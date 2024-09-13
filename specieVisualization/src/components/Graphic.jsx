import React, { useEffect, useRef, useState, useCallback } from 'react';
import PuffLoader from "react-spinners/PuffLoader";
import Inputs from "./Inputs"
import * as d3 from 'd3';

const Graphic = () => {
  const [loading, setLoading] = useState(false);
  const [actualCluster, setActualCluster] = useState("kmeans");
  const [bestK, setBestK] = useState(2);
  const svgRef = useRef(null);
  const width = 1000;
  const height = 1000;
  const margin = { top: 20, right: 30, bottom: 30, left: 60 };
  
  const colorScale = d3.scaleOrdinal()
    .domain([-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    .range(['lightcoral', 'lightseagreen', 'darkorchid', 'darkorange', 'lightskyblue', 'deeppink', 'lawngreen', 'aqua', 'papayawhip', 'palegreen', 'orchid']);

  const updateChart = useCallback(async (type, paramsAPI) => {
    const bestKName = 'bestK'+type
    let data = JSON.parse(localStorage.getItem(type));
    setActualCluster(type)

    if (paramsAPI == undefined) paramsAPI = {} 
    if (!svgRef.current) return;
    if (type.localeCompare('dbscan') !== 0) setBestK(parseInt(localStorage.getItem(bestKName)))

    if (data == null) {
      setLoading(true);
      const body = JSON.stringify({ type, paramsAPI });
      const res = await fetch(`http://127.0.0.1:5000/do_cluster`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
      });
      const response = await res.json();
      data = response['cluster']
      setBestK(response['bestK'])
      localStorage.setItem(type, JSON.stringify(data));
      localStorage.setItem(bestKName, JSON.stringify(response['bestK']));
      console.log('data received');   
    }
    setLoading(false);

    const svg = d3.select(svgRef.current);

    const xScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.x), d3.max(data, d => d.x)])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.y), d3.max(data, d => d.y)])
      .range([height - margin.bottom, margin.top]);

    svg.selectAll("circle").remove();
    svg.selectAll(".x-axis").remove();
    svg.selectAll(".y-axis").remove();

    svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 4)
      .attr("fill", d => colorScale(d.cluster))
      .on("mouseover", (event, d) => {
        d3.select(".tooltip").transition()
          .duration(200)
          .style("opacity", 0.9);
        d3.select(".tooltip").html(`x: ${d.x}<br/>y: ${d.y}`)
          .style("left", `${event.pageX + 5}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => {
        d3.select(".tooltip").transition()
          .duration(500)
          .style("opacity", 0);
      });

    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    const zoom = d3.zoom()
      .scaleExtent([0.5, 20])
      .on('zoom', zoomed);

    function zoomed(event) {
      const transform = event.transform;
      
      const newXScale = transform.rescaleX(xScale);
      const newYScale = transform.rescaleY(yScale);
    
      svg.selectAll("circle")
        .attr("cx", d => newXScale(d.x))
        .attr("cy", d => newYScale(d.y));
    
      svg.select(".x-axis").call(d3.axisBottom(newXScale));
      svg.select(".y-axis").call(d3.axisLeft(newYScale));
    }

    svg.call(zoom);
  }, []);

  const sendParams = (params) => {
    console.log('params', params, typeof(params))
    if (localStorage.getItem(actualCluster) != null) {
      console.log('eliminando local storage')
      localStorage.removeItem(actualCluster)
    }
    updateChart(actualCluster, params)
  }

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all");

    updateChart("kmeans");

    return () => {
      svg.selectAll("*").remove();
    };
  }, [updateChart]);

  return (
    <div className="main-group">
      <div className="svg-group">
        <div className="button-group">
          <button onClick={() => updateChart('kmeans')}>Kmeans</button>
          <button onClick={() => updateChart('dbscan')}>DBSCAN</button>
          <button onClick={() => updateChart('hierarquical')}>Hierarchical</button>
        </div>
        {loading && 
        <div className='loading-group'>
          <p>Working on it...</p>
          <PuffLoader size={200} />
        </div>
        }
        <svg ref={svgRef}></svg>
        <div className="tooltip" style={{ opacity: 0, position: 'absolute' }}></div>
      </div>
      <Inputs cluster={actualCluster} sendParams={sendParams} bestK={bestK}/>
    </div>
  );
};

export default Graphic;