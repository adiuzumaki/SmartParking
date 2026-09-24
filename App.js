import React, { useState, useEffect } from "react";
import MapComponent from "./components/MapComponent";
import SearchBar from "./components/SearchBar";
import FilterComponent from "./components/FilterComponent";
import ErrorMessage from "./components/ErrorMessage";
import Login from "./components/Login";
import "./index.css";

function App() {
  const [filters, setFilters] = useState({ radius: 5, type: "all", availability: "all" });
  const [mapCenter, setMapCenter] = useState({ lat: -37.7870, lng: 175.2790, zoom: 15 });
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");

  // Persist token
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  // Persist dark mode
  useEffect(() => {
    document.body.className = darkMode ? "dark" : "";
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  if (!token) return <Login setToken={setToken} setError={setError} />;

  const logout = () => setToken(null);

  return (
    <div className={`app-root ${darkMode ? "dark" : ""}`}>
      <header className="header">
        <h1 className="title">Smart Parking Availability</h1>
        <div className="controls">
          <SearchBar setError={setError} setCenter={setMapCenter} />
          <FilterComponent
            onFilter={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
          />
          <button className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
          </button>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="main">
        {error && <ErrorMessage message={error} />}
        <MapComponent
          filters={filters}
          setError={setError}
          token={token}
          center={mapCenter}
          setCenter={setMapCenter}
        />
      </main>

      <footer className="footer">
        <small>Smart Parking — {darkMode ? "Dark" : "Light"} Mode</small>
      </footer>
    </div>
  );
}

export default App;
