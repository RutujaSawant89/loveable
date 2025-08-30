import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './screens/Landing'; // Adjust path as needed
import Building from './screens/Building'; // Adjust path as needed
import Template from './screens/Template'; // Adjust path as needed


function App() {
  return (
    <Router>
      <Routes>
         <Route path="/" element={<Landing />} /> 
      
        <Route path="/build" element={<Building />} />
        <Route path="/templ" element={<Template />} />
    
       
      </Routes>
    </Router>
  );
}

export default App;