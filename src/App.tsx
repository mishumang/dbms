import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Signup from './pages/Signup';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import Predictions from './pages/Predictions';
import Login from './pages/Login';
function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/signup" element={< Signup  />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App