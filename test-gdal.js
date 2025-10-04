#!/usr/bin/env node

// Test script to check GDAL availability
import { spawn } from 'child_process'
import path from 'path'

const isWindows = process.platform === 'win32'
const GDAL_PATH = isWindows 
  ? 'C:\\ProgramData\\miniconda3\\envs\\gdal\\Library\\bin'
  : '/usr/bin'
const GDALINFO_EXE = isWindows 
  ? path.join(GDAL_PATH, 'gdalinfo.exe')
  : path.join(GDAL_PATH, 'gdalinfo')

console.log('🔍 Testing GDAL availability...')
console.log(`Platform: ${process.platform}`)
console.log(`GDAL Path: ${GDAL_PATH}`)
console.log(`GDAL Executable: ${GDALINFO_EXE}`)

const process = spawn(GDALINFO_EXE, ['--version'], {
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
    console.log('✅ GDAL is available!')
    console.log('Version:', stdout.trim())
  } else {
    console.log('❌ GDAL is not available')
    console.log('Error:', stderr)
    console.log('\n💡 Solutions:')
    console.log('1. Install GDAL on your system')
    console.log('2. Use Docker with GDAL pre-installed')
    console.log('3. Deploy to Railway with the provided Dockerfile')
  }
})

process.on('error', (error) => {
  console.log('❌ Failed to execute GDAL command')
  console.log('Error:', error.message)
  console.log('\n💡 Solutions:')
  console.log('1. Install GDAL on your system')
  console.log('2. Use Docker with GDAL pre-installed')
  console.log('3. Deploy to Railway with the provided Dockerfile')
})
