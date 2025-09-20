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

const statColors = {
  pollution: 'text-red-500',
  heat: 'text-orange-500',
  floodRisk: 'text-blue-500',
  landUse: 'text-green-500'
}

const statBgColors = {
  pollution: 'bg-red-500/10',
  heat: 'bg-orange-500/10',
  floodRisk: 'bg-blue-500/10',
  landUse: 'bg-green-500/10'
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
        const colorClass = statColors[key]
        const bgColorClass = statBgColors[key]
        const label = statLabels[key]
        
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
                      <p className="text-2xl font-bold">
                        {value}%
                      </p>
                      <div className="flex items-center">
                        <div 
                          className="w-16 h-1.5 bg-muted rounded-full overflow-hidden ml-2"
                        >
                          <motion.div
                            className={`h-full rounded-full ${
                              key === 'pollution' ? 'bg-red-500' :
                              key === 'heat' ? 'bg-orange-500' :
                              key === 'floodRisk' ? 'bg-blue-500' :
                              'bg-green-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-full ${bgColorClass}`}>
                    <IconComponent className={`h-6 w-6 ${colorClass}`} />
                  </div>
                </div>
                
                <div className="mt-4 flex items-center space-x-2">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      value > 70 ? 'bg-red-500' :
                      value > 40 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                  />
                  <span className={`text-xs font-medium ${
                    value > 70 ? 'text-red-500' :
                    value > 40 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {value > 70 ? 'High' : value > 40 ? 'Medium' : 'Low'}
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