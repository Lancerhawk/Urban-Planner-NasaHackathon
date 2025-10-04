import { spawn } from 'child_process'
import path from 'path'
import { promises as fs } from 'fs'

// Path to GDAL executables - detect platform
const isWindows = process.platform === 'win32'
const GDAL_PATH = isWindows 
  ? 'C:\\ProgramData\\miniconda3\\envs\\gdal\\Library\\bin'
  : '/usr/bin'
const GDALINFO_EXE = isWindows 
  ? path.join(GDAL_PATH, 'gdalinfo.exe')
  : path.join(GDAL_PATH, 'gdalinfo')
const GDAL_TRANSLATE_EXE = isWindows 
  ? path.join(GDAL_PATH, 'gdal_translate.exe')
  : path.join(GDAL_PATH, 'gdal_translate')

// Check if GDAL is available
async function checkGDALAvailability() {
  try {
    await executeGDAL(GDALINFO_EXE, ['--version'])
    return true
  } catch (error) {
    console.warn('GDAL not available:', error.message)
    return false
  }
}

// Execute GDAL command and return output
async function executeGDAL(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false
    })
    
    let stdout = ''
    let stderr = ''
    
    process.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    process.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`GDAL command failed (code ${code}): ${stderr}`))
      }
    })
    
    process.on('error', (error) => {
      reject(new Error(`Failed to execute GDAL command: ${error.message}`))
    })
  })
}

// Parse gdalinfo output to extract band statistics
function parseGdalInfo(output) {
  const bands = []
  const lines = output.split('\n')
  
  let currentBand = null
  let inBandSection = false
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Detect band start
    const bandMatch = trimmed.match(/^Band (\d+) Block=/)
    if (bandMatch) {
      if (currentBand) {
        bands.push(currentBand)
      }
      currentBand = {
        band: parseInt(bandMatch[1]),
        hasValidData: false,
        minimum: null,
        maximum: null,
        mean: null,
        stddev: null,
        validPercent: 0,
        noDataValue: null,
        scale: 1,
        offset: 0
      }
      inBandSection = true
      continue
    }
    
    if (!inBandSection || !currentBand) continue
    
    // Parse band properties
    if (trimmed.includes('NoData Value=')) {
      const match = trimmed.match(/NoData Value=(-?\d+)/)
      if (match) {
        currentBand.noDataValue = parseInt(match[1])
      }
    }
    
    if (trimmed.includes('Offset:') && trimmed.includes('Scale:')) {
      const offsetMatch = trimmed.match(/Offset:\s*(-?\d+(?:\.\d+)?)/)
      const scaleMatch = trimmed.match(/Scale:\s*(-?\d+(?:\.\d+)?)/)
      if (offsetMatch) currentBand.offset = parseFloat(offsetMatch[1])
      if (scaleMatch) currentBand.scale = parseFloat(scaleMatch[1])
    }
    
    // Parse statistics
    const statsMatch = trimmed.match(/Minimum=(-?\d+(?:\.\d+)?), Maximum=(-?\d+(?:\.\d+)?), Mean=(-?\d+(?:\.\d+)?), StdDev=(-?\d+(?:\.\d+)?)/)
    if (statsMatch) {
      currentBand.hasValidData = true
      currentBand.minimum = parseFloat(statsMatch[1])
      currentBand.maximum = parseFloat(statsMatch[2])
      currentBand.mean = parseFloat(statsMatch[3])
      currentBand.stddev = parseFloat(statsMatch[4])
    }
    
    // Parse valid percent
    const validPercentMatch = trimmed.match(/STATISTICS_VALID_PERCENT=(-?\d+(?:\.\d+)?)/)
    if (validPercentMatch) {
      currentBand.validPercent = parseFloat(validPercentMatch[1])
    }
    
    // Stop parsing when we hit the next band or end
    if (trimmed.startsWith('Band ') && !trimmed.includes('Block=')) {
      inBandSection = false
    }
  }
  
  // Add the last band
  if (currentBand) {
    bands.push(currentBand)
  }
  
  return bands
}

