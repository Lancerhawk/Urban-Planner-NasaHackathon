'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'

const LeafletMap = dynamic(() => import('./PlannerSiteMapLeaflet'), { ssr: false })

export default function PlannerSiteMap({ cityData, scenario = 'baseline', requirements }) {
  const zones = useMemo(() => {
    // Static demo zones with simple coloring
    // Colors: green = suitable, yellow = conditionally suitable, red = not suitable
    return [
      {
        id: 'zone-a',
        name: 'Redevelopment Plot A',
        color: '#10b981',
        suitability: 'Suitable',
        coords: [
          [cityData.coordinates[0] + 0.02, cityData.coordinates[1] - 0.03],
          [cityData.coordinates[0] + 0.025, cityData.coordinates[1] - 0.01],
          [cityData.coordinates[0] + 0.01, cityData.coordinates[1] - 0.015],
        ],
      },
      {
        id: 'zone-b',
        name: 'Industrial Conversion B',
        color: '#f59e0b',
        suitability: 'Conditional',
        coords: [
          [cityData.coordinates[0] - 0.015, cityData.coordinates[1] + 0.03],
          [cityData.coordinates[0] - 0.02, cityData.coordinates[1] + 0.015],
          [cityData.coordinates[0] - 0.03, cityData.coordinates[1] + 0.035],
        ],
      },
      {
        id: 'zone-c',
        name: 'Sensitive Green C',
        color: '#ef4444',
        suitability: 'Avoid',
        coords: [
          [cityData.coordinates[0] + 0.01, cityData.coordinates[1] + 0.01],
          [cityData.coordinates[0] + 0.02, cityData.coordinates[1] + 0.02],
          [cityData.coordinates[0] + 0.005, cityData.coordinates[1] + 0.025],
        ],
      },
    ]
  }, [cityData, scenario, requirements])

  return (
    <div className="h-full w-full">
      <LeafletMap cityData={cityData} zones={zones} />
    </div>
  )
}


