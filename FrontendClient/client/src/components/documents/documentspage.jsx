import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  ArrowLeft, FileText, Download, Eye, Trash2, User, AlertCircle, 
  CheckCircle, Printer, X, Search, Filter, Share2, Mail, MessageCircle,
  Tag, Calendar, HardDrive, Type, User as UserIcon, ExternalLink,
  ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, Smartphone, Wifi, WifiOff,
  Upload, Plus
} from 'lucide-react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Document, Page, pdfjs } from 'react-pdf';
import { useReactToPrint } from 'react-to-print';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// API Configuration - Centralized API Gateway
const API_GATEWAY = process.env.REACT_APP_API_GATEWAY || 'http://localhost:5000';
const BASE_API = `${API_GATEWAY}/api/v1/restpoint`;

// Enhanced Styled Components with minimal padding
const PageContainer = styled.div`
  min-height: 100vh;
  padding: 0.5rem;
  background: #f8fafc;
  font-family: 'Inter', sans-serif;

  @media (max-width: 768px) {
    padding: 0.25rem;
  }
`;

const Header = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.75rem;

  @media (max-width: 768px) {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }
`;

const SearchFilterBar = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 768px) {
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 0.6rem 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  @media (max-width: 768px) {
    min-width: 150px;
    padding: 0.5rem 0.6rem;
  }
`;

const FilterSelect = styled.select`
  padding: 0.6rem 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 0.6rem;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }
`;

const DocumentCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background: #f8fafc;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
  position: relative;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border-color: #3b82f6;
  }

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    padding: 0.6rem;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
`;

const DocumentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;

  @media (max-width: 768px) {
    gap: 0.4rem;
  }
`;

const DocumentDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const DocumentName = styled.h4`
  margin: 0 0 0.3rem 0;
  color: #1e293b;
  font-size: 0.9rem;
  font-weight: 600;
  word-break: break-word;
  line-height: 1.3;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  @media (max-width: 768px) {
    font-size: 0.85rem;
    margin-bottom: 0.3rem;
  }
`;

const DocumentMeta = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  line-height: 1.2;

  @media (max-width: 768px) {
    gap: 0.4rem;
  }
`;

const CategoryBadge = styled.span`
  background: ${props => props.color || '#e2e8f0'};
  color: ${props => props.textColor || '#475569'};
  padding: 0.15rem 0.4rem;
  border-radius: 0.5rem;
  font-size: 0.7rem;
  font-weight: 500;
`;

const MetaBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: ${props => props.bgColor};
  color: ${props => props.textColor};
  padding: 0.2rem 0.4rem;
  border-radius: 0.5rem;
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 0.65rem;
    padding: 0.15rem 0.3rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.3rem;

  @media (max-width: 768px) {
    justify-content: space-between;
    gap: 0.2rem;
  }
`;

const ActionButton = styled.button`
  background: ${props => props.bgColor || '#3b82f6'};
  color: white;
  border: none;
  padding: 0.4rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;

  &:hover {
    background: ${props => props.hoverColor || '#2563eb'};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    padding: 0.3rem;
    flex: 1;
    font-size: 0.7rem;
  }
`;

// Enhanced PDF Viewer Components
const PDFModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 0.5rem;
  backdrop-filter: blur(4px);
`;

const PDFViewerContainer = styled.div`
  background: #ffffff;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 100%;
  height: 95vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  &.fullscreen {
    height: 100vh;
    border-radius: 0;
    max-width: 100vw;
  }

  @media (max-width: 768px) {
    height: 100vh;
    border-radius: 0;
    max-width: 100vw;
  }
`;

const PDFToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 0.75rem;
  z-index: 10;

  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PDFTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;

  @media (max-width: 768px) {
    max-width: 200px;
    font-size: 0.9rem;
  }
`;

const NetworkStatus = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
`;

const PageNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0.25rem;
`;

const PageInput = styled.input`
  width: 50px;
  padding: 0.25rem;
  border: none;
  text-align: center;
  font-size: 0.875rem;
  background: transparent;
  
  &:focus {
    outline: none;
    background: #f1f5f9;
    border-radius: 0.25rem;
  }
  
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const PageCounter = styled.span`
  font-size: 0.875rem;
  color: #64748b;
  padding: 0 0.25rem;
