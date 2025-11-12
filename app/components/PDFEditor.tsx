'use client';

import React, { useState, useRef, useCallback } from 'react';
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';
import { PDFViewer } from './PDFViewer';
import { Toolbar, ToolType } from './Toolbar';
import { CanvasDrawing, DrawingElement } from './CanvasDrawing';
import { InPlaceTextEditor } from './RichTextEditor';

interface HistoryState {
  elements: DrawingElement[];
}

export const PDFEditor: React.FC = () => {
  // File state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  
  // View state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  
  // Tool state
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [strokeColor, setStrokeColor] = useState('#ff0000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  
  // Drawing state
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // History management
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: [...elements] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [elements, history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements([...history[newIndex].elements]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements([...history[newIndex].elements]);
    }
  }, [history, historyIndex]);

  // File handling
  const handleFileUpload = useCallback((file: File) => {
    setPdfFile(file);
    setCurrentPage(1);
    setElements([]);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const handleDocumentLoadSuccess = useCallback((pdf: any) => {
    setPdfDocument(pdf);
    setTotalPages(pdf.numPages);
  }, []);

  // Navigation
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // Note: In a full implementation, you'd want to save/load elements per page
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // Note: In a full implementation, you'd want to save/load elements per page
    }
  }, [currentPage, totalPages]);

  // Zoom
  const handleZoomIn = useCallback(() => {
    setScale(prevScale => Math.min(prevScale + 0.25, 3.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prevScale => Math.max(prevScale - 0.25, 0.25));
  }, []);

  // Drawing
  const handleElementAdd = useCallback((element: DrawingElement) => {
    setElements(prev => {
      const newElements = [...prev, element];
      // Save to history after adding element
      setTimeout(() => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ elements: newElements });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }, 0);
      return newElements;
    });
  }, [history, historyIndex]);

  const handleElementUpdate = useCallback((id: string, updates: Partial<DrawingElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const handleElementDelete = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
  }, []);

  const handleElementEdit = useCallback((id: string) => {
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, isEditing: true } : el
    ));
  }, []);

  const handleTextConfirm = useCallback((id: string, text: string, textFormat?: any) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        // Convert viewport coordinates back to canvas coordinates for rendering
        const canvas = canvasRef.current;
        let canvasPoints = el.points;
        
        if (canvas && el.isEditing) {
          const rect = canvas.getBoundingClientRect();
          const fontSize = textFormat?.fontSize || el.fontSize || 16;
          canvasPoints = el.points.map(point => ({
            x: point.x - rect.left + 2, // Account for the -2 offset we added during editing
            y: point.y - rect.top + 2 + fontSize   // Account for baseline vs top positioning + offset
          }));
        }
        
        return { 
          ...el, 
          text, 
          textFormat, 
          isEditing: false,
          points: canvasPoints
        };
      }
      return el;
    }));

    // Save to history after confirming text
    setTimeout(() => {
      const canvas = canvasRef.current;
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        elements: elements.map(el => {
          if (el.id === id) {
            let canvasPoints = el.points;
            
            if (canvas && el.isEditing) {
              const rect = canvas.getBoundingClientRect();
              const fontSize = textFormat?.fontSize || el.fontSize || 16;
              canvasPoints = el.points.map(point => ({
                x: point.x - rect.left + 2, // Account for the -2 offset we added during editing
                y: point.y - rect.top + 2 + fontSize   // Account for baseline vs top positioning + offset
              }));
            }
            
            return { 
              ...el, 
              text, 
              textFormat, 
              isEditing: false,
              points: canvasPoints
            };
          }
          return el;
        })
      });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }, 0);
  }, [elements, history, historyIndex, canvasRef]);

  const handleTextCancel = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
  }, []);

  const handleTextMove = useCallback((id: string, deltaX: number, deltaY: number) => {
    setElements(prev => prev.map(el => 
      el.id === id 
        ? { 
            ...el, 
            points: el.points.map(point => ({
              x: point.x + deltaX,
              y: point.y + deltaY
            }))
          }
        : el
    ));
  }, []);

  const handleTextChange = useCallback((id: string, text: string) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, text } : el
    ));
  }, []);

  // Export
  const handleDownload = useCallback(async () => {
    if (!pdfFile) {
      alert('No PDF file loaded');
      return;
    }

    try {
      if (elements.length > 0) {
        // Import the PDFExporter
        const { PDFExporter } = await import('./PDFExporter');
        
        // Merge annotations with PDF
        const mergedPDFBytes = await PDFExporter.mergePDFWithAnnotations(
          pdfFile,
          elements,
          currentPage,
          scale
        );
        
        // Create blob and download
        const blob = new Blob([new Uint8Array(mergedPDFBytes)], { type: 'application/pdf' });
        saveAs(blob, `edited-${pdfFile.name}`);
      } else {
        // No annotations, just download original
        saveAs(pdfFile, `copy-${pdfFile.name}`);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    }
  }, [pdfFile, elements, currentPage, scale]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onFileUpload={handleFileUpload}
        onDownload={handleDownload}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        onUndo={handleUndo}
        onRedo={handleRedo}
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={scale}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />


      <div className="flex flex-1 overflow-hidden">

        <div className="flex-1 relative">
          <PDFViewer
            file={pdfFile}
            scale={scale}
            onDocumentLoadSuccess={handleDocumentLoadSuccess}
            currentPage={currentPage}
            canvasRef={canvasRef}
          />
          
          {/* Canvas Drawing Layer */}
          <CanvasDrawing
            canvasRef={canvasRef}
            activeTool={activeTool}
            elements={elements}
            onElementAdd={handleElementAdd}
            onElementUpdate={handleElementUpdate}
            onElementDelete={handleElementDelete}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            fontSize={fontSize}
          />

          {elements
            .filter(el => el.type === 'text' && el.isEditing)
            .map(element => (
              <InPlaceTextEditor
                key={element.id}
                element={element}
                onConfirm={(text, format) => handleTextConfirm(element.id, text, format)}
                onCancel={() => handleTextCancel(element.id)}
                onTextChange={(text) => handleTextChange(element.id, text)}
                onMove={(deltaX, deltaY) => handleTextMove(element.id, deltaX, deltaY)}
              />
            ))
          }
        </div>

        {/* Optional Sidebar for tool options */}
        <div className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 hidden lg:block">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Tool Options
          </h3>
          
          {/* Color Picker */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex gap-2 mb-2">
              {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000'].map(color => (
                <button
                  key={color}
                  onClick={() => setStrokeColor(color)}
                  className={`w-8 h-8 rounded border-2 ${
                    strokeColor === color ? 'border-gray-800 dark:border-gray-200' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-full h-8 border border-gray-300 rounded"
            />
          </div>

          {/* Stroke Width */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stroke Width: {strokeWidth}px
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Font Size */}
          {activeTool === 'text' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Size: {fontSize}px
              </label>
              <input
                type="range"
                min="8"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Elements List */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Annotations ({elements.length})
            </h4>
            <div className="max-h-32 overflow-y-auto">
              {elements.map((element, index) => (
                <div
                  key={element.id}
                  className="text-xs text-gray-600 dark:text-gray-400 p-1 border-b"
                >
                  {index + 1}. {element.type}
                  {element.text && `: "${element.text}"`}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
