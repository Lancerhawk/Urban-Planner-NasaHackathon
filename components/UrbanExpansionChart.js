'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function UrbanExpansionChart({ data }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!svgRef.current) return

    const drawChart = () => {
      const svg = d3.select(svgRef.current)
      svg.selectAll("*").remove()

      // Get the container dimensions
      const container = svgRef.current.parentElement
      const containerWidth = container.clientWidth || 300
      const containerHeight = container.clientHeight || 200
      
      const width = containerWidth
      const height = containerHeight
      const margin = { top: 20, right: 30, bottom: 40, left: 30 }
      const innerWidth = width - margin.left - margin.right
      const innerHeight = height - margin.top - margin.bottom

      svg.attr("width", width).attr("height", height)

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Sample data for urban expansion over time
    const expansionData = [
      { year: 2020, population: 8.2, infrastructure: 12.1, total: 10.15 },
      { year: 2021, population: 9.1, infrastructure: 13.5, total: 11.3 },
      { year: 2022, population: 9.8, infrastructure: 14.2, total: 12.0 },
      { year: 2023, population: 10.5, infrastructure: 15.1, total: 12.8 },
      { year: 2024, population: 11.2, infrastructure: 15.7, total: 13.45 }
    ]

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(expansionData, d => d.year))
      .range([0, innerWidth])

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(expansionData, d => d.total) + 2])
      .range([innerHeight, 0])

    // Line generators
    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.total))
      .curve(d3.curveMonotoneX)

    const populationLine = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.population))
      .curve(d3.curveMonotoneX)

    const infrastructureLine = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.infrastructure))
      .curve(d3.curveMonotoneX)

    // Add area under the main line
    const area = d3.area()
      .x(d => xScale(d.year))
      .y0(innerHeight)
      .y1(d => yScale(d.total))
      .curve(d3.curveMonotoneX)

    // Draw area
    g.append("path")
      .datum(expansionData)
      .attr("d", area)
      .style("fill", "url(#gradient)")
      .style("opacity", 0.3)

    // Draw lines
    g.append("path")
      .datum(expansionData)
      .attr("d", line)
      .style("fill", "none")
      .style("stroke", "#3b82f6")
      .style("stroke-width", 3)

    g.append("path")
      .datum(expansionData)
      .attr("d", populationLine)
      .style("fill", "none")
      .style("stroke", "#10b981")
      .style("stroke-width", 2)
      .style("stroke-dasharray", "5,5")

    g.append("path")
      .datum(expansionData)
      .attr("d", infrastructureLine)
      .style("fill", "none")
      .style("stroke", "#f59e0b")
      .style("stroke-width", 2)
      .style("stroke-dasharray", "5,5")

    // Add dots for data points
    g.selectAll(".dot")
      .data(expansionData)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.year))
      .attr("cy", d => yScale(d.total))
      .attr("r", 4)
      .style("fill", "#3b82f6")
      .style("stroke", "#ffffff")
      .style("stroke-width", 2)

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d => d.toString()))

    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`))

    // Add gradient definition
    const defs = svg.append("defs")
    const gradient = defs.append("linearGradient")
      .attr("id", "gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", innerHeight)
      .attr("x2", 0).attr("y2", 0)

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.1)

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.4)

    // Add legend
    const legend = g.append("g")
      .attr("transform", `translate(${innerWidth - 90}, 10)`)

    const legendData = [
      { color: "#3b82f6", label: "Total Growth", solid: true },
      { color: "#10b981", label: "Population", solid: false },
      { color: "#f59e0b", label: "Infrastructure", solid: false }
    ]

    legend.selectAll(".legend-item")
      .data(legendData)
      .enter().append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`)
      .each(function(d) {
        const g = d3.select(this)
        
        g.append("line")
          .attr("x1", 0)
          .attr("x2", 15)
          .attr("y1", 0)
          .attr("y2", 0)
          .style("stroke", d.color)
          .style("stroke-width", d.solid ? 3 : 2)
          .style("stroke-dasharray", d.solid ? "none" : "5,5")
        
        g.append("text")
          .attr("x", 20)
          .attr("y", 0)
          .attr("dy", "0.35em")
          .style("font-size", "10px")
          .style("fill", "#9ca3af")
          .text(d.label)
      })
    }

    // Initial draw
    drawChart()

    // Add resize handler
    const handleResize = () => {
      drawChart()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [data])

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg ref={svgRef} className="w-full h-full max-w-full max-h-full"></svg>
    </div>
  )
}
