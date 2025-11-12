'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

interface PDFViewerProps {
  file: File | null;
  scale: number;
  onDocumentLoadSuccess: (pdf: any) => void;
  currentPage: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<any>;
}

const PDFViewerClient: React.FC<PDFViewerProps> = ({
  file,
  scale,
  onDocumentLoadSuccess,
  currentPage,
  canvasRef
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize PDF.js only on client side
  useEffect(() => {
    const initPdfjs = async () => {
      if (typeof window !== 'undefined' && !pdfjsLib) {
        const pdfjs = await import('pdfjs-dist');
        // Use unpkg.com with exact version match
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        setPdfjsLib(pdfjs);
      }
    };
    initPdfjs();
  }, [pdfjsLib]);

  // Load PDF document
  useEffect(() => {
    if (!file || !pdfjsLib) return;

    const loadPdf = async () => {
      setIsLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        onDocumentLoadSuccess(pdf);
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [file, pdfjsLib, onDocumentLoadSuccess]);

  // Render current page
  useEffect(() => {
    if (!pdfDocument || !pageCanvasRef.current || isLoading) return;

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        
        const canvas = pageCanvasRef.current!;
        const context = canvas.getContext('2d')!;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        setPageWidth(viewport.width);
        setPageHeight(viewport.height);
        
               // Update annotation canvas size
               if (canvasRef.current) {
                 canvasRef.current.width = viewport.width;
                 canvasRef.current.height = viewport.height;
                 canvasRef.current.style.width = `${viewport.width}px`;
                 canvasRef.current.style.height = `${viewport.height}px`;
               }

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (error) {
        console.error('Error rendering page:', error);
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, scale, canvasRef, isLoading]);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl text-gray-300 dark:text-gray-600 mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No PDF loaded
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Upload a PDF file to start editing
          </p>
        </div>
      </div>
    );
  }

  if (!pdfjsLib) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Loading PDF.js...
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Loading PDF...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center bg-gray-100 dark:bg-gray-800 overflow-auto h-full">
      <div className="relative">
        {/* PDF Page Canvas */}
        <canvas
          ref={pageCanvasRef}
          className="border border-gray-300 dark:border-gray-600 shadow-lg"
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
        
        {/* Canvas overlay for drawing and annotations */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-auto z-10 pdf-editor-canvas"
          width={pageWidth}
          height={pageHeight}
          style={{
            width: `${pageWidth}px`,
            height: `${pageHeight}px`,
          }}
        />
      </div>
      
      {/* Page info */}
      {numPages > 0 && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Page {currentPage} of {numPages}
        </div>
      )}
    </div>
  );
};

export const PDFViewer = dynamic(() => Promise.resolve(PDFViewerClient), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Loading...
        </div>
      </div>
    </div>
  )
});
