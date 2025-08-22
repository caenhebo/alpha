'use client'

import { useEffect } from 'react'

interface SumSubLauncherProps {
  token: string
  onComplete?: () => void
  onError?: (error: any) => void
}

// Declare the global snsWebSdk as shown in Striga docs
declare global {
  interface Window {
    snsWebSdk: any
  }
}

export function SumSubLauncher({ token, onComplete, onError }: SumSubLauncherProps) {
  useEffect(() => {
    // Load the SumSub SDK script
    const script = document.createElement('script')
    script.src = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js'
    script.async = true
    
    script.onload = () => {
      console.log('[SumSub] Script loaded, checking for snsWebSdk...')
      
      // The Striga docs show it as 'snsWebSdk' not 'SumsubWebSdk'
      if (window.snsWebSdk) {
        console.log('[SumSub] Found snsWebSdk, launching...')
        launchSumSubWebSdk(token)
      } else {
        console.error('[SumSub] snsWebSdk not found on window')
        onError?.({ message: 'SumSub SDK not loaded' })
      }
    }
    
    script.onerror = () => {
      console.error('[SumSub] Failed to load script')
      onError?.({ message: 'Failed to load SumSub SDK' })
    }
    
    document.body.appendChild(script)
    
    // Function from Striga documentation
    function launchSumSubWebSdk(token: string) {
      try {
        let snsWebSdkInstance = window.snsWebSdk.init(
          token,
          // updateAccessToken callback - required by SumSub
          () => {
            console.log('[SumSub] Access token update requested')
            // Return the same token or fetch a new one if needed
            return Promise.resolve(token)
          }
        )
          .withConf({
            lang: 'en',
            onMessage: (type: string, payload: any) => {
              console.log('WebSDK onMessage', type, payload)
              
              // Handle completion
              if (type === 'idCheck.onApplicantSubmitted') {
                onComplete?.()
              }
            },
          })
          .build()
          
        snsWebSdkInstance.launch('#sumsub-websdk-container')
      } catch (error) {
        console.error('[SumSub] Failed to launch:', error)
        onError?.(error)
      }
    }
    
    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [token, onComplete, onError])
  
  return (
    <div id="sumsub-websdk-container" style={{ width: '100%', minHeight: '600px' }}>
      <p style={{ textAlign: 'center', padding: '20px' }}>Loading verification...</p>
    </div>
  )
}