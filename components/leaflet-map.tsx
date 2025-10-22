"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LeafletMapProps {
  center: [number, number]
  zoom?: number
  radius?: number
  onLocationSelect?: (lat: number, lng: number) => void
  className?: string
  height?: string
  showRadius?: boolean
  interactive?: boolean
}

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  
  return null
}

export default function LeafletMap({
  center,
  zoom = 15,
  radius = 50,
  onLocationSelect,
  className = "",
  height = "400px",
  showRadius = true,
  interactive = true
}: LeafletMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center)
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const mapRef = useRef<L.Map>(null)

  useEffect(() => {
    setMapCenter(center)
  }, [center])

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!interactive || !onLocationSelect) return
    
    const { lat, lng } = e.latlng
    setCurrentLocation([lat, lng])
    onLocationSelect(lat, lng)
  }, [interactive, onLocationSelect])

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newCenter: [number, number] = [latitude, longitude]
        setMapCenter(newCenter)
        setCurrentLocation(newCenter)
        if (onLocationSelect) {
          onLocationSelect(latitude, longitude)
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Unable to get your current location. Please allow location access.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }, [onLocationSelect])

  return (
    <div className={`relative ${className}`}>
      <div 
        className="w-full rounded-lg border-2 border-gray-200 overflow-hidden"
        style={{ height }}
      >
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController center={mapCenter} zoom={zoom} />
          
          {/* Center marker */}
          <Marker position={mapCenter} />
          
          {/* Current location marker (if different from center) */}
          {currentLocation && 
           (currentLocation[0] !== mapCenter[0] || currentLocation[1] !== mapCenter[1]) && (
            <Marker position={currentLocation} />
          )}
          
          {/* Radius circle */}
          {showRadius && (
            <Circle
              center={mapCenter}
              radius={radius}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                weight: 2
              }}
            />
          )}
          
          {/* Click handler for interactive maps */}
          {interactive && onLocationSelect && (
            <div
              className="absolute inset-0 cursor-crosshair z-[1000]"
              onClick={(e) => {
                if (mapRef.current) {
                  const rect = mapRef.current.getContainer().getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const y = e.clientY - rect.top
                  const latlng = mapRef.current.containerPointToLatLng([x, y])
                  handleMapClick({ latlng } as L.LeafletMouseEvent)
                }
              }}
            />
          )}
        </MapContainer>
      </div>
      
      {/* Location controls */}
      {interactive && (
        <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-2">
          <button
            onClick={getCurrentLocation}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-md p-2 shadow-md"
            title="Use current location"
          >
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Location info */}
      <div className="mt-2 text-sm text-gray-600">
        <p>Location: {mapCenter[0].toFixed(6)}, {mapCenter[1].toFixed(6)}</p>
        {showRadius && <p>Radius: {radius}m</p>}
      </div>
    </div>
  )
}
