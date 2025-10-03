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

const createNASADatasetIcon = (type, intensity, dataset) => {
  const colors = {
    pollution: intensity > 70 ? '#dc2626' : intensity > 40 ? '#f59e0b' : '#10b981',
    heat: intensity > 70 ? '#dc2626' : intensity > 40 ? '#f97316' : '#10b981',
    flood: intensity > 70 ? '#2563eb' : intensity > 40 ? '#3b82f6' : '#10b981'
  }
  
  const icons = {
    pollution: '🛰️',
    heat: '🌡️',
    flood: '🌊'
  }
  
  return new L.divIcon({
    className: 'nasa-dataset-marker',
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

export default function CityMap({ cityData, mode = 'detailed' }) {
  const [map, setMap] = useState(null)
  const [mapKey, setMapKey] = useState(0)
  const mapRef = useRef(null)

  const generateNASADatasetPoints = (center, type) => {
    const points = []
    const [lat, lng] = center
    
    // NASA dataset configurations
    const datasetConfig = {
      pollution: {
        count: 8,
        datasets: ['TEMPO_NO2', 'MODIS_AOD', 'OMI_O3'],
        baseIntensity: cityData.stats.pollution || 50
      },
      heat: {
        count: 6,
        datasets: ['MODIS_LST', 'Landsat_Thermal', 'ASTER_Temperature'],
        baseIntensity: cityData.stats.heat || 50
      },
      flood: {
        count: 5,
        datasets: ['GPM_Precipitation', 'MODIS_Flood', 'SRTM_Elevation'],
        baseIntensity: cityData.stats.floodRisk || 50
      }
    }
    
    const config = datasetConfig[type]
    
    for (let i = 0; i < config.count; i++) {
      const angle = (i / config.count) * 2 * Math.PI
      const distance = 0.02 + Math.random() * 0.08 
      const offsetLat = lat + Math.cos(angle) * distance
      const offsetLng = lng + Math.sin(angle) * distance
      
      const variation = (Math.random() - 0.5) * 30
      const intensity = Math.max(10, Math.min(95, config.baseIntensity + variation))
      
      const dataset = config.datasets[Math.floor(Math.random() * config.datasets.length)]
      
      points.push({
        id: `${type}-${i}`,
        position: [offsetLat, offsetLng],
        type,
        intensity: Math.round(intensity),
        dataset: dataset,
        name: `${dataset} Data Point ${i + 1}`,
        lastUpdate: new Date(Date.now() - Math.random() * 3600000).toISOString()
      })
    }
    
    return points
  }

  const pollutionDataPoints = mode === 'overview' ? [] : generateNASADatasetPoints(cityData.coordinates, 'pollution')
  const heatDataPoints = mode === 'overview' ? [] : generateNASADatasetPoints(cityData.coordinates, 'heat')
  const floodDataPoints = mode === 'overview' ? [] : generateNASADatasetPoints(cityData.coordinates, 'flood')

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
    return Math.max(800, intensity * 15)
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
        
        {mode !== 'overview' ? (
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
        ) : (
          // Draw a simple synthetic boundary ring for overview mode
          (() => {
            const [lat, lng] = cityData.coordinates
            const ring = Array.from({ length: 24 }, (_, i) => {
              const angle = (i / 24) * 2 * Math.PI
              const r = 0.08 + (Math.sin(i) * 0.01)
              return [lat + Math.cos(angle) * r, lng + Math.sin(angle) * r]
            })
            return (
              <Polygon 
                positions={ring}
                pathOptions={{ color: '#3b82f6', weight: 3, fillOpacity: 0, dashArray: '6,6' }}
              />
            )
          })()
        )}

        {mode !== 'overview' && pollutionDataPoints.map((dataPoint) => (
          <div key={dataPoint.id}>
            <Marker position={dataPoint.position} icon={createNASADatasetIcon(dataPoint.type, dataPoint.intensity, dataPoint.dataset)}>
              <Popup>
                <div className="p-3 min-w-[200px]">
                  <h4 className="font-bold text-sm mb-2">🛰️ {dataPoint.name}</h4>
                  <div className="space-y-1">
                    <p className="text-xs"><span className="font-semibold">NASA Dataset:</span> {dataPoint.dataset}</p>
                    <p className="text-xs"><span className="font-semibold">Air Quality Index:</span> {dataPoint.intensity}%</p>
                    <p className="text-xs"><span className="font-semibold">Status:</span> 
                      <span className={`ml-1 ${dataPoint.intensity > 70 ? 'text-red-600' : dataPoint.intensity > 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {dataPoint.intensity > 70 ? 'High Risk' : dataPoint.intensity > 40 ? 'Moderate' : 'Low Risk'}
                      </span>
                    </p>
                    <p className="text-xs"><span className="font-semibold">Data Source:</span> NASA Earthdata</p>
                    <p className="text-xs"><span className="font-semibold">Last Update:</span> {new Date(dataPoint.lastUpdate).toLocaleTimeString()}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={dataPoint.position}
              radius={getZoneRadius(dataPoint.intensity)}
              fillColor={getZoneColor(dataPoint.type, dataPoint.intensity)}
              fillOpacity={getZoneOpacity(dataPoint.intensity)}
              color={getZoneColor(dataPoint.type, dataPoint.intensity)}
              weight={2}
              opacity={0.8}
            />
          </div>
        ))}

        {mode !== 'overview' && heatDataPoints.map((dataPoint) => (
          <div key={dataPoint.id}>
            <Marker position={dataPoint.position} icon={createNASADatasetIcon(dataPoint.type, dataPoint.intensity, dataPoint.dataset)}>
              <Popup>
                <div className="p-3 min-w-[200px]">
                  <h4 className="font-bold text-sm mb-2">🌡️ {dataPoint.name}</h4>
                  <div className="space-y-1">
                    <p className="text-xs"><span className="font-semibold">NASA Dataset:</span> {dataPoint.dataset}</p>
                    <p className="text-xs"><span className="font-semibold">Heat Index:</span> {dataPoint.intensity}%</p>
                    <p className="text-xs"><span className="font-semibold">Status:</span> 
                      <span className={`ml-1 ${dataPoint.intensity > 70 ? 'text-red-600' : dataPoint.intensity > 40 ? 'text-orange-600' : 'text-green-600'}`}>
                        {dataPoint.intensity > 70 ? 'Extreme Heat' : dataPoint.intensity > 40 ? 'Moderate' : 'Comfortable'}
                      </span>
                    </p>
                    <p className="text-xs"><span className="font-semibold">Data Source:</span> NASA Earthdata</p>
                    <p className="text-xs"><span className="font-semibold">Last Update:</span> {new Date(dataPoint.lastUpdate).toLocaleTimeString()}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={dataPoint.position}
              radius={getZoneRadius(dataPoint.intensity)}
              fillColor={getZoneColor(dataPoint.type, dataPoint.intensity)}
              fillOpacity={getZoneOpacity(dataPoint.intensity)}
              color={getZoneColor(dataPoint.type, dataPoint.intensity)}
              weight={2}
              opacity={0.8}
            />
          </div>
        ))}

        {mode !== 'overview' && floodDataPoints.map((dataPoint) => (
          <div key={dataPoint.id}>
            <Marker position={dataPoint.position} icon={createNASADatasetIcon(dataPoint.type, dataPoint.intensity, dataPoint.dataset)}>
              <Popup>
                <div className="p-3 min-w-[200px]">
                  <h4 className="font-bold text-sm mb-2">🌊 {dataPoint.name}</h4>
                  <div className="space-y-1">
                    <p className="text-xs"><span className="font-semibold">NASA Dataset:</span> {dataPoint.dataset}</p>
                    <p className="text-xs"><span className="font-semibold">Flood Risk:</span> {dataPoint.intensity}%</p>
                    <p className="text-xs"><span className="font-semibold">Status:</span> 
                      <span className={`ml-1 ${dataPoint.intensity > 70 ? 'text-red-600' : dataPoint.intensity > 40 ? 'text-blue-600' : 'text-green-600'}`}>
                        {dataPoint.intensity > 70 ? 'High Risk' : dataPoint.intensity > 40 ? 'Moderate' : 'Low Risk'}
                      </span>
                    </p>
                    <p className="text-xs"><span className="font-semibold">Data Source:</span> NASA Earthdata</p>
                    <p className="text-xs"><span className="font-semibold">Last Update:</span> {new Date(dataPoint.lastUpdate).toLocaleTimeString()}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={dataPoint.position}
              radius={getZoneRadius(dataPoint.intensity)}
              fillColor={getZoneColor(dataPoint.type, dataPoint.intensity)}
              fillOpacity={getZoneOpacity(dataPoint.intensity)}
              color={getZoneColor(dataPoint.type, dataPoint.intensity)}
              weight={2}
              opacity={0.8}
            />
          </div>
        ))}
      </MapContainer>
    </div>
  )
}