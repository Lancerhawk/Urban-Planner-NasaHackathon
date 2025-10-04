'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'

const LeafletMap = dynamic(() => import('./PlannerSiteMapLeaflet'), { ssr: false })

export default function PlannerSiteMap({ cityData, scenario = 'baseline', requirements, hasLand = false, landCoordinates = '', landName = '' }) {
  const zones = useMemo(() => {
    const [lat, lng] = cityData.coordinates
    
    // If user has land, show their plot
    if (hasLand && landCoordinates) {
      try {
        const [userLat, userLng] = landCoordinates.split(',').map(Number)
        return [
          {
            id: 'user-land',
            name: landName || 'Your Land',
            color: '#3b82f6',
            suitability: 'Your Land',
            type: 'owned',
            coords: [
              [userLat - 0.008, userLng - 0.008],
              [userLat + 0.008, userLng - 0.008],
              [userLat + 0.008, userLng + 0.008],
              [userLat - 0.008, userLng + 0.008],
            ],
          }
        ]
      } catch (e) {
        // Invalid coordinates, fall back to available zones
        // console.error('Invalid land coordinates:', e)
      }
    }
    
    // Available zones for purchase/development - maximally spaced to eliminate any overlap
    return [
      {
        id: 'zone-a',
        name: 'Commercial Plot A',
        color: '#10b981',
        suitability: 'For Sale',
        type: 'available',
        price: '₹2.5 Cr/acre',
        owner: 'ABC Developers',
        contact: '+91-98765-43210',
        coords: [
          [lat + 0.040, lng - 0.060],
          [lat + 0.065, lng - 0.055],
          [lat + 0.070, lng - 0.040],
          [lat + 0.065, lng - 0.025],
          [lat + 0.040, lng - 0.020],
          [lat + 0.015, lng - 0.025],
          [lat + 0.010, lng - 0.040],
          [lat + 0.015, lng - 0.055],
        ],
      },
      {
        id: 'zone-b',
        name: 'Residential Sector B',
        color: '#f59e0b',
        suitability: 'Conditional',
        type: 'available',
        price: '₹1.8 Cr/acre',
        owner: 'XYZ Properties',
        contact: '+91-98765-43211',
        coords: [
          [lat - 0.080, lng + 0.010],
          [lat - 0.055, lng + 0.020],
          [lat - 0.040, lng + 0.015],
          [lat - 0.030, lng + 0.005],
          [lat - 0.035, lng - 0.010],
          [lat - 0.050, lng - 0.005],
          [lat - 0.065, lng + 0.005],
          [lat - 0.085, lng + 0.005],
        ],
      },
      {
        id: 'zone-c',
        name: 'Government Reserved',
        color: '#ef4444',
        suitability: 'Not Available',
        type: 'government',
        price: 'N/A',
        owner: 'Municipal Corporation',
        contact: 'N/A',
        coords: [
          [lat - 0.010, lng + 0.030],
          [lat + 0.015, lng + 0.035],
          [lat + 0.020, lng + 0.050],
          [lat + 0.010, lng + 0.060],
          [lat - 0.010, lng + 0.055],
          [lat - 0.020, lng + 0.040],
        ],
      },
      {
        id: 'zone-d',
        name: 'Industrial Zone D',
        color: '#8b5cf6',
        suitability: 'For Sale',
        type: 'available',
        price: '₹1.2 Cr/acre',
        owner: 'Industrial Estates Ltd',
        contact: '+91-98765-43212',
        coords: [
          [lat - 0.055, lng - 0.070],
          [lat - 0.040, lng - 0.075],
          [lat - 0.025, lng - 0.070],
          [lat - 0.020, lng - 0.055],
          [lat - 0.025, lng - 0.040],
          [lat - 0.040, lng - 0.045],
          [lat - 0.055, lng - 0.050],
        ],
      },
      {
        id: 'zone-e',
        name: 'Private Development E',
        color: '#ef4444',
        suitability: 'Occupied',
        type: 'occupied',
        price: 'N/A',
        owner: 'Private Owner',
        contact: 'Confidential',
        coords: [
          [lat + 0.060, lng - 0.025],
          [lat + 0.075, lng - 0.015],
          [lat + 0.080, lng + 0.005],
          [lat + 0.070, lng + 0.015],
          [lat + 0.055, lng + 0.010],
          [lat + 0.045, lng],
          [lat + 0.050, lng - 0.015],
        ],
      },
      {
        id: 'zone-f',
        name: 'Mixed Use Plot F',
        color: '#10b981',
        suitability: 'For Sale',
        type: 'available',
        price: '₹3.2 Cr/acre',
        owner: 'Metro Developers',
        contact: '+91-98765-43213',
        coords: [
          [lat - 0.090, lng - 0.035],
          [lat - 0.075, lng - 0.040],
          [lat - 0.060, lng - 0.045],
          [lat - 0.055, lng - 0.040],
          [lat - 0.060, lng - 0.030],
          [lat - 0.075, lng - 0.025],
          [lat - 0.090, lng - 0.030],
        ],
      },
      {
        id: 'zone-g',
        name: 'Green Buffer Zone',
        color: '#ef4444',
        suitability: 'Protected',
        type: 'government',
        price: 'N/A',
        owner: 'Forest Department',
        contact: 'N/A',
        coords: [
          [lat - 0.035, lng + 0.070],
          [lat - 0.015, lng + 0.075],
          [lat, lng + 0.070],
          [lat + 0.005, lng + 0.055],
          [lat, lng + 0.040],
          [lat - 0.015, lng + 0.035],
          [lat - 0.030, lng + 0.040],
          [lat - 0.040, lng + 0.055],
        ],
      },
      {
        id: 'zone-h',
        name: 'Tech Park H',
        color: '#8b5cf6',
        suitability: 'For Sale',
        type: 'available',
        price: '₹4.5 Cr/acre',
        owner: 'TechCorp Estates',
        contact: '+91-98765-43214',
        coords: [
          [lat + 0.090, lng - 0.030],
          [lat + 0.105, lng - 0.015],
          [lat + 0.100, lng + 0.005],
          [lat + 0.085, lng + 0.010],
          [lat + 0.070, lng + 0.005],
          [lat + 0.065, lng - 0.010],
          [lat + 0.070, lng - 0.025],
          [lat + 0.085, lng - 0.035],
        ],
      },
    ]
  }, [cityData, scenario, requirements, hasLand, landCoordinates, landName])

  return (
    <div className="h-full w-full">
      <LeafletMap cityData={cityData} zones={zones} />
    </div>
  )
}