// Extract AOD statistics from a single GeoTIFF file
export async function extractAODFromFile(filePath) {
  try {
    const absolutePath = path.resolve(filePath)
    
    // Check if file exists
    await fs.access(absolutePath)
    
    // Run gdalinfo with statistics
    const output = await executeGDAL(GDALINFO_EXE, ['-stats', absolutePath])
    
    // Parse the output
    const bands = parseGdalInfo(output)
    
    // Extract meaningful AOD values from bands with valid data
    const validBands = bands.filter(band => band.hasValidData && band.validPercent > 0)
    
    if (validBands.length === 0) {
      return {
        hasValidData: false,
        aod: null,
        bands: bands,
        error: 'No valid AOD data found in any band'
      }
    }
    
    // Calculate weighted average AOD from valid bands
    let totalAOD = 0
    let totalWeight = 0
    
    for (const band of validBands) {
      // Apply scale factor to convert raw values to AOD
      const scaledMean = (band.mean * band.scale) + band.offset
      const weight = band.validPercent / 100 // Use valid percentage as weight
      
      totalAOD += scaledMean * weight
      totalWeight += weight
    }
    
    const averageAOD = totalWeight > 0 ? totalAOD / totalWeight : null
    
    return {
      hasValidData: true,
      aod: averageAOD,
      bands: bands,
      validBands: validBands.length,
      totalBands: bands.length,
      filename: path.basename(filePath)
    }
    
  } catch (error) {
    return {
      hasValidData: false,
      aod: null,
      bands: [],
      error: error.message,
      filename: path.basename(filePath)
    }
  }
}

