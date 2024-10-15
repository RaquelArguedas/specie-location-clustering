import React, { useRef, useEffect, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import '../styles/Map.css';
import * as d3 from 'd3';
import { cellToBoundary } from "h3-js";

export default function Map({ data }) {
  // const [hexagons, setHexagons] = useState({})
  const mapContainer = useRef(null);
  const map = useRef(null);
  const center = { lat: 50.08804, lng: 14.42076 }; // Praga
  const zoom = 3;
  maptilersdk.config.apiKey = 'ioRj9d7EC4vDuVYhP7MH';

  const getCluster = (hexagon) => {
    const clusterCount = {};
    let maxCluster = null;
    let maxValue = -Infinity;
  
    for (const item of data) {
      const cluster = item.cluster;
      const count = (clusterCount[cluster] || 0) + item[hexagon];
      clusterCount[cluster] = count;
  
      if (count > maxValue) {
        maxValue = count;
        maxCluster = cluster;
      }
    }
    return maxCluster;
  };
  
  const getHexagons = () => {
    let hexagons = {};
    let cont = 0;

    for (let i in data[0]) {
      let hexagonCoords = cellToBoundary(i);
      hexagonCoords = hexagonCoords.map(([lat, lng]) => [lng, lat]); 
      hexagons[i] = {"cords" : hexagonCoords, "cluster" : getCluster(i), "color" : "white"};
      // TODO get the color and color de hexagon

      cont++;
      if (cont === 24) break; 
    }
    return hexagons;
  };

  useEffect(() => {
    // if (map.current) return;

    let hexagons = getHexagons();
    console.log('hexagons', hexagons);

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.DATAVIZ.LIGHT,
      center: [center.lng, center.lat],
      zoom: zoom,
    });

    map.current.on('load', () => {
      Object.entries(hexagons).forEach((hexagon, index) => {
        const hexagonCords = hexagon[1].cords;
        const sourceId = `hexagon-source-${index}`; 
        const layerId = `hexagon-layer-${index}`;
        const fillLayerId = `hexagon-fill-layer-${index}`; 
      
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [hexagonCords.concat([hexagonCords[0]])], 
            },
          },
        });
      
        map.current.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-width': 3,
          },
        });
    
        map.current.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          layout: {},
          paint: {
            'fill-color': 'rgba(0, 0, 0, 0.07)', 
            'fill-outline-color': 'rgba(0, 0, 0, 0.5)', 
          },
        });
      });
    });
    
  }, [center.lng, center.lat, zoom, data]);

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
    </div>
  );
}
