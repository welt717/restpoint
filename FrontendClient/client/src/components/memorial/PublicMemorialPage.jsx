import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Heart, MessageCircle, Share2,  Clock, MapPin, Calendar } from 'lucide-react';
import api from '../../api/axios';
import { ENDPOINTS } from '../../api/endpoints';

// Candle flicker animation
const flicker = keyframes`
  0%, 100% { opacity: 1; transform: scaleY(1); }
  25% { opacity: 0.9; transform: scaleY(0.98); }
  50% { opacity: 1; transform: scaleY(1.02); }
  75% { opacity: 0.95; transform: scaleY(0.99); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(255, 165, 0, 0.3); }
  50% { box-shadow: 0 0 40px rgba(255, 165, 0, 0.5); }
`;

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0e1a 0%, #111827 50%, #0f172a 100%);
  color: #e2e8f0;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%);
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  animation: ${fadeIn} 0.8s ease;
`;

const ProfilePhoto = styled.div`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e293b, #334155);
  border: 4px solid #A67C52;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  animation: ${glowPulse} 3s ease-in-out infinite;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Name = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
  text-align: center;
`;

const Dates = styled.p`
  color: #94a3b8;
  font-size: 1rem;
  margin: 0;
`;

const CandleRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 2rem 0;
  animation: ${fadeIn} 1s ease;
`;

const Candle = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
  &:hover { transform: scale(1.1); }
`;

const Flame = styled.div`
  width: 20px;
  height: 30px;
  background: radial-gradient(ellipse at bottom, #ffd700 0%, #ff8c00 40%, #ff4500 70%, transparent 100%);
  border-radius: 50% 50% 20% 20%;
  animation: ${flicker} 0.8s ease-in-out infinite;
  filter: blur(0.5px);
  position: relative;
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 30px;
    height: 10px;
    background: radial-gradient(ellipse, rgba(255,165,0,0.3), transparent);
    border-radius: 50%;
  }
