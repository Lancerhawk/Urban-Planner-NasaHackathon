'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/saparator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Eye, MapPin, Wind, ThermometerSun, Waves, Building2, Sparkles,
  BrainCircuit, Clock3, Route, ShieldAlert
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Area, BarChart, Bar, ComposedChart } from 'recharts'

const CityMap = dynamic(() => import('@/components/CityMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-full bg-card rounded-lg border flex items-center justify-center">
      <div className="text-muted-foreground">Loading scenario map...</div>
    </div>
  )
})
const PlannerSiteMap = dynamic(() => import('@/components/PlannerSiteMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-card rounded-lg border flex items-center justify-center">
      <div className="text-muted-foreground">Loading site planner…</div>
    </div>
  )
})

export default function FutureVision({ cityData, selectedCountry, selectedCity, cities, onCityChange }) {
  const [mounted, setMounted] = useState(false)
  const [scenario, setScenario] = useState('baseline')
  const [hasLand, setHasLand] = useState(false)
  const [landCoordinates, setLandCoordinates] = useState('')
  const [landName, setLandName] = useState('')

  useEffect(() => { setMounted(true) }, [])

  // Per-city derived static datasets (change with selected city)
  const aqiForecast = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const trend = cityData?.pollutionTrend || []
    const baseByMonth = trend.reduce((acc, d) => {
      const idx = Math.max(0, new Date(d.date + '-01').getMonth())
      acc[idx] = d.value
      return acc
    }, new Array(12).fill(undefined))
    const filled = baseByMonth.map((v, i) => {
      if (v !== undefined) return v
      const prev = baseByMonth[(i + 11) % 12] ?? cityData?.aqi ?? 100
      const next = baseByMonth[(i + 1) % 12] ?? cityData?.aqi ?? 100
      return Math.round((prev + next) / 2)
    })
    const seasonAdj = [5,0,10,5,-5,-10,-8,-6,0,6,12,15] // rough seasonal curve
    return months.map((m, i) => {
      const aqi = Math.max(20, Math.round(filled[i] + (cityData?.stats?.pollution ?? 0) * 0.2 - 10))
      const forecast = Math.max(20, Math.round(aqi + seasonAdj[i]))
      return { month: m, aqi, forecast }
    })
  }, [cityData?.name])

  const heatIslands = useMemo(() => {
    const baseLST = 30 + Math.min(10, Math.max(0, (cityData?.stats?.heat ?? 50) / 10))
    const baseArea = 80 + Math.min(120, Math.max(0, (cityData?.stats?.heat ?? 50) * 1.5))
    return [0,1,2,3,4].map((k) => ({
      year: 2024 + k,
      lst: Math.round((baseLST + k * 0.4) * 10) / 10,
      hotspotKm2: Math.round(baseArea + k * 12)
    }))
  }, [cityData?.name])

  const urbanSprawl = useMemo(() => {
    const lu = cityData?.landUse || { residential: 40, commercial: 25, industrial: 15, openSpace: 15, water: 5 }
    const urbanNow = lu.residential + lu.commercial + lu.industrial
    const greenNow = lu.openSpace + lu.water
    const otherNow = Math.max(0, 100 - urbanNow - greenNow)
    const steps = [2020, 2022, 2024, 2026, 2028]
    return steps.map((yr, idx) => ({
      year: yr,
      urban: Math.min(85, Math.round(urbanNow + idx * 3)),
      green: Math.max(10, Math.round(greenNow - idx * 2.5)),
      other: Math.max(5, Math.round(otherNow - idx * 0.5))
    }))
  }, [cityData?.name])

  // Planner briefing text derived from current city stats
  const pollutionLevel = cityData?.stats?.pollution ?? 50
  const heatLevel = cityData?.stats?.heat ?? 50
  const floodLevel = cityData?.stats?.floodRisk ?? 50
  const greenShare = (cityData?.landUse?.openSpace ?? 10) + (cityData?.landUse?.water ?? 5)

  const briefing = useMemo(() => {
    return {
      airQuality: pollutionLevel > 70
        ? `Air quality is likely to worsen in dry season, with frequent high-AQI days across dense traffic corridors of ${cityData.name}. Target congestion pockets and construction dust.`
        : pollutionLevel > 45
        ? `Air quality shows mixed days in ${cityData.name}. Expect winter upticks; monsoon offers relief. Focus on traffic hot spots and dust control.`
        : `Air quality is generally manageable in ${cityData.name}, with occasional spikes. Maintain current controls; watch industrial clusters and peak-hour traffic.`,
      heat: heatLevel > 75
        ? `Severe urban heat expected in built-up cores. Add shade trees, cool roofs, and reflective paving in priority wards.`
        : heatLevel > 55
        ? `Heat hotspots will expand moderately, especially where green cover is low. Prioritize shade and cool roof retrofits.`
        : `Heat risk remains moderate. Preserve existing green patches and introduce shade along key corridors.`,
      flooding: floodLevel > 65
        ? `High flood likelihood in coastal/river-facing and low-lying zones. Protect floodways and prepare pumps ahead of heavy rain.`
        : floodLevel > 40
        ? `Moderate flood exposure. Desilt drains and improve inlet capacity at known choke points.`
        : `Lower flood exposure overall; continue upkeep of drains and protect natural channels.`,
      landCover: greenShare < 20
        ? `Green cover is limited; guard remaining buffers. Urban growth likely along major roads and transit nodes.`
        : greenShare < 35
        ? `Some green buffer exists; expect pressure at edges. Balance growth with pocket parks and setbacks.`
        : `Healthy green share; protect key patches during edge growth and incentivize TOD-linked open space.`
    }
  }, [cityData?.name, pollutionLevel, heatLevel, floodLevel, greenShare])

  return (
    <div className="h-full p-6 overflow-auto">
      {(!mounted || !cityData) ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-muted-foreground">Loading future vision…</div>
        </div>
      ) : (
      <>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Eye className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold">Future Vision</h1>
                <Badge variant="secondary" className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">Predictive Planning</Badge>
                <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Static Demo</Badge>
              </div>
              <p className="text-muted-foreground">{cityData.name}, {cityData.country}</p>
            </div>
        </div>
        
          {/* City selectors like CityInsights */}
          {cities && onCityChange && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 lg:flex-initial lg:max-w-md">
              <Select value={selectedCountry} onValueChange={(country) => {
                const firstCity = Object.keys(cities[country] || {})[0]
                if (firstCity) onCityChange(country, firstCity)
              }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(cities).map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCity} onValueChange={(city) => onCityChange(selectedCountry, city)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(cities[selectedCountry] || {}).map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <Separator />
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left: Map + two cards */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">
          <Card className="h-[31.3rem] relative">
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px]">Static</Badge>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>Risk Scenario Map</span>
              </CardTitle>
                {/* Scenario selector moved into map card */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'baseline', label: 'Baseline' },
                    { id: 'green', label: 'Green Policy' },
                    { id: 'infra', label: 'Infra Growth' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setScenario(s.id)}
                      className={`h-8 rounded-full px-3 text-xs border transition-colors ${
                        scenario === s.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-transparent hover:bg-muted border-border'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 h-[27.3rem]">
              <div className="h-full grid grid-rows-[1fr_auto] gap-3">
                <CityMap cityData={cityData} />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#dc2626' }}></span> High</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }}></span> Medium</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#10b981' }}></span> Low</div>
                  </div>
                  <div>🛰️ NASA-inspired layers: AOD, LST, GPM, SRTM</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pollution Forecast */}
            <Card className="h-[32.5rem] relative flex flex-col overflow-hidden">
              <div className="absolute top-2 right-2 z-10">
                <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px]">Static</Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Wind className="h-5 w-5" />
                  <span>Air Pollution Forecast (AOD ➜ AQI)</span>
              </CardTitle>
            </CardHeader>
              <CardContent className="h-[27rem] p-0 flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50 scrollbar-thumb-rounded-full p-4">
                <ChartContainer
                  config={{
                    aqi: { label: 'AQI (LSTM)', color: 'hsl(var(--chart-1))' },
                    forecast: { label: 'AQI (ARIMA)', color: 'hsl(var(--chart-2))' },
                  }}
                  className="aspect-auto h-72 w-full"
                >
                  <LineChart data={aqiForecast} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area type="monotone" dataKey="aqi" stroke="var(--color-aqi)" fill="var(--color-aqi)" fillOpacity={0.15} dot={false} />
                    <Line type="monotone" dataKey="forecast" stroke="var(--color-forecast)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
                  <div className="mt-3 text-xs text-muted-foreground leading-relaxed">
                    Forecast suggests a mild improvement during wet months and deterioration in dry season. Traffic corridors and construction-heavy zones are expected to see more spikes. Use odd-even traffic control and site dust control pre-winter.
                  </div>
                </div>
                <div className="border-t border-border p-2 flex items-center gap-2">
                  <input className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70" placeholder="Ask about AQI outlook, hotspots, or mitigation…" />
                  <button className="text-xs px-3 py-1 rounded-md border hover:bg-muted">Send</button>
                </div>
            </CardContent>
          </Card>
          
            {/* Heat Island Growth */}
            <Card className="h-[32.5rem] relative flex flex-col overflow-hidden">
              <div className="absolute top-2 right-2 z-10">
                <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px]">Static</Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <ThermometerSun className="h-5 w-5" />
                  <span>Heat Island Growth (LST)</span>
              </CardTitle>
            </CardHeader>
              <CardContent className="h-[27rem] p-0 flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50 scrollbar-thumb-rounded-full p-4">
                <ChartContainer
                  config={{
                    lst: { label: 'LST (°C)', color: 'hsl(var(--chart-3))' },
                    hotspotKm2: { label: 'Hotspot Area (km²)', color: 'hsl(var(--chart-4))' },
                  }}
                  className="aspect-auto h-72 w-full"
                >
                  <ComposedChart data={heatIslands} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area yAxisId="left" type="monotone" dataKey="lst" stroke="var(--color-lst)" fill="var(--color-lst)" fillOpacity={0.15} dot={false} />
                    <Bar yAxisId="right" dataKey="hotspotKm2" fill="var(--color-hotspotKm2)" radius={[4,4,0,0]} />
                  </ComposedChart>
                </ChartContainer>
                <div className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  Expect gradual warming and expansion of heat hotspots, especially in dense built-up areas. Prioritize shade trees, cool roofs, and reflective pavements in new and retrofitted projects.
                </div>
                </div>
                <div className="border-t border-border p-2 flex items-center gap-2">
                  <input className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70" placeholder="Ask about heat hotspots, priority wards, or cool roof policy…" />
                  <button className="text-xs px-3 py-1 rounded-md border hover:bg-muted">Send</button>
                </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

        {/* Right: Briefing + Sprawl */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
          <Card className="h-[31.3rem] relative flex flex-col overflow-hidden">
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px]">Static</Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span>What to Expect (Next 6–12 months)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50 scrollbar-thumb-rounded-full p-4 space-y-4">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="font-semibold text-emerald-500">Air Quality</div>
                    <div className="text-muted-foreground">{briefing.airQuality}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="font-semibold text-orange-500">Heat</div>
                    <div className="text-muted-foreground">{briefing.heat}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="font-semibold text-blue-500">Flooding</div>
                    <div className="text-muted-foreground">{briefing.flooding}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="font-semibold text-green-600">Land Cover</div>
                    <div className="text-muted-foreground">{briefing.landCover}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-2 bg-muted/20 rounded">
                    <div className="font-semibold text-emerald-600">AQI +8–12%</div>
                    <div className="text-muted-foreground">Winter uptick</div>
                  </div>
                  <div className="p-2 bg-muted/20 rounded">
                    <div className="font-semibold text-orange-600">+1–2°C</div>
                    <div className="text-muted-foreground">Peak LST by 2028</div>
                  </div>
                  <div className="p-2 bg-muted/20 rounded">
                    <div className="font-semibold text-blue-600">High</div>
                    <div className="text-muted-foreground">Flood exposure</div>
                  </div>
                </div>
                <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                  Confidence: Moderate. Signals combine recent satellite trends with seasonal cycles. Use for planning priorities, not daily operations.
                </div>
              </div>
              <div className="border-t border-border p-2 flex items-center gap-2">
                <input className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70" placeholder="Ask about the next 6–12 months outlook or priorities…" />
                <button className="text-xs px-3 py-1 rounded-md border hover:bg-muted">Send</button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative flex flex-col">
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px]">Static</Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span>Urban Sprawl Prediction</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[23rem] p-0 flex-1 flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50 scrollbar-thumb-rounded-full p-4">
              <ChartContainer
                config={{
                  urban: { label: 'Urban %', color: 'hsl(var(--chart-1))' },
                  green: { label: 'Green %', color: 'hsl(var(--chart-2))' },
                  other: { label: 'Other %', color: 'hsl(var(--chart-4))' },
                }}
                className="h-56"
              >
                <LineChart data={urbanSprawl} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="urban" stroke="var(--color-urban)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="green" stroke="var(--color-green)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="other" stroke="var(--color-other)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="font-semibold">Green Loss</div>
                  <div className="text-muted-foreground">-12% by 2028</div>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="font-semibold">Urban Gain</div>
                  <div className="text-muted-foreground">+16% by 2028</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Urban growth will track major corridors and transit hubs first, with likely reduction in peri-urban green spaces. Guard rails: protect key green buffers and add TOD-linked open space ratios.
              </div>
              </div>
              <div className="border-t border-border p-2 flex items-center gap-2">
                <input className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70" placeholder="Ask about growth hotspots, zoning levers, or green buffer policy…" />
                <button className="text-xs px-3 py-1 rounded-md border hover:bg-muted">Send</button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom: Site Suitability & Availability */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="flex flex-col overflow-hidden relative">
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px]">Static</Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span>Site Suitability & Availability</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-3">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Project Type</div>
                    <select className="w-full h-9 rounded-md border bg-background px-2">
                      <option>Housing</option>
                      <option>School</option>
                      <option>Hospital</option>
                      <option>Commercial</option>
                      <option>Park / Open Space</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Land Area (min, acres)</div>
                      <input type="number" className="w-full h-9 rounded-md border bg-background px-2" placeholder="2" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Budget (₹ crore)</div>
                      <input type="number" className="w-full h-9 rounded-md border bg-background px-2" placeholder="50" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Do you have land?</div>
                    <div className="flex items-center gap-3 text-xs">
                      <label className="inline-flex items-center gap-1">
                        <input name="hasLand" type="radio" checked={hasLand} onChange={() => setHasLand(true)} /> Yes
                      </label>
                      <label className="inline-flex items-center gap-1">
                        <input name="hasLand" type="radio" checked={!hasLand} onChange={() => setHasLand(false)} /> No
                      </label>
                    </div>
                    {hasLand && (
                      <div className="mt-2 space-y-2">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Land Name/Reference</div>
                          <input 
                            type="text" 
                            className="w-full h-8 rounded-md border bg-background px-2 text-xs" 
                            placeholder="e.g., Plot A-123, Sector 5"
                            value={landName}
                            onChange={(e) => setLandName(e.target.value)}
                          />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Coordinates (lat, lng)</div>
                          <input 
                            type="text" 
                            className="w-full h-8 rounded-md border bg-background px-2 text-xs" 
                            placeholder="e.g., 19.0760, 72.8777"
                            value={landCoordinates}
                            onChange={(e) => setLandCoordinates(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Preferred Zones</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <label className="inline-flex items-center gap-1"><input type="checkbox" defaultChecked /> Redevelopment</label>
                      <label className="inline-flex items-center gap-1"><input type="checkbox" defaultChecked /> Transit-Oriented</label>
                      <label className="inline-flex items-center gap-1"><input type="checkbox" /> Industrial Conversion</label>
                      <label className="inline-flex items-center gap-1"><input type="checkbox" /> Green Buffer</label>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Notes</div>
                    <textarea className="w-full min-h-[72px] rounded-md border bg-background px-2 py-1" placeholder="Any constraints or preferences (e.g., near metro, max height, community space)…"></textarea>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-xs px-3 py-2 rounded-md border hover:bg-muted">Suggest Sites</button>
                  <button className="text-xs px-3 py-2 rounded-md border hover:bg-muted">Clear</button>
                </div>
              </div>
              <div className="lg:col-span-2 h-[22rem] lg:h-full">
                <PlannerSiteMap cityData={cityData} hasLand={hasLand} landCoordinates={landCoordinates} landName={landName} />
              </div>
            </div>
            <div className="border-t border-border p-2 flex items-center gap-2">
              <input className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70" placeholder="Ask about available sites, approvals, or zoning fit…" />
              <button className="text-xs px-3 py-1 rounded-md border hover:bg-muted">Send</button>
        </div>
          </CardContent>
        </Card>
      </motion.div>
      </>
      )}
    </div>
  )
}