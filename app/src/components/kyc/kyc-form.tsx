'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, Info } from 'lucide-react'
import { countries } from '@/lib/countries'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface KycFormProps {
  onSubmit: (data: KycFormData) => Promise<void>
  initialData?: Partial<KycFormData>
}

export interface KycFormData {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  dateOfBirth: string
  address: {
    addressLine1: string
    addressLine2?: string
    city: string
    postalCode: string
    country: string
  }
}

export function KycForm({ onSubmit, initialData }: KycFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<KycFormData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phoneNumber: initialData?.phoneNumber || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    address: {
      addressLine1: initialData?.address?.addressLine1 || '',
      addressLine2: initialData?.address?.addressLine2 || '',
      city: initialData?.address?.city || '',
      postalCode: initialData?.address?.postalCode || '',
      country: initialData?.address?.country || 'PT' // Default to Portugal
    }
  })

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Validate required fields
    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    
    // Validate phone number - must be European
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required'
    } else {
      const cleanPhone = formData.phoneNumber.replace(/\s/g, '')
      const europeanCodes = ['+351', '+34', '+33', '+49', '+39', '+31', '+32', '+43', '+45', '+46', '+47', '+48', '+30', '+353', '+352', '+354', '+356', '+357', '+358', '+359', '+370', '+371', '+372', '+385', '+386', '+420', '+421', '+423', '+36', '+40']
      
      const hasEuropeanCode = europeanCodes.some(code => cleanPhone.startsWith(code))
      
      if (!hasEuropeanCode) {
        errors.phoneNumber = 'Must be a European phone number (e.g., +351 900000000)'
      } else {
        // Extract the number part after country code
        let number = cleanPhone
        for (const code of europeanCodes) {
          if (cleanPhone.startsWith(code)) {
            number = cleanPhone.substring(code.length)
            break
          }
        }
        
        if (number.length < 6 || number.length > 15) {
          errors.phoneNumber = `Phone number must be 6-15 digits`
        }
      }
    }
    
    // Validate date of birth
    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required'
    } else {
      const dob = new Date(formData.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - dob.getFullYear()
      const monthDiff = today.getMonth() - dob.getMonth()
      const dayDiff = today.getDate() - dob.getDate()
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age
      
      if (actualAge < 18) {
        errors.dateOfBirth = 'You must be at least 18 years old'
      } else if (actualAge > 120) {
        errors.dateOfBirth = 'Invalid date of birth'
      }
    }
    
    // Validate address
    if (!formData.address.addressLine1.trim()) errors.addressLine1 = 'Address is required'
    if (!formData.address.city.trim()) errors.city = 'City is required'
    
    // Validate postal code - just numbers for Portugal
    if (!formData.address.postalCode.trim()) {
      errors.postalCode = 'Postal code is required'
    } else if (formData.address.country === 'PT') {
      // Allow both formats: 1000000 or 1000-000
      const cleanPostalCode = formData.address.postalCode.replace(/\D/g, '')
      if (cleanPostalCode.length !== 7) {
        errors.postalCode = 'Enter 7 digits (e.g., 1000000)'
      }
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validate form before submission
    if (!validateForm()) {
      setError('Please fix the errors in the form')
      return
    }
    
    setLoading(true)

    try {
      await onSubmit(formData)
    } catch (err) {
      // Extract more specific error message
      let errorMessage = 'Failed to submit KYC data'
      if (err instanceof Error) {
        errorMessage = err.message
        // Check for specific Striga errors
        if (err.message.includes('Invalid phone')) {
          setValidationErrors({ ...validationErrors, phoneNumber: 'Invalid phone number format for European country' })
        }
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle>Identity Verification</CardTitle>
        </div>
        <CardDescription>
          Fill your data to start your Know Your Customer verification process.
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-amber-600 font-semibold cursor-help inline-flex items-center gap-1">
                  Only European residents are supported
                  <Info className="h-3 w-3" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="font-semibold mb-2">Supported Countries:</p>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <div>Austria, Belgium, Bulgaria, Croatia, Cyprus, Czech Republic, Denmark, Estonia, Finland, France</div>
                  <div>Germany, Greece, Hungary, Iceland, Ireland, Italy, Latvia, Liechtenstein, Lithuania, Luxembourg</div>
                  <div>Malta, Netherlands, Norway, Poland, Portugal</div>
                  <div>Romania, Slovakia, Slovenia, Spain, Sweden</div>
                </div>
                <p className="mt-2 text-amber-600">UK, US, and non-EU countries are NOT supported.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value })
                  if (validationErrors.firstName) {
                    setValidationErrors({ ...validationErrors, firstName: '' })
                  }
                }}
                disabled={loading}
                className={validationErrors.firstName ? 'border-red-500' : ''}
              />
              {validationErrors.firstName && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) => {
                  setFormData({ ...formData, lastName: e.target.value })
                  if (validationErrors.lastName) {
                    setValidationErrors({ ...validationErrors, lastName: '' })
                  }
                }}
                disabled={loading}
                className={validationErrors.lastName ? 'border-red-500' : ''}
              />
              {validationErrors.lastName && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                if (validationErrors.email) {
                  setValidationErrors({ ...validationErrors, email: '' })
                }
              }}
              disabled={loading}
              className={validationErrors.email ? 'border-red-500' : ''}
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              required
              placeholder="+351 900000000"
              value={formData.phoneNumber}
              onChange={(e) => {
                setFormData({ ...formData, phoneNumber: e.target.value })
                if (validationErrors.phoneNumber) {
                  setValidationErrors({ ...validationErrors, phoneNumber: '' })
                }
              }}
              disabled={loading}
              className={validationErrors.phoneNumber ? 'border-red-500' : ''}
            />
            {validationErrors.phoneNumber && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.phoneNumber}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">European numbers only (e.g., +351 900000000)</p>
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              required
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              value={formData.dateOfBirth}
              onChange={(e) => {
                setFormData({ ...formData, dateOfBirth: e.target.value })
                if (validationErrors.dateOfBirth) {
                  setValidationErrors({ ...validationErrors, dateOfBirth: '' })
                }
              }}
              disabled={loading}
              className={validationErrors.dateOfBirth ? 'border-red-500' : ''}
            />
            {validationErrors.dateOfBirth && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.dateOfBirth}</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Address</h3>
            
            <div>
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                required
                placeholder="Street address"
                value={formData.address.addressLine1}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    address: { ...formData.address, addressLine1: e.target.value }
                  })
                  if (validationErrors.addressLine1) {
                    setValidationErrors({ ...validationErrors, addressLine1: '' })
                  }
                }}
                disabled={loading}
                className={validationErrors.addressLine1 ? 'border-red-500' : ''}
              />
              {validationErrors.addressLine1 && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.addressLine1}</p>
              )}
            </div>

            <div>
              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
              <Input
                id="addressLine2"
                placeholder="Apartment, suite, etc."
                value={formData.address.addressLine2}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, addressLine2: e.target.value }
                })}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  required
                  value={formData.address.city}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value }
                    })
                    if (validationErrors.city) {
                      setValidationErrors({ ...validationErrors, city: '' })
                    }
                  }}
                  disabled={loading}
                  className={validationErrors.city ? 'border-red-500' : ''}
                />
                {validationErrors.city && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                )}
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  required
                  placeholder="1000000"
                  value={formData.address.postalCode}
                  onChange={(e) => {
                    // Only allow numbers and auto-format
                    const value = e.target.value.replace(/\D/g, '')
                    if (value.length <= 7) {
                      // Auto-add dash after 4 digits
                      const formatted = value.length > 4 
                        ? `${value.slice(0, 4)}-${value.slice(4)}`
                        : value
                      setFormData({
                        ...formData,
                        address: { ...formData.address, postalCode: formatted }
                      })
                      if (validationErrors.postalCode) {
                        setValidationErrors({ ...validationErrors, postalCode: '' })
                      }
                    }
                  }}
                  disabled={loading}
                  className={validationErrors.postalCode ? 'border-red-500' : ''}
                />
                {validationErrors.postalCode && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.postalCode}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.address.country}
                onValueChange={(value) => setFormData({
                  ...formData,
                  address: { ...formData.address, country: value }
                })}
                disabled={loading}
              >
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}