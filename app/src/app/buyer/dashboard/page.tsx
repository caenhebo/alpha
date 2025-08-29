'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Search, FileText, CreditCard, Home, Shield, Loader2 } from 'lucide-react'
import WalletDisplay from '@/components/wallet/wallet-display'
import { RefreshWalletsButton } from '@/components/wallet/refresh-wallets-button'

export default function BuyerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isInitiatingKYC, setIsInitiatingKYC] = useState(false)
  const [kycError, setKycError] = useState('')
  const [paymentPreference, setPaymentPreference] = useState<'CRYPTO' | 'FIAT' | 'HYBRID'>('FIAT')
  const [isUpdatingPreference, setIsUpdatingPreference] = useState(false)
  const [liveKycStatus, setLiveKycStatus] = useState<string | null>(null)
  const [isCheckingKyc, setIsCheckingKyc] = useState(true)
  const [walletData, setWalletData] = useState<any>(null)
  const [isLoadingWallets, setIsLoadingWallets] = useState(false)
  const [propertyCode, setPropertyCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [transactionStats, setTransactionStats] = useState({
    totalOffers: 0,
    activeTransactions: 0,
    completedPurchases: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'BUYER') {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Fetch current payment preference and KYC status
      fetchPaymentPreference()
      fetchLiveKycStatus()
      fetchTransactionStats()
    }
  }, [session, status])

  useEffect(() => {
    if (liveKycStatus === 'PASSED') {
      fetchWallets()
    }
  }, [liveKycStatus])

  const fetchLiveKycStatus = async () => {
    try {
      setIsCheckingKyc(true)
      console.log('[Buyer Dashboard] Fetching live KYC status...')
      
      const response = await fetch('/api/kyc/status')
      if (response.ok) {
        const data = await response.json()
        console.log('[Buyer Dashboard] KYC status:', data.kycStatus)
        setLiveKycStatus(data.kycStatus)
      } else {
        console.error('[Buyer Dashboard] Failed to fetch KYC status')
        setLiveKycStatus(session?.user.kycStatus || null)
      }
    } catch (error) {
      console.error('[Buyer Dashboard] Error fetching KYC status:', error)
      setLiveKycStatus(session?.user.kycStatus || null)
    } finally {
      setIsCheckingKyc(false)
    }
  }

  const fetchPaymentPreference = async () => {
    try {
      const response = await fetch('/api/user/payment-preference')
      if (response.ok) {
        const data = await response.json()
        setPaymentPreference(data.paymentPreference || 'FIAT')
      }
    } catch (error) {
      console.error('Failed to fetch payment preference:', error)
    }
  }

  const fetchWallets = async () => {
    setIsLoadingWallets(true)
    try {
      const response = await fetch('/api/wallets')
      if (response.ok) {
        const data = await response.json()
        setWalletData(data)
      } else {
        console.error('Failed to fetch wallets')
      }
    } catch (error) {
      console.error('Error fetching wallets:', error)
    } finally {
      setIsLoadingWallets(false)
    }
  }

  const fetchTransactionStats = async () => {
    try {
      const response = await fetch('/api/transactions?role=buyer')
      if (response.ok) {
        const data = await response.json()
        const transactions = data.transactions || []
        
        const stats = {
          totalOffers: transactions.length,
          activeTransactions: transactions.filter((t: any) => 
            ['OFFER', 'NEGOTIATION', 'AGREEMENT', 'ESCROW', 'CLOSING'].includes(t.status)
          ).length,
          completedPurchases: transactions.filter((t: any) => t.status === 'COMPLETED').length
        }
        
        setTransactionStats(stats)
      }
    } catch (error) {
      console.error('Error fetching transaction stats:', error)
    }
  }

  const updatePaymentPreference = async (newPreference: 'CRYPTO' | 'FIAT' | 'HYBRID') => {
    setIsUpdatingPreference(true)
    try {
      const response = await fetch('/api/user/payment-preference', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentPreference: newPreference })
      })
      
      if (response.ok) {
        setPaymentPreference(newPreference)
        // Refresh session to update the preference
        router.refresh()
      } else {
        throw new Error('Failed to update preference')
      }
    } catch (error) {
      console.error('Failed to update payment preference:', error)
      // Revert on error
      fetchPaymentPreference()
    } finally {
      setIsUpdatingPreference(false)
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session || session.user.role !== 'BUYER') {
    return null
  }

  const initiateKYC = async () => {
    // Redirect to KYC form page
    router.push('/kyc')
  }

  const handlePropertySearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!propertyCode.trim()) {
      return
    }

    setIsSearching(true)
    try {
      // Navigate to property detail page
      router.push(`/property/${propertyCode.trim().toUpperCase()}`)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {session.user.email}</p>
        </div>

        {/* KYC Alert - Only show if not checking and not approved */}
        {!isCheckingKyc && liveKycStatus !== 'PASSED' && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong className="text-amber-900">
                  {liveKycStatus === 'REJECTED' 
                    ? 'KYC Verification Required'
                    : 'Complete your KYC to start buying properties'}
                </strong>
                <p className="text-sm text-amber-700 mt-1">
                  {liveKycStatus === 'INITIATED' 
                    ? 'Your KYC verification is in progress. This usually takes a few minutes.'
                    : liveKycStatus === 'REJECTED'
                    ? 'Please contact support to resolve your KYC verification.'
                    : 'Verify your identity to unlock all features and start making offers on properties.'}
                </p>
              </div>
              {liveKycStatus !== 'INITIATED' && liveKycStatus !== 'REJECTED' && (
                <Button 
                  onClick={initiateKYC}
                  disabled={isInitiatingKYC}
                  className="ml-4"
                >
                  {isInitiatingKYC ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting KYC...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Start KYC Verification
                    </>
                  )}
                </Button>
              )}
              {liveKycStatus === 'INITIATED' && (
                <Button 
                  onClick={fetchLiveKycStatus}
                  disabled={isCheckingKyc}
                  variant="outline"
                  className="ml-4"
                >
                  {isCheckingKyc ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check Status'
                  )}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {kycError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{kycError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Searches</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Properties being tracked</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/transactions?role=buying')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offers Made</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionStats.totalOffers}</div>
              <p className="text-xs text-muted-foreground">Total offers submitted</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/transactions?role=buying&status=active')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionStats.activeTransactions}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/transactions?role=buying&status=completed')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties Owned</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionStats.completedPurchases}</div>
              <p className="text-xs text-muted-foreground">Completed purchases</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={liveKycStatus !== 'PASSED' ? 'opacity-60' : ''}>
            <CardHeader>
              <CardTitle>Search Properties</CardTitle>
              <CardDescription>Find your dream property in Portugal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter a property code to view details and make an offer.
                </p>
                <form onSubmit={handlePropertySearch} className="space-y-3">
                  <div>
                    <Label htmlFor="propertyCode">Property Code</Label>
                    <Input
                      id="propertyCode"
                      value={propertyCode}
                      onChange={(e) => setPropertyCode(e.target.value)}
                      placeholder="e.g., CAE-2024-0001"
                      className="mt-1"
                      disabled={liveKycStatus !== 'PASSED'}
                    />
                  </div>
                  <Button 
                    type="submit"
                    className="w-full" 
                    disabled={liveKycStatus !== 'PASSED' || isSearching || !propertyCode.trim()}
                    title={liveKycStatus !== 'PASSED' ? 'Complete KYC verification to search properties' : ''}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search Property
                      </>
                    )}
                  </Button>
                </form>
                
                {liveKycStatus === 'PASSED' && (
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push('/transactions')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      My Transactions
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className={liveKycStatus !== 'PASSED' ? 'opacity-60' : ''}>
            {/* Payment Preference Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Payment Preference</CardTitle>
                <CardDescription>Choose your preferred payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-preference">Payment Method</Label>
                    <Select 
                      value={paymentPreference} 
                      onValueChange={(value: 'CRYPTO' | 'FIAT' | 'HYBRID') => updatePaymentPreference(value)}
                      disabled={liveKycStatus !== 'PASSED' || isUpdatingPreference}
                    >
                      <SelectTrigger id="payment-preference" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIAT">
                          <div>
                            <div className="font-medium">Traditional Banking (FIAT)</div>
                            <div className="text-xs text-gray-500">Pay with bank transfers in EUR</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="CRYPTO">
                          <div>
                            <div className="font-medium">Cryptocurrency</div>
                            <div className="text-xs text-gray-500">Pay with BTC, ETH, BNB, or USDT</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="HYBRID">
                          <div>
                            <div className="font-medium">Hybrid (Both)</div>
                            <div className="text-xs text-gray-500">Flexible payment with crypto or fiat</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {liveKycStatus !== 'PASSED' && (
                      <p className="text-xs text-amber-600">Complete KYC to change payment preferences</p>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-medium">KYC Status:</span>
                    <span className={`text-sm ${
                      liveKycStatus === 'PASSED' ? 'text-green-600 font-medium' : 
                      liveKycStatus === 'REJECTED' ? 'text-red-600' : 
                      'text-amber-600'
                    }`}>
                      {liveKycStatus === 'PASSED' ? 'Approved' : 
                       liveKycStatus === 'REJECTED' ? 'Rejected' : 
                       liveKycStatus === 'INITIATED' ? 'In Review' : 
                       'Pending'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Display */}
            {liveKycStatus === 'PASSED' && (
              <div>
                {isLoadingWallets ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading wallets...
                    </CardContent>
                  </Card>
                ) : walletData ? (
                  <WalletDisplay
                    userRole="BUYER"
                    primaryWallet={walletData.primaryWallet}
                    allWallets={walletData.wallets}
                    onRefresh={fetchWallets}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Crypto Wallets</CardTitle>
                      <CardDescription>Your wallets for property purchases</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RefreshWalletsButton 
                        onRefresh={fetchWallets}
                        onSyncComplete={() => {
                          fetchKycStatus()
                          fetchWallets()
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            {liveKycStatus !== 'PASSED' ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">
                  Complete KYC verification to start your property search journey.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No recent activity. Start by searching for properties.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}