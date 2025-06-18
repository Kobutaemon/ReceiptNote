import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Bicycle from "./pages/Bicycle.jsx";
import Shopping from "./pages/Shopping.jsx";
import Something from "./pages/Something.jsx";

function App() {
  return (
    <BrowserRouter>
      <Sidebar />
      <div className="bg-gray-100 h-screen">
        <header>
          <h1 className="text-3xl text-center pt-4 font-bold">ReceiptNote</h1>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bicycle" element={<Bicycle />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/something" element={<Something />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
