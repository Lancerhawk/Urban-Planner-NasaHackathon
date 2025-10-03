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
    <div className="h-full w-full rounded-lg overflow-hidden">
      <MapContainer center={cityData.coordinates} zoom={12} style={{ height: '100%', width: '100%' }} attributionControl={false}>
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
          <Polygon key={z.id} positions={z.coords} pathOptions={{ color: z.color, fillColor: z.color, fillOpacity: 0.25, weight: 2 }}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{z.name}</div>
                <div className="text-muted-foreground">Suitability: {z.suitability}</div>
              </div>
            </Popup>
          </Polygon>
        ))}
      </MapContainer>
    </div>
  )
}


