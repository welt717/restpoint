// PDF Uploader Component

import React, { useRef, useState } from 'react';
import PDFLoader, { type PDFPageInfo } from '../../utils/PDFLoader';
import './PDFUploader.css';

interface PDFUploaderProps {
  onUpload?: (pages: PDFPageInfo[], file: File) => void;
  onError?: (error: string) => void;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({ onUpload, onError }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      onError?.('Please select a valid PDF file');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setFileName(file.name);

    try {
      // Simulate progress
      setProgress(25);

      const result = await PDFLoader.loadPDF(file);

      setProgress(75);

      if (result.pages.length === 0) {
        throw new Error('No pages found in PDF');
      }

      setProgress(100);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUpload?.(result.pages, file);
      setFileName(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load PDF';
      onError?.(message);
      setFileName(null);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="pdf-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <div className="upload-area" onClick={triggerFileSelect}>
        <div className="upload-content">
          {isLoading ? (
            <>
              <div className="upload-spinner"></div>
              <p className="upload-text">
                Loading PDF... <span className="progress-text">{progress}%</span>
              </p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </>
          ) : (
            <>
              <div className="upload-icon">📄</div>
              <p className="upload-text">Drop PDF here or click to upload</p>
              <p className="upload-hint">Supported: PDF files</p>
              {fileName && <p className="file-name">{fileName}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFUploader;
