import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { processNASADataDirectory } from '@/lib/gdal-reader'

// AOD to AQI conversion function
// Based on EPA AQI formula and research correlations between AOD and PM2.5
function aodToAQI(aod) {
  if (aod === null || aod === undefined || aod < 0) return null
  
  // Convert AOD to estimated PM2.5 (μg/m³)
  // Research shows AOD * 25-50 approximates PM2.5 for urban areas
  // Using conservative factor of 35 for NYC
  const pm25 = aod * 35
  
  // EPA AQI breakpoints for PM2.5
  const breakpoints = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },      // Good
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },   // Moderate
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },  // Unhealthy for Sensitive
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 }, // Unhealthy
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 }, // Very Unhealthy
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 }  // Hazardous
  ]
  
  // Find appropriate breakpoint
  let breakpoint = breakpoints[breakpoints.length - 1] // Default to highest
  for (const bp of breakpoints) {
    if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
      breakpoint = bp
      break
    }
  }
  
  // Calculate AQI using EPA formula
  const aqi = Math.round(
    ((breakpoint.iHigh - breakpoint.iLow) / (breakpoint.cHigh - breakpoint.cLow)) * 
    (pm25 - breakpoint.cLow) + breakpoint.iLow
  )
  
  return Math.max(0, Math.min(500, aqi)) // Clamp between 0-500
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

// Process real NASA GeoTIFF data using GDAL
async function processNASAData(city = 'nyc') {
  try {
    const dataDir = path.join(process.cwd(), 'public', 'data', city, 'MCD19A2')
    
    // Check if directory exists
    try {
      await fs.access(dataDir)
    } catch {
      throw new Error(`No NASA data found for city: ${city}`)
    }
    
    console.log(`Processing NASA data for ${city} from ${dataDir}`)
    
    // Use GDAL to extract real AOD data from GeoTIFF files
    const gdalResult = await processNASADataDirectory(dataDir)
    
    if (!gdalResult.success) {
      throw new Error('Failed to process NASA GeoTIFF data')
    }
    
    const { data: gdalData, validFiles, totalFiles, errorFiles } = gdalResult
    
    if (validFiles === 0) {
      throw new Error('No valid AOD data found in any GeoTIFF files')
    }
    
    // Convert GDAL results to daily data with AQI calculations
    const dailyData = gdalData.map(item => {
      const aqi = aodToAQI(item.aod)
      
      return {
        date: item.date,
        julianDay: item.julianDay,
        year: item.year,
        aod: Math.round(item.aod * 1000) / 1000, // Round to 3 decimal places
        aqi,
        aqiLevel: getAQILevel(aqi),
        filename: item.filename,
        validBands: item.validBands,
        totalBands: item.totalBands,
        bandsInfo: item.bands.filter(b => b.hasValidData).map(b => ({
          band: b.band,
          mean: Math.round((b.mean * b.scale + b.offset) * 1000) / 1000,
          validPercent: b.validPercent
        }))
      }
    }).filter(d => d.aqi !== null) // Filter out invalid AQI values
    
    if (dailyData.length === 0) {
      throw new Error('No valid AQI values could be calculated from AOD data')
    }
    
    // Sort by date
    dailyData.sort((a, b) => new Date(a.date) - new Date(b.date))
    
    // Calculate statistics
    const aqiValues = dailyData.map(d => d.aqi)
    const aodValues = dailyData.map(d => d.aod)
    
    const avgAQI = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length)
    const avgAOD = Math.round(aodValues.reduce((a, b) => a + b, 0) / aodValues.length * 1000) / 1000
    const maxAQI = Math.max(...aqiValues)
    const minAQI = Math.min(...aqiValues)
    
    // Get recent trend (last 30 days)
    const recentData = dailyData.slice(-30)
    const recentAvgAQI = recentData.length > 0 ? Math.round(
      recentData.reduce((sum, d) => sum + d.aqi, 0) / recentData.length
    ) : avgAQI
    
    return {
      city: city.toUpperCase(),
      totalDays: totalFiles,
      validDays: dailyData.length,
      errorDays: errorFiles,
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
      dataSource: 'NASA MODIS MCD19A2 v061 (Real Satellite Data)',
      processingInfo: {
        gdalVersion: 'GDAL 3.x',
        bandsProcessed: '5-band AOD measurements',
        method: 'Weighted average from valid bands'
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
    const refresh = searchParams.get('refresh') === 'true'
    
    // In production, implement caching here
    // For now, always process fresh data
    const data = await processNASAData(city)
    
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
    const { city = 'nyc', forceRefresh = false } = body
    
    // Force refresh data
    const data = await processNASAData(city)
    
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
