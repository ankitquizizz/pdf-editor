'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { ToolType } from './Toolbar';

interface Point {
  x: number;
  y: number;
}

interface TextFormat {
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  color: string;
  backgroundColor?: string;
}

interface DrawingElement {
  id: string;
  type: ToolType;
  points: Point[];
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
  width?: number;
  height?: number;
  isEditing?: boolean;
  textFormat?: TextFormat;
}

interface CanvasDrawingProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  activeTool: ToolType;
  elements: DrawingElement[];
  onElementAdd: (element: DrawingElement) => void;
  onElementUpdate: (id: string, element: Partial<DrawingElement>) => void;
  onElementDelete: (id: string) => void;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
}

export const CanvasDrawing: React.FC<CanvasDrawingProps> = ({
  canvasRef,
  activeTool,
  elements,
  onElementAdd,
  onElementUpdate,
  onElementDelete,
  strokeColor,
  strokeWidth,
  fontSize
}) => {
  const isDrawingRef = useRef(false);
  const currentElementRef = useRef<DrawingElement | null>(null);
  const startPointRef = useRef<Point | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const lastClickElementRef = useRef<string | null>(null);

  const getMousePos = useCallback((e: MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, [canvasRef]);

  const getViewportPos = useCallback((e: MouseEvent): Point => {
    // Get coordinates relative to the viewport for fixed positioning
    return {
      x: e.clientX,
      y: e.clientY
    };
  }, []);

  const drawElement = useCallback((ctx: CanvasRenderingContext2D, element: DrawingElement) => {
    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (element.type) {
      case 'draw':
        if (element.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case 'rectangle':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          const width = end.x - start.x;
          const height = end.y - start.y;
          ctx.strokeRect(start.x, start.y, width, height);
        }
        break;

      case 'circle':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          const radius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
          );
          ctx.beginPath();
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;

      case 'arrow':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          
          // Draw arrow line
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          
          // Draw arrowhead
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const headLength = 15;
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLength * Math.cos(angle - Math.PI / 6),
            end.y - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLength * Math.cos(angle + Math.PI / 6),
            end.y - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
        break;

      case 'text':
        if (element.text && element.points.length > 0) {
          const format = element.textFormat || {
            fontFamily: 'Arial',
            fontSize: element.fontSize || 16,
            isBold: false,
            isItalic: false,
            isUnderline: false,
            color: element.color
          };
          
          // Build font string
          let fontStyle = '';
          if (format.isItalic) fontStyle += 'italic ';
          if (format.isBold) fontStyle += 'bold ';
          fontStyle += `${format.fontSize}px ${format.fontFamily}`;
          
          ctx.font = fontStyle;
          ctx.fillStyle = format.color;
          
          // Draw text with background for better visibility and interaction
          const lines = element.text.split('\n');
          const lineHeight = format.fontSize * 1.2;
          
          lines.forEach((line, index) => {
            const y = element.points[0].y + (index * lineHeight);
            
            // Draw background if specified
            if (format.backgroundColor && !element.isEditing) {
              const textMetrics = ctx.measureText(line);
              ctx.fillStyle = format.backgroundColor;
              ctx.fillRect(
                element.points[0].x - 2, 
                y - format.fontSize - 2, 
                textMetrics.width + 4, 
                format.fontSize + 4
              );
            }
            
            // Draw semi-transparent background for better click detection
            if (!element.isEditing && !format.backgroundColor) {
              const textMetrics = ctx.measureText(line);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
              ctx.fillRect(
                element.points[0].x - 2, 
                y - format.fontSize - 2, 
                textMetrics.width + 4, 
                format.fontSize + 4
              );
            }
            
            // Draw text
            ctx.fillStyle = format.color;
            ctx.fillText(line, element.points[0].x, y);
            
            // Draw underline if needed
            if (format.isUnderline) {
              const textMetrics = ctx.measureText(line);
              ctx.beginPath();
              ctx.moveTo(element.points[0].x, y + 2);
              ctx.lineTo(element.points[0].x + textMetrics.width, y + 2);
              ctx.strokeStyle = format.color;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          });
        }
        break;

      case 'highlight':
        if (element.points.length >= 2) {
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = element.color;
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          const width = end.x - start.x;
          const height = end.y - start.y || 20; // Default highlight height
          ctx.fillRect(start.x, start.y, width, height);
          ctx.globalAlpha = 1.0;
        }
        break;
    }
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all elements (except those being edited)
    elements
      .filter(element => !(element.type === 'text' && element.isEditing))
      .forEach(element => drawElement(ctx, element));

    // Draw current element being drawn
    if (currentElementRef.current) {
      drawElement(ctx, currentElementRef.current);
    }
  }, [canvasRef, elements, drawElement]);

  // Check if point is inside a text element
  const getTextElementAtPoint = useCallback((point: Point): DrawingElement | null => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (element.type === 'text' && element.text && !element.isEditing) {
        const lines = element.text.split('\n');
        const lineHeight = (element.fontSize || 16) * 1.2;
        
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          const line = lines[lineIndex];
          const canvas = canvasRef.current;
          if (!canvas) continue;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          
          ctx.font = `${element.fontSize || 16}px Arial`;
          const textMetrics = ctx.measureText(line);
          const lineY = element.points[0].y + (lineIndex * lineHeight);
          
          // Check if point is within text bounds
          if (
            point.x >= element.points[0].x - 2 &&
            point.x <= element.points[0].x + textMetrics.width + 2 &&
            point.y >= lineY - (element.fontSize || 16) - 2 &&
            point.y <= lineY + 4
          ) {
            return element;
          }
        }
      }
    }
    return null;
  }, [elements, canvasRef]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    const point = getMousePos(e);
    const currentTime = Date.now();
    
    // Handle double-click on existing text elements
    const textElement = getTextElementAtPoint(point);
    if (textElement && activeTool === 'select') {
      const timeDiff = currentTime - lastClickTimeRef.current;
      const isSameElement = lastClickElementRef.current === textElement.id;
      
      if (timeDiff < 300 && isSameElement) { // Double-click detected
        // Check if there's already a text element being edited
        const existingEditingElement = elements.find(el => el.type === 'text' && el.isEditing);
        if (existingEditingElement) {
          // Don't open another editor if one is already open
          return;
        }
        
        // Convert canvas coordinates to viewport coordinates for existing text
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const fontSize = textElement.textFormat?.fontSize || textElement.fontSize || 16;
          const viewportPoint = {
            x: textElement.points[0].x + rect.left,
            y: textElement.points[0].y + rect.top - fontSize  // Convert from baseline to top positioning
          };
          // Update the element with viewport coordinates for editing
          onElementUpdate(textElement.id, { 
            isEditing: true,
            points: [viewportPoint]
          });
        }
        lastClickTimeRef.current = 0; // Reset to prevent triple-click
        lastClickElementRef.current = null;
        return;
      }
      
      lastClickTimeRef.current = currentTime;
      lastClickElementRef.current = textElement.id;
      return;
    }
    
    // Reset click tracking for non-text interactions
    lastClickTimeRef.current = currentTime;
    lastClickElementRef.current = null;

    if (activeTool === 'select') return;

    isDrawingRef.current = true;
    startPointRef.current = point;

    if (activeTool === 'text') {
      // Check if there's already a text element being edited
      const existingEditingElement = elements.find(el => el.type === 'text' && el.isEditing);
      if (existingEditingElement) {
        // Don't open another editor if one is already open
        return;
      }

      // Check if clicking on existing text element first
      const textElement = getTextElementAtPoint(point);
      if (textElement) {
        // Convert canvas coordinates to viewport coordinates for existing text
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const fontSize = textElement.textFormat?.fontSize || textElement.fontSize || 16;
          const viewportPoint = {
            x: textElement.points[0].x + rect.left,
            y: textElement.points[0].y + rect.top - fontSize  // Convert from baseline to top positioning
          };
          // Update the element with viewport coordinates for editing
          onElementUpdate(textElement.id, { 
            isEditing: true,
            points: [viewportPoint]
          });
        }
        return;
      }

      // Get viewport coordinates for text positioning
      const viewportPoint = getViewportPos(e);

      // Create a new text element in editing mode if not clicking on existing text
      const newElement: DrawingElement = {
        id: Date.now().toString(),
        type: 'text',
        points: [viewportPoint], // Use viewport coordinates for text positioning
        color: strokeColor,
        strokeWidth,
        text: '',
        fontSize,
        isEditing: true,
        textFormat: {
          fontFamily: 'Arial',
          fontSize: fontSize,
          isBold: false,
          isItalic: false,
          isUnderline: false,
          color: strokeColor,
          backgroundColor: undefined
        }
      };
      onElementAdd(newElement);
      return;
    }

    currentElementRef.current = {
      id: Date.now().toString(),
      type: activeTool,
      points: [point],
      color: strokeColor,
      strokeWidth
    };
  }, [activeTool, getMousePos, strokeColor, strokeWidth, fontSize, onElementAdd, getTextElementAtPoint, onElementUpdate, elements]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawingRef.current || !currentElementRef.current || activeTool === 'select') return;

    const point = getMousePos(e);

    if (activeTool === 'draw') {
      currentElementRef.current.points.push(point);
    } else {
      // For shapes, just update the end point
      currentElementRef.current.points = [startPointRef.current!, point];
    }

    redrawCanvas();
  }, [activeTool, getMousePos, redrawCanvas]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current || !currentElementRef.current) return;

    onElementAdd(currentElementRef.current);
    currentElementRef.current = null;
    isDrawingRef.current = false;
    startPointRef.current = null;
  }, [onElementAdd]);

  // Handle eraser tool
  const handleEraser = useCallback((e: MouseEvent) => {
    if (activeTool !== 'eraser') return;

    const point = getMousePos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear a circular area around the mouse
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(point.x, point.y, strokeWidth, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }, [activeTool, getMousePos, canvasRef, strokeWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update cursor based on active tool
    const updateCursor = () => {
      switch (activeTool) {
        case 'text':
          canvas.style.cursor = 'text';
          break;
        case 'select':
          canvas.style.cursor = 'default';
          break;
        case 'eraser':
          canvas.style.cursor = 'crosshair';
          break;
        default:
          canvas.style.cursor = 'crosshair';
      }
    };

    updateCursor();

    const handleMouseDownWrapper = (e: MouseEvent) => {
      if (activeTool === 'eraser') {
        handleEraser(e);
      } else {
        handleMouseDown(e);
      }
    };

    const handleMouseMoveWrapper = (e: MouseEvent) => {
      if (activeTool === 'eraser' && e.buttons === 1) {
        handleEraser(e);
      } else {
        handleMouseMove(e);
      }
    };

    canvas.addEventListener('mousedown', handleMouseDownWrapper);
    canvas.addEventListener('mousemove', handleMouseMoveWrapper);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDownWrapper);
      canvas.removeEventListener('mousemove', handleMouseMoveWrapper);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeTool, handleMouseDown, handleMouseMove, handleMouseUp, handleEraser]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas, canvasRef]);

  return null; // This component doesn't render anything itself
};

export type { DrawingElement, TextFormat };
