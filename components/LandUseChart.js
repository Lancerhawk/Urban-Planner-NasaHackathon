'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function LandUseChart({ data }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!svgRef.current || !data) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 250
    const height = 250
    const radius = Math.min(width, height) / 2 - 30

    svg.attr("width", width).attr("height", height)

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`)

    const processedData = Object.entries(data).map(([key, value]) => ({
      category: key,
      value: value,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
    }))

    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))"
    ]

    const color = d3.scaleOrdinal()
      .domain(processedData.map(d => d.category))
      .range(colors)

    const pie = d3.pie()
      .value(d => d.value)
      .sort(null)

    const arc = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius)

    const labelArc = d3.arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius * 0.7)

    const arcs = g.selectAll(".arc")
      .data(pie(processedData))
      .enter().append("g")
      .attr("class", "arc")

    arcs.append("path")
      .attr("d", arc)
      .style("fill", d => color(d.data.category))
      .style("stroke", "hsl(var(--background))")
      .style("stroke-width", 2)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 0.8)
          .attr("transform", function() {
            const [x, y] = arc.centroid(d)
            return `translate(${x * 0.1}, ${y * 0.1})`
          })
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 1)
          .attr("transform", "translate(0, 0)")
      })

    arcs.append("text")
      .attr("transform", d => `translate(${labelArc.centroid(d)})`)
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .style("fill", "hsl(var(--foreground))")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(d => `${d.data.value}%`)

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.5em")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "hsl(var(--foreground))")
      .text("Land Use")

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1em")
      .style("font-size", "12px")
      .style("fill", "hsl(var(--muted-foreground))")
      .text("Distribution")

  }, [data])

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <svg ref={svgRef} className="max-w-full"></svg>
      
      <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
        {Object.entries(data).map(([key, value], index) => {
          const colors = [
            "bg-chart-1",
            "bg-chart-2", 
            "bg-chart-3",
            "bg-chart-4",
            "bg-chart-5"
          ]
          
          return (
            <div key={key} className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} flex-shrink-0`}></div>
              <span className="capitalize text-muted-foreground text-xs truncate">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}