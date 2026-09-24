import React, { useState, useEffect, useRef } from "react";

const FilterComponent = ({ onFilter = () => {} }) => {
  const [type, setType] = useState("");
  const [availability, setAvailability] = useState("");
  const timer = useRef(null);

  // Debounce: apply filters 400ms after the last change
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      onFilter({ type: type || "all", availability: availability || "all" });
    }, 400);

    return () => clearTimeout(timer.current);
  }, [type, availability, onFilter]);

  return (
    <div className="flex space-x-2 mb-4">
      <select value={type} onChange={(e) => setType(e.target.value)} className="border p-1">
        <option value="">All Types</option>
        <option value="free">Free</option>
        <option value="paid">Paid</option>
        <option value="covered">Covered</option>
      </select>

      <select
        value={availability}
        onChange={(e) => setAvailability(e.target.value)}
        className="border p-1"
      >
        <option value="">All Status</option>
        <option value="available">Available</option>
        <option value="occupied">Occupied</option>
      </select>
    </div>
  );
};

export default FilterComponent;
