import React, { useEffect, useRef, useState, useCallback } from 'react';
import Inputs from './sidebar/Inputs';
import Info from './sidebar/Info';
import { GoSidebarCollapse, GoSidebarExpand  } from "react-icons/go";

const Sidebar = ({ cluster, sendParams, updateChart, bestK, jsonInfo }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (jsonInfo!=null) setVisible(true);
  }, [jsonInfo]);

  return (
    <div className="sidebar-container">
      <button className={`sidebar-btn ${visible ? 'sidebar-btn-visible' : 'sidebar-btn-hidden'}`} onClick={() => setVisible(!visible)}>
        {visible ? <GoSidebarExpand /> : <GoSidebarCollapse />}
      </button>
      <div className={`sidebar ${visible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
      {jsonInfo && <Info jsonInfo={jsonInfo}/>}
        <Inputs cluster={cluster} sendParams={sendParams} updateChart={updateChart} bestK={bestK} />
      </div>
    </div>
  );
};

export default Sidebar;