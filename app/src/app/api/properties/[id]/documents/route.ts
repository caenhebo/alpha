import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if property exists and user owns it
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { sellerId: true }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Only the property owner can view documents
    if (property.sellerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch documents for this property
    const documents = await prisma.document.findMany({
      where: { 
        propertyId: params.id 
      },
      orderBy: { 
        createdAt: 'desc' 
      }
    })

    // Format documents for response
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      filename: doc.filename,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      documentType: doc.documentType,
      uploadedAt: doc.uploadedAt.toISOString(),
      verified: doc.verified,
      description: doc.description
    }))

    return NextResponse.json({
      documents: formattedDocuments,
      total: formattedDocuments.length
    })

  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}