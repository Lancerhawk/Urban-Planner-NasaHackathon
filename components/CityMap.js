'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Create realistic custom icons
const createSensorIcon = (type, intensity) => {
  const colors = {
    pollution: intensity > 70 ? '#dc2626' : intensity > 40 ? '#f59e0b' : '#10b981',
    heat: intensity > 70 ? '#dc2626' : intensity > 40 ? '#f97316' : '#10b981',
    flood: intensity > 70 ? '#2563eb' : intensity > 40 ? '#3b82f6' : '#10b981'
  }
  
  const icons = {
    pollution: '🌫️',
    heat: '🌡️',
    flood: '🌊'
  }
  
  return new L.divIcon({
    className: 'sensor-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, ${colors[type]}, ${colors[type]}dd);
        border: 3px solid white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        position: relative;
      ">
        <span style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));">${icons[type]}</span>
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          background: ${colors[type]};
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">${intensity}%</div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40]
  })
}

const createCityCenterIcon = (aqi) => {
  const color = aqi > 150 ? '#dc2626' : aqi > 100 ? '#f59e0b' : aqi > 50 ? '#10b981' : '#059669'
  
  return new L.divIcon({
    className: 'city-center-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, ${color}, ${color}dd);
        border: 4px solid white;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        position: relative;
      ">
        <span style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">🏙️</span>
        <div style="
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: ${color};
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        ">AQI ${aqi}</div>
      </div>
    `,
    iconSize: [48, 60],
    iconAnchor: [24, 60]
  })
}

export default function CityMap({ cityData }) {
  const [map, setMap] = useState(null)
  const [mapKey, setMapKey] = useState(0)
  const mapRef = useRef(null)

  const generateRealisticSensorData = (center, type) => {
    const points = []
    const [lat, lng] = center
    
    // Generate realistic sensor locations based on city data
    const sensorCount = type === 'pollution' ? 8 : type === 'heat' ? 6 : 5
    const baseIntensity = cityData.stats[type === 'flood' ? 'floodRisk' : type] || 50
    
    for (let i = 0; i < sensorCount; i++) {
      // More realistic distribution patterns
      const angle = (i / sensorCount) * 2 * Math.PI
      const distance = 0.02 + Math.random() * 0.08 // 2-10km radius
      const offsetLat = lat + Math.cos(angle) * distance
      const offsetLng = lng + Math.sin(angle) * distance
      
      // Realistic intensity variations
      const variation = (Math.random() - 0.5) * 30
      const intensity = Math.max(10, Math.min(95, baseIntensity + variation))
      
      points.push({
        id: `${type}-${i}`,
        position: [offsetLat, offsetLng],
        type,
        intensity: Math.round(intensity),
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Sensor ${i + 1}`,
        lastUpdate: new Date(Date.now() - Math.random() * 3600000).toISOString()
      })
    }
    
    return points
  }

  const pollutionSensors = generateRealisticSensorData(cityData.coordinates, 'pollution')
  const heatSensors = generateRealisticSensorData(cityData.coordinates, 'heat')
  const floodSensors = generateRealisticSensorData(cityData.coordinates, 'flood')

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

  const getZoneColor = (type, intensity) => {
    const colors = {
      pollution: intensity > 70 ? '#dc2626' : intensity > 40 ? '#f59e0b' : '#10b981',
      heat: intensity > 70 ? '#dc2626' : intensity > 40 ? '#f97316' : '#10b981',
      flood: intensity > 70 ? '#2563eb' : intensity > 40 ? '#3b82f6' : '#10b981'
    }
    return colors[type] || '#10b981'
  }

  const getZoneOpacity = (intensity) => {
    if (intensity > 70) return 0.25
    if (intensity > 40) return 0.2
    return 0.15
  }

  const getZoneRadius = (intensity) => {
    return Math.max(800, intensity * 15) // 800m to 1.5km radius
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
        
        {/* City Center Marker */}
        <Marker position={cityData.coordinates} icon={createCityCenterIcon(cityData.aqi)}>
          <Popup>
            <div className="p-3 min-w-[200px]">
              <h3 className="font-bold text-lg mb-2">{cityData.name}</h3>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-semibold">AQI:</span> {cityData.aqi}</p>
                <p className="text-sm"><span className="font-semibold">Status:</span> {cityData.aqiLevel}</p>
                <p className="text-sm"><span className="font-semibold">Country:</span> {cityData.country}</p>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Pollution Monitoring Zones */}
        {pollutionSensors.map((sensor) => (
          <div key={sensor.id}>
            <Marker position={sensor.position} icon={createSensorIcon(sensor.type, sensor.intensity)}>
              <Popup>
                <div className="p-3 min-w-[180px]">
                  <h4 className="font-bold text-sm mb-2">🌫️ {sensor.name}</h4>
                  <div className="space-y-1">
                    <p className="text-xs"><span className="font-semibold">Pollution Level:</span> {sensor.intensity}%</p>
                    <p className="text-xs"><span className="font-semibold">Status:</span> 
                      <span className={`ml-1 ${sensor.intensity > 70 ? 'text-red-600' : sensor.intensity > 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {sensor.intensity > 70 ? 'High Risk' : sensor.intensity > 40 ? 'Moderate' : 'Low Risk'}
                      </span>
                    </p>
                    <p className="text-xs"><span className="font-semibold">Last Update:</span> {new Date(sensor.lastUpdate).toLocaleTimeString()}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={sensor.position}
              radius={getZoneRadius(sensor.intensity)}
              fillColor={getZoneColor(sensor.type, sensor.intensity)}
              fillOpacity={getZoneOpacity(sensor.intensity)}
              color={getZoneColor(sensor.type, sensor.intensity)}
              weight={2}
              opacity={0.8}
            />
          </div>
        ))}

        {/* Heat Monitoring Zones */}
        {heatSensors.map((sensor) => (
          <div key={sensor.id}>
            <Marker position={sensor.position} icon={createSensorIcon(sensor.type, sensor.intensity)}>
              <Popup>
                <div className="p-3 min-w-[180px]">
                  <h4 className="font-bold text-sm mb-2">🌡️ {sensor.name}</h4>
                  <div className="space-y-1">
                    <p className="text-xs"><span className="font-semibold">Heat Index:</span> {sensor.intensity}%</p>
                    <p className="text-xs"><span className="font-semibold">Status:</span> 
                      <span className={`ml-1 ${sensor.intensity > 70 ? 'text-red-600' : sensor.intensity > 40 ? 'text-orange-600' : 'text-green-600'}`}>
                        {sensor.intensity > 70 ? 'Extreme Heat' : sensor.intensity > 40 ? 'Moderate' : 'Comfortable'}
                      </span>
                    </p>
                    <p className="text-xs"><span className="font-semibold">Last Update:</span> {new Date(sensor.lastUpdate).toLocaleTimeString()}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={sensor.position}
              radius={getZoneRadius(sensor.intensity)}
              fillColor={getZoneColor(sensor.type, sensor.intensity)}
              fillOpacity={getZoneOpacity(sensor.intensity)}
              color={getZoneColor(sensor.type, sensor.intensity)}
              weight={2}
              opacity={0.8}
            />
          </div>
        ))}

        {/* Flood Risk Zones */}
        {floodSensors.map((sensor) => (
          <div key={sensor.id}>
            <Marker position={sensor.position} icon={createSensorIcon(sensor.type, sensor.intensity)}>
              <Popup>
                <div className="p-3 min-w-[180px]">
                  <h4 className="font-bold text-sm mb-2">🌊 {sensor.name}</h4>
                  <div className="space-y-1">
                    <p className="text-xs"><span className="font-semibold">Flood Risk:</span> {sensor.intensity}%</p>
                    <p className="text-xs"><span className="font-semibold">Status:</span> 
                      <span className={`ml-1 ${sensor.intensity > 70 ? 'text-red-600' : sensor.intensity > 40 ? 'text-blue-600' : 'text-green-600'}`}>
                        {sensor.intensity > 70 ? 'High Risk' : sensor.intensity > 40 ? 'Moderate' : 'Low Risk'}
                      </span>
                    </p>
                    <p className="text-xs"><span className="font-semibold">Last Update:</span> {new Date(sensor.lastUpdate).toLocaleTimeString()}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={sensor.position}
              radius={getZoneRadius(sensor.intensity)}
              fillColor={getZoneColor(sensor.type, sensor.intensity)}
              fillOpacity={getZoneOpacity(sensor.intensity)}
              color={getZoneColor(sensor.type, sensor.intensity)}
              weight={2}
              opacity={0.8}
            />
          </div>
        ))}
      </MapContainer>
    </div>
  )
}