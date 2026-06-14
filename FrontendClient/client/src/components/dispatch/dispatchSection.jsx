import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
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
  Send,
MessageSquare as WhatsApp,
  MessageSquare as WhatsApp,
  Users,
  Clock,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// Unified Color Palette (matching deceasedDetailPage.jsx)
const Colors = {
  cardBg: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  borderColor: '#E5E7EB',
  shadow: '0 4px 12px rgba(0,0,0,0.05)',
  accentBlue: '#3b82f6',
  primaryDark: '#0f172a',
  dangerRed: '#dc2626',
  successGreen: '#10b981',
  buttonBg: '#3b82f6',
  buttonHover: '#2563eb',
  progressBg: '#f8fafc',
  hoverGray: '#f1f5f9',
  whatsappGreen: '#25D366',
  warningOrange: '#f59e0b',
  accentPurple: '#8b5cf6',
};

// --- Styled Components ---
const DispatchContainer = styled.div`
  background-color: ${Colors.cardBg};
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #f1f5f9;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h4`
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: ${Colors.primaryDark};

  svg {
    color: ${Colors.accentBlue};
    width: 18px;
    height: 18px;
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
  font-size: 0.85rem;

  &:hover {
    background-color: ${Colors.buttonHover};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:disabled {
    background-color: ${Colors.textSecondary};
    cursor: not-allowed;
    transform: none;
  }
`;

const WhatsAppButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background-color: ${Colors.whatsappGreen};
  color: white;
  transition: all 0.2s ease;
  font-size: 0.8rem;

  &:hover {
    background-color: #1ebe57;
    transform: translateY(-1px);
  }

  &:disabled {
    background-color: ${Colors.textSecondary};
    cursor: not-allowed;
  }
`;

const TripCard = styled.div`
  background: ${Colors.cardBg};
  border: 1px solid ${Colors.borderColor};
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: ${Colors.accentBlue}30;
    transform: translateY(-2px);
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
  background: ${Colors.primaryDark};
  color: white;
  padding: 0.3rem 1rem;
  border-radius: 2rem;
  font-weight: 600;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DateBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: ${Colors.textSecondary};
  font-size: 0.8rem;
  background: ${Colors.progressBg};
  padding: 0.3rem 0.8rem;
  border-radius: 2rem;
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.8rem;
  border-radius: 2rem;
  background: ${(props) => {
    switch (props.status) {
      case 'Assigned':
        return '#DBEAFE';
      case 'In Transit':
        return '#FEF3C7';
      case 'Completed':
        return '#D1FAE5';
      case 'Cancelled':
        return '#FEE2E2';
      default:
        return Colors.progressBg;
    }
  }};
  color: ${(props) => {
    switch (props.status) {
      case 'Assigned':
        return '#1E40AF';
      case 'In Transit':
        return '#92400E';
      case 'Completed':
        return '#059669';
      case 'Cancelled':
        return '#DC2626';
      default:
        return Colors.textSecondary;
    }
  }};
`;

const VehicleInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;
  flex-wrap: wrap;
`;

const VehicleTag = styled.span`
  background: ${Colors.progressBg};
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  color: ${Colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const DriverInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: ${Colors.textPrimary};
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: #dbeafe20;
  border-radius: 0.5rem;
  border-left: 3px solid ${Colors.accentBlue};
`;

const RouteInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: ${Colors.progressBg};
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  flex-wrap: wrap;
`;

const Location = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: ${Colors.textPrimary};
`;

const Arrow = styled.span`
  color: ${Colors.textSecondary};
  font-size: 1rem;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  flex-wrap: wrap;
`;

const Stat = styled.div`
  font-size: 0.85rem;
  color: ${Colors.textSecondary};

  strong {
    color: ${Colors.textPrimary};
    margin-right: 0.25rem;
    font-weight: 600;
  }
`;

const FuelEstimate = styled.div`
  background: #10b98110;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  margin: 0.75rem 0;
  font-size: 0.8rem;
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
  flex-wrap: wrap;
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
  font-size: 0.8rem;
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
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 950px;
  max-height: 90vh;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
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

  &:hover {
    color: ${Colors.dangerRed};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
  color: ${Colors.textPrimary};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid ${Colors.borderColor};
  border-radius: 0.5rem;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${Colors.accentBlue};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid ${Colors.borderColor};
  border-radius: 0.5rem;
  font-size: 0.9rem;
  background: white;

  &:focus {
    outline: none;
    border-color: ${Colors.accentBlue};
  }
`;

const MapContainer = styled.div`
  height: 250px;
  width: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid ${Colors.borderColor};
  margin-bottom: 1rem;
  position: relative;

  iframe {
    border: none;
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
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const SearchResultItem = styled.div`
  padding: 0.6rem 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid ${Colors.borderColor};
  font-size: 0.85rem;

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
    font-size: 0.85rem;
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
    font-size: 0.9rem;
  }

  span {
    color: ${Colors.textSecondary};
    font-weight: 500;
    font-size: 0.85rem;
  }
`;

const RouteStep = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.4rem 0;
  font-size: 0.8rem;
  color: ${Colors.textSecondary};

  .step-number {
    background: ${Colors.accentBlue};
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    flex-shrink: 0;
  }

  .step-text {
    flex: 1;
  }
`;

// ============================================
// OPEN SOURCE ROUTING UTILITIES (No TomTom)
// ============================================

// Default mortuary location (Lee Funeral Services, Nairobi)
const DEFAULT_MORTUARY = {
  lat: -1.2921,
  lon: 36.8219,
  address: 'LEE FUNERAL SERVICES',
};

// Nominatim (OSM) API for geocoding - FREE
const NOMINATIM_API = 'https://nominatim.openstreetmap.org';

// OSRM (Open Source Routing Machine) for routing - FREE
const OSRM_API = 'https://router.project-osrm.org/route/v1';

// OpenStreetMap static map embed
const getOSMMapUrl = (originLat, originLon, destLat, destLon) => {
  if (!destLat || !destLon) {
    return `https://www.openstreetmap.org/export/embed.html?bbox=36.7,-1.4,37.0,-1.2&layer=mapnik&marker=${originLat},${originLon}`;
  }

  const minLon = Math.min(originLon, destLon) - 0.05;
  const maxLon = Math.max(originLon, destLon) + 0.05;
  const minLat = Math.min(originLat, destLat) - 0.05;
  const maxLat = Math.max(originLat, destLat) + 0.05;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik&marker=${originLat},${originLon}&marker=${destLat},${destLon}`;
};

// Geocode address using Nominatim
const geocodeAddress = async (query) => {
  if (query.length < 3) return [];

  try {
    const response = await fetch(
      `${NOMINATIM_API}/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ke&limit=5&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'MontenzumaDispatch/1.0',
        },
      }
    );
    const data = await response.json();
    return data.map((result) => ({
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      address: result.display_name,
      name: result.name || result.display_name,
      type: result.type,
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
};

// Calculate route using OSRM (Open Source Routing Machine)
const calculateRouteOSRM = async (originLat, originLon, destLat, destLon) => {
  try {
    const response = await fetch(
      `${OSRM_API}/driving/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson&steps=true`
    );
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = (route.distance / 1000).toFixed(1);
      const timeInSeconds = route.duration;
      const hours = Math.floor(timeInSeconds / 3600);
      const minutes = Math.floor((timeInSeconds % 3600) / 60);
      const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      // Extract turn-by-turn directions
      const legs = route.legs[0];
      const steps = legs.steps.map((step, index) => ({
        instruction: step.maneuver.modifier || step.maneuver.type || 'Continue',
        name: step.name || '',
        distance: (step.distance / 1000).toFixed(2),
        duration: Math.round(step.duration / 60),
      }));

      return {
        distance: parseFloat(distanceKm),
        travelTime: timeString,
        travelTimeMinutes: Math.round(timeInSeconds / 60),
        steps: steps.slice(0, 10),
        geometry: route.geometry,
      };
    }
    return null;
  } catch (error) {
    console.error('OSRM routing error:', error);
    const straightDistance = calculateHaversineDistance(originLat, originLon, destLat, destLon);
    const roadDistance = (straightDistance * 1.3).toFixed(1);
    const estimatedTime = Math.round((parseFloat(roadDistance) / 50) * 60);

    return {
      distance: parseFloat(roadDistance),
      travelTime: estimatedTime > 60
        ? `${Math.floor(estimatedTime / 60)}h ${estimatedTime % 60}m`
        : `${estimatedTime}m`,
      travelTimeMinutes: estimatedTime,
      steps: [],
      geometry: null,
      isEstimated: true,
    };
  }
};

// Haversine formula for distance calculation
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ============================================
// VEHICLE/DRIVER OPTIMIZATION
// ============================================

const calculateVehicleScore = (vehicle, tripRequirements) => {
  let score = 100;
  if (vehicle.status !== 'Available') score -= 50;
  if (vehicle.currentLocation) {
    const distance = calculateHaversineDistance(
      vehicle.currentLocation.lat,
      vehicle.currentLocation.lon,
      DEFAULT_MORTUARY.lat,
      DEFAULT_MORTUARY.lon
    );
    score -= Math.min(distance * 2, 30);
  }
  if (tripRequirements.vehicleType && vehicle.type !== tripRequirements.vehicleType) {
    score -= 20;
  }
  if (tripRequirements.distance > 100 && vehicle.fuelEfficiency) {
    score += Math.min(vehicle.fuelEfficiency, 10);
  }
  return Math.max(score, 0);
};

const optimizeDispatch = (availableVehicles, tripData) => {
  const scoredVehicles = availableVehicles.map((vehicle) => ({
    ...vehicle,
    score: calculateVehicleScore(vehicle, tripData),
  }));
  scoredVehicles.sort((a, b) => b.score - a.score);
  return scoredVehicles;
};

// ============================================
// BILLING CALCULATION SERVICE
// ============================================

const calculateBillingUpToDay = (dispatchDate, ratePerDay = 5000) => {
  const today = new Date();
  const dispatch = new Date(dispatchDate);
  dispatch.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (dispatch > today) return 0;

  const daysElapsed = Math.floor((today - dispatch) / (1000 * 60 * 60 * 24)) + 1;
  return daysElapsed * ratePerDay;
};

const updateDeceasedBilling = async (deceasedId, dispatchData, tenantSlug) => {
  try {
    const billingAmount = calculateBillingUpToDay(dispatchData.dispatch_date);
    const response = await axios.put(
      `${API_BASE_URL}/api/v1/restpoint/deceased/${deceasedId}/billing`,
      {
        dispatch_set_date: dispatchData.dispatch_date,
        dispatch_id: dispatchData.dispatch_id,
        dispatch_vehicle: dispatchData.vehicle_plate,
        dispatch_destination: dispatchData.destination_address,
        billing_amount: billingAmount,
        last_updated: new Date().toISOString(),
      },
      {
        headers: {
          'x-tenant-slug': tenantSlug,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.warn('Billing update info:', error.response?.data || error.message);
    return null;
  }
};

// ============================================
// WHATSAPP NOTIFICATION SERVICE
// ============================================

const sendDispatchWhatsApp = async (driverPhone, dispatchData) => {
  try {
    const API_BASE_URL = 'http://localhost:8000';
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/restpoint/dispatch/send-whatsapp`,
      {
        phone: driverPhone,
        message: `🚐 *NEW DISPATCH ASSIGNMENT*\n\n` +
          `📍 *Route:* ${dispatchData.origin} → ${dispatchData.destination}\n` +
          `📅 *Date:* ${dispatchData.date}\n` +
          `⏰ *Time:* ${dispatchData.time}\n` +
          `🚗 *Vehicle:* ${dispatchData.vehiclePlate}\n` +
          `📏 *Distance:* ${dispatchData.distance} km (one way)\n` +
          `⏱️ *Est. Time:* ${dispatchData.travelTime}\n\n` +
          `Please confirm receipt. Drive safely! 🙏`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('WhatsApp dispatch notification failed:', error);
    throw error;
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

const DispatchSection = ({ deceasedId, dispatchData, onUpdate }) => {
  const { id } = useParams();
  const effectiveDeceasedId = deceasedId || id;
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [username, setUsername] = useState('System');
  const [trips, setTrips] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [routeSteps, setRouteSteps] = useState([]);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  // Form state
  const [tripName, setTripName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleCC, setVehicleCC] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [dispatchTime, setDispatchTime] = useState('');
  const [negotiatedPrice, setNegotiatedPrice] = useState('');
  const [ratePerKm, setRatePerKm] = useState(100);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverContact, setDriverContact] = useState('');

  // Location state
  const [destination, setDestination] = useState('');
  const [destinationLat, setDestinationLat] = useState(null);
  const [destinationLon, setDestinationLon] = useState(null);
  const [distance, setDistance] = useState(null);
  const [travelTime, setTravelTime] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Calculations
  const [fuelCost, setFuelCost] = useState(null);
  const [fuelEstimate, setFuelEstimate] = useState(null);
  const [transportCost, setTransportCost] = useState(null);
  const [totalCost, setTotalCost] = useState(null);

  // Centralized API base URL
  const API_BASE_URL = 'http://localhost:8000';

  // Helper to get tenant slug
  const getTenantSlug = () => {
    return localStorage.getItem('tenantSlug') || 
           localStorage.getItem('tenant_slug') ||
           (() => {
             try {
               const user = JSON.parse(localStorage.getItem('user') || '{}');
               return user.tenantSlug || user.tenant?.slug || 'default';
             } catch {
               return 'default';
             }
           })();
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('username');
    if (storedUser) setUsername(storedUser);
  }, []);

  useEffect(() => {
    if (effectiveDeceasedId) {
      fetchTrips();
      fetchAvailableVehicles();
    }
  }, [effectiveDeceasedId]);

  const fetchTrips = async () => {
    if (!effectiveDeceasedId) {
      setTrips([]);
      setIsLoadingTrips(false);
      return;
    }
    try {
      setIsLoadingTrips(true);
      const tenantSlug = getTenantSlug();
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/restpoint/dispatch/${effectiveDeceasedId}`,
        {
          headers: {
            'x-tenant-slug': tenantSlug,
          },
        }
      );
      if (response.data.success || response.data) {
        setTrips(response.data.data || response.data.trips || []);
      } else {
        setTrips([]);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      setTrips([]);
    } finally {
      setIsLoadingTrips(false);
    }
  };

  const fetchAvailableVehicles = async () => {
    try {
      const tenantSlug = getTenantSlug();
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/restpoint/vehicles/available`,
        {
          headers: {
            'x-tenant-slug': tenantSlug,
          },
        }
      );
      if (response.data.success || response.data) {
        setAvailableVehicles(response.data.data || response.data.vehicles || []);
      } else {
        setAvailableVehicles([]);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setAvailableVehicles([]);
    }
  };

  const calculateFuelCost = useCallback(() => {
    if (!vehicleCC || !distance || vehicleCC <= 0 || distance <= 0) return null;
    const cc = parseFloat(vehicleCC);
    if (isNaN(cc) || cc <= 0) return null;
    
    let kmPerLiter = cc < 1500 ? 15 : cc < 2000 ? 12 : cc < 3000 ? 9 : cc < 4000 ? 6 : 4;
    const roundTrip = distance * 2;
    const fuelNeeded = roundTrip / kmPerLiter;
    return {
      liters: Math.round(fuelNeeded * 10) / 10,
      cost: Math.round(fuelNeeded * 180),
    };
  }, [vehicleCC, distance]);

  const calculateTransportCost = useCallback(() => {
    if (!distance || distance <= 0 || !ratePerKm || ratePerKm <= 0) return null;
    const roundTrip = distance * 2;
    return Math.round(roundTrip * ratePerKm);
  }, [distance, ratePerKm]);

  useEffect(() => {
    if (distance && distance > 0) {
      try {
        const fuel = calculateFuelCost();
        if (fuel) {
          setFuelEstimate(fuel.liters);
          setFuelCost(fuel.cost);
        } else {
          setFuelEstimate(null);
          setFuelCost(null);
        }

        const transport = calculateTransportCost();
        setTransportCost(transport);

        const total = (fuel?.cost || 0) + (transport || 0);
        setTotalCost(total);
      } catch (error) {
        console.error('Error calculating costs:', error);
        setFuelCost(null);
        setTransportCost(null);
        setTotalCost(0);
      }
    } else {
      setFuelCost(null);
      setTransportCost(null);
      setTotalCost(0);
      setFuelEstimate(null);
    }
  }, [distance, vehicleCC, ratePerKm, calculateFuelCost, calculateTransportCost]);

  const searchLocation = async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results = await geocodeAddress(query);
    setSearchResults(results);
    setIsSearching(false);
  };

  const calculateRoute = async (lat, lon) => {
    setIsLoading(true);
    try {
      const routeData = await calculateRouteOSRM(
        DEFAULT_MORTUARY.lat,
        DEFAULT_MORTUARY.lon,
        lat,
        lon
      );

      if (routeData) {
        setDistance(routeData.distance);
        setTravelTime(routeData.travelTime);
        setRouteSteps(routeData.steps);
      }
    } catch (error) {
      console.error('Route calculation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDestinationSelect = (result) => {
    setDestination(result.address);
    setDestinationLat(result.lat);
    setDestinationLon(result.lon);
    setSearchResults([]);
    calculateRoute(result.lat, result.lon);
  };

  const getMapUrl = () => {
    return getOSMMapUrl(
      DEFAULT_MORTUARY.lat,
      DEFAULT_MORTUARY.lon,
      destinationLat,
      destinationLon
    );
  };

  const resetForm = () => {
    setTripName('');
    setVehiclePlate('');
    setVehicleName('');
    setVehicleCC('');
    setDispatchDate('');
    setDispatchTime('');
    setNegotiatedPrice('');
    setRatePerKm(100);
    setDriverName('');
    setDriverPhone('');
    setDriverContact('');
    setDestination('');
    setDestinationLat(null);
    setDestinationLon(null);
    setDistance(null);
    setTravelTime(null);
    setFuelCost(null);
    setFuelEstimate(null);
    setTransportCost(null);
    setTotalCost(null);
    setRouteSteps([]);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!vehiclePlate || !dispatchDate || !driverName || !driverContact || !destinationLat) {
      setMessage('Error: Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    const fuel = calculateFuelCost();

    const tripData = {
      deceased_id: effectiveDeceasedId,
      vehicle_plate: vehiclePlate,
      vehicle_name: vehicleName || null,
      vehicle_cc: vehicleCC || null,
      driver_name: driverName,
      driver_contact: driverContact,
      driver_phone: driverPhone,
      dispatch_date: dispatchDate,
      dispatch_time: dispatchTime || '09:00',
      destination_address: destination,
      destination_lat: destinationLat,
      destination_lon: destinationLon,
      distance_km: distance || null,
      round_trip_km: distance ? distance * 2 : null,
      travel_time: travelTime || null,
      fuel_estimate: fuelEstimate || null,
      fuel_cost: fuelCost || null,
      rate_per_km: ratePerKm || 100,
      total_cost: totalCost || null,
      negotiated_price: negotiatedPrice || null,
      trip_name: tripName || `Trip ${new Date(dispatchDate).toLocaleDateString()}`,
      origin_address: DEFAULT_MORTUARY.address,
      origin_lat: DEFAULT_MORTUARY.lat,
      origin_lon: DEFAULT_MORTUARY.lon,
      created_by: username,
      status: 'Assigned',
    };

    try {
      const tenantSlug = getTenantSlug();
      const headers = {
        'Content-Type': 'application/json',
        'x-tenant-slug': tenantSlug,
      };

      let dispatchResponse;
      if (editingId) {
        dispatchResponse = await axios.put(
          `${API_BASE_URL}/api/v1/restpoint/dispatch/${editingId}`,
          tripData,
          { headers }
        );
        setMessage('Trip updated successfully!');
      } else {
        dispatchResponse = await axios.post(
          `${API_BASE_URL}/api/v1/restpoint/dispatch`,
          tripData,
          { headers }
        );
        setMessage('Trip created successfully!');
      }

      if (dispatchResponse?.data?.data) {
        const dispatchWithId = {
          ...tripData,
          dispatch_id: dispatchResponse.data.data.dispatch_id || editingId,
        };
        await updateDeceasedBilling(effectiveDeceasedId, dispatchWithId, tenantSlug);
      }

      setTimeout(async () => {
        setShowModal(false);
        resetForm();
        await fetchTrips();
        await fetchAvailableVehicles();
        onUpdate?.();
        setMessage('');
      }, 1500);
    } catch (error) {
      console.error('Dispatch error:', error);
      setMessage('Error: ' + (error.response?.data?.error || error.message || 'Failed to save dispatch'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) {
      return;
    }
    try {
      const tenantSlug = getTenantSlug();
      await axios.delete(
        `${API_BASE_URL}/api/v1/restpoint/dispatch/${tripId}`,
        {
          headers: {
            'x-tenant-slug': tenantSlug,
          },
        }
      );
      await fetchTrips();
      await fetchAvailableVehicles();
      onUpdate?.();
      setMessage('Trip deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Delete error:', error);
      setMessage('Error deleting trip: ' + (error.response?.data?.message || error.message));
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleEdit = (trip) => {
    setEditingId(trip.dispatch_id);
    setTripName(trip.trip_name);
    setVehiclePlate(trip.vehicle_plate);
    setVehicleName(trip.vehicle_name);
    setVehicleCC(trip.vehicle_cc);
    setDispatchDate(trip.dispatch_date?.split('T')[0]);
    setDispatchTime(trip.dispatch_time || '09:00');
    setNegotiatedPrice(trip.negotiated_price || '');
    setRatePerKm(trip.rate_per_km || 100);
    setDriverName(trip.driver_name || '');
    setDriverPhone(trip.driver_phone || '');
    setDriverContact(trip.driver_contact || '');
    setDestination(trip.destination_address);
    setDestinationLat(trip.destination_lat);
    setDestinationLon(trip.destination_lon);
    setDistance(trip.distance_km);
    setTravelTime(trip.travel_time);
    setShowModal(true);
  };

  const sendToDriverWhatsApp = async (trip) => {
    if (!trip.driver_contact) {
      setMessage('No driver phone number available');
      return;
    }

    setIsSendingWhatsApp(true);
    try {
      const dispatchData = {
        origin: trip.origin_address || DEFAULT_MORTUARY.address,
        destination: trip.destination_address,
        date: new Date(trip.dispatch_date).toLocaleDateString(),
        time: trip.dispatch_time || '09:00',
        vehiclePlate: trip.vehicle_plate,
        distance: trip.distance_km,
        travelTime: trip.travel_time,
      };

      await sendDispatchWhatsApp(trip.driver_contact, dispatchData);
      setMessage('✅ Dispatch details sent to driver via WhatsApp!');
    } catch (error) {
      console.error('WhatsApp error:', error);
      setMessage('❌ Failed to send WhatsApp: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSendingWhatsApp(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const autoAssignVehicle = () => {
    if (availableVehicles.length === 0) {
      setMessage('No available vehicles for auto-assignment');
      return;
    }

    const optimized = optimizeDispatch(availableVehicles, {
      distance: distance || 50,
      vehicleType: 'hearse',
    });

    const bestVehicle = optimized[0];
    if (bestVehicle) {
      setVehiclePlate(bestVehicle.plate);
      setVehicleName(bestVehicle.name);
      setVehicleCC(bestVehicle.cc);
      setDriverName(bestVehicle.driver_name);
      setDriverPhone(bestVehicle.driver_phone);
      setDriverContact(bestVehicle.driver_contact);
      setMessage(`Auto-assigned: ${bestVehicle.plate} (Score: ${bestVehicle.score})`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <DispatchContainer>
      <Header>
        <Title>
          <Truck size={18} />
          Vehicle Dispatch
        </Title>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {availableVehicles.length > 0 && (
            <StyledButton
              onClick={autoAssignVehicle}
              style={{ backgroundColor: Colors.warningOrange }}
            >
              <Navigation size={14} /> Auto-Assign
            </StyledButton>
          )}
          <StyledButton
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <PlusCircle size={14} /> New Dispatch
          </StyledButton>
        </div>
      </Header>

      {message && (
        <div
          style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            background: message.includes('Error') || message.includes('❌')
              ? '#FEE2E2'
              : message.includes('✅')
              ? '#D1FAE5'
              : '#DBEAFE',
            color: message.includes('Error') || message.includes('❌')
              ? '#DC2626'
              : message.includes('✅')
              ? '#059669'
              : '#1E40AF',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}
        >
          {message}
        </div>
      )}

      {trips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: Colors.textSecondary }}>
          {isLoadingTrips ? (
            <>
              <Loader2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} className="animate-spin" />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading dispatch trips...</p>
            </>
          ) : (
            <>
              <Truck size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No dispatch trips added yet</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: Colors.textSecondary }}>
                Click "New Dispatch" to create your first trip
              </p>
            </>
          )}
        </div>
      ) : (
        trips.map((trip) => {
          const displayPrice = trip.negotiated_price || trip.total_cost || 0;

          return (
            <TripCard key={trip.dispatch_id}>
              <TripHeader>
                <TripLabel>
                  <Route size={14} />
                  {trip.trip_name || 'Dispatch Trip'}
                </TripLabel>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <StatusBadge status={trip.status || 'Assigned'}>
                    {trip.status || 'Assigned'}
                  </StatusBadge>
                  <DateBadge>
                    <Calendar size={14} />
                    {new Date(trip.dispatch_date).toLocaleDateString()}
                  </DateBadge>
                </div>
              </TripHeader>

              <VehicleInfo>
                <Car size={16} color={Colors.accentBlue} />
                <strong style={{ fontSize: '0.9rem' }}>{trip.vehicle_plate}</strong>
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

              {trip.driver_name && (
                <DriverInfo>
                  <Users size={16} color={Colors.accentBlue} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{trip.driver_name}</div>
                    <div style={{ fontSize: '0.75rem', color: Colors.textSecondary }}>
                      📞 {trip.driver_contact || trip.driver_phone}
                    </div>
                  </div>
                </DriverInfo>
              )}

              <RouteInfo>
                <Location>
                  <MapPin size={14} color="#10B981" />
                  <span style={{ fontSize: '0.85rem' }}>{trip.origin_address}</span>
                </Location>
                <Arrow>→</Arrow>
                <Location>
                  <MapPin size={14} color="#EF4444" />
                  <span style={{ fontSize: '0.85rem' }}>{trip.destination_address}</span>
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
                    Fuel: {trip.fuel_estimate}L (KES {trip.fuel_cost})
                  </span>
                </FuelEstimate>
              )}

              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}
              >
                <Stat style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                  <DollarSign size={14} style={{ display: 'inline', marginRight: '2px' }} />
                  {displayPrice.toLocaleString()}
                  <span
                    style={{ color: Colors.textSecondary, marginLeft: '4px', fontSize: '0.75rem' }}
                  >
                    {trip.negotiated_price ? '(final)' : '(est.)'}
                  </span>
                </Stat>

                <ActionButtons>
                  {trip.driver_contact && (
                    <WhatsAppButton onClick={() => sendToDriverWhatsApp(trip)} disabled={isSendingWhatsApp}>
                      {isSendingWhatsApp ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <WhatsApp size={14} />
                      )}
                      Send to Driver
                    </WhatsAppButton>
                  )}
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

      <ModalOverlay style={{ display: showModal ? 'flex' : 'none' }}>
        <ModalContent>
          <ModalHeader>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
              {editingId ? 'Edit Dispatch' : 'New Vehicle Dispatch'}
            </h3>
            <CloseButton
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              <X size={18} />
            </CloseButton>
          </ModalHeader>

          {/* Left Column - Trip Details */}
          <div>
            <FormGroup>
              <Label>Trip Name</Label>
              <Input
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g., Funeral Day, Body Collection"
              />
            </FormGroup>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormGroup>
                <Label>Dispatch Date *</Label>
                <Input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Dispatch Time</Label>
                <Input
                  type="time"
                  value={dispatchTime}
                  onChange={(e) => setDispatchTime(e.target.value)}
                  defaultValue="09:00"
                />
              </FormGroup>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormGroup>
                <Label>Vehicle Plate *</Label>
                <Input
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="KCA 123A"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Vehicle Name</Label>
                <Input
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder="e.g., Mercedes Hearse"
                />
              </FormGroup>
            </div>

            <FormGroup>
              <Label>Engine CC</Label>
              <Input
                value={vehicleCC}
                onChange={(e) => setVehicleCC(e.target.value)}
                placeholder="e.g., 2000"
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

            {/* Driver Information */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#dbeafe10', borderRadius: '0.5rem', border: `1px solid ${Colors.accentBlue}30` }}>
              <Label style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={14} /> Driver Information
              </Label>

              <FormGroup>
                <Label>Driver Name *</Label>
                <Input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Driver full name"
                  required
                />
              </FormGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormGroup>
                  <Label>Driver Phone *</Label>
                  <Input
                    value={driverContact}
                    onChange={(e) => setDriverContact(e.target.value)}
                    placeholder="+2547XXXXXXXX"
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Alt. Phone</Label>
                  <Input
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="Optional"
                  />
                </FormGroup>
              </div>
            </div>

            <FormGroup style={{ position: 'relative', marginTop: '1rem' }}>
              <Label>Destination *</Label>
              <Input
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  searchLocation(e.target.value);
                }}
                placeholder="Search destination address"
                required
              />
              {isSearching && (
                <div style={{ position: 'absolute', right: '10px', top: '35px' }}>
                  <Loader2 size={16} className="animate-spin" />
                </div>
              )}
              {searchResults.length > 0 && (
                <SearchResults>
                  {searchResults.map((result, idx) => (
                    <SearchResultItem key={idx} onClick={() => handleDestinationSelect(result)}>
                      <div style={{ fontWeight: 500 }}>{result.name}</div>
                      <div style={{ fontSize: '0.75rem', color: Colors.textSecondary }}>
                        {result.address}
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
              />
              <small
                style={{ color: Colors.textSecondary, marginTop: '0.25rem', display: 'block', fontSize: '0.75rem' }}
              >
                This will override the calculated estimate
              </small>
            </FormGroup>
          </div>

          {/* Right Column - Map & Summary */}
          <div>
            <MapContainer>
              <iframe src={getMapUrl()} title="Route Map" loading="lazy" />
              {distance && routeSteps.length > 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  background: 'white',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.7rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}>
                  🗺️ Powered by OpenStreetMap & OSRM
                </div>
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
                  <span>💰 Transport ({ratePerKm}/km):</span> <strong>KES {transportCost}</strong>
                </p>
                {fuelCost && (
                  <>
                    <p>
                      <span>⛽ Fuel:</span>{' '}
                      <strong>
                        {fuelEstimate}L (KES {fuelCost})
                      </strong>
                    </p>
                    <p
                      style={{
                        borderTop: `1px solid ${Colors.borderColor}`,
                        marginTop: '0.5rem',
                        paddingTop: '0.5rem',
                        fontWeight: 'bold',
                      }}
                    >
                      <span>💰 Total estimate:</span>
                      <strong style={{ color: Colors.successGreen }}>KES {totalCost}</strong>
                    </p>
                  </>
                )}
              </SummaryBox>
            )}

            {routeSteps.length > 0 && (
              <div style={{
                background: Colors.progressBg,
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                maxHeight: '150px',
                overflowY: 'auto',
              }}>
                <Label style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Navigation size={14} /> Route Directions
                </Label>
                {routeSteps.map((step, index) => (
                  <RouteStep key={index}>
                    <span className="step-number">{index + 1}</span>
                    <span className="step-text">
                      {step.instruction} {step.name && `onto ${step.name}`}
                      {step.distance && ` (${step.distance} km)`}
                    </span>
                  </RouteStep>
                ))}
              </div>
            )}

            <StyledButton
              onClick={handleSubmit}
              disabled={
                isLoading ||
                !destinationLat ||
                !vehiclePlate ||
                !dispatchDate ||
                !ratePerKm ||
                !driverName ||
                !driverContact
              }
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} /> {editingId ? 'Update' : 'Create'} Dispatch
                </>
               )}
            </StyledButton>

            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fef3c720', borderRadius: '0.5rem', fontSize: '0.75rem', color: Colors.textSecondary, border: `1px solid ${Colors.warningOrange}30` }}>
              <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Routes calculated using OpenStreetMap & OSRM (free, open-source)
            </div>
          </div>
        </ModalContent>
      </ModalOverlay>
    </DispatchContainer>
  );
};

export default DispatchSection;
