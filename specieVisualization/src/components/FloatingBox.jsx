import '../styles/FloatingBox.css';
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import Info from './sidebar/Info';

const FloatingBox = ({ jsonInfo }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (jsonInfo!=null) setVisible(true);
    console.log('jsonInfo', jsonInfo)
  }, [jsonInfo]);
  
  return (
    <Dialog  modal={false} visible={visible} position={'left'} onHide={() => {if (!visible) return; setVisible(false); }}>
      {jsonInfo && <Info jsonInfo={jsonInfo}/>}
    </Dialog>
  );
};

export default FloatingBox;