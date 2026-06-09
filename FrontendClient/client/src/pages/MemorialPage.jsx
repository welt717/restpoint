import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  Heart,
  MapPin,
  Calendar,
  Clock,
  Users,
  MessageCircle,
  Share2,
  ArrowLeft,
  Image,
  Video,
  Sparkles,
  Flame,
  Send,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import api from '../api/client';

// Theme Colors
const Colors = {
  primaryDark: '#1e293b',
  primaryDarker: '#0f172a',
  accentGold: '#C9A84C',
  accentBlue: '#3b82f6',
  white: '#FFFFFF',
  lightGray: '#F7F9FB',
  mediumGray: '#E9ECEF',
  darkGray: '#64748B',
  successGreen: '#1DB954',
  dangerRed: '#C0392B',
  warningYellow: '#F39C12',
  textPrimary: '#1a1a1a',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  borderGray: '#E5E7EB',
};

// Container
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
`;

// Navigation Bar
const NavBar = styled.nav`
  background: ${Colors.white};
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 8px rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const BrandLogo = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, ${Colors.accentGold} 0%, #e8c96a 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #1a1a1a;
  font-size: 0.9rem;
`;

const BrandText = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: ${Colors.textPrimary};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: ${Colors.lightGray};
  border: none;
  border-radius: 10px;
  color: ${Colors.textPrimary};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${Colors.mediumGray};
  }
`;

// Hero Section
const HeroSection = styled.section`
  background: linear-gradient(135deg, ${Colors.primaryDark} 0%, ${Colors.primaryDarker} 100%);
  padding: 4rem 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.05)"/></svg>');
    background-size: 50px 50px;
    opacity: 0.5;
  }
`;

const ProfilePhoto = styled.div`
  width: 180px;
  height: 180px;
  border-radius: 50%;
  margin: 0 auto 1.5rem;
  overflow: hidden;
  border: 4px solid ${Colors.accentGold};
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  background: ${Colors.mediumGray};
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const HeroName = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${Colors.white};
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
`;

const HeroDates = styled.p`
  font-size: 1.125rem;
  color: ${Colors.accentGold};
  margin: 0 0 1rem;
  font-weight: 500;
`;

const TributeMessage = styled.p`
  font-size: 1.125rem;
  color: rgba(255,255,255,0.8);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
  font-style: italic;
`;

// Candle Counter
const CandleCounter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255,255,255,0.1);
  border-radius: 50px;
  display: inline-flex;
`;

const CandleIcon = styled(Flame)`
  color: ${Colors.warningYellow};
`;

const CandleCount = styled.span`
  color: ${Colors.white};
  font-weight: 600;
  font-size: 1rem;
`;

// Main Content
const MainContent = styled.main`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
`;

// Section
const Section = styled.section`
  background: ${Colors.white};
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid ${Colors.borderGray};
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${Colors.textPrimary};
  margin: 0 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SectionIcon = styled.div`
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, ${Colors.accentGold}20 0%, ${Colors.accentGold}10 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${Colors.accentGold};
`;

// Biography
const Biography = styled.p`
  font-size: 1rem;
  line-height: 1.8;
  color: ${Colors.textSecondary};
  white-space: pre-wrap;
`;

// Gallery
const Gallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
`;

const GalleryImage = styled.div`
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: ${Colors.lightGray};
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// Funeral Details
const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const DetailCard = styled.div`
  padding: 1.25rem;
  background: ${Colors.lightGray};
  border-radius: 12px;
  border: 1px solid ${Colors.borderGray};
`;

const DetailLabel = styled.p`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${Colors.textMuted};
  font-weight: 600;
  margin: 0 0 0.5rem;
`;

const DetailValue = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: ${Colors.textPrimary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// Map
const MapContainer = styled.div`
  margin-top: 1.5rem;
  border-radius: 12px;
  overflow: hidden;
  height: 250px;
  background: ${Colors.lightGray};

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

// Family Message
const FamilyMessage = styled.blockquote`
  background: linear-gradient(135deg, ${Colors.accentGold}10 0%, ${Colors.accentGold}05 100%);
  border-left: 4px solid ${Colors.accentGold};
  padding: 1.5rem;
  border-radius: 12px;
  font-style: italic;
  color: ${Colors.textSecondary};
  line-height: 1.7;
  margin: 0;
`;

// Condolence Wall
const CondolenceForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Input = styled.input`
  padding: 0.875rem 1rem;
  border: 2px solid ${Colors.borderGray};
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: ${Colors.accentGold};
  }
