'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  MapPin, 
  Euro, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Eye,
  AlertTriangle
} from 'lucide-react'

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
}

export default function PropertyCompliance() {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [complianceNotes, setComplianceNotes] = useState('')
  const [valuationPrice, setValuationPrice] = useState('')

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/properties')
      
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

  const handleComplianceAction = async (propertyId: string, status: 'APPROVED' | 'REJECTED') => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/properties/compliance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyId,
          complianceStatus: status,
          complianceNotes: complianceNotes.trim() || null,
          valuationPrice: valuationPrice.trim() || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update compliance status')
      }

      // Refresh properties list
      await fetchProperties()
      
      // Reset form
      setSelectedProperty(null)
      setComplianceNotes('')
      setValuationPrice('')
      
    } catch (error) {
      console.error('Error updating compliance:', error)
      setError(error instanceof Error ? error.message : 'Failed to update compliance status')
    } finally {
      setIsProcessing(false)
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

  const pendingProperties = properties.filter(p => p.complianceStatus === 'PENDING')
  const approvedProperties = properties.filter(p => p.complianceStatus === 'APPROVED')
  const rejectedProperties = properties.filter(p => p.complianceStatus === 'REJECTED')

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-800">{pendingProperties.length}</div>
                <div className="text-sm text-yellow-600">Pending Review</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-800">{approvedProperties.length}</div>
                <div className="text-sm text-green-600">Approved</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-800">{rejectedProperties.length}</div>
                <div className="text-sm text-red-600">Rejected</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && pendingProperties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Properties Requiring Review ({pendingProperties.length})
            </CardTitle>
            <CardDescription>
              Properties waiting for compliance approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingProperties.map((property) => (
                <div key={property.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{property.title}</h3>
                        {getStatusBadge(property.complianceStatus)}
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
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProperty(property)
                            setComplianceNotes(property.complianceNotes || '')
                            setValuationPrice(property.valuationPrice || '')
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Property Compliance Review</DialogTitle>
                          <DialogDescription>
                            Review property details and approve or reject
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedProperty && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Property Code</Label>
                                <p className="font-mono text-blue-600">{selectedProperty.code}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Current Status</Label>
                                <div className="mt-1">{getStatusBadge(selectedProperty.complianceStatus)}</div>
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Property Title</Label>
                              <p className="mt-1">{selectedProperty.title}</p>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Description</Label>
                              <p className="mt-1 text-gray-600">{selectedProperty.description || 'No description provided'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Address</Label>
                                <p className="mt-1 text-sm">
                                  {selectedProperty.address}<br/>
                                  {selectedProperty.city}, {selectedProperty.postalCode}<br/>
                                  {selectedProperty.country}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Property Details</Label>
                                <p className="mt-1 text-sm">
                                  Price: {formatPrice(selectedProperty.price)}<br/>
                                  {selectedProperty.area && `Area: ${selectedProperty.area}m²`}<br/>
                                  {selectedProperty.bedrooms && `Bedrooms: ${selectedProperty.bedrooms}`}<br/>
                                  {selectedProperty.bathrooms && `Bathrooms: ${selectedProperty.bathrooms}`}
                                </p>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="valuationPrice">Admin Valuation (Optional)</Label>
                              <Input
                                id="valuationPrice"
                                type="number"
                                step="0.01"
                                value={valuationPrice}
                                onChange={(e) => setValuationPrice(e.target.value)}
                                placeholder="Enter valuation price in EUR"
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label htmlFor="complianceNotes">Compliance Notes</Label>
                              <Textarea
                                id="complianceNotes"
                                value={complianceNotes}
                                onChange={(e) => setComplianceNotes(e.target.value)}
                                placeholder="Add notes about compliance review..."
                                className="mt-1"
                                rows={4}
                              />
                            </div>

                            <div className="flex gap-3 pt-4">
                              <Button
                                onClick={() => handleComplianceAction(selectedProperty.id, 'APPROVED')}
                                disabled={isProcessing}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                {isProcessing ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                Approve Property
                              </Button>
                              <Button
                                onClick={() => handleComplianceAction(selectedProperty.id, 'REJECTED')}
                                disabled={isProcessing}
                                variant="destructive"
                                className="flex-1"
                              >
                                {isProcessing ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="mr-2 h-4 w-4" />
                                )}
                                Reject Property
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && properties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Properties</CardTitle>
            <CardDescription>
              Complete list of all properties in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {properties.map((property) => (
                <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium">{property.title}</span>
                      <span className="font-mono text-sm text-blue-600">{property.code}</span>
                      {getStatusBadge(property.complianceStatus)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {property.city} • {formatPrice(property.price)} • {formatDate(property.createdAt)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {property.interestCount} interested • {property.transactionCount} offers
                  </div>
                </div>
              ))}
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