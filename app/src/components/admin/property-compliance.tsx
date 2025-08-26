'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MapPin, 
  Euro, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Eye,
  AlertTriangle,
  FileText,
  MessageSquare,
  CheckSquare
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Property {
  id: string
  code: string
  title: string
  description?: string
  address: string
  city: string
  state?: string
  postalCode: string
  country: string
  price: string
  area?: number
  bedrooms?: number
  bathrooms?: number
  complianceStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  complianceNotes?: string
  valuationPrice?: string
  sellerId: string
  createdAt: string
  updatedAt: string
  interestCount: number
  transactionCount: number
  documents?: any[]
  interviewDate?: string
  interviewStatus?: string
  interviewNotes?: string
  finalApprovalStatus?: string
}

export default function PropertyCompliance() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/properties', {
        headers: {
          'Include-Relations': 'documents,interviews'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties')
      }

      const data = await response.json()
      setProperties(data.properties || [])
    } catch (error) {
      console.error('Error fetching properties:', error)
      setError('Failed to load properties')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        )
    }
  }

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseFloat(price))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT')
  }

  // Organize properties by approval stage
  const awaitingDocuments = properties.filter(p => {
    const hasDocuments = p.documents && p.documents.length > 0
    return !hasDocuments
  })
  
  const awaitingCompliance = properties.filter(p => {
    const hasDocuments = p.documents && p.documents.length >= 5
    return hasDocuments && p.complianceStatus === 'PENDING'
  })
  
  const awaitingInterview = properties.filter(p => {
    // Properties that passed compliance but haven't completed interview
    return p.complianceStatus === 'APPROVED' && p.interviewStatus !== 'COMPLETED'
  })
  
  const awaitingFinalApproval = properties.filter(p => {
    // Properties that completed interview but need final approval
    return p.complianceStatus === 'APPROVED' && p.interviewStatus === 'COMPLETED' && p.finalApprovalStatus !== 'APPROVED'
  })
  
  const approvedProperties = properties.filter(p => {
    // Only properties that are fully approved (all stages)
    return p.finalApprovalStatus === 'APPROVED'
  })
  
  const rejectedProperties = properties.filter(p => {
    return p.complianceStatus === 'REJECTED' || p.finalApprovalStatus === 'REJECTED'
  })

  const renderPropertyCard = (property: Property, variant: 'default' | 'warning' | 'success' | 'error' = 'default') => {
    const variantStyles = {
      default: 'border-gray-200 bg-white',
      warning: 'border-yellow-200 bg-yellow-50',
      success: 'border-green-200 bg-green-50',
      error: 'border-red-200 bg-red-50'
    }

    return (
      <div key={property.id} className={`border rounded-lg p-4 ${variantStyles[variant]}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold">{property.title}</h3>
              <span className="font-mono text-sm text-blue-600">{property.code}</span>
              {property.finalApprovalStatus === 'APPROVED' ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Fully Approved
                </Badge>
              ) : property.interviewStatus === 'COMPLETED' ? (
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Pending Final Approval
                </Badge>
              ) : property.complianceStatus === 'APPROVED' ? (
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Interview Stage
                </Badge>
              ) : (
                getStatusBadge(property.complianceStatus)
              )}
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {property.city}, {property.country}
              </div>
              <div className="flex items-center">
                <Euro className="h-4 w-4 mr-2" />
                {formatPrice(property.price)}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Listed {formatDate(property.createdAt)}
              </div>
              {property.interviewDate && (
                <div className="flex items-center text-purple-600">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Interview: {formatDate(property.interviewDate)}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/properties/${property.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Property Compliance Overview</CardTitle>
          <CardDescription>
            Review and manage property compliance status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>Loading properties...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <FileText className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">{awaitingDocuments.length}</div>
                <div className="text-sm text-gray-600">Awaiting Documents</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <CheckSquare className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-800">{awaitingCompliance.length}</div>
                <div className="text-sm text-blue-600">Compliance Review</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <MessageSquare className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-800">{awaitingInterview.length}</div>
                <div className="text-sm text-purple-600">Interview Stage</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-800">{awaitingFinalApproval.length}</div>
                <div className="text-sm text-yellow-600">Final Approval</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-800">{approvedProperties.length}</div>
                <div className="text-sm text-green-600">Approved</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-800">{rejectedProperties.length}</div>
                <div className="text-sm text-red-600">Rejected</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Properties by Stage */}
      {!isLoading && awaitingDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-gray-600" />
              Awaiting Documents ({awaitingDocuments.length})
            </CardTitle>
            <CardDescription>
              Properties that need sellers to upload required documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {awaitingDocuments.map(property => renderPropertyCard(property))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && awaitingCompliance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <CheckSquare className="mr-2 h-5 w-5" />
              Compliance Review Queue ({awaitingCompliance.length})
            </CardTitle>
            <CardDescription>
              Properties with documents ready for compliance review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {awaitingCompliance.map(property => renderPropertyCard(property, 'warning'))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && awaitingInterview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-purple-800">
              <MessageSquare className="mr-2 h-5 w-5" />
              Interview Stage ({awaitingInterview.length})
            </CardTitle>
            <CardDescription>
              Properties approved for compliance, pending interview completion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {awaitingInterview.map(property => renderPropertyCard(property, 'default'))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && awaitingFinalApproval.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Awaiting Final Approval ({awaitingFinalApproval.length})
            </CardTitle>
            <CardDescription>
              Properties that completed interview and need final approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {awaitingFinalApproval.map(property => renderPropertyCard(property, 'warning'))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && approvedProperties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <CheckCircle className="mr-2 h-5 w-5" />
              Approved Properties ({approvedProperties.length})
            </CardTitle>
            <CardDescription>
              Properties approved and ready for transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {approvedProperties.map(property => renderPropertyCard(property, 'success'))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && rejectedProperties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <XCircle className="mr-2 h-5 w-5" />
              Rejected Properties ({rejectedProperties.length})
            </CardTitle>
            <CardDescription>
              Properties that did not meet compliance requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rejectedProperties.map(property => renderPropertyCard(property, 'error'))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && properties.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No properties found in the system.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}