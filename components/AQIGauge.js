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

    // AQI ranges with proper colors
    const ranges = [
      { min: 0, max: 50, color: "#22c55e", label: "Good" },
      { min: 51, max: 100, color: "#eab308", label: "Moderate" },
      { min: 101, max: 150, color: "#f97316", label: "Unhealthy for Sensitive" },
      { min: 151, max: 200, color: "#ef4444", label: "Unhealthy" },
      { min: 201, max: 300, color: "#a855f7", label: "Very Unhealthy" },
      { min: 301, max: 500, color: "#7c2d12", label: "Hazardous" }
    ]

    // Create arc generator
    const arc = d3.arc()
      .innerRadius(radius - 30)
      .outerRadius(radius)

    // Create angle scale
    const angleScale = d3.scaleLinear()
      .domain([0, 300])
      .range([-Math.PI / 2, Math.PI / 2])

    // Draw background arc
    g.append("path")
      .datum({ 
        startAngle: -Math.PI / 2, 
        endAngle: Math.PI / 2 
      })
      .attr("d", arc)
      .style("fill", "#1f2937")
      .style("opacity", 0.3)

    // Draw colored ranges
    ranges.forEach(range => {
      if (range.max <= 300) {
        const startAngle = angleScale(range.min)
        const endAngle = angleScale(Math.min(range.max, 300))
        
        g.append("path")
          .datum({ 
            startAngle: startAngle, 
            endAngle: endAngle 
          })
          .attr("d", arc)
          .style("fill", range.color)
          .style("opacity", 0.8)
      }
    })

    // Draw needle
    const needleAngle = angleScale(Math.min(value, 300))
    const needleLength = radius - 15
    const needlePath = `M 0 -${needleLength} L 5 0 L 0 ${needleLength - 25} L -5 0 Z`
    
    g.append("path")
      .attr("d", needlePath)
      .attr("transform", `rotate(${(needleAngle * 180) / Math.PI})`)
      .style("fill", "#ffffff")
      .style("stroke", "#000000")
      .style("stroke-width", "1")

    // Draw center circle
    g.append("circle")
      .attr("r", 8)
      .style("fill", "#ffffff")
      .style("stroke", "#000000")
      .style("stroke-width", "2")

    // Draw value text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("y", 40)
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .style("fill", "#ffffff")
      .text(value)

    // Draw level text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("y", 60)
      .style("font-size", "12px")
      .style("fill", "#9ca3af")
      .text(level)

  }, [value, level])

  return (
    <div className="flex flex-col items-center">
      <svg ref={svgRef}></svg>
      <div className="mt-0 text-center">
        <div className="text-sm text-muted-foreground mb-3">Air Quality Index</div>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">Level</th>
                <th className="px-3 py-2 text-center font-medium">Range</th>
                <th className="px-3 py-2 text-center font-medium">Color</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-3 py-2 text-left">Good</td>
                <td className="px-3 py-2 text-center">0-50</td>
                <td className="px-3 py-2 text-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mx-auto"></div>
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 text-left">Moderate</td>
                <td className="px-3 py-2 text-center">51-100</td>
                <td className="px-3 py-2 text-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mx-auto"></div>
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 text-left">Unhealthy for Sensitive</td>
                <td className="px-3 py-2 text-center">101-150</td>
                <td className="px-3 py-2 text-center">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mx-auto"></div>
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2 text-left">Unhealthy</td>
                <td className="px-3 py-2 text-center">151-200</td>
                <td className="px-3 py-2 text-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mx-auto"></div>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-left">Very Unhealthy</td>
                <td className="px-3 py-2 text-center">201-300</td>
                <td className="px-3 py-2 text-center">
                  <div className="w-4 h-4 bg-purple-500 rounded-full mx-auto"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}