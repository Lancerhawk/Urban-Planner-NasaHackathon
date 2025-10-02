'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, ArrowRight, Globe, Building2 } from 'lucide-react'

const AVAILABLE_CITIES = {
  'India': {
    'Mumbai': {
      name: 'Mumbai',
      country: 'India',
      coordinates: [19.0760, 72.8777],
      aqi: 156,
      aqiLevel: 'Unhealthy',
      description: 'Financial capital with high pollution levels',
      stats: {
        pollution: 68,
        heat: 85,
        floodRisk: 45,
        landUse: 72
      }
    },
    'Delhi': {
      name: 'Delhi',
      country: 'India',
      coordinates: [28.7041, 77.1025],
      aqi: 198,
      aqiLevel: 'Unhealthy',
      description: 'National capital with severe air quality issues',
      stats: {
        pollution: 82,
        heat: 78,
        floodRisk: 35,
        landUse: 65
      }
    },
    'Bangalore': {
      name: 'Bangalore',
      country: 'India',
      coordinates: [12.9716, 77.5946],
      aqi: 89,
      aqiLevel: 'Moderate',
      description: 'Tech hub with moderate air quality',
      stats: {
        pollution: 45,
        heat: 62,
        floodRisk: 55,
        landUse: 78
      }
    }
  },
  'United States': {
    'New York': {
      name: 'New York',
      country: 'United States',
      coordinates: [40.7128, -74.0060],
      aqi: 65,
      aqiLevel: 'Moderate',
      description: 'Global city with NASA satellite data available',
      stats: {
        pollution: 35,
        heat: 58,
        floodRisk: 72,
        landUse: 85
      },
      hasNASAData: true
    },
    'Los Angeles': {
      name: 'Los Angeles',
      country: 'United States',
      coordinates: [34.0522, -118.2437],
      aqi: 95,
      aqiLevel: 'Moderate',
      description: 'West coast metropolis with smog challenges',
      stats: {
        pollution: 52,
        heat: 75,
        floodRisk: 25,
        landUse: 68
      }
    }
  }
}

const getAQIColor = (aqi) => {
  if (aqi <= 50) return 'bg-green-500'
  if (aqi <= 100) return 'bg-yellow-500'
  if (aqi <= 150) return 'bg-orange-500'
  if (aqi <= 200) return 'bg-red-500'
  return 'bg-purple-500'
}

const getAQITextColor = (aqi) => {
  if (aqi <= 50) return 'text-green-600'
  if (aqi <= 100) return 'text-yellow-600'
  if (aqi <= 150) return 'text-orange-600'
  if (aqi <= 200) return 'text-red-600'
  return 'text-purple-600'
}

export default function CitySelector({ onCitySelect }) {
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [hoveredCity, setHoveredCity] = useState(null)

  const handleCitySelect = (country, city) => {
    const cityData = AVAILABLE_CITIES[country][city]
    onCitySelect(country, city, cityData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Globe className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Urban Planner Dashboard
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Select a city to explore urban insights and environmental data
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>Powered by NASA Earth Data & Advanced Analytics</span>
          </div>
        </motion.div>

        {/* Country Selection */}
        {!selectedCountry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          >
            {Object.keys(AVAILABLE_CITIES).map((country, index) => (
              <motion.div
                key={country}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50"
                  onClick={() => setSelectedCountry(country)}
                >
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl flex items-center justify-center gap-3">
                      <MapPin className="h-6 w-6 text-primary" />
                      {country}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">
                        {Object.keys(AVAILABLE_CITIES[country]).length} cities available
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {Object.keys(AVAILABLE_CITIES[country]).map((city) => (
                          <Badge key={city} variant="secondary" className="text-xs">
                            {city}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* City Selection */}
        {selectedCountry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Back Button */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => setSelectedCountry(null)}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Countries
              </Button>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">{selectedCountry}</span>
              </div>
            </div>

            {/* Cities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(AVAILABLE_CITIES[selectedCountry]).map(([cityName, cityData], index) => (
                <motion.div
                  key={cityName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => setHoveredCity(cityName)}
                  onHoverEnd={() => setHoveredCity(null)}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 relative overflow-hidden"
                    onClick={() => handleCitySelect(selectedCountry, cityName)}
                  >
                    {cityData.hasNASAData && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs">
                          🛰️ NASA Data
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl flex items-center justify-between">
                        <span>{cityData.name}</span>
                        <Badge 
                          className={`${getAQIColor(cityData.aqi)} text-white px-2 py-1 text-xs`}
                        >
                          AQI {cityData.aqi}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {cityData.description}
                      </p>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* AQI Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Air Quality</span>
                        <span className={`text-sm font-semibold ${getAQITextColor(cityData.aqi)}`}>
                          {cityData.aqiLevel}
                        </span>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pollution</span>
                          <span className="font-medium">{cityData.stats.pollution}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Heat</span>
                          <span className="font-medium">{cityData.stats.heat}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Flood Risk</span>
                          <span className="font-medium">{cityData.stats.floodRisk}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Land Use</span>
                          <span className="font-medium">{cityData.stats.landUse}%</span>
                        </div>
                      </div>

                      {/* Select Button */}
                      <motion.div
                        animate={{ 
                          opacity: hoveredCity === cityName ? 1 : 0.7,
                          y: hoveredCity === cityName ? 0 : 5
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button 
                          className="w-full mt-4 flex items-center justify-center gap-2"
                          size="sm"
                        >
                          Explore {cityData.name}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
