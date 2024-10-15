import '../styles/Mixed.css';
import React, { useEffect } from 'react';
import Map from '../components/Map.jsx';
import { useNavigate } from "react-router-dom";

const Regions = ( {data} ) => {
  const navigate = useNavigate();

  useEffect(() => {
    // console.log('data in regions: ', data)
    if (data=='') navigate("/")
  }, [data]);
  
  return (
    <div className="main-group">
      <div className="svg-group">
        <Map data={data}/>
      </div>
    </div>
  );
};

export default Regions;