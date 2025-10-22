"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the entire map component to avoid SSR issues
const MapComponent = dynamic(() => import('./map-component'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-gray-500">Loading map...</div>
    </div>
  )
})

interface SimpleMapProps {
  center: [number, number]
  zoom?: number
  radius?: number
  onLocationSelect?: (lat: number, lng: number) => void
  className?: string
  height?: string
  showRadius?: boolean
  interactive?: boolean
}

export function SimpleMap(props: SimpleMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }

  return <MapComponent {...props} />
}