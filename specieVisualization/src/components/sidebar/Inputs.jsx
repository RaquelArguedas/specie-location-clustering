import '../../styles/Inputs.css';
import React, { useEffect, useState, useCallback } from 'react';
import Slider from '@mui/material/Slider';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { MdKeyboardArrowDown, MdKeyboardArrowUp  } from "react-icons/md";

const Inputs = ({ cluster, sendParams, updateChart, bestK }) => {
  const [selectedJson, setSelectedJson] = useState({})
  const [params, setParams] = useState({})
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);

  const kmeansJson = {
    "n_clusters": {
      "type": "int",
      "default": 2,
      "min": 2,
      "max": 10,
      "step": 1
    },
    "init": {
      "type": "string",
      "default": "k-means++",
      "options": [
        "k-means++",
        "random"
      ]
    },
    "max_iter": {
      "type": "int",
      "default": 300,
      "min": 100,
      "max": 1000,
      "step": 100
    },
    "tol": {
      "type": "float",
      "default": 0.0001,
      "min": 0.000001,
      "max": 0.001,
      "step": 0.0001
    },
    "verbose": {
      "type": "int",
      "default": 0,
      "min": 0,
      "max": 10,
      "step": 1
    },
    "random_state": {
      "type": "int",
      "default": null,
      "min": 0,
      "max": 10000,
      "step": 500
    },
    "copy_x": {
      "type": "bool",
      "default": true,
      "options": [
        true,
        false
      ]
    },
    "algorithm": {
      "type": "string",
      "default": "lloyd",
      "options": [
        "lloyd",
        "elkan"
      ]
    }
  }
  

  const dbscanJson = {
    "eps": {
      "type": "float",
      "default": 0.5,
      "min": 0.1,
      "max": 1,
      "step": 0.1
    },
    "min_samples": {
      "type": "int",
      "default": 5,
      "min": 1,
      "max": 10,
      "step": 1
    },
    "algorithm": {
      "type": "string",
      "default": "auto",
      "options": [
        "auto",
        "ball_tree",
        "kd_tree",
        "brute"
      ]
    },
    "leaf_size": {
      "type": "int",
      "default": 30,
      "min": 10,
      "max": 100,
      "step": 10
    },
    "p": {
      "type": "float",
      "default": null,
      "min": 1,
      "max": 5,
      "step": 0.1
    },
    "n_jobs": {
      "type": "int",
      "default": null,
      "min": -1,
      "max": 16,
      "step": 2
    }
  }
  

  const hierarchicalJson = {
    "n_clusters": {
      "type": "int",
      "default": 2,
      "min": 2,
      "max": 10,
      "step": 1
    },
    "compute_full_tree": {
      "type": "string",
      "default": "auto",
      "options": [
        "auto",
        "true",
        "false"
      ]
    },
    "linkage": {
      "type": "string",
      "default": "ward",
      "options": [
        "ward",
        "complete",
        "average",
        "single"
      ]
    },
    "distance_threshold": {
      "type": "float",
      "default": null,
      "min": 0,
      "max": 10,
      "step": 0.1
    },
    "compute_distances": {
      "type": "bool",
      "default": false,
      "options": [
        true,
        false
      ]
    }
  }
  
  const handleChange = useCallback((event, key) => {
    const newValue = event.target.value;
    setParams(prevParams => ({
      ...prevParams,
      [key]: newValue
    }));
  }, []);

  const handleSendParams = useCallback(() => {
    sendParams(params);
  }, [cluster, params, sendParams]);

  useEffect(() => {
    let json;
    switch(cluster) {
      case "kmeans":
        json = kmeansJson;
        break;
      case "dbscan":
        json = dbscanJson;
        break;
      case "hierarquical":
        json = hierarchicalJson;
        break;
      default:
        console.error(`Unknown cluster type: ${cluster}`);
        setError(`Unknown cluster type: ${cluster}`);
        return;
    }
    
    setSelectedJson(json);
    const newParams = Object.keys(json).reduce((acc, key) => {
      acc[key] = json[key]['default'];
      return acc;
    }, {});
    setParams(newParams);
  }, [cluster]);

  useEffect(() => {
    if (cluster=='kmeans' || cluster=='hierarquical'){
      setSelectedJson(prevJson => {
        return {
          ...prevJson,
          n_clusters: prevJson.n_clusters ? {
            ...prevJson.n_clusters,
            default: bestK,
          } : undefined,
        };
      });
  
      setParams(prevParams => ({
        ...prevParams,
        n_clusters: bestK,
      }));
    }
  }, [bestK]);

  if (Object.keys(selectedJson).length === 0) {
    return <div>Loading parameters...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="inputs-group">
      <h2>Clustering config
        <button className='visibility-btn' onClick={() => setVisible(!visible)}> 
          {visible ? <MdKeyboardArrowDown /> : <MdKeyboardArrowUp  />}
        </button>
      </h2>
      {visible &&
        <div className="inputs-group inputs-button">
          <div className="button-group">
            <button onClick={() => updateChart('kmeans')}>Kmeans</button>
            <button onClick={() => updateChart('dbscan')}>DBSCAN</button>
            <button onClick={() => updateChart('hierarquical')}>Hierarchical</button>
          </div>
          <h3>Hyperparameters</h3>
          {Object.entries(selectedJson).map(([key, value]) => {
            if (!value) {
              console.error(`Invalid parameter: ${key}`);
              return null;
            }
            return (
              <div key={key} className='inputs-subgroup'>
                <p>{key}</p>
                {(value.type === 'int' || value.type === 'float') ? (
                  <Slider 
                    value={params[key] ?? value.default}
                    valueLabelDisplay="auto"
                    sx={{
                      color: '#595959',  
                      width: '60%', 
                      margin: '5px',
                      marginRight: '15px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignSelf: 'center'
                    }}
                    onChange={(event) => handleChange(event, key)}
                    marks
                    step={value.step}
                    min={value.min}
                    max={value.max}
                  />
                ) : (
                  <Select
                    value={params[key] ?? value.default}
                    onChange={(event) => handleChange(event, key)}  
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                    sx={{
                      width: '60%', 
                      height:'35px',
                      margin: '5px',
                      marginRight: '15px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignSelf: 'center',
                      fontFamily:'Poppins'
                    }}
                  >
                    {value.options.map((op) =>
                      <MenuItem key={op} value={op}>{op.toString()}</MenuItem> 
                    )}
                  </Select>
                )}
              </div>
            );
          })}
          <button className='inputs-large-button' onClick={handleSendParams}>Apply</button>
        </div>
      }
    </div>
  );
};

export default Inputs;