import React, { useEffect, useRef, useState, useCallback } from 'react';
import Inputs from './sidebar/Inputs';
import Info from './sidebar/Info';

const Sidebar = ({ cluster, sendParams, bestK, jsonInfo }) => {

  return (
    <div className="sidebar">
      <Inputs cluster={cluster} sendParams={sendParams} bestK={bestK} />
      <Info jsonInfo={jsonInfo}/>
    </div>
  );
};

export default Sidebar;