import '../styles/Species.css';
import React, { useEffect, useRef, useState, useCallback, act } from 'react';
import PuffLoader from "react-spinners/PuffLoader";
import Sidebar from "../components/Sidebar"
import FloatingBox from "../components/FloatingBox"
import * as d3 from 'd3';

const Species = ({ setSharedData, showSidebar, hexagonSelected, setSpecieSelected }) => {
  const [loading, setLoading] = useState(false);
  const [actualCluster, setActualCluster] = useState("kmeans");
  const [bestK, setBestK] = useState(1);
  const svgRef = useRef(null);
  const [jsonInfo, setJsonInfo] = useState(null);
  
  const colorScale = d3.scaleOrdinal()
    .domain([-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    .range(['firebrick', 'mediumblue', 'lawngreen', 'darkorange', 'mediumvioletred', 'darkturquoise', 'lightcoral', 'gold', 'rebeccapurple', 'peru', 'darkslategray']);

  const getSize = (family) => {
    const occurrences = family[1];
  
    const sizeScale = d3.scaleLog()
      .domain([100, 2000])
      .range([8, 30]); 
  
    return sizeScale(occurrences);
  };

  const formatData = (jsonResponse, hexagonId) => {
    if (hexagonId === "") return jsonResponse;
    const filteredResponse = jsonResponse.filter(item => item[hexagonId] !== 0);
  
    return filteredResponse;
  };
  
  
  const updateChart = useCallback(async (type, paramsAPI, hexagonId) => {
    setBestK(1);
    setActualCluster(type);
  
    if (paramsAPI == undefined) paramsAPI = {}; 
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
    let data = formatData(response['cluster'], hexagonId);
    // console.log('data', data)
    setSharedData(response['cluster']);
    setBestK(response['bestK']);
    setLoading(false);
  
    const svg = d3.select(svgRef.current);
    const svgWidth = svgRef.current ? svgRef.current.clientWidth : 1000;
    const svgHeight = svgRef.current ? svgRef.current.clientHeight: 1000;
    let size = svgWidth > svgHeight ? svgHeight : svgWidth;
    size = size - Math.floor(size / 6);
  
    const xScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.UMAP1), d3.max(data, d => d.UMAP1)])
      .range([(svgWidth / 2) - (size / 2), (svgWidth / 2) + (size / 2)]);
  
    const yScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.UMAP2), d3.max(data, d => d.UMAP2)])
      .range([(svgHeight / 2) + (size / 2), (svgHeight / 2) - (size / 2)]);
  
    svg.selectAll("g").remove();
    
    const shadowGroup = svg.append("g").attr("class", "shadow-group");
    const circleGroup = svg.append("g").attr("class", "circle-group");
  
    shadowGroup.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.UMAP1))
      .attr("cy", d => yScale(d.UMAP2)) 
      .attr("r", d => getSize(d.family))
      .attr("fill", d => colorScale(d.cluster))
      .style("filter", d => 
        `drop-shadow(0px 0px 30px ${colorScale(d.cluster)}) drop-shadow(0px 0px 15px ${colorScale(d.cluster)})`)
      .lower();  

    circleGroup.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.UMAP1))
      .attr("cy", d => yScale(d.UMAP2)) 
      .attr("r", d => getSize(d.family))
      .attr("fill", d => {
        const patternId = `pattern-${d.identifier[0].replace(/[^a-zA-Z0-9-_]/g, '')}`;
        const circleRadius = getSize(d.family);
  
        if (svg.select(`#${patternId}`).empty()) {
          svg.append("defs")
            .append("pattern")
            .attr("id", patternId)
            .attr("patternUnits", "objectBoundingBox")
            .attr("width", 1)
            .attr("height", 1)
            .append("image")
            .attr("xlink:href", d.identifier[0])
            .attr("width", circleRadius * 2) 
            .attr("height", circleRadius * 2)
            .attr("preserveAspectRatio", "xMidYMid slice")
            .attr("filter", "grayscale(100%)"); 
        }        
        return `url(#${patternId})`;
      })
      .attr("stroke", d => colorScale(d.cluster))
      .attr("stroke-width", 2)
      .on("click", (event, d) => {
        setJsonInfo(d);
        shadowGroup.lower(); 
      })
      .on("mouseover", function(event, d) {
        const hexArray = Object.entries(d)
          .slice(0, 24) 
          .filter(([key, value]) => value > 0) 
          .map(([key]) => key); 
        if (setSpecieSelected != undefined) setSpecieSelected(hexArray);
        const patternId = `pattern-${d.identifier[0].replace(/[^a-zA-Z0-9-_]/g, '')}`;
        const circleRadius = 1.2 * d3.select(this).attr("r");
        d3.select(this)
          .attr("r", circleRadius) 
          .raise(); 
  
        svg.select(`#${patternId} image`)
          .attr("filter", "none")
          .attr("width", circleRadius * 2) 
          .attr("height", circleRadius * 2);
  
        shadowGroup.lower(); 
      })
      .on("mouseout", function(event, d) {
        if (setSpecieSelected != undefined) setSpecieSelected("")
        const patternId = `pattern-${d.identifier[0].replace(/[^a-zA-Z0-9-_]/g, '')}`;
        const circleRadius = d3.select(this).attr("r") / 1.2;
        d3.select(this)
          .attr("r", circleRadius)
          .lower();
        svg.select(`#${patternId} image`)
          .attr("filter", "grayscale(100%)")
          .attr("width", circleRadius * 2) 
          .attr("height", circleRadius * 2);
  
        shadowGroup.lower();  
      });

      const zoom = d3.zoom()
      .scaleExtent([0.5, 40])
      .on('zoom', zoomed);

    function zoomed(event) {
      const transform = event.transform;
    
      const newXScale = transform.rescaleX(xScale);
      const newYScale = transform.rescaleY(yScale);

      svg.selectAll("circle")
        .attr("cx", d => newXScale(d.UMAP1))
        .attr("cy", d => newYScale(d.UMAP2));

      if (transform.k < 5) {
        svg.selectAll("circle")
        .attr("r", d => getSize(d.family) * transform.k)
        .attr("fill", d => {
          const patternId = `pattern-${d.identifier[0].replace(/[^a-zA-Z0-9-_]/g, '')}`;
          const circleRadius = getSize(d.family) * transform.k;
    
          if (svg.select(`#${patternId}`).empty()) {
            svg.append("defs")
              .append("pattern")
              .attr("id", patternId)
              .attr("patternUnits", "objectBoundingBox")
              .attr("width", 1)
              .attr("height", 1)
              .append("image")
              .attr("xlink:href", d.identifier[0])
              .attr("width", circleRadius * 2) 
              .attr("height", circleRadius * 2)
              .attr("preserveAspectRatio", "xMidYMid slice");
          } else {
            svg.select(`#${patternId} image`)
              .attr("width", circleRadius * 2)
              .attr("height", circleRadius * 2);
          }
          return `url(#${patternId})`;
        });
      }
    };
    
    svg.call(zoom);
  
  }, []);
  

  const sendParams = (params) => {
    updateChart(actualCluster, params)
  }

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);

    updateChart("kmeans", {}, hexagonSelected);

    return () => {
      svg.selectAll("*").remove();
    };
  }, [updateChart, hexagonSelected]);


  const images = [
    "https://picsum.photos/id/1018/1000/600/",
    "https://picsum.photos/id/1015/250/150/",
    "https://picsum.photos/id/1019/1000/600/"
  ];

  return (
    <div className="main-group">
      <div className="svg-group">
        {loading && 
        <div className='loading-group'>
          <p>Working on it...</p>
          <PuffLoader size={200} />
        </div>
        }
        <svg ref={svgRef}></svg>
      </div>
      {showSidebar ?
        <Sidebar cluster={actualCluster} sendParams={sendParams} updateChart={updateChart} bestK={bestK} jsonInfo={jsonInfo}/> 
      :
        <FloatingBox jsonInfo={jsonInfo}/>
      }
    </div>
  );
};

export default Species;