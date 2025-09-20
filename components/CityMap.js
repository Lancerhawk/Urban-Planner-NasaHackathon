'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const pollutionIcon = new L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #ef4444; border-radius: 50%; width: 20px; height: 20px; border: 2px solid white;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

const heatIcon = new L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #f97316; border-radius: 50%; width: 20px; height: 20px; border: 2px solid white;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

const floodIcon = new L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #3b82f6; border-radius: 50%; width: 20px; height: 20px; border: 2px solid white;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

export default function CityMap({ cityData }) {
  const [map, setMap] = useState(null)
  const [mapKey, setMapKey] = useState(0)
  const mapRef = useRef(null)

  const generateOverlayPoints = (center, type) => {
    const points = []
    const [lat, lng] = center
    
    for (let i = 0; i < 5; i++) {
      const offsetLat = lat + (Math.random() - 0.5) * 0.1
      const offsetLng = lng + (Math.random() - 0.5) * 0.1
      
      points.push({
        id: `${type}-${i}`,
        position: [offsetLat, offsetLng],
        type,
        intensity: Math.floor(Math.random() * 100) + 1
      })
    }
    
    return points
  }

  const pollutionPoints = generateOverlayPoints(cityData.coordinates, 'pollution')
  const heatPoints = generateOverlayPoints(cityData.coordinates, 'heat')
  const floodPoints = generateOverlayPoints(cityData.coordinates, 'flood')

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    setMapKey(prev => prev + 1)
  }, [cityData.name])

  const getIcon = (type) => {
    switch (type) {
      case 'pollution': return pollutionIcon
      case 'heat': return heatIcon
      case 'flood': return floodIcon
      default: return pollutionIcon
    }
  }

  const getColor = (type) => {
    switch (type) {
      case 'pollution': return '#ef4444'
      case 'heat': return '#f97316'
      case 'flood': return '#3b82f6'
      default: return '#ef4444'
    }
  }

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <MapContainer
        key={mapKey}
        center={cityData.coordinates}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(mapInstance) => {
          setMap(mapInstance)
          mapRef.current = mapInstance
        }}
        attributionControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />
        
        <Marker position={cityData.coordinates}>
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold">{cityData.name}</h3>
              <p className="text-sm">AQI: {cityData.aqi}</p>
              <p className="text-sm">{cityData.aqiLevel}</p>
            </div>
          </Popup>
        </Marker>

        {pollutionPoints.map((point) => (
          <div key={point.id}>
            <Marker position={point.position} icon={getIcon(point.type)}>
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold capitalize">{point.type} Zone</h4>
                  <p className="text-sm">Intensity: {point.intensity}%</p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={point.position}
              radius={point.intensity * 50}
              fillColor={getColor(point.type)}
              fillOpacity={0.2}
              color={getColor(point.type)}
              weight={2}
            />
          </div>
        ))}

        {heatPoints.map((point) => (
          <div key={point.id}>
            <Marker position={point.position} icon={getIcon(point.type)}>
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold capitalize">{point.type} Zone</h4>
                  <p className="text-sm">Intensity: {point.intensity}%</p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={point.position}
              radius={point.intensity * 40}
              fillColor={getColor(point.type)}
              fillOpacity={0.2}
              color={getColor(point.type)}
              weight={2}
            />
          </div>
        ))}

        {floodPoints.map((point) => (
          <div key={point.id}>
            <Marker position={point.position} icon={getIcon(point.type)}>
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold capitalize">Flood Risk Zone</h4>
                  <p className="text-sm">Risk Level: {point.intensity}%</p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={point.position}
              radius={point.intensity * 60}
              fillColor={getColor(point.type)}
              fillOpacity={0.15}
              color={getColor(point.type)}
              weight={2}
            />
          </div>
        ))}
      </MapContainer>
    </div>
  )
}