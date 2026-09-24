import React, { useState, useEffect, useRef } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:5000";
const API_TOKEN = process.env.REACT_APP_API_TOKEN || "mysecrettoken123";

export default function SearchBar({ setError, setCenter }) {
  const [input, setInput] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [debouncedInput, setDebouncedInput] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const timer = useRef(null);
  const listRef = useRef(null);

  // Debounce typing
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedInput(input), 300);
    return () => clearTimeout(timer.current);
  }, [input]);

  // Fetch predictions
  useEffect(() => {
    if (!debouncedInput) {
      setPredictions([]);
      return;
    }

    const fetchPredictions = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/proxy/place/autocomplete?input=${encodeURIComponent(debouncedInput)}`,
          { headers: { Authorization: `Bearer ${API_TOKEN}` } }
        );
        if (!res.ok) throw new Error("Autocomplete failed");
        const data = await res.json();
        setPredictions(data.predictions || []);
        setHighlightIndex(-1); // Reset highlight
      } catch (err) {
        console.error(err);
        setError && setError("Autocomplete error");
      }
    };

    fetchPredictions();
  }, [debouncedInput, setError]);

  const onSelectPrediction = async (pred) => {
    setInput(pred.description);
    setPredictions([]);
    setHighlightIndex(-1);

    try {
      const res = await fetch(`${API_BASE}/proxy/place/details?place_id=${pred.place_id}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      });
      if (!res.ok) throw new Error("Place details failed");
      const data = await res.json();
      const loc = data.result?.geometry?.location;
      if (loc && setCenter) setCenter({ lat: loc.lat, lng: loc.lng, zoom: 16 });
    } catch (err) {
      console.error(err);
      setError && setError("Place details error");
    }
  };

  const handleKeyDown = (e) => {
    if (!predictions.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % predictions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + predictions.length) % predictions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < predictions.length) {
        onSelectPrediction(predictions[highlightIndex]);
      }
    }
  };

  return (
    <div className="searchbar" style={{ position: "relative", width: "300px" }}>
      <input
        type="search"
        placeholder="Search address or place..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="search-input"
        style={{ width: "100%", padding: "6px 10px" }}
      />

      {predictions.length > 0 && (
        <ul
          ref={listRef}
          className="predictions-list"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: "200px",
            overflowY: "auto",
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            zIndex: 1000,
            margin: 0,
            padding: 0,
            listStyle: "none",
          }}
        >
          {predictions.map((p, idx) => (
            <li
              key={p.place_id}
              onClick={() => onSelectPrediction(p)}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                padding: "8px 10px",
                cursor: "pointer",
                backgroundColor: highlightIndex === idx ? "#e0f0ff" : "white",
              }}
            >
              {p.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
