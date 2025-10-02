'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/saparator'
import { MapPin, Droplets, Thermometer, Waves, Building, Wind } from 'lucide-react'

import AQIGauge from '@/components/AQIGauge'
import NASAAQIGauge from '@/components/NASAAQIGauge'
import PollutionChart from '@/components/PollutionChart'
import NASAPollutionChart from '@/components/NASAPollutionChart'
import LandUseChart from '@/components/LandUseChart'
import UrbanExpansionChart from '@/components/UrbanExpansionChart'
import QuickStats from '@/components/QuickStats'

const CityMap = dynamic(() => import('@/components/CityMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-full bg-card rounded-lg border flex items-center justify-center">
      <div className="text-muted-foreground">Loading map...</div>
    </div>
  )
})

const getAQIColor = (aqi) => {
  if (aqi <= 50) return 'bg-green-500'
  if (aqi <= 100) return 'bg-yellow-500'
  if (aqi <= 150) return 'bg-orange-500'
  if (aqi <= 200) return 'bg-red-500'
  return 'bg-purple-500'
}

const getAQILevel = (aqi) => {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy for Sensitive'
  if (aqi <= 200) return 'Unhealthy'
  return 'Very Unhealthy'
}

export default function CityInsights({ cityData, cities, selectedCountry, selectedCity, onCityChange }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !cityData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading city data...</div>
      </div>
    )
  }

  return (
    <div className="h-full p-6 overflow-auto">
      {/* City Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        {/* Main Header Row - Desktop: Side by side, Mobile: Stacked */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          {/* Left Side - City Info */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="p-3 bg-primary/10 rounded-full">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{cityData.name}</h1>
                  {cityData.name === 'New York' && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      🛰️ NASA Data Available
                    </Badge>
                  )}
                </div>
                {/* <Badge 
                  className={`${getAQIColor(cityData.aqi)} text-white px-3 py-1 text-sm font-semibold flex-shrink-0`}
                >
                  AQI {cityData.aqi} - {getAQILevel(cityData.aqi)}
                </Badge> */}
              </div>
              <p className="text-muted-foreground text-lg">{cityData.country}</p>
            </div>
          </div>
          
          {/* Right Side - City Selectors */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 lg:flex-initial lg:max-w-md">
            <Select value={selectedCountry} onValueChange={(country) => {
              const firstCity = Object.keys(cities[country])[0]
              onCityChange(country, firstCity)
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
        </div>
      </motion.div>

      <Separator className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <Card className="h-[31.3rem]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>City Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[27.3rem]">
              <CityMap cityData={cityData} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="h-[27rem]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2">
                  <Wind className="h-5 w-5" />
                  <span>Pollution Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[23rem] overflow-y-auto scrollbar-thin scrollbar-track-muted/20 scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50 scrollbar-thumb-rounded-full">
                {cityData.name === 'New York' ? (
                  <NASAPollutionChart city="nyc" />
                ) : (
                  <PollutionChart data={cityData.pollutionTrend} />
                )}
              </CardContent>
            </Card>

            <Card className="h-[27rem]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Land Use Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[23rem] overflow-y-auto scrollbar-thin scrollbar-track-muted/20 scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50 scrollbar-thumb-rounded-full">
                <LandUseChart data={cityData.landUse} />
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card className="h-[31.3rem]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wind className="h-5 w-5" />
                <span>Air Quality Index</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[27.3rem] flex items-center justify-center">
              {cityData.name === 'New York' ? (
                <NASAAQIGauge city="nyc" />
              ) : (
                <AQIGauge value={cityData.aqi} level={getAQILevel(cityData.aqi)} />
              )}
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle>Urban Expansion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">+12.5%</div>
                  <div className="text-sm text-muted-foreground">Growth this year</div>
                </div>
                
                {/* Chart */}
                <div className="h-48 w-full">
                  <UrbanExpansionChart data={cityData} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-muted/20 rounded-lg">
                    <div className="font-semibold">Population</div>
                    <div className="text-muted-foreground">+8.2%</div>
                  </div>
                  <div className="text-center p-3 bg-muted/20 rounded-lg">
                    <div className="font-semibold">Infrastructure</div>
                    <div className="text-muted-foreground">+15.7%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <QuickStats stats={cityData.stats} />
      </motion.div>
    </div>
  )
}