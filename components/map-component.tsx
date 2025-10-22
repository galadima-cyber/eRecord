"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface LeafletMapProps {
  center: [number, number]
  zoom?: number
  radius?: number
  onLocationSelect?: (lat: number, lng: number) => void
  showRadius?: boolean
  interactive?: boolean
  className?: string
  height?: string
}

export default function LeafletMap({
  center,
  zoom = 13,
  radius,
  onLocationSelect,
  showRadius = false,
  interactive = true,
  className,
  height = "400px"
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ✅ FIX: Make sure no existing Leaflet map is bound to this container
    if (container._leaflet_id) {
      container._leaflet_id = null
    }

    // Initialize map only once
    if (!mapRef.current) {
      const map = L.map(container, {
        center,
        zoom,
        zoomControl: true,
        dragging: interactive,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      if (showRadius && radius) {
        L.circle(center, { radius, color: "blue", fillOpacity: 0.1 }).addTo(map)
      }

      if (onLocationSelect) {
        map.on("click", (e) => {
          const { lat, lng } = e.latlng
          onLocationSelect(lat, lng)
        })
      }

      mapRef.current = map
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [center, zoom, radius, showRadius, interactive, onLocationSelect])

  return (
    <div
      ref={containerRef}
      className={`rounded-lg overflow-hidden ${className || ""}`}
      style={{ height }}
    />
  )
}