`;

const CandleBody = styled.div`
  width: 12px;
  height: 40px;
  background: linear-gradient(180deg, #f5f5dc 0%, #ddd 100%);
  border-radius: 2px;
  margin-top: -5px;
`;

const CandleCount = styled.span`
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.5rem;
`;

const ContentArea = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem 3rem;
`;

const PostForm = styled.div`
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.6s ease;
`;

const PostInput = styled.textarea`
  width: 100%;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0.75rem;
  padding: 1rem;
  color: #e2e8f0;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: #A67C52;
  }
  &::placeholder { color: #64748b; }
`;

const PostActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
`;



const PostButton = styled.button`
  padding: 0.6rem 1.5rem;
  background: linear-gradient(135deg, #A67C52 0%, #C9A876 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { opacity: 0.9; transform: translateY(-1px); }
`;

const PhotoButton = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0.5rem;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  &:hover { background: rgba(148, 163, 184, 0.2); color: #e2e8f0; }
`;

const PostCard = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  animation: ${fadeIn} 0.5s ease;
`;

const PostHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const PostAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A67C52, #C9A876);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
`;

const PostAuthor = styled.div`
  font-weight: 600;
  color: #f1f5f9;
  font-size: 0.9rem;
`;

const PostTime = styled.div`
  font-size: 0.75rem;
  color: #64748b;
`;

const PostContent = styled.p`
  color: #cbd5e1;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 1rem;
`;

const PostImage = styled.img`
  width: 100%;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  max-height: 400px;
  object-fit: cover;
`;

const PostReactions = styled.div`
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
`;



const ReactionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  color: ${props => props.active ? '#ef4444' : '#64748b'};
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  &:hover { color: #ef4444; }
`;

const ProgramCard = styled.div`
  background: rgba(166, 124, 82, 0.1);
  border: 1px solid rgba(166, 124, 82, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const ProgramTitle = styled.h3`
  color: #A67C52;
  font-size: 1rem;
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const EventItem = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  &:last-child { border-bottom: none; }
`;

const EventTime = styled.div`
  color: #A67C52;
  font-weight: 600;
  font-size: 0.85rem;
  min-width: 80px;
`;

const EventDesc = styled.div`
  color: #e2e8f0;
  font-size: 0.9rem;
`;

const PublicMemorialPage = () => {
  const { tenantSlug, deceasedId } = useParams();
  const [deceased, setDeceased] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [candles, setCandles] = useState(0);
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    setShareUrl(window.location.href);
    fetchMemorialData();
  }, [tenantSlug, deceasedId]);

  const fetchMemorialData = async () => {
    try {
      const response = await api.get(
        ENDPOINTS.PUBLIC.DECEASED_RECORD(tenantSlug, deceasedId),
        { headers: { 'x-tenant-slug': tenantSlug } }
      );
      

      setDeceased(response.data?.data || response.data);
      
      // Fetch real candles count
      try {
        const candlesRes = await api.get(
          ENDPOINTS.MEMORIAL.CANDLES(tenantSlug),
          { headers: { 'x-tenant-slug': tenantSlug } }
        );
        setCandles(candlesRes.data?.count || candlesRes.data?.data?.length || 0);
      } catch (e) {
        setCandles(0);
      }

      // Fetch real condolences/posts
      try {
        const postsRes = await api.get(
          ENDPOINTS.MEMORIAL.CONDOLENCES(tenantSlug),
          { headers: { 'x-tenant-slug': tenantSlug } }
        );
        const apiPosts = postsRes.data?.data || postsRes.data || [];
        setPosts(Array.isArray(apiPosts) ? apiPosts.map(p => ({
          id: p.id,
          author: p.author_name || p.name || 'Visitor',
          content: p.message || p.content,
          time: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'recent',
          likes: p.likes || 0,
          comments: p.comments || 0
        })) : []);
      } catch (e) {
        setPosts([]);
      }

      // Fetch real funeral program from backend
      try {
        const programRes = await api.get(
          ENDPOINTS.MEMORIAL.PROGRAM(tenantSlug),
          { headers: { 'x-tenant-slug': tenantSlug } }
        );
        const progData = programRes.data?.data || programRes.data || null;
        if (progData) {
          // Handle both array format and object with events array
          const events = Array.isArray(progData) ? progData : (progData.events || []);
          setProgram(events.length > 0 ? events : null);
        }
      } catch (e) {
        setProgram(null);
      }
    } catch (error) {
      console.error('Error loading memorial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLightCandle = async () => {
    try {
      await api.post(
        ENDPOINTS.MEMORIAL.LIGHT(tenantSlug),
        {},
        { headers: { 'x-tenant-slug': tenantSlug } }
      );
      setCandles(prev => prev + 1);
    } catch (e) {
      // Fallback to local count
      setCandles(prev => prev + 1);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    try {
      const res = await api.post(
        ENDPOINTS.MEMORIAL.ADD_CONDOLENCE(tenantSlug),
        { message: newPost, deceased_id: deceasedId },
        { headers: { 'x-tenant-slug': tenantSlug } }
      );
      const newPostData = {
        id: res.data?.id || Date.now(),
        author: 'Visitor',
        content: newPost,
        time: 'Just now',
        likes: 0,
        comments: 0,
      };
      setPosts(prev => [newPostData, ...prev]);
      setNewPost('');
    } catch (e) {
      // Fallback: Add locally
      const post = {
        id: Date.now(),
        author: 'Visitor',
        content: newPost,
        time: 'Just now',
        likes: 0,
        comments: 0,
      };
      setPosts(prev => [post, ...prev]);
      setNewPost('');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `In Memory of ${deceased?.full_name || ' Loved One'}`, url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#94a3b8' }}>
          <div style={{ textAlign: 'center' }}>
            <Flame size={48} color="#A67C52" style={{ marginBottom: '1rem' }} />
            <p>Loading memorial...</p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header with Profile */}
      <Header>
        <ProfileSection>
          <ProfilePhoto>
            {deceased?.photo_url ? (
              <img src={deceased.photo_url} alt={deceased.full_name} />
            ) : (
              <span>🕊️</span>
            )}
          </ProfilePhoto>
          <Name>{deceased?.full_name || 'In Loving Memory'}</Name>
          <Dates>
            {deceased?.date_of_death ? new Date(deceased.date_of_death).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
            {deceased?.date_of_birth ? ` — ${new Date(deceased.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
          </Dates>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', margin: '0.5rem 0' }}>
            "Forever in our hearts"
          </p>
        </ProfileSection>
      </Header>

      {/* Candle Section */}
      <CandleRow>
        <Candle onClick={handleLightCandle}>
          <Flame />
          <CandleBody />
          <CandleCount>{candles} candles lit</CandleCount>
        </Candle>
        <Candle onClick={handleLightCandle}>
          <Flame style={{ animationDelay: '0.3s' }} />
          <CandleBody />
          <CandleCount>Light a candle</CandleCount>
        </Candle>
        <Candle onClick={handleLightCandle}>
          <Flame style={{ animationDelay: '0.6s' }} />
          <CandleBody />
          <CandleCount>Share love</CandleCount>
        </Candle>
      </CandleRow>

      <ContentArea>
        {/* Funeral Program — pulled from backend, only shows if data exists */}
        {program && program.length > 0 && (
          <ProgramCard>
            <ProgramTitle><Clock size={16} /> Order of Events</ProgramTitle>
            {program.map((event, idx) => (
              <EventItem key={idx}>
                <EventTime>{event.time || event.event_time || `Event ${idx + 1}`}</EventTime>
                <EventDesc>{event.description || event.title || event.event_name}</EventDesc>
              </EventItem>
            ))}
          </ProgramCard>
        )}

        {/* Post Form */}
        <PostForm>
          <PostInput
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share a memory, prayer, or tribute..."
          />
          <PostActions>
            <PhotoButton>
              📷 Add Photo
              <input type="file" accept="image/*" style={{ display: 'none' }} />
            </PhotoButton>
            <PostButton onClick={handlePost}>Post Tribute</PostButton>
          </PostActions>
        </PostForm>

        {/* Posts */}
        {posts.map(post => (
          <PostCard key={post.id}>
            <PostHeader>
              <PostAvatar>{post.author[0]}</PostAvatar>
              <div>
                <PostAuthor>{post.author}</PostAuthor>
                <PostTime>{post.time}</PostTime>
              </div>
            </PostHeader>
            <PostContent>{post.content}</PostContent>
            <PostReactions>
              <ReactionBtn>❤️ {post.likes}</ReactionBtn>
              <ReactionBtn>💬 {post.comments}</ReactionBtn>
              <ReactionBtn onClick={handleShare}>🔗 Share</ReactionBtn>
            </PostReactions>
          </PostCard>
        ))}

        {/* Share Button */}
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <PostButton onClick={handleShare} style={{ padding: '0.8rem 2rem' }}>
            🔗 Share Memorial Link
          </PostButton>
        </div>
      </ContentArea>
    </Container>
  );
};

export default PublicMemorialPage;
