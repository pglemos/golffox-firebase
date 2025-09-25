'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionamento automático para área administrativa
    router.push('/admin')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-golffox-blue-dark mb-4">
          Golffox Management Panel
        </h1>
        <p className="text-golffox-gray-medium">
          Redirecionando para área administrativa...
        </p>
      </div>
    </div>
  )
}