// Extract pixel data with coordinates from a single GeoTIFF file
export async function extractPixelDataWithCoordinates(filePath) {
  try {
    const absolutePath = path.resolve(filePath)
    
    // Check if file exists
    await fs.access(absolutePath)
    
    // First, try to get basic file info using gdalinfo
    const infoOutput = await executeGDAL(GDALINFO_EXE, [absolutePath])
    
    // Parse raster size from gdalinfo output
    const sizeMatch = infoOutput.match(/Size is (\d+), (\d+)/)
    if (!sizeMatch) {
      console.warn(`Could not parse size for ${path.basename(filePath)}`)
      return {
        success: false,
        pixels: [],
        error: 'Could not parse raster size from gdalinfo output',
        filename: path.basename(filePath)
      }
    }
    
    const [width, height] = sizeMatch.slice(1).map(Number)
    
    // Extract geotransform from gdalinfo output
    let geotransform = null
    
    // Try to find geotransform in the output
    const geotransformMatch = infoOutput.match(/GeoTransform = \(([^)]+)\)/)
    if (geotransformMatch) {
      geotransform = geotransformMatch[1].split(',').map(Number)
    } else {
      // Extract origin and pixel size from the output
      const originMatch = infoOutput.match(/Origin = \(([^)]+)\)/)
      const pixelSizeMatch = infoOutput.match(/Pixel Size = \(([^)]+)\)/)
      
      if (originMatch && pixelSizeMatch) {
        const origin = originMatch[1].split(',').map(Number)
        const pixelSize = pixelSizeMatch[1].split(',').map(Number)
        
        // Construct geotransform: [top-left-lng, pixel-width, 0, top-left-lat, 0, -pixel-height]
        geotransform = [origin[0], pixelSize[0], 0, origin[1], 0, pixelSize[1]]
      } else {
        // Fallback: Use default geotransform based on filename
        const isMumbai = filePath.includes('mumbai')
        if (isMumbai) {
          // Mumbai area: roughly 18.9 to 19.4 lat, 72.7 to 73.1 lng
          geotransform = [72.7, 0.001, 0, 19.4, 0, -0.001]
        } else {
          // NYC area: roughly 40.6 to 40.9 lat, -74.1 to -73.8 lng
          geotransform = [-74.1, 0.001, 0, 40.9, 0, -0.001]
        }
      }
    }
    
    // Convert the GeoTIFF to a simple text format to read pixel values
    const tempTxtPath = absolutePath.replace('.tif', '_temp.txt')
    
    try {
      // Use gdal_translate to convert to a readable format
      await executeGDAL(GDAL_TRANSLATE_EXE, [
        '-of', 'AAIGrid', // ASCII Grid format
        '-b', '1', // Use band 1 (AOD at 0.47 micron)
        '-a_nodata', '-28672', // Set NoData value
        '-scale', '0', '6000', '0', '6000', // Scale values (valid_range is -100 to 6000)
        absolutePath,
        tempTxtPath
      ])
      
      // Read the ASCII grid file
      const fs = require('fs')
      const gridData = fs.readFileSync(tempTxtPath, 'utf8')
      
      // Clean up temp file
      fs.unlinkSync(tempTxtPath)
      
      // Parse the ASCII grid data
      const lines = gridData.split('\n').filter(line => line.trim())
      const pixels = []
      
      // Skip header lines and parse data
      let dataStartIndex = 0
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('ncols') || lines[i].startsWith('nrows') || 
            lines[i].startsWith('xllcorner') || lines[i].startsWith('yllcorner') ||
            lines[i].startsWith('cellsize') || lines[i].startsWith('dx') || 
            lines[i].startsWith('dy') || lines[i].startsWith('NODATA')) {
          dataStartIndex = i + 1
        }
      }
      
      // Parse pixel data
      const sampleRate = Math.max(1, Math.floor(Math.sqrt(width * height) / 200)) // Sample ~200 pixels
      
      for (let y = 0; y < height; y += sampleRate) {
        const lineIndex = dataStartIndex + y
        if (lineIndex < lines.length) {
          const values = lines[lineIndex].trim().split(/\s+/).map(Number)
          
          for (let x = 0; x < width; x += sampleRate) {
            if (x < values.length) {
              const rawValue = values[x]
              
              // Skip NODATA values
              if (rawValue === -28672 || rawValue < 0 || rawValue > 6000) {
                continue
              }
              
              // Convert raw value to AOD using the scale factor (0.001)
              // Raw values are in the range 0-6000, scale factor is 0.001
              const aod = rawValue * 0.001
              
              // Convert pixel coordinates to geographic coordinates
              const lng = geotransform[0] + x * geotransform[1] + y * geotransform[2]
              const lat = geotransform[3] + x * geotransform[4] + y * geotransform[5]
              
              if (aod > 0 && aod < 2) { // Valid AOD range
                pixels.push({ lat, lng, aod })
              }
            }
          }
        }
      }
      
      if (pixels.length === 0) {
        console.warn(`No valid pixels extracted for ${path.basename(filePath)}`)
        return {
          success: false,
          pixels: [],
          error: 'No valid pixels extracted from GeoTIFF',
          filename: path.basename(filePath)
        }
      }
      
      return {
        success: true,
        pixels,
        totalPixels: pixels.length,
        geotransform,
        rasterSize: { width, height },
        filename: path.basename(filePath)
      }
      
    } catch (error) {
      // Clean up temp file if it exists
      try {
        if (fs.existsSync(tempTxtPath)) {
          fs.unlinkSync(tempTxtPath)
        }
      } catch {}
      throw error
    }
    
    } catch (error) {
      console.warn(`Error processing ${path.basename(filePath)}:`, error.message)
      return {
        success: false,
        pixels: [],
        error: error.message,
        filename: path.basename(filePath)
      }
    }
}

