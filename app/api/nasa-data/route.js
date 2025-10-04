import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { processNASADataDirectory, processNASADataDirectoryWithPixels, extractAODForZone } from '@/lib/gdal-reader'

// Zone boundaries for 4 diagonal zones only (NE, NW, SE, SW)
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



function aodToAQI(aod) {
  if (aod === null || aod === undefined || aod < 0) return null
  
  
  const pm25 = aod * 35
  
  const breakpoints = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },      // Good
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },   // Moderate
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },  // Unhealthy for Sensitive
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 }, // Unhealthy
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 }, // Very Unhealthy
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 }  // Hazardous
  ]
  
  let breakpoint = breakpoints[breakpoints.length - 1]
  for (const bp of breakpoints) {
    if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
      breakpoint = bp
      break
    }
  }
  
  const aqi = Math.round(
    ((breakpoint.iHigh - breakpoint.iLow) / (breakpoint.cHigh - breakpoint.cLow)) * 
    (pm25 - breakpoint.cLow) + breakpoint.iLow
  )
  
  return Math.max(0, Math.min(500, aqi)) 
}

function getAQILevel(aqi) {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

function getAQIColor(aqi) {
  if (aqi <= 50) return '#00E400'      // Green
  if (aqi <= 100) return '#FFFF00'     // Yellow
  if (aqi <= 150) return '#FF7E00'     // Orange
  if (aqi <= 200) return '#FF0000'     // Red
  if (aqi <= 300) return '#8F3F97'     // Purple
  return '#7E0023'                     // Maroon
}

// Helper function to check if a pixel is within zone bounds
function isPixelInZone(pixel, zoneBounds) {
  if (!zoneBounds) return true // citywide
  
  return pixel.lat >= zoneBounds.south && 
         pixel.lat <= zoneBounds.north &&
         pixel.lng >= zoneBounds.west && 
         pixel.lng <= zoneBounds.east
}

// Helper function to calculate average AOD from pixels
function calculateAverageAOD(pixels) {
  if (!pixels || pixels.length === 0) return null
  
  const validPixels = pixels.filter(p => p.aod > 0 && p.aod < 2)
  if (validPixels.length === 0) return null
  
  const sum = validPixels.reduce((acc, pixel) => acc + pixel.aod, 0)
  return sum / validPixels.length
}

async function processNASAData(city = 'nyc', area = 'citywide') {
  try {
    const dataDir = path.join(process.cwd(), 'public', 'data', city, 'MCD19A2')
    
    try {
      await fs.access(dataDir)
    } catch {
      throw new Error(`No NASA data found for city: ${city}`)
    }
    
    console.log(`Processing NASA data for ${city} area ${area} from ${dataDir}`)
    
    // Get area information
    const areaInfo = CITY_AREA_BOUNDARIES[city]?.[area] || CITY_AREA_BOUNDARIES[city]?.['citywide']
    const isCitywide = area === 'citywide'
    
    // Use pixel-level processing for area-specific data, regular processing for citywide
    const gdalResult = isCitywide 
      ? await processNASADataDirectory(dataDir)
      : await processNASADataDirectoryWithPixels(dataDir)
    
    if (!gdalResult.success || gdalResult.validFiles === 0) {
      throw new Error(`Failed to process NASA GeoTIFF data for ${area}. No valid data found.`)
    }
    
    const { data: gdalData, validFiles, totalFiles, errorFiles, errors: errorSamples } = gdalResult
    
    if (validFiles === 0) {
      throw new Error('No valid AOD data found in any GeoTIFF files')
    }
    
    let dailyData = []
    
    if (isCitywide) {
      // Use the original citywide processing
      dailyData = gdalData.map(item => {
        const aqi = aodToAQI(item.aod)
        
        return {
          date: item.date,
          julianDay: item.julianDay,
          year: item.year,
          aod: Math.round(item.aod * 1000) / 1000,
          aqi: aqi,
          aqiLevel: getAQILevel(aqi),
          filename: item.filename,
          validBands: item.validBands,
          totalBands: item.totalBands,
          area: areaInfo?.name || 'Citywide Average',
          bandsInfo: item.bands.filter(b => b.hasValidData).map(b => ({
            band: b.band,
            mean: Math.round((b.mean * b.scale + b.offset) * 1000) / 1000,
            validPercent: b.validPercent
          }))
        }
      }).filter(d => d.aqi !== null)
    } else {
      // Process zone-specific AQI using extractAODForZone
      const files = await fs.readdir(dataDir)
      const tifFiles = files.filter(file => file.endsWith('.tif')).sort()
      
      const zoneResults = []
      
      for (const file of tifFiles) {
        try {
          const filePath = path.join(dataDir, file)
          const zoneResult = await extractAODForZone(filePath, areaInfo?.bounds)
          
          if (zoneResult.success && zoneResult.aod !== null) {
            // Extract date from filename
            const match = file.match(/A(\d{4})(\d{3})/)
            if (match) {
              const year = parseInt(match[1])
              const julianDay = parseInt(match[2])
              const date = new Date(year, 0, julianDay)
              
              const aqi = aodToAQI(zoneResult.aod)
              
              zoneResults.push({
                date: date.toISOString().split('T')[0],
                julianDay: julianDay,
                year: year,
                aod: Math.round(zoneResult.aod * 1000) / 1000,
                aqi: aqi,
                aqiLevel: getAQILevel(aqi),
                filename: file,
                area: areaInfo?.name || 'Unknown Zone',
                pixelCount: zoneResult.pixelCount,
                totalPixels: zoneResult.totalPixels,
                zoneCoverage: zoneResult.zoneCoverage
              })
            }
          }
        } catch (error) {
          console.warn(`Error processing ${file}:`, error.message)
        }
      }
      
      dailyData = zoneResults.filter(d => d.aqi !== null)
    }
    
    if (dailyData.length === 0) {
      throw new Error('No valid AQI values could be calculated from AOD data')
    }
    
    dailyData.sort((a, b) => new Date(a.date) - new Date(b.date))
    
    const aqiValues = dailyData.map(d => d.aqi)
    const aodValues = dailyData.map(d => d.aod)
    
    const avgAQI = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length)
    const avgAOD = Math.round(aodValues.reduce((a, b) => a + b, 0) / aodValues.length * 1000) / 1000
    const maxAQI = Math.max(...aqiValues)
    const minAQI = Math.min(...aqiValues)
    
    const recentData = dailyData.slice(-30)
    const recentAvgAQI = recentData.length > 0 ? Math.round(
      recentData.reduce((sum, d) => sum + d.aqi, 0) / recentData.length
    ) : avgAQI
    
    return {
      city: city.toUpperCase(),
      area: areaInfo?.name || 'Citywide Average',
      areaId: area,
      totalDays: totalFiles,
      validDays: dailyData.length,
      errorDays: errorFiles,
      errorSamples: (errorSamples || []).slice(0, 10),
      dataRange: {
        start: dailyData[0]?.date,
        end: dailyData[dailyData.length - 1]?.date
      },
      currentAQI: avgAQI,
      currentAQILevel: getAQILevel(avgAQI),
      currentAQIColor: getAQIColor(avgAQI),
      recentAQI: recentAvgAQI,
      recentAQILevel: getAQILevel(recentAvgAQI),
      statistics: {
        averageAQI: avgAQI,
        averageAOD: avgAOD,
        maxAQI,
        minAQI,
        totalObservations: dailyData.length,
        dataQuality: {
          validFiles: validFiles,
          totalFiles: totalFiles,
          successRate: Math.round((validFiles / totalFiles) * 100)
        }
      },
      trend: dailyData.map(d => ({
        date: d.date,
        aqi: d.aqi,
        aod: d.aod
      })),
      lastUpdated: new Date().toISOString(),
      dataSource: isCitywide 
        ? 'NASA MODIS MCD19A2 v061 (Real Satellite Data)'
        : `NASA MODIS MCD19A2 v061 - ${areaInfo?.name} (Real Zone Data)`,
      processingInfo: {
        gdalVersion: 'GDAL 3.x',
        bandsProcessed: '5-band AOD measurements',
        method: isCitywide 
          ? 'Weighted average from valid bands'
          : `Real pixel data filtered by zone boundaries for ${areaInfo?.name}`
      }
    }
    
  } catch (error) {
    console.error('Error processing NASA data:', error)
    throw error
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city') || 'nyc'
    const area = searchParams.get('area') || 'citywide'
    const refresh = searchParams.get('refresh') === 'true'
    
    const data = await processNASAData(city, area)
    
    return NextResponse.json({
      success: true,
      data,
      cached: false,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('NASA Data API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { city = 'nyc', area = 'citywide', forceRefresh = false } = body
    
    const data = await processNASAData(city, area)
    
    return NextResponse.json({
      success: true,
      data,
      refreshed: true,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('NASA Data API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}