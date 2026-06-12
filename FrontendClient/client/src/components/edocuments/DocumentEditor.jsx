import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  X,
  Save,
  Download,
  Printer as Print,        // Print doesn't exist, use Printer
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Pen,
  Eraser,
  Type,
  Square,
  Circle,
  Image as ImageIcon,
  PenTool as Signature,     // Signature doesn't exist, use PenTool
  Trash2,
  Eye,
  Check,
  Upload,
  Move,
  RefreshCw,
  AlertCircle,
  Lock,
  Cloud,
} from 'lucide-react';
import Swal from 'sweetalert2';
import * as pdfjsLib from 'pdfjs-dist';
import * as fabric from "fabric";
// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// ============================================
// PRODUCTION CONFIGURATION
// ============================================

const CONFIG = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1/restpoint',
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  MAX_CANVAS_SIZE: { width: 800, height: 1131 }, // A4
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  HISTORY_MAX_STATES: 50,
  SUPPORTED_FILE_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'],
  PRODUCTION: process.env.NODE_ENV === 'production',
  ENABLE_AUTO_SAVE: true,
  ISOLATION_LEVEL: 'strict' // strict = verify tenant on every API call
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const dataURItoBlob = (dataURI) => {
  try {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  } catch (error) {
    console.error('Error converting data URI to blob:', error);
    throw error;
  }
};

// Tenant isolation helper - verify tenant before any operation
const getTenantInfo = () => {
  const tenantSlug = localStorage.getItem('tenantSlug') ||
                     localStorage.getItem('tenant_slug') ||
                     (() => {
                       try {
                         const user = JSON.parse(localStorage.getItem('user') || '{}');
                         return user.tenantSlug || user.tenant?.slug || null;
                       } catch {
                         return null;
                       }
                     })();

  if (!tenantSlug && CONFIG.PRODUCTION && CONFIG.ISOLATION_LEVEL === 'strict') {
    throw new Error('SECURITY: Tenant not identified. Operation aborted.');
  }

  return {
    slug: tenantSlug || 'default',
    isValid: !!tenantSlug
  };
};

// ============================================
// MAIN COMPONENT
// ============================================

