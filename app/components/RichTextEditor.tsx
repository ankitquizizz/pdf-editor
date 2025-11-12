'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Check, 
  X, 
  Bold, 
  Italic, 
  Underline,
  Palette,
  Type,
  ChevronDown
} from 'lucide-react';
import { DrawingElement, TextFormat } from './CanvasDrawing';

interface InPlaceTextEditorProps {
  element: DrawingElement;
  onConfirm: (text: string, format: TextFormat) => void;
  onCancel: () => void;
  onTextChange: (text: string) => void;
  onMove: (deltaX: number, deltaY: number) => void;
}

const FONT_FAMILIES = [
  'Arial',
  'Times New Roman', 
  'Helvetica',
  'Verdana',
  'Courier New'
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

const COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#0066ff', '#6600ff',
  '#ff3399', '#ff9933', '#99ff33', '#33ff99', '#3399ff', '#9933ff'
];

export const InPlaceTextEditor: React.FC<InPlaceTextEditorProps> = ({
  element,
  onConfirm,
  onCancel,
  onTextChange,
  onMove
}) => {
  const [text, setText] = useState(element.text || '');
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [format, setFormat] = useState<TextFormat>({
    fontFamily: element.textFormat?.fontFamily || 'Arial',
    fontSize: element.textFormat?.fontSize || element.fontSize || 16,
    isBold: element.textFormat?.isBold || false,
    isItalic: element.textFormat?.isItalic || false,
    isUnderline: element.textFormat?.isUnderline || false,
    color: element.textFormat?.color || element.color || '#000000',
    backgroundColor: element.textFormat?.backgroundColor
  });
  
  const textInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textInputRef.current) {
      // Set initial text content
      if (element.text && textInputRef.current.textContent !== element.text) {
        textInputRef.current.textContent = element.text;
      }
      
      // Focus and position cursor at end
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          
          // Position cursor at end of text
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(textInputRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 10);
    }
  }, [element.text]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowFontDropdown(false);
      setShowSizeDropdown(false);
      setShowColorPicker(false);
    };

    if (showFontDropdown || showSizeDropdown || showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFontDropdown, showSizeDropdown, showColorPicker]);

  const handleConfirm = () => {
    if (text.trim()) {
      onConfirm(text.trim(), format);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleTextInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || '';
    setText(newText);
    onTextChange(newText);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if clicking on the text input itself (not toolbar)
    if (e.target === textInputRef.current) {
      // Don't prevent default for text input - let it focus normally
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    onMove(deltaX, deltaY);
    
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleFormat = (formatType: keyof TextFormat) => {
    setFormat(prev => ({
      ...prev,
      [formatType]: !prev[formatType as keyof TextFormat]
    }));
  };

  const updateFormat = (updates: Partial<TextFormat>) => {
    setFormat(prev => ({ ...prev, ...updates }));
  };

  const position = element.points[0];

  const textStyle = {
    fontFamily: format.fontFamily,
    fontSize: `${format.fontSize}px`,
    fontWeight: format.isBold ? 'bold' : 'normal',
    fontStyle: format.isItalic ? 'italic' : 'normal',
    textDecoration: format.isUnderline ? 'underline' : 'none',
    color: format.color,
    backgroundColor: format.backgroundColor || 'transparent',
    minWidth: '20px',
    minHeight: `${format.fontSize + 4}px`,
    outline: 'none',
    border: '1px dashed #3b82f6',
    padding: '2px',
    whiteSpace: 'pre-wrap' as const,
    lineHeight: 1.2
  };

  return (
    <>
      {/* Floating Toolbar */}
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl formatting-toolbar"
        style={{
          left: Math.max(5, Math.min(position.x, window.innerWidth - 320)),
          top: Math.max(5, position.y - 60),
        }}
      >
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 p-2">
          {/* Bold, Italic, Underline */}
          <button
            onClick={() => toggleFormat('isBold')}
            className={`p-1 rounded transition-colors ${
              format.isBold 
                ? 'bg-blue-500 text-white' 
                : 'bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500'
            }`}
            title="Bold"
          >
            <Bold size={14} />
          </button>
          
          <button
            onClick={() => toggleFormat('isItalic')}
            className={`p-1 rounded transition-colors ${
              format.isItalic 
                ? 'bg-blue-500 text-white' 
                : 'bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500'
            }`}
            title="Italic"
          >
            <Italic size={14} />
          </button>
          
          <button
            onClick={() => toggleFormat('isUnderline')}
            className={`p-1 rounded transition-colors ${
              format.isUnderline 
                ? 'bg-blue-500 text-white' 
                : 'bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500'
            }`}
            title="Underline"
          >
            <Underline size={14} />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1" />

          {/* Font Family */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFontDropdown(!showFontDropdown);
                setShowSizeDropdown(false);
                setShowColorPicker(false);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-600 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-500"
            >
              <span className="max-w-[60px] truncate">{format.fontFamily}</span>
              <ChevronDown size={12} />
            </button>
            
            {showFontDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 border rounded shadow-lg z-10 max-h-32 overflow-y-auto">
                {FONT_FAMILIES.map(font => (
                  <button
                    key={font}
                    onClick={() => {
                      updateFormat({ fontFamily: font });
                      setShowFontDropdown(false);
                    }}
                    className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-600"
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSizeDropdown(!showSizeDropdown);
                setShowFontDropdown(false);
                setShowColorPicker(false);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-600 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-500"
            >
              <Type size={12} />
              <span>{format.fontSize}</span>
              <ChevronDown size={12} />
            </button>
            
            {showSizeDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 border rounded shadow-lg z-10 max-h-32 overflow-y-auto">
                {FONT_SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => {
                      updateFormat({ fontSize: size });
                      setShowSizeDropdown(false);
                    }}
                    className="block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    {size}px
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowFontDropdown(false);
                setShowSizeDropdown(false);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500"
              title="Text Color"
            >
              <Palette size={12} />
              <div 
                className="w-3 h-3 rounded border"
                style={{ backgroundColor: format.color }}
              />
              <ChevronDown size={12} />
            </button>
            
            {showColorPicker && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-700 border rounded shadow-lg z-10 p-2">
                <div className="grid grid-cols-6 gap-1">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        updateFormat({ color });
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                      style={{ 
                        backgroundColor: color,
                        borderColor: format.color === color ? '#3b82f6' : '#d1d5db'
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1" />

          {/* Action buttons */}
          <button
            onClick={handleConfirm}
            className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-800 rounded transition-colors"
            title="Confirm (Enter)"
          >
            <Check size={16} />
          </button>
          <button
            onClick={onCancel}
            className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded transition-colors"
            title="Cancel (Escape)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* In-place Text Input - appears directly on PDF */}
      <div
        ref={textInputRef}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={handleTextInput}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`fixed z-40 text-input-inplace ${isDragging ? 'cursor-grabbing' : 'cursor-text'}`}
        style={{
          left: position.x - 2, // Small offset to center better
          top: position.y - 2,  // Small offset to center better
          ...textStyle,
          cursor: isDragging ? 'grabbing' : 'text',
          outline: 'none',
          userSelect: 'text',
          WebkitUserSelect: 'text'
        }}
        data-placeholder="Type your text..."
        title="Click to type, drag to move"
        tabIndex={0}
        autoFocus
      />
    </>
  );
};