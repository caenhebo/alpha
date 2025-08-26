import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { strigaApiRequest } from '@/lib/striga'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all data in parallel
    const [user, properties, transactions, kycData] = await Promise.all([
      // Get user data
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { 
          kycStatus: true, 
          emailVerified: true, 
          phoneVerified: true,
          strigaUserId: true 
        }
      }),
      
      // Get properties with counts
      prisma.property.findMany({
        where: { sellerId: session.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          documents: true,
          _count: {
            select: {
              interests: true,
              transactions: true
            }
          }
        }
      }),
      
      // Get transactions
      prisma.transaction.findMany({
        where: { 
          property: {
            sellerId: session.user.id
          }
        },
        select: {
          id: true,
          status: true,
          offerAmount: true,
          createdAt: true
        }
      }),
      
      // Get KYC status from Striga if user has Striga ID
      (async () => {
        const userData = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { strigaUserId: true, kycStatus: true }
        })
        
        if (userData?.strigaUserId && userData.kycStatus !== 'PASSED') {
          try {
            const strigaUser = await strigaApiRequest('/users/get', {
              method: 'POST',
              body: JSON.stringify({
                userId: userData.strigaUserId
              })
            }) as any
            
            if (strigaUser) {
              const strigaKycStatus = strigaUser?.KYC?.status
              
              // Map Striga status to our status
              let mappedStatus = userData.kycStatus
              if (strigaKycStatus === 'APPROVED') {
                mappedStatus = 'PASSED'
                // Update database
                await prisma.user.update({
                  where: { id: session.user.id },
                  data: { kycStatus: 'PASSED' }
                })
              } else if (strigaKycStatus === 'REJECTED') {
                mappedStatus = 'REJECTED'
                await prisma.user.update({
                  where: { id: session.user.id },
                  data: { kycStatus: 'REJECTED' }
                })
              } else if (strigaKycStatus === 'INITIATED') {
                mappedStatus = 'INITIATED'
              }
              
              return mappedStatus
            }
          } catch (error) {
            console.error('Error fetching Striga KYC status:', error)
          }
        }
        return userData?.kycStatus || 'NOT_STARTED'
      })()
    ])

    // Calculate stats
    const propertyStats = {
      listedProperties: properties.length,
      pendingOffers: properties.reduce((sum, p) => sum + p._count.transactions, 0),
      activeBuyers: properties.reduce((sum, p) => sum + p._count.interests, 0),
      propertiesSold: properties.filter(p => p._count.transactions > 0).length
    }

    const transactionStats = {
      totalOffers: transactions.length,
      activeTransactions: transactions.filter(t => 
        ['OFFER', 'NEGOTIATION', 'AGREEMENT', 'ESCROW', 'CLOSING'].includes(t.status)
      ).length,
      completedSales: transactions.filter(t => t.status === 'COMPLETED').length
    }

    // Format properties for response
    const formattedProperties = properties.map(property => ({
      id: property.id,
      code: property.code,
      title: property.title,
      city: property.city,
      state: property.state,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      price: property.price.toString(),
      listingStatus: 'ACTIVE',
      complianceStatus: property.complianceStatus,
      interestCount: property._count.interests,
      transactionCount: property._count.transactions
    }))

    // Check if user has wallets (only if KYC passed)
    let hasWallets = false
    if (kycData === 'PASSED') {
      const walletCount = await prisma.wallet.count({
        where: { userId: session.user.id }
      })
      hasWallets = walletCount > 0
    }

    return NextResponse.json({
      kycStatus: kycData,
      propertyStats,
      transactionStats,
      properties: formattedProperties.slice(0, 5), // Return only first 5 for dashboard
      totalProperties: properties.length,
      hasWallets,
      user: {
        emailVerified: user?.emailVerified || false,
        phoneVerified: user?.phoneVerified || false
      }
    })

  } catch (error) {
    console.error('Dashboard data error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}