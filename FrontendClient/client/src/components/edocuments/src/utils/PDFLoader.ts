// PDF Loader Utilities using PDF.js

import * as pdfjsLib from 'pdfjs-dist';

// Set up worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFPageInfo {
  pageNum: number;
  width: number;
  height: number;
  dataUrl: string;
}

export class PDFLoader {
  /**
   * Load PDF and extract page information
   */
  static async loadPDF(file: File): Promise<{
    pages: PDFPageInfo[];
    totalPages: number;
  }> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages: PDFPageInfo[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const canvasContext = canvas.getContext('2d')!;
      await page.render({
        canvasContext,
        viewport,
      }).promise;

      pages.push({
        pageNum,
        width: viewport.width,
        height: viewport.height,
        dataUrl: canvas.toDataURL('image/png'),
      });
    }

    return {
      pages,
      totalPages: pdf.numPages,
    };
  }

  /**
   * Get specific page as image data
   */
  static async getPageAsImage(
    file: File,
    pageNum: number,
    scale: number = 2
  ): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const canvasContext = canvas.getContext('2d')!;
    await page.render({
      canvasContext,
      viewport,
    }).promise;

    return canvas.toDataURL('image/png');
  }

  /**
   * Get PDF metadata
   */
  static async getPDFMetadata(file: File): Promise<any> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const metadata = await pdf.getMetadata().catch(() => null);

    return {
      numPages: pdf.numPages,
      fingerprint: pdf.fingerprint,
      metadata: metadata?.metadata || {},
    };
  }

  /**
   * Extract text from PDF page
   */
  static async extractPageText(file: File, pageNum: number): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    return textContent.items.map((item: any) => item.str).join(' ');
  }

  /**
   * Convert PDF to base64
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export default PDFLoader;
