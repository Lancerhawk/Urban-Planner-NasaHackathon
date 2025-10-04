'use client'

import { MapContainer, TileLayer, Polygon, Popup, Marker } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function PlannerSiteMapLeaflet({ cityData, zones }) {
  return (
    <div className="h-full w-full rounded-lg overflow-hidden relative">
      <MapContainer 
        key={`${cityData.name}-${zones.length}`} 
        center={cityData.coordinates} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }} 
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" />
        <Marker position={cityData.coordinates}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{cityData.name}</div>
              <div className="text-muted-foreground">Site planning view</div>
            </div>
          </Popup>
        </Marker>
        {zones.map((z) => (
          <Polygon 
            key={z.id} 
            positions={z.coords} 
            pathOptions={{ 
              color: z.color, 
              fillColor: z.color, 
              fillOpacity: z.type === 'owned' ? 0.6 : z.type === 'available' ? 0.4 : 0.3, 
              weight: z.type === 'owned' ? 4 : z.type === 'available' ? 3 : 2,
              dashArray: z.type === 'government' ? '8,4' : z.type === 'occupied' ? '4,4' : undefined
            }}
          >
            <Popup>
              <div className="text-sm min-w-[200px]">
                <div className="font-semibold text-base mb-2">{z.name}</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">{z.suitability}</span>
                  </div>
                  {z.price && z.price !== 'N/A' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium text-green-600">{z.price}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner:</span>
                    <span className="font-medium">{z.owner}</span>
                  </div>
                  {z.contact && z.contact !== 'N/A' && z.contact !== 'Confidential' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium text-blue-600">{z.contact}</span>
                    </div>
                  )}
                  {z.type === 'available' && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                      💡 Click to view details and contact owner
                    </div>
                  )}
                  {z.type === 'government' && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                      ⚠️ Government reserved - not available for private development
                    </div>
                  )}
                  {z.type === 'occupied' && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                      🏠 Currently occupied - contact owner for potential sale
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Polygon>
        ))}
      </MapContainer>
      
      {/* Legend overlay */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border z-[1000]">
        <div className="text-sm font-semibold mb-2 text-black">Zone Types</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-black">Your Land</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
            <span className="text-black">For Sale</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
            <span className="text-black">Conditional</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#8b5cf6' }}></div>
            <span className="text-black">Industrial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-dashed" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-black">Government</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-dotted" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-black">Occupied</span>
          </div>
        </div>
      </div>
    </div>
  )
}


