import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Truck,
  Calendar,
  PlusCircle,
  X,
  Loader2,
  CheckCircle,
  MapPin,
  DollarSign,
  Car,
  Edit,
  Trash2,
  Route,
  Fuel,
  Gauge,
  Settings,
  Navigation,
  ExternalLink,
  Search,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// Clean color palette
const Colors = {
  cardBg: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  borderColor: '#E5E7EB',
  shadow: '0 4px 12px rgba(0,0,0,0.05)',
  accentBlue: '#1e293b',
  dangerRed: '#EF4444',
  successGreen: '#10B981',
  buttonBg: '#2563EB',
  buttonHover: '#1D4ED8',
  progressBg: '#F3F4F6',
  hoverGray: '#F9FAFB',
};

// TomTom API Configuration (keep as backup)
const TOMTOM_API_KEY = 'vrEBolWtMhzwL9icvdOoNQlHbghvBE1F';
const API_BASE_URL = 'http://localhost:5000/api/v1/restpoint';

// Free Routing APIs
const OSRM_API = 'https://router.project-osrm.org/route/v1/driving';
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

// MapLibre Configuration
const MAP_CONFIG = {
  // Free OpenStreetMap-based styles
  styles: {
    standard: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    voyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  },
  defaultCenter: [36.8219, -1.2921], // [lng, lat] for MapLibre (Note: reverse order!)
  defaultZoom: 13,
};

const DEFAULT_MORTUARY = {
  lat: -1.2921,
  lon: 36.8219,
  address: 'LEE FUNERAL SERVICES',
};

// --- Styled Components ---
const DispatchContainer = styled.div`
  background-color: ${Colors.cardBg};
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: ${Colors.shadow};
  border: 1px solid ${Colors.borderColor};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h4`
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: ${Colors.textPrimary};

  svg {
    color: ${Colors.accentBlue};
  }
`;

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background-color: ${Colors.buttonBg};
  color: white;
  transition: all 0.2s ease;
  font-size: 0.9rem;

  &:hover {
    background-color: ${Colors.buttonHover};
  }

  &:disabled {
    background-color: ${Colors.textSecondary};
    cursor: not-allowed;
  }
`;

const TripCard = styled.div`
  background: ${Colors.cardBg};
  border: 1px solid ${Colors.borderColor};
  border-radius: 1rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: ${Colors.shadow};
    border-color: ${Colors.accentBlue}40;
  }
`;

const TripHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TripLabel = styled.div`
  background: ${Colors.accentBlue};
  color: white;
  padding: 0.3rem 1rem;
  border-radius: 2rem;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DateBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: ${Colors.textSecondary};
  font-size: 0.85rem;
  background: ${Colors.progressBg};
  padding: 0.3rem 1rem;
  border-radius: 2rem;
`;

const VehicleInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
  flex-wrap: wrap;
