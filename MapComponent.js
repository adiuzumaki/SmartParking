// frontend/src/components/MapComponent.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  useLoadScript,
  MarkerClustererF,
} from "@react-google-maps/api";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:5000";
const GOOGLE_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

export default function MapComponent({ filters = {}, setError, token, center, setCenter }) {
  const [spots, setSpots] = useState([]);
  const [selected, setSelected] = useState(null);
  const mapRef = useRef();
  const lastBoundsRef = useRef(null);
  const mockSpotsRef = useRef([]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_KEY,
    libraries: ["places"],
  });

  // Generate mock spots within map bounds
  const generateMockSpotsInBounds = useCallback((bounds, count = 300) => {
    const mock = [];
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    for (let i = 0; i < count; i++) {
      const lat = sw.lat() + Math.random() * (ne.lat() - sw.lat());
      const lng = sw.lng() + Math.random() * (ne.lng() - sw.lng());
      mock.push({
        id: `mock-${i}`,
        name: `Spot ${i + 1}`,
        latitude: lat,
        longitude: lng,
        type: ["free", "paid", "covered"][Math.floor(Math.random() * 3)],
        availability: ["available", "occupied"][Math.floor(Math.random() * 2)],
      });
    }
    return mock;
  }, []);

  // Filter spots dynamically
  const applyFilters = useCallback(
    (spotList) =>
      spotList.filter((spot) => {
        const typeMatch = !filters.type || filters.type === "all" || spot.type === filters.type;
        const availMatch = !filters.availability || filters.availability === "all" || spot.availability === filters.availability;
        return typeMatch && availMatch;
      }),
    [filters]
  );

  // Fetch backend + mock spots
  const fetchSpots = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      let backendSpots = [];

      if (token) {
        const qs = new URLSearchParams({
          lat: center.lat,
          lng: center.lng,
          radius: filters.radius || 5,
          type: filters.type || "all",
        });

        const res = await fetch(`${API_BASE}/get_parking_spots?${qs.toString()}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load spots");
        backendSpots = data;
      }

      const bounds = mapRef.current.getBounds();
      if (!bounds) return;

      const boundsChanged = !lastBoundsRef.current || !lastBoundsRef.current.equals(bounds);
      let allSpots = backendSpots;

      if (boundsChanged) {
        const needed = Math.max(300 - backendSpots.length, 0);
        const mockSpots = generateMockSpotsInBounds(bounds, needed);
        mockSpotsRef.current = [...backendSpots, ...mockSpots];
        allSpots = mockSpotsRef.current;
        lastBoundsRef.current = bounds;
      } else {
        allSpots = mockSpotsRef.current;
      }

      setSpots(applyFilters(allSpots));
    } catch (err) {
      console.error(err);
      setError(err.message);
      setSpots(applyFilters(mockSpotsRef.current));
    }
  }, [center, filters, token, setError, generateMockSpotsInBounds, applyFilters]);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  // Track user location
  const [userLocation, setUserLocation] = useState(null);
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation error:", err)
      );
    }
  }, []);

  const handleMapClick = () => setSelected(null);
  const handleMarkerClick = (spot) => setSelected(spot);
  const onMapLoad = (map) => (mapRef.current = map);

  const onDragEnd = () => {
    if (mapRef.current) {
      const c = mapRef.current.getCenter();
      setCenter({ lat: c.lat(), lng: c.lng(), zoom: mapRef.current.getZoom() });
    }
  };

  if (loadError) return <p className="map-error">Error loading map</p>;
  if (!isLoaded) return <p className="map-loading">Loading map...</p>;

  return (
    <div className="map-wrapper">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "70vh" }}
        zoom={center.zoom || 15}
        center={{ lat: center.lat, lng: center.lng }}
        onClick={handleMapClick}
        onLoad={onMapLoad}
        onDragEnd={onDragEnd}
        options={{
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
        }}
      >
        {/* User location marker */}
        {userLocation && (
          <MarkerF
            position={userLocation}
            icon={{
              url: `http://maps.google.com/mapfiles/ms/icons/blue-dot.png`,
            }}
          />
        )}

        {/* Parking spot markers */}
        <MarkerClustererF
          options={{
            imagePath:
              "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
            averageCenter: true,
            minimumClusterSize: 5,
          }}
        >
          {(clusterer) =>
            spots.map((spot) => (
              <MarkerF
                key={spot.id}
                position={{ lat: spot.latitude, lng: spot.longitude }}
                clusterer={clusterer}
                onClick={() => handleMarkerClick(spot)}
                animation={window.google.maps.Animation.DROP}
                icon={{
                  url:
                    spot.availability === "available"
                      ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                      : "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                }}
              />
            ))
          }
        </MarkerClustererF>

        {/* InfoWindow */}
        {selected && (
          <InfoWindowF
            position={{ lat: selected.latitude, lng: selected.longitude }}
            onCloseClick={() => setSelected(null)}
          >
            <div>
              <h3>{selected.name}</h3>
              <p>Type: {selected.type}</p>
              <p>
                Status:{" "}
                <b style={{ color: selected.availability === "available" ? "green" : "red" }}>
                  {selected.availability}
                </b>
              </p>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
}
