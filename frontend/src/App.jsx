// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import StatsPage from "./components/StatsPage";
import "./App.css";
import TargetCursor from "./components/TargetCursor.jsx";

function App() {
  return (
    <BrowserRouter>
      <TargetCursor
        targetSelector=".cursor-target"
        spinDuration={2}
        hideDefaultCursor={true}
        parallaxOn={true}
        hoverDuration={0.2}
      />

      <div className="app">
        <header className="header">
          <div className="container">
            <h1 className="logo">TinyLink</h1>
            <p className="tagline">Shorten URLs, Track Clicks</p>
          </div>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/code/:code" element={<StatsPage />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="container">
            <p>&copy; 2025 TinyLink BY VYOM TIWARI </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
