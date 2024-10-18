import React, { useRef, useEffect } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import '../styles/Map.css';
import * as d3 from 'd3';
import { cellToBoundary } from "h3-js";

export default function Map({ data, setHexagonSelected, specieSelected }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const center = { lat: 50.08804, lng: 24.42076 }; // Praga
  const zoom = 3;
  let lastHexagon = ""; 
  maptilersdk.config.apiKey = 'ioRj9d7EC4vDuVYhP7MH';

  const colorScale = d3.scaleOrdinal()
    .domain([-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    .range(['firebrick', 'mediumblue', 'lawngreen', 'darkorange', 'mediumvioletred', 'darkturquoise', 'lightcoral', 'gold', 'rebeccapurple', 'peru', 'darkslategray']);

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
      const cluster = getCluster(i);
      const color = d3.color(colorScale(cluster)).rgb();
      color.opacity = 0.3;
      hexagons[i] = { "id": i, 
                      "cords": hexagonCoords, 
                      "cluster": cluster, 
                      "color": `rgba(${color.r}, ${color.g}, ${color.b}, ${color.opacity})`
                    };

      cont++;
      if (cont === 24) break;
    }
    return hexagons;
  };

  useEffect(() => {
    if (map.current) return; 

    
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
        const hexagonColor = hexagon[1].color;
        const sourceId = `hexagon-source-${index}`;
        const layerId = `hexagon-layer-${index}`;
        const fillLayerId = `hexagon-fill-layer-${index}`;

        map.current.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { hexagonId: hexagon[1].id, cluster: hexagon[1].cluster },
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
            'line-color': hexagonColor,
          },
        });

        map.current.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          layout: {},
          paint: {
            'fill-color': hexagonColor,
            'fill-outline-color': 'rgba(0, 0, 0, 0)',
          },
        });

        map.current.on('click', fillLayerId, (e) => {
          const clickedFeature = e.features[0];
          const hexagonId = clickedFeature.properties.hexagonId;
          const cluster = clickedFeature.properties.cluster;

          lastHexagon = hexagonId === lastHexagon ? "" : hexagonId;

          if (lastHexagon === "") {
            Object.entries(hexagons).forEach(([hexId, hexData]) => {
              const originalColor = hexData.color;
              const currentFillLayerId = `hexagon-fill-layer-${Object.keys(hexagons).indexOf(hexId)}`;
              map.current.setPaintProperty(currentFillLayerId, 'fill-color', originalColor);
            });
          } else {
            Object.entries(hexagons).forEach(([hexId, hexData]) => {
              const currentFillLayerId = `hexagon-fill-layer-${Object.keys(hexagons).indexOf(hexId)}`;
              if (hexId === lastHexagon) {
                map.current.setPaintProperty(currentFillLayerId, 'fill-color', 'rgba(74, 74, 74, 0.3)');
              } else {
                map.current.setPaintProperty(currentFillLayerId, 'fill-color', hexData.color);
              }
            });
          }

          setHexagonSelected(lastHexagon); 
          console.log(`Hexágono clicado: ${hexagonId}, Cluster: ${cluster}`);
        });
      });
    });
  }, [center.lng, center.lat, zoom, data]);

  useEffect(() => {
    console.log('specieSelected from regions', specieSelected);
    
    if (specieSelected === '') {
      Object.entries(hexagons).forEach(([hexagonId, hexagonData]) => {
        const fillLayerId = `hexagon-fill-layer-${Object.keys(hexagons).indexOf(hexagonId)}`;
        map.current.setPaintProperty(fillLayerId, 'fill-color', hexagonData.color); 
      });
      
      return;
    }
  
    specieSelected.forEach((hexagonId) => {
      const hexagon = Object.values(hexagons).find(h => h.id === hexagonId);
      
      if (hexagon) {
        const fillLayerId = `hexagon-fill-layer-${Object.keys(hexagons).indexOf(hexagonId)}`;
        map.current.setPaintProperty(fillLayerId, 'fill-color', 'rgba(255, 0, 0, 0.5)');
      }
    });
  }, [specieSelected, hexagons]);
  

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
    </div>
  );
}
