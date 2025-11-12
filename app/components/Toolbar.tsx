'use client';

import React from 'react';
import { 
  MousePointer2, 
  Type, 
  Pen, 
  Highlighter, 
  Eraser, 
  Download, 
  Upload,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Square,
  Circle,
  ArrowRight,
  Undo,
  Redo
} from 'lucide-react';

export type ToolType = 'select' | 'text' | 'draw' | 'highlight' | 'eraser' | 'rectangle' | 'circle' | 'arrow';

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onFileUpload: (file: File) => void;
  onDownload: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onUndo: () => void;
  onRedo: () => void;
  currentPage: number;
  totalPages: number;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onToolChange,
  onFileUpload,
  onDownload,
  onZoomIn,
  onZoomOut,
  onPreviousPage,
  onNextPage,
  onUndo,
  onRedo,
  currentPage,
  totalPages,
  zoom,
  canUndo,
  canRedo
}) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileUpload(file);
    }
  };

  const renderToolButton = (
    tool: ToolType | undefined,
    Icon: React.ElementType,
    label: string,
    onClick?: () => void
  ) => (
    <button
      key={tool || label}
      onClick={onClick || (() => tool && onToolChange(tool))}
      className={`p-2 rounded-lg transition-colors duration-200 ${
        activeTool === tool
          ? 'bg-blue-500 text-white shadow-lg' 
          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-md'
      }`}
      title={label}
    >
      <Icon size={20} />
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        {/* File Operations */}
        <div className="flex items-center gap-2">
          <label className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg cursor-pointer transition-colors duration-200 shadow-md">
            <Upload size={20} />
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          
          <button
            onClick={onDownload}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-md"
            title="Download PDF"
          >
            <Download size={20} />
          </button>
        </div>

        {/* Editing Tools */}
        <div className="flex items-center gap-2">
          {renderToolButton("select", MousePointer2, "Select / Pan (Double-click text to edit)")}
          {renderToolButton("text", Type, "Add Text (Click existing text to edit, drag to move)")}
          {renderToolButton("draw", Pen, "Draw")}
          {renderToolButton("highlight", Highlighter, "Highlight")}
          {renderToolButton("rectangle", Square, "Rectangle")}
          {renderToolButton("circle", Circle, "Circle")}
          {renderToolButton("arrow", ArrowRight, "Arrow")}
          {renderToolButton("eraser", Eraser, "Eraser")}
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              canUndo 
                ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-md' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
            title="Undo"
          >
            <Undo size={20} />
          </button>
          
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              canRedo 
                ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-md' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
            title="Redo"
          >
            <Redo size={20} />
          </button>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPreviousPage}
            disabled={currentPage <= 1}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              currentPage > 1 
                ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-md' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
            title="Previous Page"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-sm min-w-[80px] text-center">
            {totalPages > 0 ? `${currentPage}/${totalPages}` : '0/0'}
          </span>
          
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              currentPage < totalPages 
                ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-md' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
            title="Next Page"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onZoomOut}
            className="p-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 shadow-md"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-sm min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={onZoomIn}
            className="p-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 shadow-md"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