`;

const ZoomControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0.25rem;
`;

const ZoomLevel = styled.span`
  font-size: 0.875rem;
  color: #475569;
  padding: 0 0.5rem;
  min-width: 45px;
  text-align: center;
`;

const PDFActionButton = styled.button`
  background: ${props => props.bgColor || 'white'};
  color: ${props => props.textColor || '#475569'};
  border: 1px solid #e2e8f0;
  padding: 0.4rem 0.6rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;

  &:hover {
    background: ${props => props.hoverColor || '#f1f5f9'};
    border-color: #cbd5e1;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    min-width: 32px;
    min-height: 32px;
    padding: 0.3rem 0.5rem;
  }
`;

const PDFContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  background: #f1f5f9;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const PDFPageContainer = styled.div`
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  position: relative;
  
  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`;

const PageNumberIndicator = styled.div`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  opacity: 0.9;
`;

const MobileToolbar = styled.div`
  display: none;
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 0.5rem;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const PageInfo = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  min-width: 60px;
  text-align: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  gap: 1rem;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #ef4444;
  text-align: center;
  padding: 2rem;
  gap: 0.5rem;
`;

const CacheControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  font-size: 0.75rem;
`;

const ClearCacheButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 0.75rem;
  text-decoration: underline;
  
  &:hover {
    color: #475569;
  }
`;

// Modal Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 0.5rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.5rem;
  width: 100%;
  max-width: ${props => props.size === 'large' ? '95vw' : '500px'};
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;

  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
  }
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;

  @media (max-width: 768px) {
    font-size: 0.95rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f1f5f9;
    color: #374151;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  padding: 1rem;
  overflow: auto;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`;

// Share Modal Components
const ShareForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const FormLabel = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`;

const FormInput = styled.input`
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const FormSelect = styled.select`
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const FormTextarea = styled.textarea`
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-height: 80px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const SubmitButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: #059669;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

// Upload Modal Components
const UploadArea = styled.div`
  border: 2px dashed #e2e8f0;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;

  &:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }

  &.dragover {
    border-color: #3b82f6;
    background: #eff6ff;
  }
`;

const UploadButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

// Category colors mapping
const CATEGORY_COLORS = {
  'Identification': { bg: '#dbeafe', text: '#1e40af' },
  'Next of Kin': { bg: '#f3e8ff', text: '#7c3aed' },
  'Billing': { bg: '#dcfce7', text: '#166534' },
  'Release Forms': { bg: '#fef3c7', text: '#92400e' },
  'Case File': { bg: '#fce7f3', text: '#be185d' },
  'Medical Records': { bg: '#ffedd5', text: '#9a3412' },
  'Legal Documents': { bg: '#e0e7ff', text: '#3730a3' },
  'General': { bg: '#f1f5f9', text: '#475569' }
};

const META_COLORS = {
  date: { bg: '#fef3c7', text: '#92400e' },
  size: { bg: '#d1fae5', text: '#065f46' },
  type: { bg: '#e0e7ff', text: '#3730a3' },
  format: { bg: '#fce7f3', text: '#be185d' },
  user: { bg: '#f3e8ff', text: '#7c3aed' },
};