// Process all GeoTIFF files in a directory
export async function processNASADataDirectory(dataDir) {
  try {
    // Check if GDAL is available
    const gdalAvailable = await checkGDALAvailability()
    if (!gdalAvailable) {
      throw new Error('GDAL is not available in this environment. Please ensure GDAL is installed.')
    }
    
    // Get all TIF files
    const files = await fs.readdir(dataDir)
    const tifFiles = files.filter(file => file.endsWith('.tif')).sort()
    
    if (tifFiles.length === 0) {
      throw new Error('No TIF files found in directory')
    }
    
    const results = []
    const errors = []
    
    console.log(`Processing ${tifFiles.length} GeoTIFF files...`)
    
    // Process files in batches to avoid overwhelming the system
    const batchSize = 5
    for (let i = 0; i < tifFiles.length; i += batchSize) {
      const batch = tifFiles.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (file) => {
        const filePath = path.join(dataDir, file)
        const result = await extractAODFromFile(filePath)
        
        if (result.hasValidData) {
          // Extract date from filename (e.g., MCD19A2.A2025060...)
          const match = file.match(/A(\d{4})(\d{3})/)
          if (match) {
            const year = parseInt(match[1])
            const julianDay = parseInt(match[2])
            const date = new Date(year, 0, julianDay)
            
            result.date = date.toISOString().split('T')[0]
            result.julianDay = julianDay
            result.year = year
          }
        }
        
        return result
      })
      
      const batchResults = await Promise.all(batchPromises)
      
      for (const result of batchResults) {
        if (result.hasValidData) {
          results.push(result)
        } else {
          errors.push(result)
        }
      }
      
      // Progress logging
      console.log(`Processed ${Math.min(i + batchSize, tifFiles.length)}/${tifFiles.length} files`)
    }
    
    console.log(`Successfully processed ${results.length} files, ${errors.length} errors`)
    
    return {
      success: true,
      totalFiles: tifFiles.length,
      validFiles: results.length,
      errorFiles: errors.length,
      data: results,
      errors: errors.slice(0, 5) // Return first 5 errors for debugging
    }
    
  } catch (error) {
    console.error('Error processing NASA data directory:', error)
    throw error
  }
}

// Extract hotspots (highest AOD points) from a single GeoTIFF file
export async function extractHotspots(filePath, maxHotspots = 10) {
  try {
    // First get all pixels from the file
    const pixelResult = await extractPixelDataWithCoordinates(filePath)
    
    if (!pixelResult.success || !pixelResult.pixels || pixelResult.pixels.length === 0) {
      return {
        success: false,
        hotspots: [],
        error: 'No valid pixels found in file',
        filename: pixelResult.filename
      }
    }
    
    // Filter valid AOD pixels and sort by AOD value (highest first)
    const validPixels = pixelResult.pixels
      .filter(p => p.aod > 0 && p.aod < 2)
      .sort((a, b) => b.aod - a.aod)
      .slice(0, maxHotspots) // Get top N hotspots
    
    if (validPixels.length === 0) {
      return {
        success: false,
        hotspots: [],
        error: 'No valid AOD values found',
        filename: pixelResult.filename
      }
    }
    
    // Convert to hotspot format
    const hotspots = validPixels.map((pixel, index) => ({
      id: `hotspot-${index}`,
      lat: pixel.lat,
      lng: pixel.lng,
      aod: pixel.aod,
      aqi: Math.round((pixel.aod * 100) + 50), // Rough AQI conversion
      severity: pixel.aod > 1.5 ? 'critical' : pixel.aod > 1.0 ? 'high' : 'moderate',
      radius: 1000, // 1km radius in meters
      rank: index + 1
    }))
    
    return {
      success: true,
      hotspots,
      totalPixels: pixelResult.pixels.length,
      validPixels: validPixels.length,
      filename: pixelResult.filename
    }
    
  } catch (error) {
    return {
      success: false,
      hotspots: [],
      error: error.message,
      filename: path.basename(filePath)
    }
  }
}

