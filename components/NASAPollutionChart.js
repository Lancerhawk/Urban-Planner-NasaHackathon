'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useNASAData } from '@/hooks/use-nasa-data'
import { Badge } from '@/components/ui/badge'
import { Satellite, TrendingUp, TrendingDown, Minus } from 'lucide-react'

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
        <div className="space-y-1 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm">AQI: {data.aqi}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm">AOD: {data.aod}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

function TrendIndicator({ trend, value }) {
  if (trend > 5) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">+{value}%</span>
      </div>
    )
  } else if (trend < -5) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingDown className="h-4 w-4" />
        <span className="text-sm font-medium">{value}%</span>
      </div>
    )
  } else {
    return (
      <div className="flex items-center gap-1 text-gray-600">
        <Minus className="h-4 w-4" />
        <span className="text-sm font-medium">Stable</span>
      </div>
    )
  }
}

export default function NASAPollutionChart({ city = 'nyc' }) {
  const {
    trend,
    statistics,
    loading,
    error,
    dataSource,
    totalDays
  } = useNASAData(city, true)

  const [trendAnalysis, setTrendAnalysis] = useState(null)

  useEffect(() => {
    if (!trend || trend.length < 2) return

    // Calculate trend analysis
    const recent30 = trend.slice(-30)
    const previous30 = trend.slice(-60, -30)
    
    if (previous30.length === 0) return

    const recentAvg = recent30.reduce((sum, d) => sum + d.aqi, 0) / recent30.length
    const previousAvg = previous30.reduce((sum, d) => sum + d.aqi, 0) / previous30.length
    
    const trendPercent = ((recentAvg - previousAvg) / previousAvg) * 100
    
    setTrendAnalysis({
      recentAvg: Math.round(recentAvg),
      previousAvg: Math.round(previousAvg),
      trendPercent: Math.round(trendPercent * 10) / 10,
      direction: trendPercent > 5 ? 'up' : trendPercent < -5 ? 'down' : 'stable'
    })
  }, [trend])

  if (loading && !trend) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading NASA pollution data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-center">
        <div>
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-sm text-red-500 mb-1">Error loading data</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!trend || trend.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No pollution data available</p>
      </div>
    )
  }

  // Get AQI level thresholds for reference lines
  const aqiThresholds = [
    { value: 50, label: 'Good', color: '#22c55e' },
    { value: 100, label: 'Moderate', color: '#eab308' },
    { value: 150, label: 'Unhealthy for Sensitive', color: '#f97316' },
    { value: 200, label: 'Unhealthy', color: '#ef4444' }
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Satellite className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">NASA Pollution Trend</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalDays} days
          </Badge>
        </div>
        
        {trendAnalysis && (
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              30-day trend vs previous period
            </div>
            <TrendIndicator 
              trend={trendAnalysis.trendPercent} 
              value={Math.abs(trendAnalysis.trendPercent)}
            />
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              domain={['dataMin - 10', 'dataMax + 10']}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines for AQI levels */}
            {aqiThresholds.map((threshold) => (
              <ReferenceLine 
                key={threshold.value}
                y={threshold.value} 
                stroke={threshold.color}
                strokeDasharray="2 2"
                strokeOpacity={0.5}
              />
            ))}
            
            <Line 
              type="monotone" 
              dataKey="aqi" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-xs">
        <div className="p-2 bg-muted/20 rounded">
          <div className="font-semibold text-green-600">{statistics?.minAQI || 'N/A'}</div>
          <div className="text-muted-foreground">Best Day</div>
        </div>
        <div className="p-2 bg-muted/20 rounded">
          <div className="font-semibold text-blue-600">{statistics?.averageAQI || 'N/A'}</div>
          <div className="text-muted-foreground">Average</div>
        </div>
        <div className="p-2 bg-muted/20 rounded">
          <div className="font-semibold text-red-600">{statistics?.maxAQI || 'N/A'}</div>
          <div className="text-muted-foreground">Worst Day</div>
        </div>
      </div>

      {/* Data Source */}
      <div className="mt-2 text-center text-xs text-muted-foreground">
        {dataSource}
      </div>
    </div>
  )
}
