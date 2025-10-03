'use client'

import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, Legend } from 'recharts'
import { useNASAData } from '@/hooks/use-nasa-data'
import { Badge } from '@/components/ui/badge'
import { Satellite, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const dateValue = data.dateMs ?? data.date ?? label
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{new Date(dateValue).toLocaleDateString()}</p>
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
  const [xDomain, setXDomain] = useState(null)
  const [activeRange, setActiveRange] = useState('90')
  
  // Prepare a smoothed series (7-day moving average) for readability
  const smoothedTrend = Array.isArray(trend) && trend.length > 0
    ? trend.map((d, idx) => {
        const start = Math.max(0, idx - 6)
        const window = trend.slice(start, idx + 1)
        const avg = window.reduce((s, p) => s + p.aqi, 0) / window.length
        const dateMs = new Date(d.date).getTime()
        return { ...d, aqi_ma7: Math.round(avg), dateMs }
      })
    : []

  // Stats for currently visible range
  const visibleStats = useMemo(() => {
    if (!smoothedTrend || smoothedTrend.length === 0) return null
    const [minDomain, maxDomain] = xDomain ?? [
      smoothedTrend[0].dateMs,
      smoothedTrend[smoothedTrend.length - 1].dateMs
    ]
    const inView = smoothedTrend.filter(d => d.dateMs >= minDomain && d.dateMs <= maxDomain)
    if (inView.length === 0) return null
    // Find min and max with their dates
    let minItem = inView[0]
    let maxItem = inView[0]
    for (let i = 1; i < inView.length; i++) {
      if (inView[i].aqi < minItem.aqi) minItem = inView[i]
      if (inView[i].aqi > maxItem.aqi) maxItem = inView[i]
    }
    const aqiValues = inView.map(d => d.aqi)
    const averageAQI = Math.round(aqiValues.reduce((s, v) => s + v, 0) / aqiValues.length)
    return { 
      minAQI: minItem.aqi, 
      minDate: minItem.dateMs ?? new Date(minItem.date).getTime(),
      maxAQI: maxItem.aqi, 
      maxDate: maxItem.dateMs ?? new Date(maxItem.date).getTime(),
      averageAQI 
    }
  }, [smoothedTrend, xDomain])

  useEffect(() => {
    if (!smoothedTrend || smoothedTrend.length === 0) return
    const min = smoothedTrend[0].dateMs
    const max = smoothedTrend[smoothedTrend.length - 1].dateMs
    // Default to last ~90 days if possible
    const ninetyDays = 90 * 24 * 60 * 60 * 1000
    setXDomain([Math.max(min, max - ninetyDays), max])
  }, [smoothedTrend?.length])

  function setRangeDays(days) {
    if (!smoothedTrend || smoothedTrend.length === 0) return
    const min = smoothedTrend[0].dateMs
    const max = smoothedTrend[smoothedTrend.length - 1].dateMs
    if (days === 'ALL') {
      setXDomain([min, max])
      setActiveRange('ALL')
      return
    }
    const rangeMs = days * 24 * 60 * 60 * 1000
    setXDomain([Math.max(min, max - rangeMs), max])
    setActiveRange(String(days))
  }

  // Style helper for range buttons
  const rangeBtnCls = (key) => `h-6 px-2 text-[10px] transition-colors ${
    activeRange===key
      ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/40'
      : 'bg-transparent'
  }`

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

  if (!smoothedTrend || smoothedTrend.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No chartable trend yet. Try refreshing the NASA data.</p>
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
          <LineChart
            key={(xDomain ?? []).join('-')}
            data={smoothedTrend}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={true} vertical={false} />
            <XAxis 
              dataKey="dateMs"
              type="number"
              domain={xDomain ?? ["dataMin", "dataMax"]}
              allowDataOverflow
              scale="time"
              stroke="#9ca3af"
              fontSize={12}
              minTickGap={24}
              padding={{ left: 0, right: 0 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              tickCount={6}
              domain={[0, 'dataMax + 20']}
              orientation="right"
              width={0}
              tickMargin={4}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Legend removed to reduce clutter */}
            
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
            
            {/* Raw AQI line (de-emphasized, no dots) */}
            <Area
              type="monotone"
              dataKey="aqi"
              name="AQI"
              stroke="#60a5fa"
              fill="#60a5fa"
              fillOpacity={0.12}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, stroke: '#60a5fa', strokeWidth: 2 }}
            />
            {/* 7-day moving average (highlighted) */}
            <Line 
              type="monotone" 
              dataKey="aqi_ma7" 
              name="AQI"
              stroke="#3b82f6" 
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Compact range controls below chart */}
      <div className="mt-2 flex items-center justify-center gap-2">
        <Button size="sm" variant="outline" aria-pressed={activeRange==='30'} className={rangeBtnCls('30')} onClick={() => setRangeDays(30)}>30d</Button>
        <Button size="sm" variant="outline" aria-pressed={activeRange==='90'} className={rangeBtnCls('90')} onClick={() => setRangeDays(90)}>3m</Button>
        <Button size="sm" variant="outline" aria-pressed={activeRange==='180'} className={rangeBtnCls('180')} onClick={() => setRangeDays(180)}>6m</Button>
        <Button size="sm" variant="outline" aria-pressed={activeRange==='ALL'} className={rangeBtnCls('ALL')} onClick={() => setRangeDays('ALL')}>All</Button>
      </div>
      {/* Helper caption removed per request */}

      {/* Visible-range statistics derived from the data shown in the chart */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-xs">
        <div className="p-2 bg-muted/20 rounded">
          <div className="font-semibold text-green-600">AQI {visibleStats?.minAQI ?? statistics?.minAQI ?? 'N/A'}</div>
          <div className="text-muted-foreground">Best Day{visibleStats?.minDate ? ` • ${new Date(visibleStats.minDate).toLocaleDateString()}` : ''}</div>
        </div>
        <div className="p-2 bg-muted/20 rounded">
          <div className="font-semibold text-blue-600">AQI {visibleStats?.averageAQI ?? statistics?.averageAQI ?? 'N/A'}</div>
          <div className="text-muted-foreground">Average (range)</div>
        </div>
        <div className="p-2 bg-muted/20 rounded">
          <div className="font-semibold text-red-600">AQI {visibleStats?.maxAQI ?? statistics?.maxAQI ?? 'N/A'}</div>
          <div className="text-muted-foreground">Worst Day{visibleStats?.maxDate ? ` • ${new Date(visibleStats.maxDate).toLocaleDateString()}` : ''}</div>
        </div>
      </div>

      {/* Data Source */}
      <div className="mt-2 text-center text-xs text-muted-foreground">
        {dataSource}
      </div>
    </div>
  )
}
