'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function AQIGauge({ value, level }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 200
    const height = 200
    const radius = Math.min(width, height) / 2 - 20

    svg.attr("width", width).attr("height", height)

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`)

    const ranges = [
      { min: 0, max: 50, color: "#22c55e", label: "Good" },
      { min: 51, max: 100, color: "#eab308", label: "Moderate" },
      { min: 101, max: 150, color: "#f97316", label: "Unhealthy for Sensitive" },
      { min: 151, max: 200, color: "#ef4444", label: "Unhealthy" },
      { min: 201, max: 300, color: "#a855f7", label: "Very Unhealthy" },
      { min: 301, max: 500, color: "#7c2d12", label: "Hazardous" }
    ]

    const arc = d3.arc()
      .innerRadius(radius - 30)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)

    g.append("path")
      .datum({ startAngle: -Math.PI / 2, endAngle: Math.PI / 2 })
      .style("fill", "hsl(var(--muted))")
      .attr("d", arc)

    const angleScale = d3.scaleLinear()
      .domain([0, 300])
      .range([-Math.PI / 2, Math.PI / 2])

    ranges.forEach(range => {
      if (range.max <= 300) {
        g.append("path")
          .datum({ 
            startAngle: angleScale(range.min), 
            endAngle: angleScale(Math.min(range.max, 300))
          })
          .style("fill", range.color)
          .style("opacity", 0.8)
          .attr("d", arc)
      }
    })

    const needleAngle = angleScale(Math.min(value, 300))
    const needlePath = `M 0 -${radius - 15} L 5 0 L 0 ${radius - 40} L -5 0 Z`
    
    g.append("path")
      .attr("d", needlePath)
      .attr("transform", `rotate(${(needleAngle * 180) / Math.PI})`)
      .style("fill", "hsl(var(--foreground))")

    g.append("circle")
      .attr("r", 8)
      .style("fill", "hsl(var(--foreground))")

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("y", 40)
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .style("fill", "hsl(var(--foreground))")
      .text(value)

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("y", 60)
      .style("font-size", "12px")
      .style("fill", "hsl(var(--muted-foreground))")
      .text(level)

  }, [value, level])

  return (
    <div className="flex flex-col items-center">
      <svg ref={svgRef}></svg>
      <div className="mt-4 text-center">
        <div className="text-sm text-muted-foreground mb-2">Air Quality Index</div>
        <div className="flex items-center justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Good</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Moderate</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Unhealthy</span>
          </div>
        </div>
      </div>
    </div>
  )
}