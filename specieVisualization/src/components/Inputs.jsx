import React, { useEffect, useRef, useState, useCallback } from 'react';
import Slider from '@mui/material/Slider';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

const Inputs = ({ cluster, sendParams, bestK }) => {
  const [selectedJson, setSelectedJson] = useState({})
  const [params, setParams] = useState({})

  const kmeansJson = {
    "n_clusters": {
      "type": "int",
      "default": 8,
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
      "default": 8,
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
  
  const handleChange = (event, key) => {
    const newValue = event.target.value;
    setParams(prevParams => ({
      ...prevParams,
      [key]: newValue
    }));
  };

  const handleSendParams = () => {
    const paramsName = 'params'+cluster
    localStorage.setItem(paramsName, JSON.stringify(params));
    sendParams(params);  
  };

  useEffect(() => {
    const paramsName = 'params'+cluster
    const json = cluster == "kmeans" ? kmeansJson : (cluster == "dbscan" ? dbscanJson : hierarchicalJson)
    setSelectedJson(json)

    let savedParams = JSON.parse(localStorage.getItem(paramsName));
    const newParams = Object.keys(json).reduce((acc, key) => {
      acc[key] = json[key]['default'];
      return acc;
    }, {});  
    setParams(savedParams === null ? newParams : savedParams)
  }, [cluster]);

  useEffect(() => {
    setSelectedJson(prevJson => ({
      ...prevJson,
      n_clusters: {
        ...prevJson.n_clusters,
        default: bestK,
      },
    }));

    setParams(prevParams => ({
      ...prevParams,
      n_clusters: bestK, 
    }));
  }, [bestK]);

  
  return (
    <div className="inputs-group">
      <h3>Hiperparameters</h3>
      {Object.keys(selectedJson).map((key) => (
        <div className='inputs-subgroup'>
          <p>{key}</p>
          {(selectedJson[key]['type'] == 'int' || selectedJson[key]['type'] == 'float') ? (
            <Slider 
              value={params[key]}
              valueLabelDisplay="auto"
              sx={{color: '#595959',  
                width: '60%', 
                margin: '5px',
                marginRight: '15px',
                display: 'flex',
                justifyContent: 'center',
                alignSelf: 'center'}}
              onChange={(event) => handleChange(event, key)}
              marks
              step={selectedJson[key]['step']}
              min={selectedJson[key]['min']}
              max={selectedJson[key]['max']}
              key={key}
            />
          ) : (
            <Select
              value={params[key]}
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
              {selectedJson[key]['options'].map((op) =>
                <MenuItem key={op} value={op}>{op.toString()}</MenuItem> 
              )}
            </Select>
          )}
        </div>
      ))}
      <button className='inputs-button' onClick={handleSendParams}>Apply</button>
    </div>
  );
};

export default Inputs;