`;

const TextArea = styled.textarea`
  padding: 0.875rem 1rem;
  border: 2px solid ${Colors.borderGray};
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s ease;
  font-family: inherit;

  &:focus {
    border-color: ${Colors.accentGold};
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, ${Colors.accentGold} 0%, #b8943e 100%);
  color: ${Colors.white};
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(201, 168, 76, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Condolence List
const CondolenceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CondolenceCard = styled.div`
  padding: 1.25rem;
  background: ${Colors.lightGray};
  border-radius: 12px;
  border: 1px solid ${Colors.borderGray};
`;

const CondolenceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const CondolenceAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${Colors.accentBlue} 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${Colors.white};
  font-weight: 600;
  font-size: 0.9rem;
`;

const CondolenceMeta = styled.div`
  flex: 1;
`;

const CondolenceName = styled.p`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${Colors.textPrimary};
  margin: 0;
`;

const CondolenceTime = styled.p`
  font-size: 0.75rem;
  color: ${Colors.textMuted};
  margin: 0;
`;

const CondolenceMessage = styled.p`
  font-size: 0.9rem;
  line-height: 1.6;
  color: ${Colors.textSecondary};
  margin: 0;
`;

// Virtual Candles
const CandleSection = styled.div`
  text-align: center;
`;

const LightCandleButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, ${Colors.warningYellow} 0%, #e08e0b 100%);
  color: ${Colors.white};
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 2rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(243, 156, 18, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CandlesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
`;

const CandleItem = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, ${Colors.warningYellow}20 0%, ${Colors.warningYellow}10 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: flicker 2s ease-in-out infinite;

  @keyframes flicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

// Memories & Tributes
const MemoryForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: ${Colors.lightGray};
  border: 2px dashed ${Colors.borderGray};
  border-radius: 10px;
  color: ${Colors.textSecondary};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${Colors.accentGold};
    color: ${Colors.accentGold};
  }
`;

// Share Modal
const ShareBar = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid ${Colors.borderGray};
`;

const ShareButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: ${Colors.lightGray};
  border: 1px solid ${Colors.borderGray};
  border-radius: 8px;
  font-size: 0.85rem;
  color: ${Colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${Colors.mediumGray};
  }
`;

// Loading State
const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${Colors.borderGray};
  border-top-color: ${Colors.accentGold};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 2rem auto;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Error State
const ErrorState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${Colors.dangerRed};
`;

// Success Toast
const Toast = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  background: ${Colors.successGreen};
  color: ${Colors.white};
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

// Main Component
const MemorialPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [memorial, setMemorial] = useState(null);
  const [error, setError] = useState(null);
  const [candleCount, setCandleCount] = useState(0);
  const [condolences, setCondolences] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form states
  const [condolenceName, setCondolenceName] = useState('');
  const [condolenceMessage, setCondolenceMessage] = useState('');
  const [memoryName, setMemoryName] = useState('');
  const [memoryText, setMemoryText] = useState('');

  useEffect(() => {
    fetchMemorialData();
    fetchCandleCount();
    fetchCondolences();
  }, [slug]);

  const fetchMemorialData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/memorial/${slug}`);
      setMemorial(response.data.data);
    } catch (err) {
      console.error('Error fetching memorial:', err);
      setError('Memorial not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchCandleCount = async () => {
    try {
      const response = await api.get(`/api/v1/memorial/${slug}/candles`);
      setCandleCount(response.data.data?.count || 0);
    } catch (err) {
      console.error('Error fetching candles:', err);
    }
  };

  const fetchCondolences = async () => {
    try {
      const response = await api.get(`/api/v1/memorial/${slug}/condolences`);
      setCondolences(response.data.data || []);
    } catch (err) {
      console.error('Error fetching condolences:', err);
    }
  };

  const handleLightCandle = async () => {
    try {
      await api.post(`/api/v1/memorial/${slug}/candles`, {
        visitorName: 'Anonymous'
      });
      setCandleCount(prev => prev + 1);
      showNotification('Candle lit successfully 🕯️');
    } catch (err) {
      console.error('Error lighting candle:', err);
    }
  };

  const handlePostCondolence = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/v1/memorial/${slug}/condolences`, {
        visitorName: condolenceName,
        message: condolenceMessage
      });
      setCondolenceName('');
      setCondolenceMessage('');
      fetchCondolences();
      showNotification('Condolence message posted 🤍');
    } catch (err) {
      console.error('Error posting condolence:', err);
    }
  };

  const handlePostMemory = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/v1/memorial/${slug}/memories`, {
        visitorName: memoryName,
        message: memoryText
      });
      setMemoryName('');
      setMemoryText('');
      showNotification('Memory shared successfully 💐');
    } catch (err) {
      console.error('Error posting memory:', err);
    }
  };

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `In loving memory of ${memorial?.deceased?.full_name}`;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      default:
        navigator.clipboard.writeText(url);
        showNotification('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  if (error || !memorial) {
    return (
      <Container>
        <NavBar>
          <NavBrand>
            <BrandLogo>RP</BrandLogo>
            <BrandText>Rest Point</BrandText>
          </NavBrand>
        </NavBar>
        <ErrorState>
          <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
          <h2>Memorial Not Found</h2>
          <p>The memorial page you're looking for doesn't exist or has been removed.</p>
          <SubmitButton onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
            Go Home
          </SubmitButton>
        </ErrorState>
      </Container>
    );
  }

  const deceased = memorial.deceased || {};
  const funeralDetails = memorial.funeral_details || {};
  const burialDetails = memorial.burial_details || {};

  return (
    <Container>
      {/* Navigation */}
      <NavBar>
        <NavBrand>
          <BrandLogo>RP</BrandLogo>
          <BrandText>Rest Point Memorial</BrandText>
        </NavBrand>
        <BackButton onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
          Back to Home
        </BackButton>
      </NavBar>

      {/* Hero Section */}
      <HeroSection>
        <ProfilePhoto>
          {deceased.profile_photo ? (
            <img src={deceased.profile_photo} alt={deceased.full_name} />
          ) : (
            <User size={64} color={Colors.darkGray} />
          )}
        </ProfilePhoto>
        <HeroName>{deceased.full_name}</HeroName>
        <HeroDates>
          {deceased.date_of_birth} — {deceased.date_of_death}
        </HeroDates>
        {memorial.tribute_message && (
          <TributeMessage>"{memorial.tribute_message}"</TributeMessage>
        )}
        <CandleCounter>
          <CandleIcon size={20} />
          <CandleCount>{candleCount.toLocaleString()} Candles Lit</CandleCount>
        </CandleCounter>
      </HeroSection>

      {/* Main Content */}
      <MainContent>
        {/* Biography */}
        {memorial.biography && (
          <Section>
            <SectionTitle>
              <SectionIcon><Users size={18} /></SectionIcon>
              Biography
            </SectionTitle>
            <Biography>{memorial.biography}</Biography>
          </Section>
        )}

        {/* Gallery */}
        {memorial.gallery && memorial.gallery.length > 0 && (
          <Section>
            <SectionTitle>
              <SectionIcon><Image size={18} /></SectionIcon>
              Photo Gallery
            </SectionTitle>
            <Gallery>
              {memorial.gallery.map((photo, idx) => (
                <GalleryImage key={idx}>
                  <img src={photo} alt={`Gallery image ${idx + 1}`} />
                </GalleryImage>
              ))}
            </Gallery>
          </Section>
        )}

        {/* Funeral Information */}
        {(funeralDetails.viewing_date || funeralDetails.service_date || funeralDetails.venue) && (
          <Section>
            <SectionTitle>
              <SectionIcon><Calendar size={18} /></SectionIcon>
              Funeral Information
            </SectionTitle>
            <DetailsGrid>
              {funeralDetails.viewing_date && (
                <DetailCard>
                  <DetailLabel>Viewing</DetailLabel>
                  <DetailValue>
                    <Calendar size={16} />
                    {funeralDetails.viewing_date}
                  </DetailValue>
                </DetailCard>
              )}
              {funeralDetails.service_date && (
                <DetailCard>
                  <DetailLabel>Funeral Service</DetailLabel>
                  <DetailValue>
                    <Clock size={16} />
                    {funeralDetails.service_date}
                  </DetailValue>
                </DetailCard>
              )}
              {funeralDetails.venue && (
                <DetailCard>
                  <DetailLabel>Venue</DetailLabel>
                  <DetailValue>
                    <MapPin size={16} />
                    {funeralDetails.venue}
                  </DetailValue>
                </DetailCard>
              )}
            </DetailsGrid>
            {funeralDetails.directions && (
              <p style={{ marginTop: '1rem', color: Colors.textSecondary, lineHeight: 1.6 }}>
                <strong>Directions:</strong> {funeralDetails.directions}
              </p>
            )}
            {funeralDetails.google_maps_link && (
              <MapContainer>
                <iframe
                  src={funeralDetails.google_maps_link}
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  title="Map location"
                />
              </MapContainer>
            )}
          </Section>
        )}

        {/* Burial Information */}
        {(burialDetails.date || burialDetails.location) && (
          <Section>
            <SectionTitle>
              <SectionIcon><MapPin size={18} /></SectionIcon>
              Burial Information
            </SectionTitle>
            <DetailsGrid>
              {burialDetails.date && (
                <DetailCard>
                  <DetailLabel>Burial Date</DetailLabel>
                  <DetailValue>
                    <Calendar size={16} />
                    {burialDetails.date}
                  </DetailValue>
                </DetailCard>
              )}
              {burialDetails.location && (
                <DetailCard>
                  <DetailLabel>Cemetery</DetailLabel>
                  <DetailValue>
                    <MapPin size={16} />
                    {burialDetails.location}
                  </DetailValue>
                </DetailCard>
              )}
            </DetailsGrid>
          </Section>
        )}

        {/* Family Message */}
        {memorial.family_message && (
          <Section>
            <SectionTitle>
              <SectionIcon><Heart size={18} /></SectionIcon>
              Family Message
            </SectionTitle>
            <FamilyMessage>
              {memorial.family_message}
            </FamilyMessage>
          </Section>
        )}

        {/* Virtual Candles */}
        <Section>
          <CandleSection>
            <SectionTitle style={{ justifyContent: 'center' }}>
              <SectionIcon><Flame size={18} /></SectionIcon>
              Light a Candle
            </SectionTitle>
            <LightCandleButton onClick={handleLightCandle}>
              <Sparkles size={20} />
              Light a Candle 🕯️
            </LightCandleButton>
            <p style={{ color: Colors.textMuted, fontSize: '0.9rem' }}>
              Join {candleCount.toLocaleString()} others who have lit a candle in remembrance
            </p>
          </CandleSection>
        </Section>

        {/* Condolence Wall */}
        <Section>
          <SectionTitle>
            <SectionIcon><MessageCircle size={18} /></SectionIcon>
            Condolence Wall
          </SectionTitle>
          
          <CondolenceForm onSubmit={handlePostCondolence}>
            <Input
              type="text"
              placeholder="Your name"
              value={condolenceName}
              onChange={(e) => setCondolenceName(e.target.value)}
              required
            />
            <TextArea
              placeholder="Share a message of condolence..."
              value={condolenceMessage}
              onChange={(e) => setCondolenceMessage(e.target.value)}
              required
            />
            <SubmitButton type="submit">
              <Send size={18} />
              Post Message
            </SubmitButton>
          </CondolenceForm>

          <CondolenceList>
            {condolences.map((condolence) => (
              <CondolenceCard key={condolence.id}>
                <CondolenceHeader>
                  <CondolenceAvatar>
                    {condolence.visitor_name?.charAt(0)?.toUpperCase() || 'A'}
                  </CondolenceAvatar>
                  <CondolenceMeta>
                    <CondolenceName>{condolence.visitor_name}</CondolenceName>
                    <CondolenceTime>
                      {new Date(condolence.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CondolenceTime>
                  </CondolenceMeta>
                </CondolenceHeader>
                <CondolenceMessage>{condolence.message}</CondolenceMessage>
              </CondolenceCard>
            ))}
          </CondolenceList>
        </Section>

        {/* Memories & Tributes */}
        <Section>
          <SectionTitle>
            <SectionIcon><Heart size={18} /></SectionIcon>
            Memories & Tributes
          </SectionTitle>
          
          <MemoryForm onSubmit={handlePostMemory}>
            <Input
              type="text"
              placeholder="Your name"
              value={memoryName}
              onChange={(e) => setMemoryName(e.target.value)}
              required
            />
            <TextArea
              placeholder="Share a memory or tribute..."
              value={memoryText}
              onChange={(e) => setMemoryText(e.target.value)}
              required
            />
            <UploadButton>
              <Image size={18} />
              Add Photo (Optional)
              <FileInput type="file" accept="image/*,video/*" />
            </UploadButton>
            <SubmitButton type="submit">
              <Heart size={18} />
              Share Memory
            </SubmitButton>
          </MemoryForm>
        </Section>

        {/* Share */}
        <ShareBar>
          <ShareButton onClick={() => handleShare('facebook')}>
            <Share2 size={16} />
            Facebook
          </ShareButton>
          <ShareButton onClick={() => handleShare('twitter')}>
            <Share2 size={16} />
            Twitter
          </ShareButton>
          <ShareButton onClick={() => handleShare('whatsapp')}>
            <Share2 size={16} />
            WhatsApp
          </ShareButton>
          <ShareButton onClick={() => handleShare('copy')}>
            <Share2 size={16} />
            Copy Link
          </ShareButton>
        </ShareBar>
      </MainContent>

      {/* Toast Notification */}
      {showToast && (
        <Toast>
          <CheckCircle size={20} />
          {toastMessage}
        </Toast>
      )}
    </Container>
  );
};

export default MemorialPage;