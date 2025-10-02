import { spawn } from 'child_process'
import path from 'path'
import { promises as fs } from 'fs'

// Path to GDAL executables
const GDAL_PATH = 'C:\\ProgramData\\miniconda3\\envs\\gdal\\Library\\bin'
const GDALINFO_EXE = path.join(GDAL_PATH, 'gdalinfo.exe')
const GDAL_TRANSLATE_EXE = path.join(GDAL_PATH, 'gdal_translate.exe')

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

// Process all GeoTIFF files in a directory
export async function processNASADataDirectory(dataDir) {
  try {
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
