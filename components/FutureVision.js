'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Construction, Zap, TreePine } from 'lucide-react'

export default function FutureVision() {
  return (
    <div className="h-full p-6 overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="p-6 bg-primary/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <Eye className="h-12 w-12 text-primary" />
        </div>
        
        <h1 className="text-4xl font-bold mb-4">Future Vision</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
          Advanced urban development projections and planning scenarios coming soon
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Construction className="h-5 w-5" />
                <span>Smart Infrastructure</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI-powered infrastructure planning and optimization
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Energy Efficiency</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sustainable energy solutions and consumption modeling
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TreePine className="h-5 w-5" />
                <span>Green Spaces</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Urban forest planning and environmental impact analysis
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}