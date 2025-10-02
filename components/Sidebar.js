'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { 
  BarChart3, 
  Eye, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight,
  Map,
  Activity,
  Target,
  Menu,
  X,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const sidebarItems = [
  {
    id: 'insights',
    label: 'City Insights',
    icon: BarChart3,
  },
  {
    id: 'future',
    label: 'Future Vision',
    icon: Eye,
  },
  {
    id: 'benchmarking',
    label: 'Urban Benchmarking',
    icon: TrendingUp,
  }
]

const sidebarActions = [
  {
    id: 'change-city',
    label: 'Change City',
    icon: MapPin,
    description: 'Select a different city'
  }
]

export default function Sidebar({ activeView, setActiveView, sidebarOpen, setSidebarOpen, onChangeCity }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024) 
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  if (isMobile) {
    return (
      <>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-[55]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <motion.div
          className={`fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-[9999] w-64 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ position: 'fixed', zIndex: 9999 }}
          initial={{ x: -256 }}
          animate={{ x: sidebarOpen ? 0 : -256 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-2 bg-sidebar-primary rounded-lg">
                <Map className="h-6 w-6 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">Urban Planner</h1>
                <p className="text-xs text-sidebar-foreground/60">Dashboard v2.0</p>
              </div>
            </motion.div>
            
            <Button
              variant="ghost" 
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => {
              const IconComponent = item.icon
              const isActive = activeView === item.id
              
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start h-12 ${
                      isActive 
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md' 
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                    onClick={() => {
                      setActiveView(item.id)
                      setSidebarOpen(false) // Close sidebar on mobile after selection
                    }}
                  >
                    <IconComponent className="h-5 w-5 mr-3 flex-shrink-0" />
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="font-medium text-sm truncate w-full">{item.label}</span>
                      <span className="text-xs opacity-60 truncate w-full">{item.description}</span>
                    </div>
                  </Button>
                </motion.div>
              )
            })}
            
            {/* Separator */}
            <div className="border-t border-sidebar-border my-4"></div>
            
            {/* Action Items */}
            {sidebarActions.map((action) => {
              const IconComponent = action.icon
              
              return (
                <motion.div
                  key={action.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={() => {
                      if (action.id === 'change-city' && onChangeCity) {
                        onChangeCity()
                      }
                      setSidebarOpen(false) // Close sidebar on mobile after selection
                    }}
                  >
                    <IconComponent className="h-5 w-5 mr-3 flex-shrink-0" />
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="font-medium text-sm truncate w-full">{action.label}</span>
                      <span className="text-xs opacity-60 truncate w-full">{action.description}</span>
                    </div>
                  </Button>
                </motion.div>
              )
            })}
          </nav>

          <motion.div
            className="absolute bottom-4 left-4 right-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-sidebar-accent rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-4 w-4 text-sidebar-accent-foreground" />
                <span className="text-sm font-medium text-sidebar-accent-foreground">System Status</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-sidebar-accent-foreground/70">Data Sync</span>
                  <span className="text-green-400">Live</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-sidebar-accent-foreground/70">Last Update</span>
                  <span className="text-sidebar-accent-foreground/70">2 min ago</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </>
    )
  }

  return (
    <motion.div
      className={`fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-[9999] transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      style={{ position: 'fixed', zIndex: 9999 }}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <motion.div
          className="flex items-center space-x-3"
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-2 bg-sidebar-primary rounded-lg">
            <Map className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">Urban Planner</h1>
              <p className="text-xs text-sidebar-foreground/60">Dashboard</p>
            </div>
          )}
        </motion.div>
        
        <div className="lg:hidden">
          <Button
            variant="ghost" 
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => {
          const IconComponent = item.icon
          const isActive = activeView === item.id
          
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start h-12 ${
                  isActive 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                } ${!sidebarOpen && 'px-3'}`}
                onClick={() => setActiveView(item.id)}
              >
                <IconComponent className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : ''} flex-shrink-0`} />
                {sidebarOpen && (
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium text-sm truncate w-full">{item.label}</span>
                    <span className="text-xs opacity-60 truncate w-full">{item.description}</span>
                  </div>
                )}
              </Button>
            </motion.div>
          )
        })}
        
        {/* Separator */}
        {sidebarOpen && <div className="border-t border-sidebar-border my-4"></div>}
        
        {/* Action Items */}
        {sidebarActions.map((action) => {
          const IconComponent = action.icon
          
          return (
            <motion.div
              key={action.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                className={`w-full justify-start h-12 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${!sidebarOpen && 'px-3'}`}
                onClick={() => {
                  if (action.id === 'change-city' && onChangeCity) {
                    onChangeCity()
                  }
                }}
              >
                <IconComponent className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : ''} flex-shrink-0`} />
                {sidebarOpen && (
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium text-sm truncate w-full">{action.label}</span>
                    <span className="text-xs opacity-60 truncate w-full">{action.description}</span>
                  </div>
                )}
              </Button>
            </motion.div>
          )
        })}
      </nav>

      {sidebarOpen && (
        <motion.div
          className="absolute bottom-4 left-4 right-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-sidebar-accent rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-4 w-4 text-sidebar-accent-foreground" />
              <span className="text-sm font-medium text-sidebar-accent-foreground">System Status</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-sidebar-accent-foreground/70">Data Sync</span>
                <span className="text-green-400">Live</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-sidebar-accent-foreground/70">Last Update</span>
                <span className="text-sidebar-accent-foreground/70">2 min ago</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}