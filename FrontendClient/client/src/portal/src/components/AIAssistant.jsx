import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  Send,
  Mic,
  Search,
  FileText,
  X,
  Minimize2,
  Maximize2,
  Loader,
  Copy,
  Share2,
  Phone,
  MessageCircle,
  Trash2,
  CreditCard,
  Bot,
  User,
  ChevronRight,
  MessageSquare,
  Sparkles,
  HelpCircle,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import api from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';

// Colors - Matching listDeceased style
const Colors = {
  primaryDark: '#2C3E50',
  accentBlue: '#1e293b',
  white: '#FFFFFF',
  lightGray: '#F7F9FB',
  mediumGray: '#E9ECEF',
  darkGray: '#1e293b',
  successGreen: '#1DB954',
  dangerRed: '#C0392B',
  warningYellow: '#F39C12',
  infoBlue: '#1e293b',
  tableBorder: '#E9ECEF',
  headerBg: '#1e293b',
  hoverGray: '#F0F3F5',
  statusReceived: '#6A0572',
  statusUnderCare: '#F39C12',
  statusReady: '#1DB954',
  statusCompleted: '#C0392B',
};

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Floating Action Button - AI Assistant (Not Search!)
const AssistantButton = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${Colors.headerBg} 0%, ${Colors.accentBlue} 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(30, 41, 59, 0.3);
  transition: all 0.3s ease;
  z-index: 1001;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 8px 30px rgba(30, 41, 59, 0.4);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 22px;
  height: 22px;
  border-radius: 11px;
  background: ${Colors.dangerRed};
  color: white;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border: 2px solid white;
`;

// Main Container
const AssistantContainer = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 1000;
`;