// Extract AOD for a specific zone from a single GeoTIFF file
export async function extractAODForZone(filePath, zoneBounds) {
  try {
    // First get all pixels from the file
    const pixelResult = await extractPixelDataWithCoordinates(filePath)
    
    if (!pixelResult.success || !pixelResult.pixels || pixelResult.pixels.length === 0) {
      return {
        success: false,
        aod: null,
        pixelCount: 0,
        error: 'No valid pixels found in file',
        filename: pixelResult.filename
      }
    }
    
    // Filter pixels by zone bounds
    const zonePixels = pixelResult.pixels.filter(pixel => {
      return pixel.lat >= zoneBounds.south && 
             pixel.lat <= zoneBounds.north &&
             pixel.lng >= zoneBounds.west && 
             pixel.lng <= zoneBounds.east
    })
    
    if (zonePixels.length === 0) {
      return {
        success: false,
        aod: null,
        pixelCount: 0,
        error: 'No pixels found in specified zone',
        filename: pixelResult.filename
      }
    }
    
    // Calculate average AOD for the zone
    const validPixels = zonePixels.filter(p => p.aod > 0 && p.aod < 2)
    if (validPixels.length === 0) {
      return {
        success: false,
        aod: null,
        pixelCount: zonePixels.length,
        error: 'No valid AOD values in zone',
        filename: pixelResult.filename
      }
    }
    
    const sum = validPixels.reduce((acc, pixel) => acc + pixel.aod, 0)
    const averageAOD = sum / validPixels.length
    
    return {
      success: true,
      aod: averageAOD,
      pixelCount: validPixels.length,
      totalPixels: pixelResult.pixels.length,
      zoneCoverage: Math.round((validPixels.length / pixelResult.pixels.length) * 100),
      filename: pixelResult.filename
    }
    
  } catch (error) {
    return {
      success: false,
      aod: null,
      pixelCount: 0,
      error: error.message,
      filename: path.basename(filePath)
    }
  }
}

// Process all GeoTIFF files with pixel-level data for area-specific analysis
export async function processNASADataDirectoryWithPixels(dataDir) {
  try {
    // Get all TIF files
    const files = await fs.readdir(dataDir)
    const tifFiles = files.filter(file => file.endsWith('.tif')).sort()
    
    if (tifFiles.length === 0) {
      throw new Error('No TIF files found in directory')
    }
    
    const results = []
    const errors = []
    
    console.log(`Processing ${tifFiles.length} GeoTIFF files with pixel data...`)
    
    // Process files in smaller batches for pixel data (more memory intensive)
    const batchSize = 5 // Increased batch size for better performance
    for (let i = 0; i < tifFiles.length; i += batchSize) {
      const batch = tifFiles.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (file) => {
        try {
          const filePath = path.join(dataDir, file)
          const result = await extractPixelDataWithCoordinates(filePath)
          
          if (result.success && result.pixels && result.pixels.length > 0) {
            // Extract date from filename (e.g., MCD19A2.A2025060...)
            const match = file.match(/A(\d{4})(\d{3})/)
            if (match) {
              const year = parseInt(match[1])
              const julianDay = parseInt(match[2])
              const date = new Date(year, 0, julianDay)
              
              result.date = date.toISOString().split('T')[0]
              result.julianDay = julianDay
              result.year = year
            }
            return result
          } else {
            return {
              success: false,
              pixels: [],
              error: result.error || 'No valid pixels generated',
              filename: file
            }
          }
        } catch (error) {
          return {
            success: false,
            pixels: [],
            error: error.message,
            filename: file
          }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      
      for (const result of batchResults) {
        if (result.success) {
          results.push(result)
        } else {
          errors.push(result)
        }
      }
      
      // Progress logging
      console.log(`Processed ${Math.min(i + batchSize, tifFiles.length)}/${tifFiles.length} files (${results.length} successful, ${errors.length} errors)`)
    }
    
    console.log(`Successfully processed ${results.length} files with pixel data, ${errors.length} errors`)
    
    // If we have some successful results, return success
    if (results.length > 0) {
      return {
        success: true,
        totalFiles: tifFiles.length,
        validFiles: results.length,
        errorFiles: errors.length,
        data: results,
        errors: errors.slice(0, 5) // Return first 5 errors for debugging
      }
    } else {
      // If no files were processed successfully, return failure
      return {
        success: false,
        totalFiles: tifFiles.length,
        validFiles: 0,
        errorFiles: errors.length,
        data: [],
        errors: errors.slice(0, 10) // Return more errors for debugging
      }
    }
    
  } catch (error) {
    console.error('Error processing NASA data directory with pixels:', error)
    throw error
  }
}
