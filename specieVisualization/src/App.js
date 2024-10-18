import './App.css';
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavigationBar from './components/Navigationbar';
import Species from './pages/Species';
import Regions from './pages/Regions';

function App() {
  const [data, setData] = useState("");

  return (
    <>
      <BrowserRouter>
      { data != "" && <NavigationBar /> }
        <div className="app-container">
          <Routes>
            { data != "" && <Route path="/regions" element={<Regions data={data} setSharedData={setData}/>} />}
            <Route path="/" element={<Species setSharedData={setData} showSidebar = {true} />} />
            <Route path="*" element={<Species setSharedData={setData} showSidebar = {true}/>} />
          </Routes>
        </div>
      </BrowserRouter>
    </>
  );
}

export default App;
