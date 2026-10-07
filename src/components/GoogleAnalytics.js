import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { GoogleAnalytics } from '@next/third-parties/google'
import { GA_ID, initializeAnalytics, trackPageView } from '../lib/analytics'

export default function Analytics() {
  const router = useRouter()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    setInitialized(initializeAnalytics())
  }, [])

  useEffect(() => {
    if (initialized && router.isReady) trackPageView()
  }, [initialized, router.isReady, router.pathname])

  return initialized ? <GoogleAnalytics gaId={GA_ID} /> : null
}