`;

const VehicleTag = styled.span`
  background: ${Colors.progressBg};
  padding: 0.2rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.85rem;
  color: ${Colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const RouteInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: ${Colors.progressBg};
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  margin: 1rem 0;
  flex-wrap: wrap;
`;

const Location = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: ${Colors.textPrimary};
`;

const Arrow = styled.span`
  color: ${Colors.textSecondary};
  font-size: 1rem;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 1.5rem;
  margin: 1rem 0;
  flex-wrap: wrap;
`;

const Stat = styled.div`
  font-size: 0.9rem;
  color: ${Colors.textSecondary};

  strong {
    color: ${Colors.textPrimary};
    margin-right: 0.25rem;
    font-weight: 600;
  }
`;

const FuelEstimate = styled.div`
  background: #10b98110;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  margin: 0.75rem 0;
  font-size: 0.9rem;
  color: #059669;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${Colors.borderColor};
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid ${Colors.borderColor};
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.danger ? Colors.dangerRed : Colors.accentBlue)};
    color: white;
    border-color: ${(props) => (props.danger ? Colors.dangerRed : Colors.accentBlue)};
  }
`;

// Modal Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 1100px;
  max-height: 90vh;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
`;

const ModalHeader = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${Colors.borderColor};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${Colors.textSecondary};
  padding: 0.25rem;

  &:hover {
    color: ${Colors.dangerRed};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
  position: relative;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  margin-bottom: 0.4rem;
  font-size: 0.9rem;
  color: ${Colors.textPrimary};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid ${Colors.borderColor};
  border-radius: 0.5rem;
  font-size: 0.95rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${Colors.accentBlue};
  }
`;

const MapContainer = styled.div`
  width: 100%;
  height: 400px;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid ${Colors.borderColor};
  position: relative;
  background: ${Colors.progressBg};

  .maplibregl-map {
    width: 100%;
    height: 100%;
  }
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid ${Colors.borderColor};
  border-radius: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: ${Colors.shadow};
`;

const SearchResultItem = styled.div`
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid ${Colors.borderColor};
  font-size: 0.9rem;
  transition: background 0.2s;

  &:hover {
    background: ${Colors.hoverGray};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const SummaryBox = styled.div`
  background: ${Colors.progressBg};
  padding: 1rem;
  border-radius: 0.75rem;
  margin: 1rem 0;

  p {
    margin: 0.5rem 0;
    display: flex;
    justify-content: space-between;
    font-size: 0.95rem;
  }

  strong {
    color: ${Colors.accentBlue};
  }
`;

const RateInput = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;

  input {
    flex: 1;
    padding: 0.6rem 0.75rem;
    border: 1px solid ${Colors.borderColor};
    border-radius: 0.5rem;
    font-size: 0.95rem;
  }

  span {
    color: ${Colors.textSecondary};
    font-weight: 500;
  }
`;

const MapControls = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const MapButton = styled.button`
  background: white;
  border: 1px solid ${Colors.borderColor};
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    background: ${Colors.hoverGray};
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const RouteInfoBox = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  flex-wrap: wrap;
  justify-content: center;

  span {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  strong {
    color: ${Colors.accentBlue};
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 1rem 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid ${Colors.borderColor};
  border-radius: 0.5rem;
  font-size: 0.95rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: ${Colors.accentBlue};
  }
`;

// Main Component
const DispatchSection = ({ deceasedId, onUpdate }) => {
  const { id } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('System');
  const [trips, setTrips] = useState([]);

  // Map Refs
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const routeSourceRef = useRef(null);

  // Form state
  const [tripName, setTripName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleCC, setVehicleCC] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [negotiatedPrice, setNegotiatedPrice] = useState('');
  const [ratePerKm, setRatePerKm] = useState(100);

  // Location state
  const [destination, setDestination] = useState('');
  const [destinationLat, setDestinationLat] = useState(null);
  const [destinationLon, setDestinationLon] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [travelTime, setTravelTime] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [mapStyle, setMapStyle] = useState('standard');

  // Calculations
  const [fuelCost, setFuelCost] = useState(null);
  const [fuelEstimate, setFuelEstimate] = useState(null);
  const [transportCost, setTransportCost] = useState(null);
  const [totalCost, setTotalCost] = useState(null);

  // Debounce timer for search
  const searchTimeout = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('username');
    if (storedUser) setUsername(storedUser);
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [deceasedId, id]);

  // Initialize map when modal opens
  useEffect(() => {
    if (showModal && mapContainer.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializeMap();
      }, 100);
    }

    // Cleanup on modal close
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [showModal, mapStyle]);

  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_CONFIG.styles[mapStyle] || MAP_CONFIG.styles.standard,
        center: MAP_CONFIG.defaultCenter,
        zoom: MAP_CONFIG.defaultZoom,
        attributionControl: true,
      });

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), 'top-left');
      map.current.addControl(new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
      }), 'bottom-left');

      // Add mortuary marker
      map.current.on('load', () => {
        addMarker(
          DEFAULT_MORTUARY.lat,
          DEFAULT_MORTUARY.lon,
          '#10B981',
          '🏠',
          'Mortuary'
        );

        // If editing with existing destination, load route
        if (destinationLat && destinationLon) {
          addMarker(destinationLat, destinationLon, '#EF4444', '📍', 'Destination');
          fetchRoute(DEFAULT_MORTUARY.lat, DEFAULT_MORTUARY.lon, destinationLat, destinationLon);
        }
      });

      // Handle map errors gracefully
      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  const addMarker = (lat, lng, color, emoji, label) => {
    if (!map.current) return;

    // Create custom marker element
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.innerHTML = `
      <div style="
        background: ${color};
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 4px;
        border: 2px solid white;
      ">
        <span style="font-size: 16px;">${emoji}</span>
        <span>${label}</span>
      </div>
    `;

    // Remove existing marker at similar position (avoid duplicates)
    const marker = new maplibregl.Marker({ 
      element: el, 
      anchor: 'bottom',
      offset: [0, -10]
    })
      .setLngLat([lng, lat])
      .addTo(map.current);

    markersRef.current.push(marker);
    return marker;
  };

  const fetchRoute = async (originLat, originLon, destLat, destLon) => {
    if (!map.current) return;
    
    setIsMapLoading(true);
    
    try {
      // Using OSRM (free, no API key needed)
      const url = `${OSRM_API}/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson&steps=true&alternatives=false`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }
      
      const data = await response.json();

      if (data.routes?.[0]) {
        const route = data.routes[0];
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMinutes = Math.round(route.duration / 60);
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        setDistance(parseFloat(distanceKm));
        setTravelTime(timeString);

        // Draw route on map
        drawRoute(route.geometry);
        
        // Fit map to show entire route
        fitMapToRoute(route.geometry);
      }
    } catch (error) {
      console.error('Route error:', error);
      
      // Fallback to Haversine distance calculation
      const dist = calculateDistance(originLat, originLon, destLat, destLon);
      setDistance(Math.round(dist * 10) / 10);
      
      // Estimate time (assume average 40km/h)
      const estimatedMinutes = Math.round((dist / 40) * 60);
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = estimatedMinutes % 60;
      setTravelTime(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
      
      // Draw straight line as fallback
      drawStraightLine(originLat, originLon, destLat, destLon);
    } finally {
      setIsMapLoading(false);
    }
  };

  const drawRoute = (geometry) => {
    if (!map.current) return;

    // Remove existing route
    if (map.current.getLayer('route-line')) {
      map.current.removeLayer('route-line');
    }
    if (map.current.getLayer('route-line-bg')) {
      map.current.removeLayer('route-line-bg');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }

    // Add route source
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: geometry,
      },
    });

    // Add background (wider) line
    map.current.addLayer({
      id: 'route-line-bg',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#2563EB',
        'line-width': 8,
        'line-opacity': 0.2,
      },
    });

    // Add main route line with dash effect (Waze-like)
    map.current.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#2563EB',
        'line-width': 4,
        'line-opacity': 0.8,
      },
    });

    routeSourceRef.current = geometry;
  };

  const drawStraightLine = (lat1, lon1, lat2, lon2) => {
    if (!map.current) return;

    const geometry = {
      type: 'LineString',
      coordinates: [[lon1, lat1], [lon2, lat2]]
    };

    drawRoute(geometry);
    fitMapToRoute(geometry);
  };

  const fitMapToRoute = (geometry) => {
    if (!map.current || !geometry || !geometry.coordinates) return;

    try {
      const coordinates = geometry.coordinates;
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend([coord[0], coord[1]]);
      }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15,
        duration: 1000,
      });
    } catch (error) {
      console.error('Error fitting map to route:', error);
    }
  };

  // Haversine formula for distance calculation (fallback)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const searchLocation = useCallback(async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Debounce search
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Using Nominatim (free, rate-limited to 1 request/sec)
        const response = await fetch(
          `${NOMINATIM_API}?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=ke&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'FuneralServiceApp/1.0', // Required by Nominatim
            },
          }
        );
        
        if (!response.ok) {
          throw new Error('Search failed');
        }
        
        const data = await response.json();
        setSearchResults(data || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        
        // Fallback to TomTom if Nominatim fails
        try {
          const response = await fetch(
            `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${TOMTOM_API_KEY}&countrySet=KE&limit=5`
          );
          const data = await response.json();
          const formattedResults = (data.results || []).map(r => ({
            display_name: r.address.freeformAddress,
            lat: r.position.lat,
            lon: r.position.lon,
          }));
          setSearchResults(formattedResults);
        } catch (fallbackError) {
          console.error('Fallback search error:', fallbackError);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleDestinationSelect = (result) => {
    const address = result.display_name;
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    setDestination(address);
    setDestinationLat(lat);
    setDestinationLon(lon);
    setSearchResults([]);

    // Update map
    if (map.current) {
      // Clear old markers except mortuary
      markersRef.current.forEach(marker => {
        const pos = marker.getLngLat();
        if (pos.lat !== DEFAULT_MORTUARY.lon || pos.lng !== DEFAULT_MORTUARY.lat) {
          marker.remove();
        }
      });

      addMarker(lat, lon, '#EF4444', '📍', 'Destination');
      fetchRoute(DEFAULT_MORTUARY.lat, DEFAULT_MORTUARY.lon, lat, lon);
    } else {
      // Fallback distance calculation
      const dist = calculateDistance(DEFAULT_MORTUARY.lat, DEFAULT_MORTUARY.lon, lat, lon);
      setDistance(Math.round(dist * 10) / 10);
      const estimatedMinutes = Math.round((dist / 40) * 60);
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = estimatedMinutes % 60;
      setTravelTime(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
    }
  };

  const openInWaze = () => {
    if (destinationLat && destinationLon) {
      const url = `https://waze.com/ul?ll=${destinationLat},${destinationLon}&navigate=yes`;
      window.open(url, '_blank');
    }
  };

  const openInGoogleMaps = () => {
    if (destinationLat && destinationLon) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLon}`;
      window.open(url, '_blank');
    }
  };

  const calculateFuelCost = useCallback(() => {
    if (!vehicleCC || !distance) return null;
    const cc = parseFloat(vehicleCC);
    let kmPerLiter;
    
    if (cc < 1500) kmPerLiter = 15;
    else if (cc < 2000) kmPerLiter = 12;
    else if (cc < 3000) kmPerLiter = 9;
    else if (cc < 4000) kmPerLiter = 6;
    else kmPerLiter = 4;

    const roundTrip = distance * 2;
    const fuelNeeded = roundTrip / kmPerLiter;
    
    return {
      liters: Math.round(fuelNeeded * 10) / 10,
      cost: Math.round(fuelNeeded * 180), // KES 180 per liter
    };
  }, [vehicleCC, distance]);

  const calculateTransportCost = useCallback(() => {
    if (!distance || !ratePerKm) return null;
    const roundTrip = distance * 2;
    return Math.round(roundTrip * ratePerKm);
  }, [distance, ratePerKm]);

  useEffect(() => {
    if (distance) {
      const fuel = calculateFuelCost();
      if (fuel) {
        setFuelEstimate(fuel.liters);
        setFuelCost(fuel.cost);
      }

      const transport = calculateTransportCost();
      setTransportCost(transport);

      const total = (fuel?.cost || 0) + (transport || 0);
      setTotalCost(total);
    }
  }, [distance, vehicleCC, ratePerKm, calculateFuelCost, calculateTransportCost]);

  const fetchTrips = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dispatch/${deceasedId || id}`);
      if (response.data.success) {
        setTrips(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  const resetForm = () => {
    setTripName('');
    setVehiclePlate('');
    setVehicleName('');
    setVehicleCC('');
    setDispatchDate('');
    setNegotiatedPrice('');
    setRatePerKm(100);
    setDestination('');
    setDestinationLat(null);
    setDestinationLon(null);
    setDistance(null);
    setTravelTime(null);
    setFuelCost(null);
    setFuelEstimate(null);
    setTransportCost(null);
    setTotalCost(null);
    setSearchResults([]);
    setEditingId(null);
    
    // Clear map markers and routes
    if (map.current) {
      clearMarkers();
      
      // Remove route layers
      ['route-line', 'route-line-bg'].forEach(layer => {
        if (map.current.getLayer(layer)) {
          map.current.removeLayer(layer);
        }
      });
      
      if (map.current.getSource('route')) {
        map.current.removeSource('route');
      }
      
      // Reset map view
      map.current.flyTo({
        center: MAP_CONFIG.defaultCenter,
        zoom: MAP_CONFIG.defaultZoom,
      });
      
      // Re-add mortuary marker
      addMarker(DEFAULT_MORTUARY.lat, DEFAULT_MORTUARY.lon, '#10B981', '🏠', 'Mortuary');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!vehiclePlate || !dispatchDate || !destinationLat || !destinationLon) {
      setMessage('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);

    const fuel = calculateFuelCost();

    const tripData = {
      deceased_id: deceasedId || id,
      vehicle_plate: vehiclePlate,
      vehicle_name: vehicleName || null,
      vehicle_cc: vehicleCC || null,
      dispatch_date: dispatchDate,
      destination_address: destination,
      destination_lat: destinationLat,
      destination_lon: destinationLon,
      distance_km: distance,
      round_trip_km: distance ? distance * 2 : null,
      travel_time: travelTime,
      fuel_estimate: fuelEstimate,
      fuel_cost: fuelCost,
      rate_per_km: ratePerKm,
      total_cost: totalCost,
      negotiated_price: negotiatedPrice || null,
      trip_name: tripName || `Trip ${new Date(dispatchDate).toLocaleDateString()}`,
      origin_address: DEFAULT_MORTUARY.address,
      origin_lat: DEFAULT_MORTUARY.lat,
      origin_lon: DEFAULT_MORTUARY.lon,
      created_by: username,
    };

    try {
      if (editingId) {
        await axios.put(`${API_BASE_URL}/dispatch/${editingId}`, tripData);
        setMessage('Trip updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/dispatch`, tripData);
        setMessage('Trip added successfully!');
      }

      setTimeout(async () => {
        setShowModal(false);
        resetForm();
        await fetchTrips();
        onUpdate?.();
        setMessage('');
      }, 1500);
    } catch (error) {
      console.error('Error saving trip:', error);
      setMessage('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await axios.delete(`${API_BASE_URL}/dispatch/${tripId}`);
        await fetchTrips();
        onUpdate?.();
        setMessage('Trip deleted successfully');
      } catch (error) {
        console.error('Error deleting trip:', error);
        setMessage('Error deleting trip');
      }
    }
  };

  const handleEdit = (trip) => {
    setEditingId(trip.dispatch_id);
    setTripName(trip.trip_name || '');
    setVehiclePlate(trip.vehicle_plate || '');
    setVehicleName(trip.vehicle_name || '');
    setVehicleCC(trip.vehicle_cc || '');
    setDispatchDate(trip.dispatch_date?.split('T')[0] || '');
    setNegotiatedPrice(trip.negotiated_price || '');
    setRatePerKm(trip.rate_per_km || 100);
    setDestination(trip.destination_address || '');
    setDestinationLat(trip.destination_lat);
    setDestinationLon(trip.destination_lon);
    setDistance(trip.distance_km);
    setTravelTime(trip.travel_time);
    setShowModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('KES', 'KES ');
  };

  return (
    <DispatchContainer>
      <Header>
        <Title>
          <Truck size={20} />
          Vehicle Trips
        </Title>
        <StyledButton
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <PlusCircle size={16} /> Add Trip
        </StyledButton>
      </Header>

      {message && (
        <div
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            background: message.includes('Error') ? '#FEE2E2' : '#D1FAE5',
            color: message.includes('Error') ? '#DC2626' : '#059669',
            borderRadius: '0.5rem',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {message.includes('Error') ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle size={16} />
          )}
          {message}
        </div>
      )}

      {trips.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          color: Colors.textSecondary 
        }}>
          <Truck size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>No trips added yet. Click "Add Trip" to get started.</p>
        </div>
      ) : (
        trips.map((trip) => {
          const displayPrice = trip.negotiated_price || trip.total_cost || 0;

          return (
            <TripCard key={trip.dispatch_id}>
              <TripHeader>
                <TripLabel>
                  <Route size={14} />
                  {trip.trip_name || 'Trip'}
                </TripLabel>
                <DateBadge>
                  <Calendar size={14} />
                  {new Date(trip.dispatch_date).toLocaleDateString('en-KE', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </DateBadge>
              </TripHeader>

              <VehicleInfo>
                <Car size={16} color={Colors.accentBlue} />
                <strong style={{ fontSize: '0.95rem' }}>{trip.vehicle_plate}</strong>
                {trip.vehicle_name && (
                  <VehicleTag>
                    <Car size={12} /> {trip.vehicle_name}
                  </VehicleTag>
                )}
                {trip.vehicle_cc && (
                  <VehicleTag>
                    <Gauge size={12} /> {trip.vehicle_cc}CC
                  </VehicleTag>
                )}
              </VehicleInfo>

              <RouteInfo>
                <Location>
                  <MapPin size={14} color="#10B981" />
                  <span>{trip.origin_address}</span>
                </Location>
                <Arrow>→</Arrow>
                <Location>
                  <MapPin size={14} color="#EF4444" />
                  <span>{trip.destination_address}</span>
                </Location>
              </RouteInfo>

              <StatsRow>
                <Stat>
                  <strong>{trip.distance_km || 0}</strong> km one way
                </Stat>
                <Stat>
                  <strong>
                    {trip.round_trip_km ||
                      (trip.distance_km ? (trip.distance_km * 2).toFixed(1) : 0)}
                  </strong>{' '}
                  km round trip
                </Stat>
                {trip.travel_time && (
                  <Stat>
                    <Clock size={12} style={{ display: 'inline', marginRight: '2px' }} />
                    {trip.travel_time}
                  </Stat>
                )}
                {trip.rate_per_km && (
                  <Stat>
                    <Settings size={12} style={{ display: 'inline', marginRight: '2px' }} />
                    KES {trip.rate_per_km}/km
                  </Stat>
                )}
              </StatsRow>

              {trip.fuel_cost && (
                <FuelEstimate>
                  <Fuel size={14} />
                  <span>
                    Fuel: {trip.fuel_estimate}L ({formatCurrency(trip.fuel_cost)})
                  </span>
                </FuelEstimate>
              )}

              <div
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: '0.5rem'
                }}
              >
                <Stat style={{ fontWeight: 500 }}>
                  <DollarSign size={14} style={{ display: 'inline', marginRight: '2px' }} />
                  {formatCurrency(displayPrice)}
                  <span
                    style={{ 
                      color: Colors.textSecondary, 
                      marginLeft: '4px', 
                      fontSize: '0.8rem' 
                    }}
                  >
                    {trip.negotiated_price ? '(final)' : '(est.)'}
                  </span>
                </Stat>

                <ActionButtons>
                  <ActionButton onClick={() => handleEdit(trip)}>
                    <Edit size={14} /> Edit
                  </ActionButton>
                  <ActionButton danger onClick={() => handleDelete(trip.dispatch_id)}>
                    <Trash2 size={14} /> Delete
                  </ActionButton>
                </ActionButtons>
              </div>
            </TripCard>
          );
        })
      )}

      {/* Add/Edit Trip Modal */}
      {showModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                {editingId ? 'Edit Trip' : 'New Trip'}
              </h3>
              <CloseButton
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <X size={20} />
              </CloseButton>
            </ModalHeader>

            {/* Left Column - Form Fields */}
            <div>
              <FormGroup>
                <Label>Trip Name</Label>
                <Input
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder="e.g., Trip A, Funeral Day"
                />
              </FormGroup>

              <FormGroup>
                <Label>Vehicle Plate *</Label>
                <Input
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                  placeholder="KCA 123A"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Vehicle Name</Label>
                <Input
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder="e.g., Mercedes, Toyota"
                />
              </FormGroup>

              <FormGroup>
                <Label>Engine CC</Label>
                <Input
                  type="number"
                  value={vehicleCC}
                  onChange={(e) => setVehicleCC(e.target.value)}
                  placeholder="e.g., 2000"
                  min="0"
                />
              </FormGroup>

              <FormGroup>
                <Label>Trip Date *</Label>
                <Input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Rate per Kilometer (KES) *</Label>
                <RateInput>
                  <Input
                    type="number"
                    value={ratePerKm}
                    onChange={(e) => setRatePerKm(parseFloat(e.target.value) || 0)}
                    min="1"
                    step="1"
                    required
                  />
                  <span>/km</span>
                </RateInput>
              </FormGroup>

              <FormGroup style={{ position: 'relative' }}>
                <Label>Destination *</Label>
                <div style={{ position: 'relative' }}>
                  <Input
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      searchLocation(e.target.value);
                    }}
                    placeholder="Search for a location..."
                    required
                  />
                  {isSearching && (
                    <Loader2 
                      size={16} 
                      style={{ 
                        position: 'absolute', 
                        right: '10px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        animation: 'spin 1s linear infinite'
                      }} 
                    />
                  )}
                </div>
                {searchResults.length > 0 && (
                  <SearchResults>
                    {searchResults.map((result, idx) => (
                      <SearchResultItem 
                        key={idx} 
                        onClick={() => handleDestinationSelect(result)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin size={14} color={Colors.accentBlue} />
                          <span>{result.display_name}</span>
                        </div>
                      </SearchResultItem>
                    ))}
                  </SearchResults>
                )}
              </FormGroup>

              <FormGroup>
                <Label>Final Price (Optional)</Label>
                <Input
                  type="number"
                  value={negotiatedPrice}
                  onChange={(e) => setNegotiatedPrice(e.target.value)}
                  placeholder="Enter agreed price"
                  min="0"
                />
                <small
                  style={{ 
                    color: Colors.textSecondary, 
                    marginTop: '0.25rem', 
                    display: 'block',
                    fontSize: '0.8rem'
                  }}
                >
                  This will override the calculated estimate
                </small>
              </FormGroup>
            </div>

            {/* Right Column - Map */}
            <div>
              <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <Select 
                  value={mapStyle}
                  onChange={(e) => setMapStyle(e.target.value)}
                  style={{ fontSize: '0.85rem', padding: '0.4rem' }}
                >
                  <option value="standard">Light Map</option>
                  <option value="dark">Dark Map</option>
                  <option value="voyager">Voyager Map</option>
                </Select>
              </div>
              
              <MapContainer ref={mapContainer}>
                {isMapLoading && (
                  <LoadingOverlay>
                    <Loader2 size={16} className="animate-spin" />
                    Calculating route...
                  </LoadingOverlay>
                )}
                
                <MapControls>
                  <MapButton onClick={openInWaze} title="Open in Waze">
                    <ExternalLink size={14} /> Open in Waze
                  </MapButton>
                  <MapButton onClick={openInGoogleMaps} title="Open in Google Maps">
                    <Navigation size={14} /> Open in Maps
                  </MapButton>
                </MapControls>
                
                {distance && (
                  <RouteInfoBox>
                    <span>
                      <MapPin size={14} />
                      <strong>{distance} km</strong>
                    </span>
                    <span>
                      <Clock size={14} />
                      <strong>{travelTime}</strong>
                    </span>
                    {totalCost && (
                      <span>
                        <DollarSign size={14} />
                        <strong>{formatCurrency(totalCost)}</strong>
                      </span>
                    )}
                  </RouteInfoBox>
                )}
              </MapContainer>

              {distance && (
                <SummaryBox>
                  <p>
                    <span>📍 One way:</span> <strong>{distance} km</strong>
                  </p>
                  <p>
                    <span>🔄 Round trip:</span> <strong>{(distance * 2).toFixed(1)} km</strong>
                  </p>
                  <p>
                    <span>⏱️ Travel time:</span> <strong>{travelTime}</strong>
                  </p>
                  <p>
                    <span>💰 Transport rate:</span> <strong>KES {ratePerKm}/km</strong>
                  </p>
                  <p>
                    <span>🚗 Transport cost:</span> <strong>{formatCurrency(transportCost || 0)}</strong>
                  </p>
                  {fuelCost && (
                    <>
                      <p>
                        <span>⛽ Fuel needed:</span>{' '}
                        <strong>{fuelEstimate}L</strong>
                      </p>
                      <p>
                        <span>⛽ Fuel cost:</span>{' '}
                        <strong>{formatCurrency(fuelCost)}</strong>
                      </p>
                      <p
                        style={{
                          borderTop: `1px solid ${Colors.borderColor}`,
                          marginTop: '0.75rem',
                          paddingTop: '0.75rem',
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                        }}
                      >
                        <span>💰 Total estimate:</span>
                        <strong style={{ color: Colors.successGreen }}>
                          {formatCurrency(totalCost || 0)}
                        </strong>
                      </p>
                    </>
                  )}
                </SummaryBox>
              )}

              <StyledButton
                onClick={handleSubmit}
                disabled={
                  isLoading || !destinationLat || !vehiclePlate || !dispatchDate || !ratePerKm
                }
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> {editingId ? 'Update' : 'Save'} Trip
                  </>
                )}
              </StyledButton>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </DispatchContainer>
  );
};

export default DispatchSection;