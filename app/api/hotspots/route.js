import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { extractHotspots } from '@/lib/gdal-reader'

// Zone boundaries for hotspot detection
const CITY_AREA_BOUNDARIES = {
  'nyc': {
    'citywide': { name: 'Citywide Average', bounds: null },
    'northeastern': { 
      name: 'Northeastern', 
      bounds: { north: 41.0, south: 40.7, west: -73.95, east: -73.6 }
    },
    'northwestern': { 
      name: 'Northwestern', 
      bounds: { north: 41.0, south: 40.7, west: -74.3, east: -73.95 }
    },
    'southeastern': { 
      name: 'Southeastern', 
      bounds: { north: 40.7, south: 40.4, west: -73.95, east: -73.6 }
    },
    'southwestern': { 
      name: 'Southwestern', 
      bounds: { north: 40.7, south: 40.4, west: -74.3, east: -73.95 }
    }
  },
  'mumbai': {
    'citywide': { name: 'Citywide Average', bounds: null },
    'northeastern': { 
      name: 'Northeastern', 
      bounds: { north: 19.30, south: 19.05, west: 72.925, east: 73.10 }
    },
    'northwestern': { 
      name: 'Northwestern', 
      bounds: { north: 19.30, south: 19.05, west: 72.75, east: 72.925 }
    },
    'southeastern': { 
      name: 'Southeastern', 
      bounds: { north: 19.05, south: 18.80, west: 72.925, east: 73.10 }
    },
    'southwestern': { 
      name: 'Southwestern', 
      bounds: { north: 19.05, south: 18.80, west: 72.75, east: 72.925 }
    }
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city') || 'nyc'
    const area = searchParams.get('area') || 'citywide'
    const maxHotspots = parseInt(searchParams.get('maxHotspots')) || 10

    const dataDir = path.join(process.cwd(), 'public', 'data', city, 'MCD19A2')
    
    try {
      await fs.access(dataDir)
    } catch {
      return NextResponse.json({ 
        success: false, 
        error: `No NASA data found for city: ${city}` 
      }, { status: 404 })
    }

    // Get area information
    const areaInfo = CITY_AREA_BOUNDARIES[city]?.[area] || CITY_AREA_BOUNDARIES[city]?.['citywide']
    const isCitywide = area === 'citywide'

    // Get all TIF files
    const files = await fs.readdir(dataDir)
    const tifFiles = files.filter(file => file.endsWith('.tif')).sort()
    
    if (tifFiles.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No GeoTIFF files found' 
      }, { status: 404 })
    }

    // Process recent files for hotspots (last 30 days worth)
    const recentFiles = tifFiles.slice(-30) // Get last 30 files
    const allHotspots = []
    const processedFiles = []

    for (const file of recentFiles) {
      try {
        const filePath = path.join(dataDir, file)
        const hotspotResult = await extractHotspots(filePath, maxHotspots)
        
        if (hotspotResult.success && hotspotResult.hotspots.length > 0) {
          // Filter by area bounds if not citywide
          let filteredHotspots = hotspotResult.hotspots
          
          if (!isCitywide && areaInfo?.bounds) {
            filteredHotspots = hotspotResult.hotspots.filter(hotspot => {
              return hotspot.lat >= areaInfo.bounds.south && 
                     hotspot.lat <= areaInfo.bounds.north &&
                     hotspot.lng >= areaInfo.bounds.west && 
                     hotspot.lng <= areaInfo.bounds.east
            })
          }
          
          if (filteredHotspots.length > 0) {
            // Add date information
            const match = file.match(/A(\d{4})(\d{3})/)
            if (match) {
              const year = parseInt(match[1])
              const julianDay = parseInt(match[2])
              const date = new Date(year, 0, julianDay)
              
              filteredHotspots.forEach(hotspot => {
                hotspot.date = date.toISOString().split('T')[0]
                hotspot.filename = file
              })
              
              allHotspots.push(...filteredHotspots)
              processedFiles.push(file)
            }
          }
        }
      } catch (error) {
        console.warn(`Error processing ${file}:`, error.message)
      }
    }

    if (allHotspots.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hotspots found in the specified area' 
      }, { status: 404 })
    }

    // Sort all hotspots by AOD value (highest first) and take top N
    const topHotspots = allHotspots
      .sort((a, b) => b.aod - a.aod)
      .slice(0, maxHotspots)

    // Calculate statistics
    const aodValues = topHotspots.map(h => h.aod)
    const aqiValues = topHotspots.map(h => h.aqi)
    
    const stats = {
      totalHotspots: topHotspots.length,
      maxAOD: Math.max(...aodValues),
      minAOD: Math.min(...aodValues),
      avgAOD: aodValues.reduce((a, b) => a + b, 0) / aodValues.length,
      maxAQI: Math.max(...aqiValues),
      minAQI: Math.min(...aqiValues),
      avgAQI: aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length,
      processedFiles: processedFiles.length,
      totalFiles: recentFiles.length
    }

    return NextResponse.json({
      success: true,
      city: city.toUpperCase(),
      area: areaInfo?.name || 'Citywide Average',
      areaId: area,
      hotspots: topHotspots,
      statistics: stats,
      dataRange: {
        start: topHotspots[0]?.date,
        end: topHotspots[topHotspots.length - 1]?.date
      },
      lastUpdated: new Date().toISOString(),
      dataSource: `NASA MODIS MCD19A2 v061 - ${areaInfo?.name} Hotspots (Real Pixel Data)`
    })

  } catch (error) {
    console.error('Error processing hotspots:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