// Enhanced PDF Viewer Component
const EnhancedPDFViewer = ({ document, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCached, setIsCached] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  
  const containerRef = useRef(null);
  const pdfContainerRef = useRef(null);

  useEffect(() => {
    const initOfflineCache = async () => {
      if ('caches' in window) {
        try {
          const cache = await caches.open('pdf-viewer-cache');
          const cachedResponse = await cache.match(document.url);
          if (cachedResponse) {
            setIsCached(true);
            const blob = await cachedResponse.blob();
            setPdfBlob(blob);
          }
        } catch (error) {
          console.error('Cache error:', error);
        }
      }
    };

    initOfflineCache();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [document.url]);

  const cachePDF = async () => {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open('pdf-viewer-cache');
      const response = await fetch(document.url);
      await cache.put(document.url, response.clone());
      setIsCached(true);
      const blob = await response.blob();
      setPdfBlob(blob);
    } catch (error) {
      console.error('Failed to cache PDF:', error);
    }
  };

  const clearCache = async () => {
    if ('caches' in window) {
      try {
        await caches.delete('pdf-viewer-cache');
        setIsCached(false);
        setPdfBlob(null);
        toast.success('Cache cleared');
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    }
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
    
    if (pdfContainerRef.current) {
      pdfContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const goToPage = (page) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
      if (pdfContainerRef.current) {
        pdfContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const previousPage = () => goToPage(pageNumber - 1);
  const nextPage = () => goToPage(pageNumber + 1);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const zoomToFit = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      setScale(containerWidth / 800);
    }
  };
  const resetZoom = () => setScale(1.0);

  const rotate = () => setRotation(prev => (prev + 90) % 360);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handlePrint = () => {
    try {
      if (pdfBlob) {
        const printUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(printUrl, '_blank');
        
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
            setTimeout(() => URL.revokeObjectURL(printUrl), 1000);
          };
        }
      } else {
        const printFrame = document.createElement('iframe');
        printFrame.style.display = 'none';
        printFrame.src = document.url;
        document.body.appendChild(printFrame);
        
        printFrame.onload = () => {
          setTimeout(() => {
            printFrame.contentWindow.print();
            setTimeout(() => {
              document.body.removeChild(printFrame);
            }, 1000);
          }, 500);
        };
      }
      
      toast.info('Opening print dialog...');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print document');
    }
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      if (pdfBlob) {
        const url = URL.createObjectURL(pdfBlob);
        link.href = url;
        link.download = document.originalName || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        link.href = document.url;
        link.download = document.originalName || 'document.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast.success('Download started...');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            previousPage();
          }
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            nextPage();
          }
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetZoom();
          }
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNumber, numPages, scale, isFullscreen, onClose]);

  return (
    <PDFModalOverlay onClick={onClose}>
      <PDFViewerContainer 
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className={isFullscreen ? 'fullscreen' : ''}
      >
        <PDFToolbar>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={20} color="#3b82f6" />
            <PDFTitle>{document.originalName}</PDFTitle>
            
            <NetworkStatus>
              {isOnline ? (
                <Wifi size={14} color="#10b981" title="Online" />
              ) : (
                <WifiOff size={14} color="#ef4444" title="Offline" />
              )}
              {isCached && (
                <Smartphone size={14} color="#3b82f6" title="Available offline" />
              )}
            </NetworkStatus>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <PageNavigation>
              <PDFActionButton 
                onClick={previousPage}
                disabled={pageNumber <= 1}
                title="Previous page (←)"
              >
                ←
              </PDFActionButton>
              
              <PageInput
                type="number"
                min="1"
                max={numPages || 1}
                value={pageNumber}
                onChange={(e) => goToPage(parseInt(e.target.value))}
              />
              <PageCounter>of {numPages || '?'}</PageCounter>
              
              <PDFActionButton 
                onClick={nextPage}
                disabled={pageNumber >= (numPages || 1)}
                title="Next page (→)"
              >
                →
              </PDFActionButton>
            </PageNavigation>

            <ZoomControls>
              <PDFActionButton onClick={zoomOut} title="Zoom out (Ctrl+-)">
                <ZoomOut size={16} />
              </PDFActionButton>
              <ZoomLevel>{Math.round(scale * 100)}%</ZoomLevel>
              <PDFActionButton onClick={zoomIn} title="Zoom in (Ctrl++)">
                <ZoomIn size={16} />
              </PDFActionButton>
              <PDFActionButton onClick={zoomToFit} title="Fit to width">
                <Maximize2 size={16} />
              </PDFActionButton>
              <PDFActionButton onClick={resetZoom} title="Reset zoom (Ctrl+0)">
                100%
              </PDFActionButton>
            </ZoomControls>

            <PDFActionButton onClick={rotate} title="Rotate">
              <RotateCw size={16} />
            </PDFActionButton>

            <PDFActionButton 
              onClick={handleDownload}
              bgColor="#10b981"
              hoverColor="#059669"
              title="Download"
            >
              <Download size={16} />
            </PDFActionButton>
            
            <PDFActionButton 
              onClick={handlePrint}
              bgColor="#f59e0b"
              hoverColor="#d97706"
              title="Print"
            >
              <Printer size={16} />
            </PDFActionButton>

            <PDFActionButton 
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen (Ctrl+F)"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </PDFActionButton>

            <PDFActionButton 
              onClick={onClose}
              bgColor="#ef4444"
              hoverColor="#dc2626"
              title="Close (Esc)"
            >
              <X size={16} />
            </PDFActionButton>
          </div>
        </PDFToolbar>

        <PDFContent ref={pdfContainerRef}>
          <Document
            file={pdfBlob ? URL.createObjectURL(pdfBlob) : document.url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <LoadingContainer>
                <Spinner />
                <p>Loading PDF...</p>
                {!isOnline && isCached && <p>Showing cached version</p>}
              </LoadingContainer>
            }
            error={
              <ErrorContainer>
                <p>Failed to load PDF</p>
                {!isOnline && !isCached && (
                  <p>PDF not available offline. Please connect to internet.</p>
                )}
              </ErrorContainer>
            }
          >
            {Array.from(new Array(numPages), (el, index) => (
              <PDFPageContainer key={`page_${index + 1}`}>
                <Page 
                  pageNumber={index + 1}
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={<div>Loading page {index + 1}...</div>}
                />
                <PageNumberIndicator>
                  Page {index + 1} of {numPages}
                </PageNumberIndicator>
              </PDFPageContainer>
            ))}
          </Document>
        </PDFContent>

        <MobileToolbar>
          <PDFActionButton onClick={previousPage} disabled={pageNumber <= 1}>
            ←
          </PDFActionButton>
          <PageInfo>
            {pageNumber} / {numPages || '?'}
          </PageInfo>
          <PDFActionButton onClick={nextPage} disabled={pageNumber >= (numPages || 1)}>
            →
          </PDFActionButton>
          <div style={{ flex: 1 }} />
          <PDFActionButton onClick={zoomOut}>
            <ZoomOut size={18} />
          </PDFActionButton>
          <PDFActionButton onClick={zoomIn}>
            <ZoomIn size={18} />
          </PDFActionButton>
          <PDFActionButton onClick={handleDownload}>
            <Download size={18} />
          </PDFActionButton>
        </MobileToolbar>

        <CacheControls>
          <small style={{ color: '#64748b' }}>
            {isCached ? '✓ Available offline' : 'Online only'}
          </small>
          {isCached && (
            <ClearCacheButton onClick={clearCache}>
              Clear cache
            </ClearCacheButton>
          )}
        </CacheControls>
      </PDFViewerContainer>
    </PDFModalOverlay>
  );
};

