'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Droplets, Thermometer, Waves, Building } from 'lucide-react'

const statIcons = {
  pollution: Droplets,
  heat: Thermometer,
  floodRisk: Waves,
  landUse: Building
}

const getSeverityLevel = (key, value) => {
  if (key === 'pollution') {
    if (value <= 30) return { level: 'Low', color: 'green', bgColor: 'bg-green-500/10', textColor: 'text-green-500', iconColor: 'text-green-500' }
    if (value <= 60) return { level: 'Moderate', color: 'yellow', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-500', iconColor: 'text-yellow-500' }
    if (value <= 80) return { level: 'High', color: 'orange', bgColor: 'bg-orange-500/10', textColor: 'text-orange-500', iconColor: 'text-orange-500' }
    return { level: 'Critical', color: 'red', bgColor: 'bg-red-500/10', textColor: 'text-red-500', iconColor: 'text-red-500' }
  }
  
  if (key === 'heat') {
    if (value <= 30) return { level: 'Low', color: 'green', bgColor: 'bg-green-500/10', textColor: 'text-green-500', iconColor: 'text-green-500' }
    if (value <= 60) return { level: 'Moderate', color: 'yellow', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-500', iconColor: 'text-yellow-500' }
    if (value <= 80) return { level: 'High', color: 'orange', bgColor: 'bg-orange-500/10', textColor: 'text-orange-500', iconColor: 'text-orange-500' }
    return { level: 'Critical', color: 'red', bgColor: 'bg-red-500/10', textColor: 'text-red-500', iconColor: 'text-red-500' }
  }
  
  if (key === 'floodRisk') {
    if (value <= 30) return { level: 'Low', color: 'green', bgColor: 'bg-green-500/10', textColor: 'text-green-500', iconColor: 'text-green-500' }
    if (value <= 60) return { level: 'Moderate', color: 'yellow', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-500', iconColor: 'text-yellow-500' }
    if (value <= 80) return { level: 'High', color: 'orange', bgColor: 'bg-orange-500/10', textColor: 'text-orange-500', iconColor: 'text-orange-500' }
    return { level: 'Critical', color: 'red', bgColor: 'bg-red-500/10', textColor: 'text-red-500', iconColor: 'text-red-500' }
  }
  
  if (key === 'landUse') {
    if (value >= 80) return { level: 'Excellent', color: 'green', bgColor: 'bg-green-500/10', textColor: 'text-green-500', iconColor: 'text-green-500' }
    if (value >= 60) return { level: 'Good', color: 'blue', bgColor: 'bg-blue-500/10', textColor: 'text-blue-500', iconColor: 'text-blue-500' }
    if (value >= 40) return { level: 'Fair', color: 'yellow', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-500', iconColor: 'text-yellow-500' }
    return { level: 'Poor', color: 'red', bgColor: 'bg-red-500/10', textColor: 'text-red-500', iconColor: 'text-red-500' }
  }
  
  return { level: 'Unknown', color: 'gray', bgColor: 'bg-gray-500/10', textColor: 'text-gray-500', iconColor: 'text-gray-500' }
}

const getProgressBarColor = (key, value) => {
  const severity = getSeverityLevel(key, value)
  return {
    'green': 'bg-green-500',
    'yellow': 'bg-yellow-500', 
    'orange': 'bg-orange-500',
    'red': 'bg-red-500',
    'blue': 'bg-blue-500',
    'gray': 'bg-gray-500'
  }[severity.color]
}

const statLabels = {
  pollution: 'Pollution Level',
  heat: 'Heat Index',
  floodRisk: 'Flood Risk',
  landUse: 'Land Use Efficiency'
}

export default function QuickStats({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(stats).map(([key, value], index) => {
        const IconComponent = statIcons[key]
        const label = statLabels[key]
        const severity = getSeverityLevel(key, value)
        const progressBarColor = getProgressBarColor(key, value)
        
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {label}
                    </p>
                    <div className="flex items-baseline space-x-2">
                      <p className={`text-2xl font-bold ${severity.textColor}`}>
                        {value}%
                      </p>
                      <div className="flex items-center">
                        <div 
                          className="w-16 h-1.5 bg-muted rounded-full overflow-hidden ml-2"
                        >
                          <motion.div
                            className={`h-full rounded-full ${progressBarColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-full ${severity.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${severity.iconColor}`} />
                  </div>
                </div>
                
                <div className="mt-4 flex items-center space-x-2">
                  <div 
                    className={`w-2 h-2 rounded-full ${progressBarColor}`}
                  />
                  <span className={`text-xs font-medium ${severity.textColor}`}>
                    {severity.level}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}