// Chat Window
const ChatWindow = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  width: ${props => props.isExpanded ? '100%' : '450px'};
  height: ${props => props.isExpanded ? '100%' : '680px'};
  background: ${Colors.lightGray};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 0.3s ease;
  border-top-left-radius: ${props => props.isExpanded ? '0' : '12px'};
  border: 1px solid ${Colors.tableBorder};

  @media (max-width: 768px) {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
`;

// Header
const ChatHeader = styled.div`
  background: ${Colors.headerBg};
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.875rem;
`;

const HeaderIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderTitle = styled.div`
  h3 {
    font-size: 1rem;
    font-weight: 700;
    color: white;
    margin: 0;
  }
  p {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const HeaderButton = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
`;

// Messages Area
const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: ${Colors.lightGray};

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${Colors.mediumGray};
    border-radius: 3px;
  }
`;

// Message Bubbles
const Message = styled.div`
  display: flex;
  gap: 0.75rem;
  max-width: 85%;
  animation: ${slideIn} 0.3s ease;

  ${props => props.isUser && css`
    flex-direction: row-reverse;
    margin-left: auto;
  `}
`;

const MessageAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${props => props.isUser ? Colors.infoBlue : Colors.statusReceived};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const MessageBubble = styled.div`
  background: ${props => props.isUser ? Colors.infoBlue : Colors.white};
  padding: 0.875rem 1rem;
  border-radius: 16px;
  border-top-${props => props.isUser ? 'right' : 'left'}-radius: 4px;
  box-shadow: ${props => props.isUser ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.08)'};
  border: ${props => !props.isUser ? `1px solid ${Colors.tableBorder}` : 'none'};
`;

const MessageText = styled.p`
  font-size: 0.875rem;
  line-height: 1.5;
  color: ${props => props.isUser ? 'white' : Colors.darkGray};
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

const MessageTime = styled.span`
  font-size: 0.65rem;
  color: ${props => props.isUser ? 'rgba(255,255,255,0.7)' : Colors.darkGray};
  margin-top: 0.375rem;
  display: block;
  text-align: ${props => props.isUser ? 'right' : 'left'};
`;

// Search Results
const SearchResults = styled.div`
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SearchResultItem = styled.div`
  padding: 0.75rem;
  background: ${Colors.white};
  border-radius: 8px;
  border: 1px solid ${Colors.tableBorder};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${Colors.hoverGray};
    border-color: ${Colors.infoBlue};
  }

  h4 {
    font-size: 0.825rem;
    font-weight: 600;
    color: ${Colors.primaryDark};
    margin: 0 0 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  p {
    font-size: 0.725rem;
    color: ${Colors.darkGray};
    margin: 0;
  }
`;

// Quick Commands Section
const QuickCommandsSection = styled.div`
  padding: 0.75rem 1rem;
  border-top: 1px solid ${Colors.tableBorder};
  background: ${Colors.white};
  flex-shrink: 0;
`;

const QuickCommandsTitle = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${Colors.darkGray};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.625rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const QuickCommandsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const QuickCommandButton = styled.button`
  padding: 0.5rem 0.875rem;
  background: ${Colors.lightGray};
  border: 1px solid ${Colors.tableBorder};
  border-radius: 8px;
  color: ${Colors.primaryDark};
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${Colors.hoverGray};
    border-color: ${Colors.infoBlue};
    color: ${Colors.infoBlue};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Input Area
const InputArea = styled.div`
  padding: 1rem;
  background: ${Colors.white};
  border-top: 1px solid ${Colors.tableBorder};
  flex-shrink: 0;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  background: ${Colors.lightGray};
  border: 2px solid ${Colors.tableBorder};
  border-radius: 12px;
  padding: 0.5rem 0.75rem;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: ${Colors.infoBlue};
    background: ${Colors.white};
  }
`;

const Input = styled.textarea`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: ${Colors.primaryDark};
  font-size: 0.875rem;
  line-height: 1.5;
  resize: none;
  max-height: 100px;
  min-height: 24px;
  font-family: inherit;
  padding: 0;

  &::placeholder {
    color: ${Colors.darkGray};
  }
`;

const SendButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${Colors.infoBlue};
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: ${Colors.accentBlue};
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const VoiceButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${Colors.lightGray};
  border: 1px solid ${Colors.tableBorder};
  color: ${Colors.darkGray};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: ${Colors.hoverGray};
    color: ${Colors.primaryDark};
  }

  &.recording {
    background: ${Colors.dangerRed};
    border-color: ${Colors.dangerRed};
    color: white;
    animation: ${pulse} 1s ease-in-out infinite;
  }
`;

// Welcome Screen
const WelcomeScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  flex: 1;
`;

const WelcomeIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: ${Colors.headerBg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const WelcomeTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${Colors.primaryDark};
  margin: 0 0 0.5rem;
`;

const WelcomeSubtitle = styled.p`
  font-size: 0.875rem;
  color: ${Colors.darkGray};
  margin: 0 0 1.5rem;
  max-width: 280px;
  line-height: 1.5;
`;

const WelcomeActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  width: 100%;
  max-width: 300px;
`;

const WelcomeAction = styled.button`
  padding: 0.875rem 1rem;
  background: ${Colors.white};
  border: 1px solid ${Colors.tableBorder};
  border-radius: 10px;
  color: ${Colors.primaryDark};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  text-align: left;

  &:hover {
    background: ${Colors.hoverGray};
    border-color: ${Colors.infoBlue};
    color: ${Colors.infoBlue};
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  span {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;

// Typing Indicator
const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 0.5rem 0;
`;

const TypingDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${Colors.darkGray};
  animation: ${pulse} 1.4s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.2s;
  }

  &:nth-child(3) {
    animation-delay: 0.4s;
  }
`;

// Share Modal
const ShareModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease;
`;

const ShareModalContent = styled.div`
  background: ${Colors.white};
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: ${fadeIn} 0.3s ease;
`;

const ShareOption = styled.button`
  width: 100%;
  padding: 0.875rem 1rem;
  background: ${Colors.lightGray};
  border: 1px solid ${Colors.tableBorder};
  border-radius: 10px;
  color: ${Colors.primaryDark};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 0.625rem;
  transition: all 0.2s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: ${Colors.hoverGray};
    border-color: ${props => props.color || Colors.infoBlue};
    transform: translateX(4px);
  }

  svg {
    color: ${props => props.color || Colors.infoBlue};
  }
`;

// Main Component
const AIAssistant = ({ userData, tenantSlug, deceasedId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContent, setShareContent] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Quick commands
  const quickCommands = [
    { icon: <Search size={14} />, label: 'Search deceased', command: 'search deceased' },
    { icon: <FileText size={14} />, label: 'Generate documents', command: 'generate documents' },
    { icon: <CreditCard size={14} />, label: 'Payments', command: 'show payments' },
    { icon: <HelpCircle size={14} />, label: 'Help', command: 'help' },
  ];

  const welcomeActions = [
    { icon: <Search size={18} />, label: 'Search deceased records', command: 'search deceased John' },
    { icon: <FileText size={18} />, label: 'Generate death certificate', command: 'generate death certificate' },
    { icon: <CreditCard size={18} />, label: 'Check payment status', command: 'show payments' },
    { icon: <HelpCircle size={18} />, label: 'Get help', command: 'help' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setShowWelcome(true);
    }
  }, [isOpen]);

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  // API call to search service
  const callSearchAPI = async (query) => {
    try {
      const response = await api.post(ENDPOINTS.SEARCH?.GLOBAL || '/api/v1/search/global', {
        query: query,
        track: true
      });
      
      if (response.data?.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Search API error:', error);
      return null;
    }
  };

  const addAssistantMessage = (text, showCommands = false, searchResults = null) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      isUser: false,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      showCommands,
      searchResults
    }]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      isUser: true,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const processCommand = async (command) => {
    if (!command.trim()) return;
    
    setShowWelcome(false);
    setIsLoading(true);
    addUserMessage(command);
    setInputValue('');

    const lowerCommand = command.toLowerCase();

    // Document search commands - Call backend search service
    if (lowerCommand.includes('search') || lowerCommand.includes('find') || lowerCommand.includes('look for')) {
      const searchQuery = command.replace(/search|find|look for/gi, '').trim();
      
      try {
        const searchResults = await callSearchAPI(searchQuery);
        
        if (searchResults && searchResults.results) {
          const results = searchResults.results;
          const resultCount = Object.values(results).flat().length;
          
          if (resultCount > 0) {
            const formattedResults = Object.entries(results).map(([module, items]) => ({
              module,
              items
            }));
            
            addAssistantMessage(
              `I found ${resultCount} result(s) matching "${searchQuery}":`,
              false,
              formattedResults
            );
          } else {
            addAssistantMessage(
              `No results found for "${searchQuery}". Try a different search term.`,
              true
            );
          }
        } else {
          addAssistantMessage(
            `Searching for "${searchQuery}"... Let me help you with that.`,
            true
          );
        }
      } catch (error) {
        addAssistantMessage(
          `I'm searching for "${searchQuery}"... Please hold on.`,
          true
        );
      }
    }
    // Generate document commands
    else if (lowerCommand.includes('generate') || lowerCommand.includes('create') || lowerCommand.includes('certificate')) {
      addAssistantMessage(
        `I can help you generate documents. Available options:\n\n` +
        `📄 Death Certificate\n` +
        `📄 Burial Permit\n` +
        `📄 Cremation Certificate\n\n` +
        `Which document would you like to generate?`,
        true
      );
    }
    // Payment commands
    else if (lowerCommand.includes('payment') || lowerCommand.includes('bill') || lowerCommand.includes('balance') || lowerCommand.includes('pay')) {
      addAssistantMessage(
        `Your current account balance is KES 45,000.\n\n` +
        `Recent transactions:\n` +
        `• KES 10,000 - Service Fee (Paid) ✓\n` +
        `• KES 15,000 - Embalming (Pending)\n` +
        `• KES 20,000 - Casket (Pending)\n\n` +
        `Would you like to make a payment?`,
        true
      );
    }
    // Contact support
    else if (lowerCommand.includes('contact') || lowerCommand.includes('support') || lowerCommand.includes('help')) {
      addAssistantMessage(
        `You can reach our support team:\n\n` +
        `📞 Phone: +254 740 045 355\n` +
        `💬 WhatsApp: Click to chat\n` +
        `📧 Email: support@restpoint.com\n\n` +
        `Our team is available 24/7 to assist you.`,
        true
      );
    }
    // Share commands
    else if (lowerCommand.includes('share') || lowerCommand.includes('send')) {
      setShareContent(command);
      setShowShareModal(true);
      setIsLoading(false);
      return;
    }
    // Status commands
    else if (lowerCommand.includes('status') || lowerCommand.includes('update') || lowerCommand.includes('progress')) {
      addAssistantMessage(
        `Current status for your case:\n\n` +
        `✅ Admission - Completed\n` +
        `✅ Embalming - Completed\n` +
        `🔄 Documentation - In Progress\n` +
        `⏳ Release - Pending\n\n` +
        `Estimated completion: 2-3 business days`,
        true
      );
    }
    // Default response
    else {
      addAssistantMessage(
        `I understand you're asking about "${command}".\n\n` +
        `I can help you with:\n` +
        `• Searching deceased records\n` +
        `• Generating documents\n` +
        `• Checking payments\n` +
        `• Getting status updates\n\n` +
        `What would you like to do?`,
        true
      );
    }

    setIsLoading(false);
  };

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    processCommand(inputValue.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleShare = (method) => {
    const phoneNumber = '+254740045355';
    
    switch (method) {
      case 'whatsapp':
        const whatsappMsg = encodeURIComponent(shareContent);
        window.open(`https://wa.me/${phoneNumber.replace('+', '')}?text=${whatsappMsg}`, '_blank');
        break;
      case 'sms':
        window.location.href = `sms:${phoneNumber}?body=${encodeURIComponent(shareContent)}`;
        break;
      case 'call':
        window.location.href = `tel:${phoneNumber}`;
        break;
      default:
        navigator.clipboard.writeText(shareContent);
        break;
    }
    
    setShowShareModal(false);
    addAssistantMessage(`Content shared via ${method}! ✅`);
  };

  const handleQuickCommand = (command) => {
    processCommand(command);
  };

  const handleWelcomeAction = (command) => {
    processCommand(command);
  };

  const clearChat = () => {
    setMessages([]);
    setShowWelcome(true);
  };

  return (
    <>
      {!isOpen ? (
        <AssistantButton onClick={() => setIsOpen(true)} aria-label="Open AI Assistant">
          <Bot size={28} color="white" />
          {unreadCount > 0 && <NotificationBadge>{unreadCount}</NotificationBadge>}
        </AssistantButton>
      ) : (
        <AssistantContainer>
          <ChatWindow isExpanded={isExpanded}>
            {/* Header */}
            <ChatHeader>
              <HeaderLeft>
                <HeaderIcon>
                  <Bot size={22} color="white" />
                </HeaderIcon>
                <HeaderTitle>
                  <h3>AI Assistant</h3>
                  <p>BETA</p>
                </HeaderTitle>
              </HeaderLeft>
              <HeaderActions>
                <HeaderButton onClick={clearChat} title="Clear chat">
                  <Trash2 size={16} />
                </HeaderButton>
                <HeaderButton onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? 'Minimize' : 'Expand'}>
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </HeaderButton>
                <HeaderButton onClick={() => setIsOpen(false)} title="Close">
                  <X size={16} />
                </HeaderButton>
              </HeaderActions>
            </ChatHeader>

            {/* Messages or Welcome */}
            {showWelcome && messages.length === 0 ? (
              <WelcomeScreen>
                <WelcomeIcon>
                  <Bot size={40} color="white" />
                </WelcomeIcon>
                <WelcomeTitle>AI Assistant</WelcomeTitle>
                <WelcomeSubtitle>
                  I'm here to help you search records, generate documents, and answer questions.
                </WelcomeSubtitle>
                <WelcomeActions>
                  {welcomeActions.map((action, idx) => (
                    <WelcomeAction key={idx} onClick={() => handleWelcomeAction(action.command)}>
                      <span>
                        {action.icon}
                        {action.label}
                      </span>
                      <ChevronRight size={16} />
                    </WelcomeAction>
                  ))}
                </WelcomeActions>
              </WelcomeScreen>
            ) : (
              <MessagesArea>
                {messages.map((msg) => (
                  <Message key={msg.id} isUser={msg.isUser}>
                    <MessageAvatar isUser={msg.isUser}>
                      {msg.isUser ? (
                        <User size={18} color="white" />
                      ) : (
                        <Bot size={18} color="white" />
                      )}
                    </MessageAvatar>
                    <div>
                      <MessageBubble isUser={msg.isUser}>
                        <MessageText isUser={msg.isUser}>{msg.text}</MessageText>
                        
                        {msg.searchResults && msg.searchResults.length > 0 && (
                          <SearchResults>
                            {msg.searchResults.map((group, groupIdx) => (
                              <div key={groupIdx}>
                                {group.items && group.items.map((result, idx) => (
                                  <SearchResultItem key={idx}>
                                    <h4>
                                      <FileText size={14} />
                                      {result.name || result.title || result._source?.name || 'Unknown'}
                                    </h4>
                                    <p>
                                      {result.module || group.module} • {result.status || 'Available'}
                                    </p>
                                  </SearchResultItem>
                                ))}
                              </div>
                            ))}
                          </SearchResults>
                        )}
                        
                        {msg.showCommands && (
                          <QuickCommandsGrid style={{ marginTop: '0.75rem' }}>
                            <QuickCommandButton onClick={() => handleQuickCommand('search deceased')}>
                              <Search size={12} /> Search
                            </QuickCommandButton>
                            <QuickCommandButton onClick={() => handleQuickCommand('generate documents')}>
                              <FileText size={12} /> Documents
                            </QuickCommandButton>
                            <QuickCommandButton onClick={() => handleQuickCommand('show payments')}>
                              <CreditCard size={12} /> Payments
                            </QuickCommandButton>
                          </QuickCommandsGrid>
                        )}
                        
                        <MessageTime isUser={msg.isUser}>{msg.time}</MessageTime>
                      </MessageBubble>
                    </div>
                  </Message>
                ))}
                
                {isLoading && (
                  <Message isUser={false}>
                    <MessageAvatar>
                      <Bot size={18} color="white" />
                    </MessageAvatar>
                    <MessageBubble>
                      <TypingIndicator>
                        <TypingDot />
                        <TypingDot />
                        <TypingDot />
                      </TypingIndicator>
                    </MessageBubble>
                  </Message>
                )}
                
                <div ref={messagesEndRef} />
              </MessagesArea>
            )}

            {/* Quick Commands Section */}
            <QuickCommandsSection>
              <QuickCommandsTitle>
                <Sparkles size={12} />
                Quick Commands
              </QuickCommandsTitle>
              <QuickCommandsGrid>
                {quickCommands.map((cmd, idx) => (
                  <QuickCommandButton key={idx} onClick={() => handleQuickCommand(cmd.command)}>
                    {cmd.icon}
                    {cmd.label}
                  </QuickCommandButton>
                ))}
              </QuickCommandsGrid>
            </QuickCommandsSection>

            {/* Input */}
            <InputArea>
              <InputWrapper>
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything... (e.g., 'search deceased John', 'generate death certificate')"
                  rows={1}
                />
                <VoiceButton 
                  className={isRecording ? 'recording' : ''} 
                  onClick={toggleVoiceInput}
                  title="Voice input"
                >
                  <Mic size={16} />
                </VoiceButton>
                <SendButton onClick={handleSend} disabled={!inputValue.trim() || isLoading}>
                  {isLoading ? <Loader size={16} style={{ animation: `${spin} 1s linear infinite` }} /> : <Send size={16} />}
                </SendButton>
              </InputWrapper>
            </InputArea>
          </ChatWindow>
        </AssistantContainer>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal onClick={() => setShowShareModal(false)}>
          <ShareModalContent onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: Colors.primaryDark, marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: '700' }}>
              Share via
            </h3>
            <ShareOption onClick={() => handleShare('whatsapp')} color="#25D366">
              <MessageCircle size={20} />
              WhatsApp
            </ShareOption>
            <ShareOption onClick={() => handleShare('sms')} color="#3498DB">
              <MessageSquare size={20} />
              SMS
            </ShareOption>
            <ShareOption onClick={() => handleShare('call')} color={Colors.successGreen}>
              <Phone size={20} />
              Phone Call
            </ShareOption>
            <ShareOption onClick={() => handleShare('copy')} color={Colors.darkGray}>
              <Copy size={20} />
              Copy to Clipboard
            </ShareOption>
            <button
              onClick={() => setShowShareModal(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '1rem',
                background: 'transparent',
                border: `1px solid ${Colors.tableBorder}`,
                borderRadius: '10px',
                color: Colors.darkGray,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
          </ShareModalContent>
        </ShareModal>
      )}
    </>
  );
};

export default AIAssistant;