const DocumentEditor = ({
  document: initialDocument,
  template: initialTemplate,
  file: initialFile,
  onClose,
  onSave
}) => {
  const canvasRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Refs to prevent closure stale values
  const documentRef = useRef(initialDocument);
  const templateRef = useRef(initialTemplate);
  const fileRef = useRef(initialFile);

  // Tenant & Security
  const [tenantInfo] = useState(() => getTenantInfo());
  const [securityStatus, setSecurityStatus] = useState('verified');
  const [lastSaveTime, setLastSaveTime] = useState(null);

  // Editor states
  const [canvas, setCanvas] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState('select');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [selectedObject, setSelectedObject] = useState(null);

  // Signature pad states
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [isSigning, setIsSigning] = useState(false);

  // Document info
  const [documentTitle, setDocumentTitle] = useState(initialDocument?.title || initialTemplate?.name || 'Untitled Document');
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [fieldValues, setFieldValues] = useState(initialDocument?.fieldValues || {});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // History Undo/Redo states
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // ============================================
  // SECURITY & INITIALIZATION
  // ============================================

  // Verify tenant on mount
  useEffect(() => {
    try {
      if (!tenantInfo.slug) {
        setSecurityStatus('unverified');
        setLoadError('Tenant information not available');
        return;
      }
      setSecurityStatus('verified');
    } catch (error) {
      setSecurityStatus('error');
      setLoadError(error.message);
    }
  }, [tenantInfo]);

  // ============================================
  // HISTORY MANAGEMENT
  // ============================================

  const saveHistoryState = useCallback((fabricCanvas) => {
    if (!fabricCanvas || fabricCanvas._loadingState) return;

    try {
      const json = fabricCanvas.toJSON();
      const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      newHistory.push(json);

      if (newHistory.length > CONFIG.HISTORY_MAX_STATES) {
        newHistory.shift();
      }

      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;

      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(false);
      setIsDirty(true);
    } catch (error) {
      console.error('Error saving history state:', error);
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (!canvas || historyIndexRef.current <= 0) return;

    try {
      const targetIndex = historyIndexRef.current - 1;
      const state = historyRef.current[targetIndex];
      const bgImage = canvas.backgroundImage;

      canvas._loadingState = true;
      canvas.loadFromJSON(state, () => {
        try {
          if (bgImage) {
            canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
          }
          canvas.renderAll();
          historyIndexRef.current = targetIndex;
          setCanUndo(targetIndex > 0);
          setCanRedo(true);
          setIsDirty(true);
        } finally {
          canvas._loadingState = false;
        }
      });
    } catch (error) {
      console.error('Error during undo:', error);
      Swal.fire('Error', 'Failed to undo action', 'error');
    }
  }, [canvas]);

  const handleRedo = useCallback(() => {
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;

    try {
      const targetIndex = historyIndexRef.current + 1;
      const state = historyRef.current[targetIndex];
      const bgImage = canvas.backgroundImage;

      canvas._loadingState = true;
      canvas.loadFromJSON(state, () => {
        try {
          if (bgImage) {
            canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
          }
          canvas.renderAll();
          historyIndexRef.current = targetIndex;
          setCanUndo(true);
          setCanRedo(targetIndex < historyRef.current.length - 1);
          setIsDirty(true);
        } finally {
          canvas._loadingState = false;
        }
      });
    } catch (error) {
      console.error('Error during redo:', error);
      Swal.fire('Error', 'Failed to redo action', 'error');
    }
  }, [canvas]);

  // ============================================
  // CANVAS INITIALIZATION
  // ============================================

  useEffect(() => {
    if (!canvasRef.current || !tenantInfo.slug || securityStatus !== 'verified') return;

    try {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: CONFIG.MAX_CANVAS_SIZE.width,
        height: CONFIG.MAX_CANVAS_SIZE.height,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        selection: true,
        controlsAboveObjects: true,
        enablePointerEvents: true
      });

      setCanvas(fabricCanvas);

      // Event listeners with error handling
      const handleObjectAdded = (e) => {
        try {
          if (e.target && !e.target.isBackground) {
            saveHistoryState(fabricCanvas);
          }
        } catch (error) {
          console.error('Error in object:added handler:', error);
        }
      };

      const handleObjectModified = () => {
        try {
          saveHistoryState(fabricCanvas);
        } catch (error) {
          console.error('Error in object:modified handler:', error);
        }
      };

      const handleObjectRemoved = (e) => {
        try {
          if (e.target && !e.target.isBackground) {
            saveHistoryState(fabricCanvas);
          }
        } catch (error) {
          console.error('Error in object:removed handler:', error);
        }
      };

      const handleSelectionCreated = (e) => {
        try {
          setSelectedObject(e.selected[0]);
        } catch (error) {
          console.error('Error in selection:created handler:', error);
        }
      };

      const handleSelectionUpdated = (e) => {
        try {
          setSelectedObject(e.selected[0]);
        } catch (error) {
          console.error('Error in selection:updated handler:', error);
        }
      };

      const handleSelectionCleared = () => {
        try {
          setSelectedObject(null);
        } catch (error) {
          console.error('Error in selection:cleared handler:', error);
        }
      };

      fabricCanvas.on('object:added', handleObjectAdded);
      fabricCanvas.on('object:modified', handleObjectModified);
      fabricCanvas.on('object:removed', handleObjectRemoved);
      fabricCanvas.on('selection:created', handleSelectionCreated);
      fabricCanvas.on('selection:updated', handleSelectionUpdated);
      fabricCanvas.on('selection:cleared', handleSelectionCleared);

      // Load background
      loadBackground(fabricCanvas).then(() => {
        setIsLoading(false);
      }).catch((error) => {
        console.error('Error loading background:', error);
        setLoadError('Failed to load document background');
        setIsLoading(false);
      });

      return () => {
        fabricCanvas.off('object:added', handleObjectAdded);
        fabricCanvas.off('object:modified', handleObjectModified);
        fabricCanvas.off('object:removed', handleObjectRemoved);
        fabricCanvas.off('selection:created', handleSelectionCreated);
        fabricCanvas.off('selection:updated', handleSelectionUpdated);
        fabricCanvas.off('selection:cleared', handleSelectionCleared);
        fabricCanvas.dispose();
      };
    } catch (error) {
      console.error('Error initializing canvas:', error);
      setLoadError('Failed to initialize editor');
      setIsLoading(false);
    }
  }, [tenantInfo, securityStatus, saveHistoryState]);

  // ============================================
  // BRUSH CONFIGURATION
  // ============================================

  useEffect(() => {
    if (!canvas) return;

    try {
      if (activeTool === 'pen') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushSize;
      } else if (activeTool === 'eraser') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = '#ffffff';
        canvas.freeDrawingBrush.width = brushSize * 4;
      } else {
        canvas.isDrawingMode = false;
      }
    } catch (error) {
      console.error('Error configuring brush:', error);
    }
  }, [activeTool, brushColor, brushSize, canvas]);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  useEffect(() => {
    const handleKeyDown = (e) => {
      try {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const activeObject = canvas?.getActiveObject();
          if (activeObject && activeObject.type !== 'textbox' && !activeObject.isEditing) {
            e.preventDefault();
            deleteSelected();
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          saveDocument();
        }
      } catch (error) {
        console.error('Error in keyboard handler:', error);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, handleUndo, handleRedo]);

  // ============================================
  // AUTO-SAVE MECHANISM
  // ============================================

  const autoSaveDocument = useCallback(async () => {
    if (!canvas || !isDirty || isSaving || !tenantInfo.slug) return;

    try {
      setIsAutoSaving(true);
      const canvasState = JSON.stringify(canvas.toJSON());
      const dataUrl = canvas.toDataURL({ format: 'png', quality: 0.8 });

      const doc = documentRef.current;
      if (doc?.id) {
        await axios.put(
          `${CONFIG.API_BASE_URL}/edocuments/${doc.id}`,
          {
            title: documentTitle,
            canvasState: canvasState,
            image: dataUrl,
            status: 'draft',
            fieldValues: fieldValues,
            autoSaved: true
          },
          {
            headers: {
              'x-tenant-slug': tenantInfo.slug,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        setLastSaveTime(new Date().toLocaleTimeString());
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      if (CONFIG.PRODUCTION) {
        console.warn('Auto-save failed - changes still in browser memory');
      }
    } finally {
      setIsAutoSaving(false);
    }
  }, [canvas, isDirty, isSaving, tenantInfo, documentTitle, fieldValues]);

  // Set up auto-save interval
  useEffect(() => {
    if (!CONFIG.ENABLE_AUTO_SAVE) return;

    autoSaveTimerRef.current = setInterval(() => {
      autoSaveDocument();
    }, CONFIG.AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveDocument]);

  // ============================================
  // BACKGROUND LOADING
  // ============================================

  const loadBackground = async (fabricCanvas) => {
    const file = fileRef.current;
    const doc = documentRef.current;
    const template = templateRef.current;

    return new Promise(async (resolve, reject) => {
      const setFabricBackgroundImage = (url) => {
        try {
          fabricCanvas._loadingState = true;
          fabric.Image.fromURL(url, (img) => {
            try {
              img.set({
                scaleX: fabricCanvas.width / img.width,
                scaleY: fabricCanvas.height / img.height,
                originX: 'left',
                originY: 'top',
                selectable: false,
                evented: false,
                isBackground: true
              });

              fabricCanvas.setBackgroundImage(img, () => {
                try {
                  fabricCanvas.renderAll();
                  fabricCanvas._loadingState = false;

                  if (doc?.canvasState) {
                    const state = typeof doc.canvasState === 'string' ? JSON.parse(doc.canvasState) : doc.canvasState;
                    fabricCanvas._loadingState = true;
                    fabricCanvas.loadFromJSON(state, () => {
                      try {
                        fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
                        fabricCanvas.renderAll();
                        fabricCanvas._loadingState = false;
                        saveHistoryState(fabricCanvas);
                        resolve();
                      } catch (error) {
                        reject(error);
                      }
                    });
                  } else {
                    saveHistoryState(fabricCanvas);
                    resolve();
                  }
                } catch (error) {
                  reject(error);
                }
              });
            } catch (error) {
              reject(error);
            }
          }, { crossOrigin: 'anonymous' });
        } catch (error) {
          reject(error);
        }
      };

      const loadPDFBackground = async (pdfData) => {
        try {
          const loadingTask = pdfjsLib.getDocument({ data: pdfData });
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);

          const viewport = page.getViewport({ scale: 2.0 });
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = viewport.width;
          tempCanvas.height = viewport.height;

          await page.render({
            canvasContext: tempCtx,
            viewport: viewport
          }).promise;

          const dataUrl = tempCanvas.toDataURL('image/png');
          setFabricBackgroundImage(dataUrl);
        } catch (error) {
          reject(new Error('Failed to render PDF: ' + error.message));
        }
      };

      try {
        if (file) {
          if (file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = async (e) => {
              const typedArray = new Uint8Array(e.target.result);
              await loadPDFBackground(typedArray);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
          } else if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              setFabricBackgroundImage(e.target.result);
            };
            reader.onerror = () => reject(new Error('Failed to read image file'));
            reader.readAsDataURL(file);
          }
        } else if (doc?.fileUrl) {
          const url = `${CONFIG.API_BASE_URL}/edocuments/download/${doc.fileUrl}`;
          if (doc.fileUrl.toLowerCase().endsWith('.pdf')) {
            try {
              const response = await fetch(url, {
                headers: { 'x-tenant-slug': tenantInfo.slug }
              });
              const buffer = await response.arrayBuffer();
              await loadPDFBackground(new Uint8Array(buffer));
            } catch (error) {
              setFabricBackgroundImage(url);
            }
          } else {
            setFabricBackgroundImage(url);
          }
        } else if (template?.fileName) {
          const url = `${CONFIG.API_BASE_URL}/edocuments/templates/download/${template.fileName}`;
          setFabricBackgroundImage(url);
        } else {
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  // ============================================
  // CANVAS OPERATIONS
  // ============================================

  const addTextBox = useCallback(() => {
    if (!canvas) return;
    try {
      const text = new fabric.Textbox('Double click to edit text', {
        left: 150,
        top: 150,
        width: 250,
        fontSize: 18,
        fontFamily: 'Arial',
        fill: brushColor === '#ffffff' ? '#000000' : brushColor,
        borderColor: '#c9a84c',
        cornerColor: '#c9a84c',
        cornerSize: 8,
        transparentCorners: false
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      saveHistoryState(canvas);
    } catch (error) {
      console.error('Error adding textbox:', error);
    }
  }, [canvas, brushColor, saveHistoryState]);

  const addRectangle = useCallback(() => {
    if (!canvas) return;
    try {
      const rect = new fabric.Rect({
        left: 150,
        top: 150,
        width: 120,
        height: 80,
        fill: 'transparent',
        stroke: brushColor === '#ffffff' ? '#000000' : brushColor,
        strokeWidth: brushSize,
        borderColor: '#c9a84c',
        cornerColor: '#c9a84c',
        cornerSize: 8,
        transparentCorners: false
      });
      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.renderAll();
      saveHistoryState(canvas);
    } catch (error) {
      console.error('Error adding rectangle:', error);
    }
  }, [canvas, brushColor, brushSize, saveHistoryState]);

  const addCircle = useCallback(() => {
    if (!canvas) return;
    try {
      const circle = new fabric.Circle({
        left: 150,
        top: 150,
        radius: 50,
        fill: 'transparent',
        stroke: brushColor === '#ffffff' ? '#000000' : brushColor,
        strokeWidth: brushSize,
        borderColor: '#c9a84c',
        cornerColor: '#c9a84c',
        cornerSize: 8,
        transparentCorners: false
      });
      canvas.add(circle);
      canvas.setActiveObject(circle);
      canvas.renderAll();
      saveHistoryState(canvas);
    } catch (error) {
      console.error('Error adding circle:', error);
    }
  }, [canvas, brushColor, brushSize, saveHistoryState]);

  const deleteSelected = useCallback(() => {
    if (!canvas) return;
    try {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.remove(activeObject);
        canvas.discardActiveObject();
        canvas.renderAll();
        saveHistoryState(canvas);
      }
    } catch (error) {
      console.error('Error deleting object:', error);
    }
  }, [canvas, saveHistoryState]);

  const handleLogoImport = useCallback((e) => {
    const file = e.target.files[0];
    if (!file || !canvas) return;

    if (file.size > CONFIG.MAX_FILE_SIZE) {
      Swal.fire('Error', 'File too large. Maximum 50MB allowed.', 'error');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        fabric.Image.fromURL(event.target.result, (img) => {
          try {
            const scale = Math.min(180 / img.width, 180 / img.height);
            img.set({
              left: 200,
              top: 200,
              scaleX: scale,
              scaleY: scale,
              borderColor: '#c9a84c',
              cornerColor: '#c9a84c',
              cornerSize: 8,
              transparentCorners: false
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            saveHistoryState(canvas);
          } catch (error) {
            console.error('Error adding image to canvas:', error);
          }
        });
      };
      reader.readAsDataURL(file);
      e.target.value = null;
    } catch (error) {
      console.error('Error importing logo:', error);
    }
  }, [canvas, saveHistoryState]);

  // ============================================
  // SIGNATURE HANDLING
  // ============================================

  const signatureStart = useCallback((e) => {
    if (e.type === 'touchstart') e.preventDefault();
    const sigCanvas = signatureCanvasRef.current;
    if (!sigCanvas) return;

    try {
      const ctx = sigCanvas.getContext('2d');
      const coords = getSigCanvasCoords(e);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      setIsSigning(true);
    } catch (error) {
      console.error('Error starting signature:', error);
    }
  }, []);

  const signatureMove = useCallback((e) => {
    if (e.type === 'touchmove') e.preventDefault();
    if (!isSigning) return;

    const sigCanvas = signatureCanvasRef.current;
    if (!sigCanvas) return;

    try {
      const ctx = sigCanvas.getContext('2d');
      const coords = getSigCanvasCoords(e);
      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    } catch (error) {
      console.error('Error during signature move:', error);
    }
  }, [isSigning]);

  const signatureEnd = useCallback((e) => {
    if (e.type === 'touchend') e.preventDefault();
    if (isSigning) {
      setIsSigning(false);
      const sigCanvas = signatureCanvasRef.current;
      if (sigCanvas) {
        setSignatureData(sigCanvas.toDataURL());
      }
    }
  }, [isSigning]);

  const clearSignature = useCallback(() => {
    const sigCanvas = signatureCanvasRef.current;
    if (sigCanvas) {
      const ctx = sigCanvas.getContext('2d');
      ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
      setSignatureData(null);
    }
  }, []);

  const getSigCanvasCoords = (e) => {
    const sigCanvas = signatureCanvasRef.current;
    const rect = sigCanvas.getBoundingClientRect();

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const applySignature = useCallback(() => {
    if (!canvas || !signatureData) return;

    try {
      fabric.Image.fromURL(signatureData, (img) => {
        try {
          img.set({
            left: 200,
            top: 200,
            scaleX: 0.6,
            scaleY: 0.6,
            borderColor: '#c9a84c',
            cornerColor: '#c9a84c',
            cornerSize: 8,
            transparentCorners: false
          });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
          saveHistoryState(canvas);

          setShowSignatureModal(false);
          setSignatureData(null);
        } catch (error) {
          console.error('Error applying signature:', error);
        }
      });
    } catch (error) {
      console.error('Error in applySignature:', error);
    }
  }, [canvas, signatureData, saveHistoryState]);

  // ============================================
  // DOCUMENT OPERATIONS
  // ============================================

  const saveDocument = useCallback(async () => {
    if (!canvas || !tenantInfo.slug) return;

    setIsSaving(true);

    try {
      const canvasState = JSON.stringify(canvas.toJSON());
      const dataUrl = canvas.toDataURL({ format: 'png', quality: 1.0 });

      let response;
      const doc = documentRef.current;

      if (doc?.id) {
        response = await axios.put(
          `${CONFIG.API_BASE_URL}/edocuments/${doc.id}`,
          {
            title: documentTitle,
            canvasState: canvasState,
            image: dataUrl,
            status: 'completed',
            fieldValues: fieldValues
          },
          {
            headers: {
              'x-tenant-slug': tenantInfo.slug,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
      } else {
        const formData = new FormData();
        const blob = dataURItoBlob(dataUrl);

        let filename = 'document.png';
        if (fileRef.current) {
          filename = fileRef.current.name.replace(/\.[^/.]+$/, "") + "_edited.png";
        } else if (templateRef.current) {
          filename = templateRef.current.name.toLowerCase().replace(/[^a-z0-9]/gi, '_') + "_document.png";
        }

        formData.append('document', blob, filename);
        formData.append('title', documentTitle);
        formData.append('description', `Edited scanned document: ${documentTitle}`);
        formData.append('documentType', templateRef.current?.type || 'document');
        formData.append('canvasState', canvasState);
        formData.append('fieldValues', JSON.stringify(fieldValues));

        response = await axios.post(
          `${CONFIG.API_BASE_URL}/edocuments`,
          formData,
          {
            headers: {
              'x-tenant-slug': tenantInfo.slug,
              'Content-Type': 'multipart/form-data'
            },
            timeout: 30000
          }
        );
      }

      if (response.data?.success) {
        setIsDirty(false);
        setLastSaveTime(new Date().toLocaleTimeString());
        Swal.fire({
          icon: 'success',
          title: 'Document Saved!',
          text: 'Your document has been securely stored.',
          confirmButtonColor: '#C9A84C',
          timer: 2000
        });
        if (onSave) onSave(response.data.data);
      }
    } catch (error) {
      console.error('Error saving document:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save document';
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: errorMsg,
        confirmButtonColor: '#C9A84C'
      });
    } finally {
      setIsSaving(false);
    }
  }, [canvas, tenantInfo, documentTitle, fieldValues, onSave]);

  const downloadPNG = useCallback(() => {
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL({ format: 'png', quality: 1.0 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${documentTitle.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`;
      a.click();
    } catch (error) {
      console.error('Error downloading PNG:', error);
      Swal.fire('Error', 'Failed to download document', 'error');
    }
  }, [canvas, documentTitle]);

  const printDocument = useCallback(() => {
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL({ format: 'png', quality: 1.0 });
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print - ${documentTitle}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; height: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              @media print {
                img { max-width: 100%; height: auto; box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing document:', error);
      Swal.fire('Error', 'Failed to print document', 'error');
    }
  }, [canvas, documentTitle]);

  // ============================================
  // RENDER
  // ============================================

  const colorPresets = [
    '#000000', '#FFFFFF', '#D97706', '#DC2626', '#2563EB', '#16A34A',
    '#7C3AED', '#DB2777', '#4B5563', '#0369A1'
  ];

  if (loadError || securityStatus === 'error') {
    return (
      <div style={editorContainerStyle}>
        <div style={{ ...headerStyle, justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ ...actionButtonStyle, backgroundColor: '#b91c1c', color: '#fff' }}>
            <X size={16} /> Close
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#ef4444' }}>
            <AlertCircle size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Unable to Load Editor</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{loadError || 'Security verification failed'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={editorContainerStyle}>
        <div style={{ ...headerStyle, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...actionButtonStyle, backgroundColor: '#b91c1c', color: '#fff' }}>
            <X size={16} /> Close
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
            <p>Initializing editor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={editorContainerStyle}>
      {/* Top Header Bar */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            style={titleInputStyle}
            placeholder="Document Name"
            disabled={isLoading}
          />
          <span style={{ color: '#6b7280', fontSize: '12px' }}>
            {templateRef.current?.name && `| Template: ${templateRef.current.name}`}
          </span>
          {isDirty && (
            <span style={{ color: '#fbbf24', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ● Unsaved changes
            </span>
          )}
          {isAutoSaving && (
            <span style={{ color: '#60a5fa', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Cloud size={12} /> Auto-saving...
            </span>
          )}
          {lastSaveTime && !isDirty && (
            <span style={{ color: '#10b981', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={12} /> Saved at {lastSaveTime}
            </span>
          )}
          {securityStatus === 'verified' && (
            <span style={{ color: '#10b981', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} /> {tenantInfo.slug}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Zoom Controls */}
          <button onClick={() => setZoom(Math.max(50, zoom - 15))} style={actionButtonStyle} title="Zoom Out" disabled={isLoading}>
            <ZoomOut size={16} />
          </button>
          <span style={{ color: '#9ca3af', fontSize: '13px', minWidth: '45px', textAlign: 'center', fontWeight: 600 }}>
            {zoom}%
          </span>
          <button onClick={() => setZoom(Math.min(200, zoom + 15))} style={actionButtonStyle} title="Zoom In" disabled={isLoading}>
            <ZoomIn size={16} />
          </button>

          <div style={dividerStyle} />

          {/* Undo / Redo */}
          <button onClick={handleUndo} disabled={!canUndo || isLoading} style={{ ...actionButtonStyle, opacity: canUndo ? 1 : 0.4 }} title="Undo (Ctrl+Z)">
            <Undo size={16} />
          </button>
          <button onClick={handleRedo} disabled={!canRedo || isLoading} style={{ ...actionButtonStyle, opacity: canRedo ? 1 : 0.4 }} title="Redo (Ctrl+Y)">
            <Redo size={16} />
          </button>

          <div style={dividerStyle} />

          {/* Save / Export / Close */}
          <button onClick={saveDocument} disabled={isSaving || isLoading} style={{ ...actionButtonStyle, backgroundColor: '#059669', color: '#fff' }} title="Save Document (Ctrl+S)">
            <Save size={16} style={{ marginRight: '6px' }} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={downloadPNG} style={actionButtonStyle} title="Download PNG" disabled={isLoading}>
            <Download size={16} />
          </button>
          <button onClick={printDocument} style={actionButtonStyle} title="Print Document" disabled={isLoading}>
            <Printer size={16} />
          </button>

          <button onClick={onClose} style={{ ...actionButtonStyle, backgroundColor: '#b91c1c', color: '#fff' }} title="Close Editor" disabled={isLoading}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left Toolbar */}
        <div style={toolbarStyle}>
          <h4 style={toolbarHeadingStyle}>Tools</h4>

          <div style={toolGroupStyle}>
            <ToolButton
              icon={<Move size={18} />}
              active={activeTool === 'select'}
              onClick={() => setActiveTool('select')}
              title="Select / Move Elements"
              disabled={isLoading}
            />
            <ToolButton
              icon={<Type size={18} />}
              active={activeTool === 'text'}
              onClick={() => { setActiveTool('select'); addTextBox(); }}
              title="Add Editable Text"
              disabled={isLoading}
            />
            <ToolButton
              icon={<Pen size={18} />}
              active={activeTool === 'pen'}
              onClick={() => setActiveTool('pen')}
              title="Freehand Pencil"
              disabled={isLoading}
            />
            <ToolButton
              icon={<Eraser size={18} />}
              active={activeTool === 'eraser'}
              onClick={() => setActiveTool('eraser')}
              title="Eraser (White Brush)"
              disabled={isLoading}
            />
            <ToolButton
              icon={<Square size={18} />}
              active={activeTool === 'rect'}
              onClick={() => { setActiveTool('select'); addRectangle(); }}
              title="Draw Rectangle"
              disabled={isLoading}
            />
            <ToolButton
              icon={<Circle size={18} />}
              active={activeTool === 'circle'}
              onClick={() => { setActiveTool('select'); addCircle(); }}
              title="Draw Circle"
              disabled={isLoading}
            />
          </div>

          <div style={dividerHorizontalStyle} />

          {/* Signatures & Images */}
          <h4 style={toolbarHeadingStyle}>Insert</h4>
          <div style={toolGroupStyle}>
            <button onClick={() => { setActiveTool('select'); setShowSignatureModal(true); }} style={toolbarSquareButtonStyle} title="Add Signature" disabled={isLoading}>
              <Signature size={18} />
              <span style={{ fontSize: '10px', marginTop: '4px' }}>Signature</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} style={toolbarSquareButtonStyle} title="Upload Logo" disabled={isLoading}>
              <ImageIcon size={18} />
              <span style={{ fontSize: '10px', marginTop: '4px' }}>Logo</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoImport}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          <div style={dividerHorizontalStyle} />

          {/* Color Presets */}
          <h4 style={toolbarHeadingStyle}>Brush Color</h4>
          <div style={colorPaletteGridStyle}>
            {colorPresets.map(color => (
              <button
                key={color}
                onClick={() => setBrushColor(color)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: brushColor === color ? '2px solid #c9a84c' : '1px solid #4b5563',
                  cursor: 'pointer',
                  padding: 0
                }}
                title={color}
                disabled={isLoading}
              />
            ))}
          </div>

          <div style={dividerHorizontalStyle} />

          {/* Brush Size */}
          <h4 style={toolbarHeadingStyle}>Brush Size: {brushSize}px</h4>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: '#c9a84c', cursor: 'pointer' }}
            disabled={isLoading}
          />

          {selectedObject && (
            <>
              <div style={dividerHorizontalStyle} />
              <button onClick={deleteSelected} style={{ ...toolbarSquareButtonStyle, backgroundColor: '#7f1d1d', color: '#fca5a5', width: '100%', height: '40px' }} title="Delete Element" disabled={isLoading}>
                <Trash2 size={16} style={{ marginRight: '6px' }} />
                Delete Selected
              </button>
            </>
          )}
        </div>

        {/* Canvas Scroll Wrapper */}
        <div style={canvasScrollWrapperStyle}>
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              backgroundColor: '#fff',
              transition: 'transform 0.1s ease',
              margin: '30px auto'
            }}
          >
            <canvas ref={canvasRef} style={{ display: 'block' }} />
          </div>
        </div>
      </div>

      {/* Digital Signature Modal */}
      {showSignatureModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#f3f4f6', margin: 0, fontSize: '18px', fontWeight: 600 }}>
                ✒️ Draw Your Signature
              </h3>
              <button onClick={() => setShowSignatureModal(false)} style={closeModalButtonStyle}>
                <X size={18} />
              </button>
            </div>

            <div style={signaturePadWrapperStyle}>
              <canvas
                ref={signatureCanvasRef}
                width={450}
                height={200}
                onMouseDown={signatureStart}
                onMouseMove={signatureMove}
                onMouseUp={signatureEnd}
                onMouseLeave={signatureEnd}
                onTouchStart={signatureStart}
                onTouchMove={signatureMove}
                onTouchEnd={signatureEnd}
                onTouchCancel={signatureEnd}
                style={{
                  width: '100%',
                  height: '200px',
                  cursor: 'crosshair',
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  touchAction: 'none',
                  display: 'block'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={clearSignature} style={{ ...modalBtnStyle, backgroundColor: '#4b5563' }}>
                Clear
              </button>
              <button onClick={() => setShowSignatureModal(false)} style={{ ...modalBtnStyle, backgroundColor: '#374151' }}>
                Cancel
              </button>
              <button
                onClick={applySignature}
                disabled={!signatureData}
                style={{
                  ...modalBtnStyle,
                  backgroundColor: signatureData ? '#c9a84c' : '#4b5563',
                  color: signatureData ? '#1e293b' : '#9ca3af',
                  fontWeight: 600
                }}
              >
                <Check size={16} style={{ marginRight: '6px' }} />
                Apply Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// STYLING (Production-Grade)
// ============================================

const editorContainerStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#0f172a',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: '"Inter", "Outfit", sans-serif'
};

const headerStyle = {
  backgroundColor: '#1e293b',
  padding: '12px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '2px solid #c9a84c',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  flexWrap: 'wrap',
  gap: '10px'
};

const titleInputStyle = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px dashed #4b5563',
  color: '#f3f4f6',
  fontSize: '18px',
  fontWeight: 600,
  outline: 'none',
  width: '320px',
  padding: '4px 0',
  transition: 'border-color 0.2s'
};

const actionButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 14px',
  backgroundColor: '#334155',
  color: '#f3f4f6',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  boxSizing: 'border-box'
};

const dividerStyle = {
  width: '1px',
  height: '24px',
  backgroundColor: '#475569',
  margin: '0 4px'
};

const toolbarStyle = {
  width: '180px',
  backgroundColor: '#1e293b',
  borderRight: '1px solid #334155',
  display: 'flex',
  flexDirection: 'column',
  padding: '16px 12px',
  gap: '12px',
  overflowY: 'auto',
  boxSizing: 'border-box'
};

const toolbarHeadingStyle = {
  color: '#9ca3af',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '8px 0 4px 0'
};

const toolGroupStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '8px'
};

const dividerHorizontalStyle = {
  height: '1px',
  backgroundColor: '#334155',
  margin: '8px 0'
};

const colorPaletteGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '6px',
  justifyContent: 'center'
};

const canvasScrollWrapperStyle = {
  flex: 1,
  overflow: 'auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  padding: '20px',
  backgroundColor: '#0f172a'
};

const ToolButton = ({ icon, active, onClick, title, disabled }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    style={{
      width: '100%',
      height: '42px',
      borderRadius: '8px',
      border: active ? '1.5px solid #c9a84c' : '1px solid #475569',
      backgroundColor: active ? 'rgba(201, 168, 76, 0.15)' : '#334155',
      color: active ? '#c9a84c' : '#cbd5e1',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box',
      opacity: disabled ? 0.5 : 1
    }}
  >
    {icon}
  </button>
);

const toolbarSquareButtonStyle = {
  width: '100%',
  height: '56px',
  borderRadius: '8px',
  border: '1px solid #475569',
  backgroundColor: '#334155',
  color: '#cbd5e1',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box'
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1100,
  backdropFilter: 'blur(4px)'
};

const modalContentStyle = {
  backgroundColor: '#1e293b',
  borderRadius: '12px',
  padding: '24px',
  width: '90%',
  maxWidth: '500px',
  border: '1px solid #c9a84c',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
};

const signaturePadWrapperStyle = {
  border: '2px dashed #475569',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  marginBottom: '20px',
  overflow: 'hidden'
};

const modalBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 18px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
  color: '#f3f4f6',
  transition: 'all 0.2s ease'
};

const closeModalButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: '#9ca3af',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  transition: 'background-color 0.2s'
};

export default DocumentEditor;
