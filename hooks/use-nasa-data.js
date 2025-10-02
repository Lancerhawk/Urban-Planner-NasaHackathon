import { useState, useEffect, useCallback, useRef } from 'react'

const REFRESH_INTERVAL = 10 * 60 * 1000 // 10 minutes in milliseconds
const CACHE_KEY = 'nasa-data-cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

export function useNASAData(city = 'nyc', autoRefresh = true) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshCount, setRefreshCount] = useState(0)
  
  const intervalRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Check cache first
  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}-${city}`)
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached)
        const age = Date.now() - timestamp
        
        if (age < CACHE_DURATION) {
          return cachedData
        }
      }
    } catch (error) {
      console.warn('Error reading cache:', error)
    }
    return null
  }, [city])

  // Save to cache
  const setCachedData = useCallback((data) => {
    try {
      localStorage.setItem(`${CACHE_KEY}-${city}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.warn('Error saving to cache:', error)
    }
  }, [city])

  // Fetch NASA data
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = getCachedData()
        if (cachedData) {
          setData(cachedData)
          setLastUpdated(new Date(cachedData.lastUpdated))
          setLoading(false)
          setError(null)
          return cachedData
        }
      }
      
      setLoading(true)
      setError(null)
      
      // Create new abort controller
      abortControllerRef.current = new AbortController()
      
      const url = forceRefresh 
        ? `/api/nasa-data?city=${city}&refresh=true`
        : `/api/nasa-data?city=${city}`
      
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch NASA data')
      }
      
      const nasaData = result.data
      setData(nasaData)
      setLastUpdated(new Date(nasaData.lastUpdated))
      setLoading(false)
      setError(null)
      setRefreshCount(prev => prev + 1)
      
      // Cache the data
      setCachedData(nasaData)
      
      return nasaData
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted')
        return
      }
      
      console.error('Error fetching NASA data:', error)
      setError(error.message)
      setLoading(false)
      
      // Try to use cached data as fallback
      const cachedData = getCachedData()
      if (cachedData && !data) {
        setData(cachedData)
        setLastUpdated(new Date(cachedData.lastUpdated))
      }
    }
  }, [city, getCachedData, setCachedData, data])

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  // Setup auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const startAutoRefresh = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      intervalRef.current = setInterval(() => {
        console.log(`Auto-refreshing NASA data for ${city}...`)
        fetchData(true)
      }, REFRESH_INTERVAL)
    }

    startAutoRefresh()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, city, fetchData])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Calculate time until next refresh
  const getTimeUntilNextRefresh = useCallback(() => {
    if (!lastUpdated || !autoRefresh) return null
    
    const nextRefresh = new Date(lastUpdated.getTime() + REFRESH_INTERVAL)
    const now = new Date()
    const diff = nextRefresh - now
    
    if (diff <= 0) return 0
    
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return { minutes, seconds, totalSeconds: Math.floor(diff / 1000) }
  }, [lastUpdated, autoRefresh])

  return {
    data,
    loading,
    error,
    lastUpdated,
    refreshCount,
    refresh,
    getTimeUntilNextRefresh,
    // Convenience accessors
    currentAQI: data?.currentAQI,
    currentAQILevel: data?.currentAQILevel,
    currentAQIColor: data?.currentAQIColor,
    statistics: data?.statistics,
    trend: data?.trend,
    totalDays: data?.totalDays,
    validDays: data?.validDays,
    dataRange: data?.dataRange,
    dataSource: data?.dataSource
  }
}
