import '../styles/Regions.css';
import React, { useEffect, useState } from 'react';
import Map from '../components/Map.jsx';
import Species from './Species';
import { useNavigate } from "react-router-dom";

const Regions = ({ data, setSharedData }) => {
  const navigate = useNavigate();
  const [hexagonSelected, setHexagonSelected] = useState("");
  const [specieSelected, setSpecieSelected] = useState("");

  useEffect(() => {
    if (data === '') navigate("/");
  }, [data, navigate]);

  return (
    <div className="regions">
      <div className="panel">
        <Species setSharedData={setSharedData}  showSidebar = {false} hexagonSelected={hexagonSelected} setSpecieSelected={setSpecieSelected}/>
      </div>
      <div className="panel">
        <Map data={data} hexagonSelected={hexagonSelected} setHexagonSelected={setHexagonSelected} specieSelected={specieSelected} />
      </div>
    </div>
  );
};

export default Regions;
