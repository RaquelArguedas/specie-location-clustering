import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavigationBar from './components/NavigationBar';
import Species from './pages/Species';
import Regions from './pages/Regions';
import Mixed from './pages/Mixed';

function App() {
  return (
    <>
      <NavigationBar />
      <div className="app-container">
      <BrowserRouter>
        <Routes>
          <Route path="/regions" element={<Regions />}/>
          <Route path="/mixed" element={<Mixed />}/>
          <Route path="/" element={<Species />}/>
          <Route path="*" element={<Species />} />
        </Routes>
      </BrowserRouter>
    </div>
    </>
  );
}

export default App;
