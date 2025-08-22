import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyWebhookSignature } from '@/lib/striga'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature') || ''

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const webhookData = JSON.parse(body)
    const { eventType, data, eventId } = webhookData

    // Check for duplicate events (idempotency)
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: {
        source_eventId: {
          source: 'striga',
          eventId: eventId
        }
      }
    })

    if (existingEvent) {
      console.log('Duplicate webhook event received:', eventId)
      return NextResponse.json({ received: true })
    }

    // Store webhook event for debugging
    await prisma.webhookEvent.create({
      data: {
        eventType,
        source: 'striga',
        eventId,
        payload: webhookData,
        processed: false
      }
    })

    // Process different event types
    switch (eventType) {
      case 'KYC_STATUS_CHANGED':
        await handleKycStatusChange(data)
        break
      
      case 'WALLET_CREATED':
        await handleWalletCreated(data)
        break
      
      case 'TRANSACTION_COMPLETED':
        await handleTransactionCompleted(data)
        break
      
      case 'IBAN_CREATED':
        await handleIbanCreated(data)
        break

      default:
        console.log('Unhandled webhook event type:', eventType)
    }

    // Mark event as processed
    await prisma.webhookEvent.update({
      where: {
        source_eventId: {
          source: 'striga',
          eventId: eventId
        }
      },
      data: {
        processed: true,
        processedAt: new Date()
      }
    })

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Store error in webhook event if possible
    try {
      const body = await request.text()
      const webhookData = JSON.parse(body)
      if (webhookData.eventId) {
        await prisma.webhookEvent.updateMany({
          where: {
            source: 'striga',
            eventId: webhookData.eventId
          },
          data: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    } catch (logError) {
      console.error('Failed to log webhook error:', logError)
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle KYC status changes
async function handleKycStatusChange(data: any) {
  const { userId, status, sessionId } = data

  try {
    // Find user by Striga user ID
    const user = await prisma.user.findUnique({
      where: { strigaUserId: userId }
    })

    if (!user) {
      console.error('User not found for Striga ID:', userId)
      return
    }

    // Update KYC status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        kycStatus: status,
        kycSessionId: sessionId
      }
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'KYC Status Update',
        message: `Your KYC verification status has been updated to: ${status}`,
        type: 'KYC_UPDATE'
      }
    })

    // If KYC passed, create wallets automatically
    if (status === 'PASSED') {
      await createUserWallets(user.id, userId)
      
      // Create digital IBAN for sellers
      if (user.role === 'SELLER') {
        await createUserDigitalIban(user.id, userId)
      }
    }

    console.log(`KYC status updated for user ${user.id}: ${status}`)

  } catch (error) {
    console.error('Failed to handle KYC status change:', error)
    throw error
  }
}

// Handle wallet creation confirmation
async function handleWalletCreated(data: any) {
  const { userId, walletId, currency, address } = data

  try {
    // Find user by Striga user ID
    const user = await prisma.user.findUnique({
      where: { strigaUserId: userId }
    })

    if (!user) {
      console.error('User not found for Striga ID:', userId)
      return
    }

    // Create or update wallet record
    await prisma.wallet.upsert({
      where: {
        userId_currency: {
          userId: user.id,
          currency: currency
        }
      },
      update: {
        strigaWalletId: walletId,
        address: address,
        lastSyncAt: new Date()
      },
      create: {
        userId: user.id,
        strigaWalletId: walletId,
        currency: currency,
        address: address,
        balance: 0
      }
    })

    console.log(`Wallet created for user ${user.id}: ${currency} - ${walletId}`)

  } catch (error) {
    console.error('Failed to handle wallet creation:', error)
    throw error
  }
}

// Handle transaction completion
async function handleTransactionCompleted(data: any) {
  const { transactionId, userId, amount, currency, status } = data

  try {
    // Update transaction status and payment records
    await prisma.payment.updateMany({
      where: {
        txHash: transactionId
      },
      data: {
        status: status === 'COMPLETED' ? 'COMPLETED' : 'FAILED'
      }
    })

    console.log(`Transaction updated: ${transactionId} - ${status}`)

  } catch (error) {
    console.error('Failed to handle transaction completion:', error)
    throw error
  }
}

// Handle digital IBAN creation
async function handleIbanCreated(data: any) {
  const { userId, iban, bankName, accountNumber } = data

  try {
    // Find user by Striga user ID
    const user = await prisma.user.findUnique({
      where: { strigaUserId: userId }
    })

    if (!user) {
      console.error('User not found for Striga ID:', userId)
      return
    }

    // Create digital IBAN record
    await prisma.digitalIban.create({
      data: {
        userId: user.id,
        iban: iban,
        bankName: bankName,
        accountNumber: accountNumber,
        active: true
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Digital IBAN Created',
        message: 'Your digital IBAN has been successfully created and is ready to use.',
        type: 'IBAN_CREATED'
      }
    })

    console.log(`Digital IBAN created for user ${user.id}: ${iban}`)

  } catch (error) {
    console.error('Failed to handle IBAN creation:', error)
    throw error
  }
}

// Helper function to create wallets for all supported currencies
async function createUserWallets(userId: string, strigaUserId: string) {
  const currencies = ['BTC', 'ETH', 'BNB', 'USDT']
  
  for (const currency of currencies) {
    try {
      // This would trigger wallet creation which will be confirmed via webhook
      await fetch('/api/wallets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          currency: currency
        })
      })
    } catch (error) {
      console.error(`Failed to create ${currency} wallet for user ${userId}:`, error)
    }
  }
}

// Helper function to create digital IBAN
async function createUserDigitalIban(userId: string, strigaUserId: string) {
  try {
    await fetch('/api/iban/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId
      })
    })
  } catch (error) {
    console.error(`Failed to create digital IBAN for user ${userId}:`, error)
  }
}