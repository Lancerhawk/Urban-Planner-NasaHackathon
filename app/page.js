'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeProvider } from 'next-themes'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Sidebar from '@/components/Sidebar'
import CityInsights from '@/components/CityInsights'
import FutureVision from '@/components/FutureVision'
import UrbanBenchmarking from '@/components/UrbanBenchmarking'

const MOCK_CITIES = {
  'India': {
    'Mumbai': {
      name: 'Mumbai',
      country: 'India',
      coordinates: [19.0760, 72.8777],
      aqi: 156,
      aqiLevel: 'Unhealthy',
      stats: {
        pollution: 68,
        heat: 85,
        floodRisk: 45,
        landUse: 72
      },
      landUse: {
        residential: 45,
        commercial: 25,
        industrial: 15,
        openSpace: 10,
        water: 5
      },
      pollutionTrend: [
        { date: '2024-01', value: 145 },
        { date: '2024-02', value: 132 },
        { date: '2024-03', value: 168 },
        { date: '2024-04', value: 156 },
        { date: '2024-05', value: 142 },
        { date: '2024-06', value: 156 }
      ]
    },
    'Delhi': {
      name: 'Delhi',
      country: 'India',
      coordinates: [28.7041, 77.1025],
      aqi: 198,
      aqiLevel: 'Unhealthy',
      stats: {
        pollution: 82,
        heat: 78,
        floodRisk: 35,
        landUse: 65
      },
      landUse: {
        residential: 40,
        commercial: 30,
        industrial: 20,
        openSpace: 8,
        water: 2
      },
      pollutionTrend: [
        { date: '2024-01', value: 220 },
        { date: '2024-02', value: 185 },
        { date: '2024-03', value: 210 },
        { date: '2024-04', value: 198 },
        { date: '2024-05', value: 175 },
        { date: '2024-06', value: 198 }
      ]
    },
    'Bangalore': {
      name: 'Bangalore',
      country: 'India',
      coordinates: [12.9716, 77.5946],
      aqi: 89,
      aqiLevel: 'Moderate',
      stats: {
        pollution: 45,
        heat: 62,
        floodRisk: 55,
        landUse: 78
      },
      landUse: {
        residential: 35,
        commercial: 25,
        industrial: 15,
        openSpace: 20,
        water: 5
      },
      pollutionTrend: [
        { date: '2024-01', value: 75 },
        { date: '2024-02', value: 68 },
        { date: '2024-03', value: 92 },
        { date: '2024-04', value: 89 },
        { date: '2024-05', value: 78 },
        { date: '2024-06', value: 89 }
      ]
    }
  },
  'United States': {
    'New York': {
      name: 'New York',
      country: 'United States',
      coordinates: [40.7128, -74.0060],
      aqi: 65,
      aqiLevel: 'Moderate',
      stats: {
        pollution: 35,
        heat: 58,
        floodRisk: 72,
        landUse: 85
      },
      landUse: {
        residential: 30,
        commercial: 35,
        industrial: 10,
        openSpace: 20,
        water: 5
      },
      pollutionTrend: [
        { date: '2024-01', value: 58 },
        { date: '2024-02', value: 52 },
        { date: '2024-03', value: 68 },
        { date: '2024-04', value: 65 },
        { date: '2024-05', value: 61 },
        { date: '2024-06', value: 65 }
      ]
    },
    'Los Angeles': {
      name: 'Los Angeles',
      country: 'United States',
      coordinates: [34.0522, -118.2437],
      aqi: 95,
      aqiLevel: 'Moderate',
      stats: {
        pollution: 52,
        heat: 75,
        floodRisk: 25,
        landUse: 68
      },
      landUse: {
        residential: 50,
        commercial: 20,
        industrial: 15,
        openSpace: 12,
        water: 3
      },
      pollutionTrend: [
        { date: '2024-01', value: 88 },
        { date: '2024-02', value: 82 },
        { date: '2024-03', value: 105 },
        { date: '2024-04', value: 95 },
        { date: '2024-05', value: 91 },
        { date: '2024-06', value: 95 }
      ]
    }
  }
}

export default function App() {
  const [activeView, setActiveView] = useState('insights')
  const [selectedCountry, setSelectedCountry] = useState('India')
  const [selectedCity, setSelectedCity] = useState('Mumbai')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const currentCityData = MOCK_CITIES[selectedCountry]?.[selectedCity]

  const renderContent = () => {
    switch (activeView) {
      case 'insights':
        return (
          <CityInsights 
            cityData={currentCityData}
            cities={MOCK_CITIES}
            selectedCountry={selectedCountry}
            selectedCity={selectedCity}
            onCityChange={(country, city) => {
              setSelectedCountry(country)
              setSelectedCity(city)
            }}
          />
        )
      case 'future':
        return <FutureVision />
      case 'benchmarking':
        return <UrbanBenchmarking />
      default:
        return <CityInsights cityData={currentCityData} />
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar 
        activeView={activeView}
        setActiveView={setActiveView}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      {isMobile && !sidebarOpen && (
        <motion.div
          className="fixed top-4 right-4 z-[70]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            onClick={() => setSidebarOpen(true)}
            className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            size="icon"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
      
      <main className={`flex-1 transition-all duration-300 ${
        isMobile 
          ? 'ml-0' // No margin on mobile since sidebar overlays
          : sidebarOpen 
            ? 'ml-64' 
            : 'ml-16'
      }`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}