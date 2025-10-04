'use client'

import { useState, useEffect, useCallback } from 'react'

const CACHE_KEY = 'nasa-hotspots-cache'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export function useHotspots(city = 'nyc', area = 'citywide', maxHotspots = 10) {
  const [hotspots, setHotspots] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dataSource, setDataSource] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  // Check cache first
  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}-${city}-${area}`)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data
        }
      }
    } catch (error) {
      console.warn('Error reading hotspots cache:', error)
    }
    return null
  }, [city, area])

  // Save to cache
  const setCachedData = useCallback((data) => {
    try {
      localStorage.setItem(`${CACHE_KEY}-${city}-${area}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.warn('Error saving hotspots cache:', error)
    }
  }, [city, area])

  // Fetch hotspots data
  const fetchHotspots = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = getCachedData()
        if (cachedData) {
          setHotspots(cachedData.hotspots || [])
          setStatistics(cachedData.statistics)
          setDataSource(cachedData.dataSource || '')
          setLastUpdated(cachedData.lastUpdated ? new Date(cachedData.lastUpdated) : new Date())
          setLoading(false)
          return
        }
      }

      const url = forceRefresh 
        ? `/api/hotspots?city=${city}&area=${area}&maxHotspots=${maxHotspots}&refresh=true`
        : `/api/hotspots?city=${city}&area=${area}&maxHotspots=${maxHotspots}`

      const response = await fetch(url)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch hotspots')
      }

      if (result.success) {
        setHotspots(result.hotspots || [])
        setStatistics(result.statistics)
        setDataSource(result.dataSource || '')
        setLastUpdated(new Date(result.lastUpdated))
        
        // Cache the data
        setCachedData(result)
      } else {
        throw new Error(result.error || 'Failed to process hotspots')
      }
    } catch (error) {
      console.error('Error fetching hotspots:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [city, area, maxHotspots, getCachedData, setCachedData])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    fetchHotspots()
  }, [fetchHotspots])

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchHotspots(true)
  }, [fetchHotspots])

  // Get time until next refresh
  const getTimeUntilNextRefresh = useCallback(() => {
    if (!lastUpdated) return null
    
    const timeSinceUpdate = Date.now() - lastUpdated.getTime()
    const timeUntilRefresh = CACHE_DURATION - timeSinceUpdate
    
    if (timeUntilRefresh <= 0) return null
    
    const minutes = Math.floor(timeUntilRefresh / 60000)
    const seconds = Math.floor((timeUntilRefresh % 60000) / 1000)
    
    return { minutes, seconds }
  }, [lastUpdated])

  return {
    hotspots,
    statistics,
    loading,
    error,
    dataSource,
    lastUpdated,
    refresh,
    getTimeUntilNextRefresh
  }
}
