'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export default function PollutionChart({ data }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!svgRef.current || !data) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 40, left: 50 }
    const width = 300 - margin.left - margin.right
    const height = 150 - margin.bottom - margin.top

    svg.attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom)

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const parseDate = d3.timeParse("%Y-%m")
    const processedData = data.map(d => ({
      date: parseDate(d.date),
      value: d.value
    }))

    const xScale = d3.scaleTime()
      .domain(d3.extent(processedData, d => d.date))
      .range([0, width])

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.value) * 1.1])
      .range([height, 0])

    const line = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX)

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b")))
      .selectAll("text")
      .style("fill", "hsl(var(--foreground))")

    g.selectAll(".domain, .tick line")
      .style("stroke", "hsl(var(--border))")

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("fill", "hsl(var(--foreground))")

    g.selectAll(".domain, .tick line")
      .style("stroke", "hsl(var(--border))")

    g.selectAll(".grid-line")
      .data(yScale.ticks())
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .style("stroke", "hsl(var(--border))")
      .style("stroke-opacity", 0.3)
      .style("stroke-dasharray", "3,3")

    const area = d3.area()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX)

    g.append("path")
      .datum(processedData)
      .attr("fill", "hsl(var(--chart-1))")
      .attr("opacity", 0.3)
      .attr("d", area)

    g.append("path")
      .datum(processedData)
      .attr("fill", "none")
      .attr("stroke", "hsl(var(--chart-1))")
      .attr("stroke-width", 3)
      .attr("d", line)

    g.selectAll(".dot")
      .data(processedData)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.value))
      .attr("r", 4)
      .attr("fill", "hsl(var(--chart-1))")
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 2)

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("fill", "hsl(var(--muted-foreground))")
      .style("font-size", "12px")
      .text("AQI Value")

  }, [data])

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg ref={svgRef} className="max-w-full max-h-full"></svg>
    </div>
  )
}