// Main Documents Page Component
const DocumentsPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [deceasedData, setDeceasedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [sharingDocument, setSharingDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [shareForm, setShareForm] = useState({
    email: '',
    method: 'whatsapp',
    message: ''
  });
  const [isSharing, setIsSharing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('General');
  const [isUploading, setIsUploading] = useState(false);

  const deceasedId = params.deceasedId || params.id;

  const getUsername = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.name || user.username || user.email || 'User';
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
    return 'User';
  };

  useEffect(() => {
    if (deceasedId) {
      fetchDocuments();
      fetchDeceasedDetails();
    } else {
      setIsLoading(false);
    }
  }, [deceasedId]);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, categoryFilter]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      
      // Fetch documents for this specific deceased from centralized API
      const API_URL = `${BASE_API}/documents/${deceasedId}`;

      const response = await axios.get(API_URL, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': localStorage.getItem('tenantSlug') || 'system_shared'
        }
      });
      
      if (response.data && response.data.success) {
        setDocuments(response.data.files || []);
      } else {
        setDocuments([]);
      }
      
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error fetching documents:', error);
      
      let errorMessage = 'Failed to fetch documents';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - server is not responding';
      } else if (error.response) {
        errorMessage = `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server - check if backend is running';
      }
      
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const fetchDeceasedDetails = async () => {
    try {
      // Fetch deceased details from the portal API
      const response = await axios.get(`${BASE_API}/deceased/${deceasedId}`, {
        timeout: 10000,
        headers: {
          'x-tenant-slug': localStorage.getItem('tenantSlug') || 'system_shared'
        }
      });
      
      if (response.data && response.data.data) {
        setDeceasedData(response.data.data);
      } else {
        setDeceasedData({ full_name: 'Unknown Deceased' });
      }
    } catch (error) {
      console.log('Could not fetch deceased details, using fallback');
      setDeceasedData({ full_name: 'Unknown Deceased' });
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.mimeType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(doc => doc.category === categoryFilter);
    }

    setFilteredDocuments(filtered);
  };

  const handleDownload = async (document) => {
    try {
      const downloadUrl = `${BASE_API}/documents/download/${document.documentId}`;
      
      const response = await fetch(downloadUrl, {
        headers: {
          'x-tenant-slug': localStorage.getItem('tenantSlug') || 'system_shared'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.originalName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloading ${document.originalName || 'document'}...`);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document: ' + error.message);
    }
  };

  const handleView = async (document) => {
    try {
      const viewUrl = `${BASE_API}/documents/download/${document.documentId}`;
      
      if (document.mimeType === 'application/pdf' || document.originalName?.toLowerCase().endsWith('.pdf')) {
        setViewingDocument({
          ...document,
          url: viewUrl
        });
        toast.info(`Opening PDF document...`);
      } else {
        const response = await fetch(viewUrl, {
          headers: {
            'x-tenant-slug': localStorage.getItem('tenantSlug') || 'system_shared'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        setViewingDocument({
          ...document,
          url: objectUrl
        });
        toast.info(`Opening ${document.originalName || 'document'}...`);
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to view document: ' + error.message);
    }
  };

  const handlePrint = async (document) => {
    try {
      const printUrl = `${BASE_API}/documents/download/${document.documentId}`;
      
      const response = await fetch(printUrl, {
        headers: {
          'x-tenant-slug': localStorage.getItem('tenantSlug') || 'system_shared'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      if (document.mimeType === 'application/pdf') {
        const printFrame = document.createElement('iframe');
        printFrame.style.display = 'none';
        printFrame.src = objectUrl;
        document.body.appendChild(printFrame);
        
        printFrame.onload = () => {
          setTimeout(() => {
            printFrame.contentWindow.print();
            setTimeout(() => {
              document.body.removeChild(printFrame);
              URL.revokeObjectURL(objectUrl);
            }, 1000);
          }, 500);
        };
      } else {
        const printWindow = window.open(objectUrl, '_blank');
        
        if (printWindow) {
          printWindow.onload = () => {
            try {
              printWindow.print();
              setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            } catch (printError) {
              console.error('Print error:', printError);
              toast.error('Failed to print document.');
            }
          };
        } else {
          toast.error('Please allow popups for printing');
          URL.revokeObjectURL(objectUrl);
        }
      }
      
      toast.info(`Opening document for printing...`);
    } catch (error) {
      console.error('Error printing document:', error);
      toast.error('Failed to print document: ' + error.message);
    }
  };

  const handleShare = (document) => {
    setSharingDocument(document);
    setShareForm({
      email: '',
      method: 'whatsapp',
      message: `Hello! Please find attached document: ${document.originalName}`
    });
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    
    if (shareForm.method === 'email') {
      if (!shareForm.email) {
        toast.error('Please enter an email address');
        return;
      }

      setIsSharing(true);

      try {
        await axios.post(`${BASE_API}/documents/share`, {
          documentId: sharingDocument.documentId,
          recipientEmail: shareForm.email,
          method: shareForm.method,
          message: shareForm.message,
          documentName: sharingDocument.originalName
        }, {
          headers: {
            'x-tenant-slug': localStorage.getItem('tenantSlug') || 'system_shared'
          }
        });

        toast.success(`Document shared successfully via email to ${shareForm.email}`);
        setSharingDocument(null);
      } catch (error) {
        console.error('Error sharing document:', error);
        toast.error('Failed to share document: ' + error.message);
      } finally {
        setIsSharing(false);
      }
    } else if (shareForm.method === 'whatsapp') {
      setIsSharing(true);

      try {
        const downloadUrl = `${BASE_API}/documents/download/${sharingDocument.documentId}`;
        
        const response = await fetch(downloadUrl, {
          headers: {
            'x-tenant-slug': localStorage.getItem('tenantSlug') || 'system_shared'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const file = new File([blob], sharingDocument.originalName, { 
          type: sharingDocument.mimeType || 'application/pdf' 
        });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: sharingDocument.originalName,
            text: shareForm.message
          });
          
          toast.success('Document shared via native share dialog');
        } else {
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = sharingDocument.originalName;
          link.click();
          
          toast.info('Document downloaded. You can now share it via WhatsApp.');
          
          setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        }
        
        setSharingDocument(null);
      } catch (error) {
        console.error('Error sharing via WhatsApp:', error);
        toast.error('Failed to share document: ' + error.message);
      } finally {
        setIsSharing(false);
      }
    }
  };

  const handleDelete = async (documentId, documentName) => {
    if (window.confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) {
      try {
        setIsDeleting(true);
        
        await axios.delete(`${BASE_API}/documents/${deceasedId}/${documentId}`, {
          data: { deletedBy: getUsername() },
          headers: {
            'x-tenant-slug': localStorage.getItem('tenantSlug') || 'system_shared'
          }
        });
        
        setDocuments(prev => prev.filter(doc => doc.documentId !== documentId));
        toast.success('Document deleted successfully');
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || e.target.files?.[0];
    if (file) {
      setUploadingFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadingFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('document', uploadingFile);
      formData.append('category', uploadCategory);
      formData.append('uploadedBy', getUsername());

      await axios.post(
        `${BASE_API}/documents/${deceasedId}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-tenant-slug': localStorage.getItem('tenantSlug') || 'system_shared'
          }
        }
      );

      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      setUploadingFile(null);
      setUploadCategory('General');
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const closeViewer = () => {
    if (viewingDocument && viewingDocument.url.startsWith('blob:')) {
      URL.revokeObjectURL(viewingDocument.url);
    }
    setViewingDocument(null);
  };

  const closeShareModal = () => {
    setSharingDocument(null);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadingFile(null);
    setUploadCategory('General');
  };

  const getFileIcon = (filename, mimeType) => {
    const size = window.innerWidth < 768 ? 18 : 20;
    
    if (!filename && !mimeType) return <FileText size={size} color="#3b82f6" />;
    
    const type = mimeType || '';
    
    if (type.includes('pdf')) {
      return <FileText size={size} color="#ef4444" />;
    } else if (type.includes('image')) {
      return <FileText size={size} color="#10b981" />;
    } else if (type.includes('word') || type.includes('document')) {
      return <FileText size={size} color="#2b579a" />;
    } else if (type.includes('excel') || type.includes('spreadsheet')) {
      return <FileText size={size} color="#217346" />;
    } else {
      return <FileText size={size} color="#3b82f6" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getCategoryColor = (category) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
  };

  const retryFetch = () => {
    fetchDocuments();
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading documents...</p>
          <button 
            onClick={retryFetch}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Retry
          </button>
        </div>
      </PageContainer>
    );
  }

  const hasDocuments = documents && documents.length > 0;
  const categories = [...new Set(documents.map(doc => doc.category).filter(Boolean))];

  return (
    <PageContainer>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Header>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: window.innerWidth < 768 ? '1.2rem' : '1.4rem', 
            fontWeight: 'bold', 
            color: '#1e293b', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.4rem'
          }}>
            <FileText size={window.innerWidth < 768 ? 20 : 22} />
            Documents
          </h1>
          <p style={{ 
            margin: '0.2rem 0 0 0', 
            color: '#64748b',
            fontSize: window.innerWidth < 768 ? '0.75rem' : '0.8rem'
          }}>
            Managing documents for: <strong>{deceasedData?.full_name || 'Unknown'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <BackButton onClick={() => navigate(-1)}>
            <ArrowLeft size={window.innerWidth < 768 ? 14 : 16} />
            Back
          </BackButton>
          <ActionButton
            onClick={() => setShowUploadModal(true)}
            bgColor="#10b981"
            hoverColor="#059669"
            title="Upload Document"
          >
            <Plus size={16} />
            {window.innerWidth >= 768 && 'Upload'}
          </ActionButton>
        </div>
      </Header>

      <SearchFilterBar>
        <SearchInput
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FilterSelect
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </FilterSelect>
      </SearchFilterBar>

      <ContentCard>
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((document) => (
            <DocumentCard key={document.documentId}>
              <DocumentInfo>
                {getFileIcon(document.originalName, document.mimeType)}
                <DocumentDetails>
                  <DocumentName>
                    {document.originalName || 'Unnamed Document'}
                  </DocumentName>
                  <DocumentMeta>
                    <CategoryBadge 
                      color={getCategoryColor(document.category).bg} 
                      textColor={getCategoryColor(document.category).text}
                    >
                      {document.category || 'General'}
                    </CategoryBadge>
                    <MetaBadge bgColor={META_COLORS.date.bg} textColor={META_COLORS.date.text}>
                      <Calendar size={10} />
                      {formatDate(document.uploadedAt)}
                    </MetaBadge>
                    {document.sizeKB && (
                      <MetaBadge bgColor={META_COLORS.size.bg} textColor={META_COLORS.size.text}>
                        <HardDrive size={10} />
                        {formatFileSize(document.sizeKB * 1024)}
                      </MetaBadge>
                    )}
                  </DocumentMeta>
                </DocumentDetails>
              </DocumentInfo>
              <ActionButtons>
                <ActionButton 
                  onClick={() => handleView(document)}
                  bgColor="#3b82f6"
                  hoverColor="#2563eb"
                  title="View"
                >
                  <Eye size={14} />
                  {window.innerWidth >= 768 && 'View'}
                </ActionButton>
                <ActionButton 
                  onClick={() => handleDownload(document)}
                  bgColor="#10b981"
                  hoverColor="#059669"
                  title="Download"
                >
                  <Download size={14} />
                  {window.innerWidth >= 768 && 'Download'}
                </ActionButton>
                <ActionButton 
                  onClick={() => handleShare(document)}
                  bgColor="#8b5cf6"
                  hoverColor="#7c3aed"
                  title="Share"
                >
                  <Share2 size={14} />
                  {window.innerWidth >= 768 && 'Share'}
                </ActionButton>
                <ActionButton 
                  onClick={() => handlePrint(document)}
                  bgColor="#f59e0b"
                  hoverColor="#d97706"
                  title="Print"
                >
                  <Printer size={14} />
                  {window.innerWidth >= 768 && 'Print'}
                </ActionButton>
                <ActionButton 
                  onClick={() => handleDelete(document.documentId, document.originalName)}
                  bgColor="#ef4444"
                  hoverColor="#dc2626"
                  disabled={isDeleting}
                  title="Delete"
                >
                  <Trash2 size={14} />
                  {window.innerWidth >= 768 && 'Delete'}
                </ActionButton>
              </ActionButtons>
            </DocumentCard>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            <FileText size={40} color="#cbd5e1" />
            <h3 style={{ color: '#64748b', margin: '1rem 0 0.5rem 0' }}>
              {documents.length === 0 ? 'No Documents Found' : 'No Matching Documents'}
            </h3>
            {documents.length === 0 && (
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Click the "Upload" button to add documents for this deceased.
              </p>
            )}
          </div>
        )}
      </ContentCard>

      {/* PDF Viewer */}
      {viewingDocument && (viewingDocument.mimeType === 'application/pdf' || viewingDocument.originalName?.toLowerCase().endsWith('.pdf')) ? (
        <EnhancedPDFViewer 
          document={viewingDocument}
          onClose={closeViewer}
        />
      ) : viewingDocument ? (
        <ModalOverlay onClick={closeViewer}>
          <ModalContent onClick={(e) => e.stopPropagation()} size="large">
            <ModalHeader>
              <ModalTitle>
                <FileText size={18} style={{ marginRight: '0.4rem' }} />
                {viewingDocument.originalName || 'Document Viewer'}
              </ModalTitle>
              <CloseButton onClick={closeViewer}>
                <X size={18} />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <iframe 
                src={viewingDocument.url}
                title={viewingDocument.originalName}
                style={{
                  width: '100%',
                  height: '70vh',
                  border: 'none',
                  borderRadius: '0.375rem'
                }}
              />
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginTop: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <ActionButton 
                  onClick={() => handleDownload(viewingDocument)}
                  bgColor="#10b981"
                  hoverColor="#059669"
                >
                  <Download size={16} />
                  Download
                </ActionButton>
                <ActionButton 
                  onClick={() => handlePrint(viewingDocument)}
                  bgColor="#f59e0b"
                  hoverColor="#d97706"
                >
                  <Printer size={16} />
                  Print
                </ActionButton>
                <ActionButton 
                  onClick={() => handleShare(viewingDocument)}
                  bgColor="#8b5cf6"
                  hoverColor="#7c3aed"
                >
                  <Share2 size={16} />
                  Share
                </ActionButton>
              </div>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      ) : null}

      {/* Share Document Modal */}
      {sharingDocument && (
        <ModalOverlay onClick={closeShareModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Share2 size={18} style={{ marginRight: '0.4rem' }} />
                Share Document
              </ModalTitle>
              <CloseButton onClick={closeShareModal}>
                <X size={18} />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <ShareForm onSubmit={handleShareSubmit}>
                <FormGroup>
                  <FormLabel>Document</FormLabel>
                  <FormInput
                    type="text"
                    value={sharingDocument.originalName}
                    disabled
                    style={{ background: '#f9fafb' }}
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>Share Method</FormLabel>
                  <FormSelect
                    value={shareForm.method}
                    onChange={(e) => setShareForm({...shareForm, method: e.target.value})}
                  >
                    <option value="whatsapp">WhatsApp (Native Share)</option>
                    <option value="email">Email</option>
                  </FormSelect>
                </FormGroup>

                {shareForm.method === 'email' ? (
                  <FormGroup>
                    <FormLabel>Email Address</FormLabel>
                    <FormInput
                      type="email"
                      placeholder="recipient@example.com"
                      value={shareForm.email}
                      onChange={(e) => setShareForm({...shareForm, email: e.target.value})}
                      required
                    />
                  </FormGroup>
                ) : (
                  <FormGroup>
                    <FormLabel>Phone Number</FormLabel>
                    <FormInput
                      type="tel"
                      placeholder="+254712345678"
                      value={shareForm.email}
                      onChange={(e) => setShareForm({...shareForm, email: e.target.value})}
                      required
                    />
                  </FormGroup>
                )}

                <FormGroup>
                  <FormLabel>Message (Optional)</FormLabel>
                  <FormTextarea
                    placeholder="Add a personal message..."
                    value={shareForm.message}
                    onChange={(e) => setShareForm({...shareForm, message: e.target.value})}
                  />
                </FormGroup>

                <SubmitButton type="submit" disabled={isSharing}>
                  {isSharing ? (
                    <>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid transparent', 
                        borderTop: '2px solid white', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite',
                        marginRight: '0.5rem'
                      }}></div>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Share2 size={16} style={{ marginRight: '0.5rem' }} />
                      Share Document
                    </>
                  )}
                </SubmitButton>
              </ShareForm>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <ModalOverlay onClick={closeUploadModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Upload size={18} style={{ marginRight: '0.4rem' }} />
                Upload Document
              </ModalTitle>
              <CloseButton onClick={closeUploadModal}>
                <X size={18} />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>Category</FormLabel>
                <FormSelect
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                >
                  {Object.keys(CATEGORY_COLORS).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </FormSelect>
              </FormGroup>

              <UploadArea
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('fileInput').click()}
                className={uploadingFile ? 'dragover' : ''}
              >
                <input
                  id="fileInput"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadingFile(e.target.files[0])}
                  style={{ display: 'none' }}
                />
                <Upload size={40} color="#3b82f6" style={{ marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                  {uploadingFile ? uploadingFile.name : 'Drag & drop file here or click to browse'}
                </p>
                <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>
                  Supported: PDF, Word, Images (max 50MB)
                </p>
              </UploadArea>

              <UploadButton 
                onClick={handleUpload} 
                disabled={!uploadingFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      border: '2px solid transparent', 
                      borderTop: '2px solid white', 
                      borderRadius: '50%', 
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload Document
                  </>
                )}
              </UploadButton>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default DocumentsPage;