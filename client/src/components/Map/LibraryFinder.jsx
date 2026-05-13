import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../context/AuthContext';
import { librariesAPI, recommendationsAPI } from '../../services/api';
import { findOptimalRoute } from '../../services/pathfinding';
import { FiMapPin, FiNavigation, FiLoader, FiX, FiInfo } from 'react-icons/fi';
import Sidebar from '../Student/Sidebar';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const studentIcon = L.divIcon({
  html: `<div class="student-marker"><div class="pulse-ring"></div><div class="pulse-core"></div></div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const libraryIcon = (type) => L.divIcon({
  html: `<div class="lib-marker lib-marker-${type}">📚</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const targetIcon = L.divIcon({
  html: `<div class="lib-marker lib-marker-target">🎯</div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

const LibraryFinder = () => {
  const { user } = useAuth();
  const [userPos, setUserPos] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [route, setRoute] = useState(null);
  const [selectedLib, setSelectedLib] = useState(null);
  const [filteredType, setFilteredType] = useState(null); // 'library' | 'bookstore' or null
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [showDijkstra, setShowDijkstra] = useState(false);
  const watchRef = useRef(null);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by your browser.');
      // Fallback to stored location
      if (user?.location) {
        setUserPos([user.location.lat, user.location.lng]);
      }
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setGeoError('');
      },
      (err) => {
        setGeoError('Could not get your location. Using default.');
        // Use stored or Delhi default
        const lat = user?.location?.lat || 28.6139;
        const lng = user?.location?.lng || 77.2090;
        setUserPos([lat, lng]);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [user]);

  // Fetch libraries & recommendations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [libRes, recRes] = await Promise.all([
          librariesAPI.getAll(),
          user?._id ? recommendationsAPI.getByStudent(user._id) : Promise.resolve({ data: {} })
        ]);
        setLibraries(libRes.data.libraries || []);
        const weakCodes = recRes.data?.weakSubjects?.map(w => w.subjectCode) || [];
        setRecommendations(weakCodes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleGetDirections = useCallback(async (lib) => {
    if (!userPos) return;
    setRouteLoading(true);
    setSelectedLib(lib);
    // when user requests directions, show only the single selected location
    setShowOnlySelected(true);

    try {
      const result = await findOptimalRoute(userPos[0], userPos[1], libraries, lib._id);
      setRoute(result);
    } catch (err) {
      console.error('Route calc error:', err);
    } finally {
      setRouteLoading(false);
    }
  }, [userPos, libraries]);

  const clearRoute = () => {
    setRoute(null);
    setSelectedLib(null);
    setFilteredType(null);
    setShowOnlySelected(false);
  };

  const clearFilter = () => {
    setFilteredType(null);
    setShowOnlySelected(false);
  };

  const defaultCenter = userPos || [28.6139, 77.2090];

  return (
    <div className="dashboard-layout">
      <Sidebar role="student" />
      <div className="main-content map-layout">
        <div className="page-header">
          <div>
            <h1 className="page-title">Library Finder</h1>
            <p className="page-subtitle">Find nearby libraries with smart navigation</p>
          </div>
          {route && (
            <button className="btn btn-outline" onClick={clearRoute} id="clear-route-btn">
              <FiX size={16} /> Clear Route
            </button>
          )}
          {(filteredType || showOnlySelected) && (
            <button className="btn btn-outline" onClick={clearFilter} style={{ marginLeft: '0.5rem' }} id="clear-filter-btn">
              <FiX size={16} /> Show All
            </button>
          )}
        </div>

        {geoError && (
          <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
            <FiInfo size={16} /> {geoError}
          </div>
        )}

        <div className="map-container-wrap">
          {/* Route Info Panel */}
          {route && (
            <div className="route-panel" id="route-info-panel">
              <div className="route-panel-header">
                <h3>Route to {selectedLib?.name}</h3>
                <button onClick={clearRoute}><FiX /></button>
              </div>
              <div className="route-stats">
                <div className="route-stat">
                  <FiMapPin size={18} />
                  <div>
                    <span className="route-stat-val">{route.totalDistance} km</span>
                    <span className="route-stat-label">Driving Distance</span>
                  </div>
                </div>
                <div className="route-stat">
                  <span className="walk-icon">🚶</span>
                  <div>
                    <span className="route-stat-val">{route.walkingDistance} km</span>
                    <span className="route-stat-label">Walking Distance</span>
                  </div>
                </div>
                <div className="route-stat">
                  <span className="car-icon">🚗</span>
                  <div>
                    <span className="route-stat-val">{route.drivingTime} min</span>
                    <span className="route-stat-label">Driving Time</span>
                  </div>
                </div>
                <div className="route-stat">
                  <span className="walk-icon">🚶</span>
                  <div>
                    <span className="route-stat-val">{route.walkingTime} min</span>
                    <span className="route-stat-label">Walking Time</span>
                  </div>
                </div>
              </div>
              <div className="algo-info">
                <div className="algo-badge astar">Road Navigation (Primary)</div>
                <button
                  className={`algo-toggle ${showDijkstra ? 'active' : ''}`}
                  onClick={() => setShowDijkstra(!showDijkstra)}
                  id="toggle-dijkstra-btn"
                >
                  {showDijkstra ? 'Hide' : 'Show'} Straight-Line Comparison
                </button>
              </div>
            </div>
          )}

          {/* Map */}
          {loading ? (
            <div className="map-loading">
              <FiLoader size={32} className="spin-anim" />
              <p>Loading map...</p>
            </div>
          ) : (
            <MapContainer
              center={defaultCenter}
              zoom={13}
              className="leaflet-map"
              id="main-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={userPos} />

              {/* Student Position */}
              {userPos && (
                <>
                  <Marker position={userPos} icon={studentIcon} id="student-marker">
                    <Popup>
                      <div className="map-popup">
                        <strong>📍 Your Location</strong>
                        <p>{user?.name}</p>
                        <small>{userPos[0].toFixed(4)}, {userPos[1].toFixed(4)}</small>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={userPos}
                    radius={10000}
                    pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.04, weight: 1, dashArray: '8,4' }}
                  />
                </>
              )}

              {/* Libraries */}
              {libraries.filter(lib => {
                if (showOnlySelected) return selectedLib && lib._id === selectedLib._id;
                if (filteredType) return lib.type === filteredType || (selectedLib && lib._id === selectedLib._id);
                return true;
              }).map(lib => {
                const isSelected = selectedLib?._id === lib._id;
                const availableRec = lib.books?.filter(b => recommendations.includes(b.subjectCode)) || [];
                return (
                  <Marker
                    key={lib._id}
                    position={[lib.location.lat, lib.location.lng]}
                    icon={isSelected ? targetIcon : libraryIcon(lib.type)}
                    id={`lib-marker-${lib._id}`}
                    eventHandlers={{
                      click: () => {
                        // when marker clicked, set this as selected and show only this marker
                        setSelectedLib(lib);
                        setShowOnlySelected(true);
                      }
                    }}
                  >
                    <Popup minWidth={260} maxWidth={300}>
                      <div className="map-popup lib-popup">
                        <div className="popup-type">{lib.type === 'library' ? '📚 Library' : '🏪 Bookstore'}</div>
                        <h4 className="popup-name">{lib.name}</h4>
                        <p className="popup-address">📍 {lib.address}</p>
                        <div className="popup-details">
                          <span>⏰ {lib.openingHours}</span>
                          {lib.contactNumber && <span>📞 {lib.contactNumber}</span>}
                          <span>⭐ {lib.rating}</span>
                        </div>

                        {availableRec.length > 0 && (
                          <div className="popup-rec-books">
                            <strong>📖 Recommended books here:</strong>
                            {availableRec.slice(0, 2).map(b => (
                              <div key={b._id} className="popup-book">{b.title}</div>
                            ))}
                          </div>
                        )}

                        <button
                          className="popup-directions-btn"
                          onClick={() => handleGetDirections(lib)}
                          disabled={routeLoading}
                          id={`directions-btn-${lib._id}`}
                        >
                          {routeLoading ? '⏳ Calculating...' : '🗺️ Get Directions (A*)'}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Route Polylines */}
              {route && (
                <>
                  <Polyline
                    positions={route.routeCoords || route.aStarCoords}
                    pathOptions={{ color: '#2563EB', weight: 5, opacity: 0.9 }}
                    id="astar-route"
                  />
                  {showDijkstra && (
                    <Polyline
                      positions={route.straightCoords || route.dijkstraCoords}
                      pathOptions={{ color: '#D97706', weight: 4, opacity: 0.7, dashArray: '10,8' }}
                      id="dijkstra-route"
                    />
                  )}
                </>
              )}
            </MapContainer>
          )}
        </div>

        {/* Library Cards List */}
        <div className="libraries-list">
          <h2 className="list-title">Nearby Libraries ({libraries.length})</h2>
          <div className="lib-cards-grid">
            {libraries.filter(lib => {
              if (showOnlySelected) return selectedLib && lib._id === selectedLib._id;
              if (filteredType) return lib.type === filteredType || (selectedLib && lib._id === selectedLib._id);
              return true;
            }).map(lib => {
              const dist = userPos
                ? ((Math.sqrt(
                    (lib.location.lat - userPos[0]) ** 2 +
                    (lib.location.lng - userPos[1]) ** 2
                  ) * 111).toFixed(1))
                : '?';
              return (
                <div key={lib._id} className={`lib-card ${selectedLib?._id === lib._id ? 'lib-card-active' : ''}`}
                  id={`lib-list-card-${lib._id}`}>
                  <div className="lib-card-icon">
                    {lib.type === 'library' ? '📚' : '🏪'}
                  </div>
                  <div className="lib-card-info">
                    <h3>{lib.name}</h3>
                    <p className="lib-type">{lib.type}</p>
                    <p className="lib-hours">⏰ {lib.openingHours}</p>
                    <div className="lib-meta">
                      <span>📍 ~{dist} km</span>
                      <span>⭐ {lib.rating}</span>
                      <span>📚 {lib.books?.length || 0} books</span>
                    </div>
                  </div>
                  <button
                    className="lib-nav-btn"
                    onClick={() => handleGetDirections(lib)}
                    id={`nav-btn-${lib._id}`}
                  >
                    <FiNavigation size={16} />
                    Navigate
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryFinder;
