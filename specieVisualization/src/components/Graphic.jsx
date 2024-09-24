import React, { useEffect, useRef, useState, useCallback, act } from 'react';
import PuffLoader from "react-spinners/PuffLoader";
import Sidebar from "./Sidebar"
import * as d3 from 'd3';

const Graphic = () => {
  const [loading, setLoading] = useState(false);
  const [actualCluster, setActualCluster] = useState("kmeans");
  const [bestK, setBestK] = useState(1);
  const svgRef = useRef(null);
  const width = 1000;
  const height = 1000;
  const margin = { top: 20, right: 30, bottom: 30, left: 60 };
  const [jsonInfo, setJsonInfo] = useState(null);
  
  const colorScale = d3.scaleOrdinal()
    .domain([-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    .range(['lightcoral', 'lightseagreen', 'darkorchid', 'darkorange', 'lightskyblue', 'deeppink', 'lawngreen', 'aqua', 'papayawhip', 'palegreen', 'orchid']);

  const getSize = (family) => {
    const occurrences = family[1];
  
    const sizeScale = d3.scaleLog()
      .domain([100, 15000])
      .range([5, 20]); 
  
    return sizeScale(occurrences);
  };
  
  const updateChart = useCallback(async (type, paramsAPI) => {
    setBestK(1)
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
      .attr("r", d => getSize(d.family))
      .attr("fill", d => colorScale(d.cluster))
      .on("click", (event, d) => {
        setJsonInfo(d);
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
        .attr("cy", d => newYScale(d.UMAP2))
        .attr("r", d => getSize(d.family) * transform.k); 
    }
      

    svg.call(zoom);
  }, []);

  const sendParams = (params) => {
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

  const images = [
    "https://picsum.photos/id/1018/1000/600/",
    "https://picsum.photos/id/1015/250/150/",
    "https://picsum.photos/id/1019/1000/600/"
  ];

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
      </div>
      <Sidebar cluster={actualCluster} sendParams={sendParams} bestK={bestK} jsonInfo={jsonInfo}/>
    </div>
  );
};

export default Graphic;