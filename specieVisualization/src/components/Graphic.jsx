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
    setActualCluster(type)

    if (paramsAPI == undefined) paramsAPI = {} 
    if (!svgRef.current) return;

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
    let data = response['cluster']
    setBestK(response['bestK'])
    setLoading(false);

    const svg = d3.select(svgRef.current);

    const xScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.UMAP1), d3.max(data, d => d.UMAP1)])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.UMAP2), d3.max(data, d => d.UMAP2)])
      .range([height - margin.bottom, margin.top]);

    svg.selectAll("circle").remove();

    svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.UMAP1))
      .attr("cy", d => yScale(d.UMAP2))
      .attr("r", 4)
      .attr("fill", d => colorScale(d.cluster))
      .on("mouseover", (event, d) => {
        d3.select(".tooltip").transition()
          .duration(200)
          .style("opacity", 0.9);
        d3.select(".tooltip").html(`UMAP1: ${d.UMAP1.toFixed(2)}<br/>UMAP2: ${d.UMAP2.toFixed(2)}`)
          .style("left", `${event.pageX + 5}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => {
        d3.select(".tooltip").transition()
          .duration(500)
          .style("opacity", 0);
      });

    const zoom = d3.zoom()
      .scaleExtent([0.5, 20])
      .on('zoom', zoomed);

    function zoomed(event) {
      const transform = event.transform;
      
      const newXScale = transform.rescaleX(xScale);
      const newYScale = transform.rescaleY(yScale);
    
      svg.selectAll("circle")
        .attr("cx", d => newXScale(d.UMAP1))
        .attr("cy", d => newYScale(d.UMAP2));
    }

    svg.call(zoom);
  }, []);

  const sendParams = (params) => {
    if (localStorage.getItem(actualCluster) != null) {
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