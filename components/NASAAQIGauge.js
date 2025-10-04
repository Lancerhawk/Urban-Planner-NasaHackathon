'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Satellite, Clock, Database } from 'lucide-react'
import { useNASAData } from '@/hooks/use-nasa-data'

function RefreshTimer({ getTimeUntilNextRefresh, onRefresh, loading }) {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    const updateTimer = () => {
      const time = getTimeUntilNextRefresh()
      setTimeLeft(time)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [getTimeUntilNextRefresh])

  if (!timeLeft) return null

  return (
    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mb-0 pb-0">
      <div className="flex items-center gap-2 bg-muted/20 rounded-full px-3 py-1">
        <Clock className="h-3 w-3" />
        <span className="tabular-nums">
          Next refresh: {timeLeft.minutes}m {timeLeft.seconds}s
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        className="h-7 px-3 text-[11px] rounded-full shadow-sm"
      >
        <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Processing...' : 'Refresh'}
      </Button>
    </div>
  )
}

export default function NASAAQIGauge({ city = 'nyc', area = 'citywide' }) {
  const svgRef = useRef()
  const {
    currentAQI,
    currentAQILevel,
    currentAQIColor,
    statistics,
    totalDays,
    validDays,
    dataRange,
    dataSource,
    lastUpdated,
    loading,
    error,
    refresh,
    getTimeUntilNextRefresh
  } = useNASAData(city, true, area)

  useEffect(() => {
    if (!svgRef.current || !currentAQI) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 220
    const height = 220
    const radius = Math.min(width, height) / 2 - 25

    svg.attr("width", width).attr("height", height)

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`)

    // AQI ranges with proper colors
    const ranges = [
      { min: 0, max: 50, color: "#22c55e", label: "Good" },
      { min: 51, max: 100, color: "#eab308", label: "Moderate" },
      { min: 101, max: 150, color: "#f97316", label: "Unhealthy for Sensitive" },
      { min: 151, max: 200, color: "#ef4444", label: "Unhealthy" },
      { min: 201, max: 300, color: "#a855f7", label: "Very Unhealthy" },
      { min: 301, max: 500, color: "#7c2d12", label: "Hazardous" }
    ]

    // Create arc generator
    const arc = d3.arc()
      .innerRadius(radius - 35)
      .outerRadius(radius)

    // Create angle scale
    const angleScale = d3.scaleLinear()
      .domain([0, 300])
      .range([-Math.PI / 2, Math.PI / 2])

    // Draw background arc
    g.append("path")
      .datum({ 
        startAngle: -Math.PI / 2, 
        endAngle: Math.PI / 2 
      })
      .attr("d", arc)
      .style("fill", "#1f2937")
      .style("opacity", 0.3)

    // Draw colored ranges
    ranges.forEach(range => {
      if (range.max <= 300) {
        const startAngle = angleScale(range.min)
        const endAngle = angleScale(Math.min(range.max, 300))
        
        g.append("path")
          .datum({ 
            startAngle: startAngle, 
            endAngle: endAngle 
          })
          .attr("d", arc)
          .style("fill", range.color)
          .style("opacity", 0.8)
      }
    })

    // Draw needle
    const needleAngle = angleScale(Math.min(currentAQI, 300))
    const needleLength = radius - 20
    const needlePath = `M 0 -${needleLength} L 6 0 L 0 ${needleLength - 30} L -6 0 Z`
    
    g.append("path")
      .attr("d", needlePath)
      .attr("transform", `rotate(${(needleAngle * 180) / Math.PI})`)
      .style("fill", "#ffffff")
      .style("stroke", "#000000")
      .style("stroke-width", "1")

    // Draw center circle
    g.append("circle")
      .attr("r", 10)
      .style("fill", "#ffffff")
      .style("stroke", "#000000")
      .style("stroke-width", "2")

    // Draw value text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("y", 45)
      .style("font-size", "28px")
      .style("font-weight", "bold")
      .style("fill", "#ffffff")
      .text(currentAQI)

    // Draw level text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("y", 68)
      .style("font-size", "12px")
      .style("fill", "#9ca3af")
      .text(currentAQILevel)

  }, [currentAQI, currentAQILevel])

  if (loading && !currentAQI) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div className="w-full max-w-xs mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Processing NASA Data</span>
            <span>Loading...</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <div className="flex items-center justify-center mt-3 text-xs text-muted-foreground">
            <Satellite className="h-3 w-3 mr-1 animate-spin" />
            <span>Analyzing satellite imagery...</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Processing AOD data from NASA MODIS</p>
          <p className="text-xs text-muted-foreground">This may take a few moments</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-sm text-red-500 mb-2">Error loading NASA data</p>
        <p className="text-xs text-muted-foreground mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      <div className="flex-shrink-0">
        <RefreshTimer 
          getTimeUntilNextRefresh={getTimeUntilNextRefresh}
          onRefresh={refresh}
          loading={loading}
        />
      </div>

      {loading && currentAQI ? (
        <div className="flex-shrink-0 flex items-center justify-center py-0 w-full relative">
          <svg ref={svgRef} className="opacity-50"></svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Updating data...</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 flex items-center justify-center py-0 w-full">
          <svg ref={svgRef}></svg>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50 scrollbar-thumb-rounded-full px-3 md:px-4 mt-0 w-full">
        <div className="w-full space-y-3 pb-4">
        <div className="text-center">
          <Badge 
            className="mb-0"
            style={{ 
              backgroundColor: currentAQIColor,
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {currentAQILevel}
          </Badge>
          <div className="text-xs text-muted-foreground">
            Based on {totalDays} days of NASA satellite data
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-muted/20 rounded">
              <div className="font-semibold">{statistics.maxAQI}</div>
              <div className="text-muted-foreground">Max AQI</div>
            </div>
            <div className="text-center p-2 bg-muted/20 rounded">
              <div className="font-semibold">{statistics.minAQI}</div>
              <div className="text-muted-foreground">Min AQI</div>
            </div>
          </div>
        )}

        {/* Data Source Info */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-center gap-1">
            <Satellite className="h-3 w-3" />
            <span>{dataSource}</span>
          </div>
          {dataRange && (
            <div className="flex items-center justify-center gap-1">
              <Database className="h-3 w-3" />
              <span>{dataRange.start} to {dataRange.end}</span>
            </div>
          )}
          {lastUpdated && (
            <div>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* AQI Reference Table */}
        <div className="overflow-hidden rounded-lg border border-border mx-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-2 py-1 text-left font-medium">Level</th>
                <th className="px-2 py-1 text-center font-medium">Range</th>
                <th className="px-2 py-1 text-center font-medium">Color</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-2 py-1 text-left">Good</td>
                <td className="px-2 py-1 text-center">0-50</td>
                <td className="px-2 py-1 text-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto"></div>
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1 text-left">Moderate</td>
                <td className="px-2 py-1 text-center">51-100</td>
                <td className="px-2 py-1 text-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto"></div>
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1 text-left">Unhealthy for Sensitive</td>
                <td className="px-2 py-1 text-center">101-150</td>
                <td className="px-2 py-1 text-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto"></div>
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-2 py-1 text-left">Unhealthy</td>
                <td className="px-2 py-1 text-center">151-200</td>
                <td className="px-2 py-1 text-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mx-auto"></div>
                </td>
              </tr>
              <tr>
                <td className="px-2 py-1 text-left">Very Unhealthy</td>
                <td className="px-2 py-1 text-center">201-300</td>
                <td className="px-2 py-1 text-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  )
}
