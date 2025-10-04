'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon } from 'react-leaflet'
import L from 'leaflet'
import { useHotspots } from '@/hooks/use-hotspots'
import { Button } from '@/components/ui/button'
import { RefreshCw, MapPin } from 'lucide-react'


delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const createHotspotIcon = (severity, rank) => {
  // All hotspots are red with different intensities
  const colors = {
    critical: '#dc2626', // Bright red
    high: '#ef4444',     // Red
    moderate: '#f87171'  // Light red
  }
  
  const color = colors[severity] || '#dc2626'
  
  return new L.divIcon({
    className: 'hotspot-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, ${color}, ${color}dd);
        border: 3px solid white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        position: relative;
      ">
        ${rank}
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          background: ${color};
          color: white;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 8px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          🔥
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  })
}

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

export default function CityMap({ cityData, mode = 'detailed', showHotspots = false, selectedArea = 'citywide' }) {
  const [map, setMap] = useState(null)
  const [mapKey, setMapKey] = useState(0)
  const mapRef = useRef(null)
  
  // Get hotspots data if enabled
  const nasaCityKey = cityData?.name === 'New York' ? 'nyc' : (cityData?.name === 'Mumbai' ? 'mumbai' : null)
  const { hotspots, loading: hotspotsLoading, error: hotspotsError, refresh: refreshHotspots } = useHotspots(
    nasaCityKey, 
    selectedArea, 
    10
  )

  // Map refresh functionality
  const [mapRefreshing, setMapRefreshing] = useState(false)
  
  const handleMapRefresh = async () => {
    setMapRefreshing(true)
    try {
      // Refresh hotspots data
      if (showHotspots && refreshHotspots) {
        await refreshHotspots()
      }
      
      // Force map re-render
      setMapKey(prev => prev + 1)
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      setMapRefreshing(false)
    }
  }

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

  // Auto-fit map to hotspots when they load
  useEffect(() => {
    if (map && showHotspots && hotspots && hotspots.length > 0) {
      const lats = hotspots.map(h => h.lat)
      const lngs = hotspots.map(h => h.lng)
      
      if (lats.length > 0 && lngs.length > 0) {
        const bounds = [
          [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01],
          [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01]
        ]
        
        // Fit map to show all hotspots with padding
        map.fitBounds(bounds, { padding: [20, 20] })
      }
    }
  }, [map, hotspots, showHotspots])

  // Show loading when area changes
  useEffect(() => {
    if (showHotspots && hotspotsLoading) {
      // Map will show loading overlay automatically
    }
  }, [selectedArea, showHotspots, hotspotsLoading])

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

  // Auto-zoom to fit hotspots if available, otherwise use default
  const getMapBounds = () => {
    if (showHotspots && hotspots && hotspots.length > 0) {
      // Calculate bounds to fit all hotspots with some padding
      const lats = hotspots.map(h => h.lat)
      const lngs = hotspots.map(h => h.lng)
      
      const bounds = [
        [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01], // Southwest
        [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01]  // Northeast
      ]
      return bounds
    }
    return null
  }

  const mapBounds = getMapBounds()
  const mapCenter = mapBounds ? 
    [(mapBounds[0][0] + mapBounds[1][0]) / 2, (mapBounds[0][1] + mapBounds[1][1]) / 2] : 
    cityData.coordinates
  const mapZoom = mapBounds ? 11 : 11

  return (
    <div className="h-full w-full rounded-lg overflow-hidden relative">
      {/* Map Controls */}
      <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-2">
        {/* Area Indicator */}
        {showHotspots && selectedArea !== 'citywide' && (
          <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-1 text-xs font-medium shadow-lg text-foreground">
            <MapPin className="h-3 w-3 inline mr-1" />
            {selectedArea.charAt(0).toUpperCase() + selectedArea.slice(1)} Zone
          </div>
        )}
        
        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleMapRefresh}
          disabled={mapRefreshing || hotspotsLoading}
          className="h-8 px-3 text-xs bg-background/95 backdrop-blur-sm border-border/50 shadow-lg hover:bg-background text-foreground hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${(mapRefreshing || hotspotsLoading) ? 'animate-spin' : ''}`} />
          {mapRefreshing || hotspotsLoading ? 'Refreshing...' : 'Refresh Map'}
        </Button>
      </div>

      {/* Loading Overlay */}
      {(mapRefreshing || hotspotsLoading) && (
        <div className="absolute inset-0 z-[999] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg p-4 border shadow-lg">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <div className="text-sm">
                <div className="font-medium">Updating Map Data</div>
                <div className="text-muted-foreground text-xs">
                  {hotspotsLoading ? 'Loading hotspots...' : 'Refreshing map...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <MapContainer
        key={mapKey}
        center={mapCenter}
        zoom={mapZoom}
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
          // In overview mode, show city center marker
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

        {/* Hotspots */}
        {showHotspots && hotspots && hotspots.map((hotspot) => (
          <div key={hotspot.id}>
            <Marker 
              position={[hotspot.lat, hotspot.lng]} 
              icon={createHotspotIcon(hotspot.severity, hotspot.rank)}
            >
              <Popup>
                <div className="p-3 min-w-[220px]">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    🔥 Pollution Hotspot #{hotspot.rank}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-semibold">Severity:</span> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                        hotspot.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        hotspot.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {hotspot.severity.toUpperCase()}
                      </span>
                    </p>
                    <p className="text-sm"><span className="font-semibold">AQI:</span> {hotspot.aqi}</p>
                    <p className="text-sm"><span className="font-semibold">AOD:</span> {hotspot.aod.toFixed(3)}</p>
                    <p className="text-sm"><span className="font-semibold">Date:</span> {hotspot.date}</p>
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                      ⚠️ High pollution area - 1km radius
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[hotspot.lat, hotspot.lng]}
              radius={hotspot.radius}
              pathOptions={{
                color: hotspot.severity === 'critical' ? '#dc2626' : 
                       hotspot.severity === 'high' ? '#ef4444' : '#f87171',
                fillColor: hotspot.severity === 'critical' ? '#dc2626' : 
                          hotspot.severity === 'high' ? '#ef4444' : '#f87171',
                fillOpacity: 0.15,
                weight: 2,
                dashArray: '5,5'
              }}
            />
          </div>
        ))}
      </MapContainer>
    </div>
  )
}