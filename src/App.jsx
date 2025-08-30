import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./screens/Landing";
/* import Building from "./screens/Building";
import Template from "./screens/Template"; */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
       {/*  <Route path="/build" element={<Building />} />
        <Route path="/templ" element={<Template />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
