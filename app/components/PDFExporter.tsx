'use client';

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DrawingElement } from './CanvasDrawing';

export class PDFExporter {
  static async mergePDFWithAnnotations(
    originalPDF: File,
    elements: DrawingElement[],
    pageNumber: number = 1,
    scale: number = 1.0
  ): Promise<Uint8Array> {
    // Read the original PDF
    const originalBytes = await originalPDF.arrayBuffer();
    const pdfDoc = await PDFDocument.load(originalBytes);
    
    // Get the specific page
    const pages = pdfDoc.getPages();
    const page = pages[pageNumber - 1];
    
    if (!page) {
      throw new Error(`Page ${pageNumber} not found`);
    }
    
    const { width, height } = page.getSize();
    
    // Load fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Process each drawing element
    for (const element of elements) {
      await this.drawElementOnPDF(page, element, scale, font, boldFont, width, height);
    }
    
    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }
  
  private static async drawElementOnPDF(
    page: any,
    element: DrawingElement,
    scale: number,
    font: any,
    boldFont: any,
    pageWidth: number,
    pageHeight: number
  ): Promise<void> {
    // Convert canvas coordinates to PDF coordinates
    const convertCoords = (x: number, y: number) => ({
      x: (x / scale),
      y: pageHeight - (y / scale) // PDF coordinates are bottom-up
    });
    
    // Parse color
    const color = this.parseColor(element.color);
    
    switch (element.type) {
      case 'text':
        if (element.text && element.points.length > 0) {
          const coords = convertCoords(element.points[0].x, element.points[0].y);
          page.drawText(element.text, {
            x: coords.x,
            y: coords.y,
            size: (element.fontSize || 16) / scale,
            font: font,
            color: rgb(color.r, color.g, color.b)
          });
        }
        break;
        
      case 'rectangle':
        if (element.points.length >= 2) {
          const start = convertCoords(element.points[0].x, element.points[0].y);
          const end = convertCoords(
            element.points[element.points.length - 1].x, 
            element.points[element.points.length - 1].y
          );
          
          const width = Math.abs(end.x - start.x);
          const height = Math.abs(end.y - start.y);
          
          page.drawRectangle({
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: width,
            height: height,
            borderColor: rgb(color.r, color.g, color.b),
            borderWidth: element.strokeWidth / scale
          });
        }
        break;
        
      case 'circle':
        if (element.points.length >= 2) {
          const start = convertCoords(element.points[0].x, element.points[0].y);
          const end = convertCoords(
            element.points[element.points.length - 1].x, 
            element.points[element.points.length - 1].y
          );
          
          const radius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
          ) / scale;
          
          page.drawCircle({
            x: start.x,
            y: start.y,
            size: radius * 2,
            borderColor: rgb(color.r, color.g, color.b),
            borderWidth: element.strokeWidth / scale
          });
        }
        break;
        
      case 'highlight':
        if (element.points.length >= 2) {
          const start = convertCoords(element.points[0].x, element.points[0].y);
          const end = convertCoords(
            element.points[element.points.length - 1].x, 
            element.points[element.points.length - 1].y
          );
          
          const width = Math.abs(end.x - start.x);
          const height = Math.abs(end.y - start.y) || 20 / scale; // Default highlight height
          
          page.drawRectangle({
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: width,
            height: height,
            color: rgb(color.r, color.g, color.b),
            opacity: 0.3
          });
        }
        break;
        
      case 'draw':
        // For freehand drawing, we'll approximate with line segments
        if (element.points.length > 1) {
          for (let i = 0; i < element.points.length - 1; i++) {
            const start = convertCoords(element.points[i].x, element.points[i].y);
            const end = convertCoords(element.points[i + 1].x, element.points[i + 1].y);
            
            // Draw a small rectangle to simulate a line
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 0) {
              page.drawRectangle({
                x: start.x,
                y: start.y - (element.strokeWidth / scale) / 2,
                width: length,
                height: element.strokeWidth / scale,
                color: rgb(color.r, color.g, color.b),
                rotate: { type: 'degrees', angle: Math.atan2(dy, dx) * 180 / Math.PI }
              });
            }
          }
        }
        break;
        
      case 'arrow':
        if (element.points.length >= 2) {
          const start = convertCoords(element.points[0].x, element.points[0].y);
          const end = convertCoords(
            element.points[element.points.length - 1].x, 
            element.points[element.points.length - 1].y
          );
          
          // Draw arrow line (simplified as a rectangle)
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          if (length > 0) {
            page.drawRectangle({
              x: start.x,
              y: start.y - (element.strokeWidth / scale) / 2,
              width: length,
              height: element.strokeWidth / scale,
              color: rgb(color.r, color.g, color.b),
              rotate: { type: 'degrees', angle: Math.atan2(dy, dx) * 180 / Math.PI }
            });
            
            // Draw arrowhead (simplified as a triangle approximation)
            const angle = Math.atan2(dy, dx);
            const headLength = 15 / scale;
            
            // Left arrow line
            const leftX = end.x - headLength * Math.cos(angle - Math.PI / 6);
            const leftY = end.y - headLength * Math.sin(angle - Math.PI / 6);
            
            // Right arrow line  
            const rightX = end.x - headLength * Math.cos(angle + Math.PI / 6);
            const rightY = end.y - headLength * Math.sin(angle + Math.PI / 6);
            
            // Draw arrowhead lines as rectangles
            const leftLength = Math.sqrt((end.x - leftX) ** 2 + (end.y - leftY) ** 2);
            const rightLength = Math.sqrt((end.x - rightX) ** 2 + (end.y - rightY) ** 2);
            
            page.drawRectangle({
              x: end.x,
              y: end.y,
              width: leftLength,
              height: element.strokeWidth / scale,
              color: rgb(color.r, color.g, color.b),
              rotate: { type: 'degrees', angle: Math.atan2(leftY - end.y, leftX - end.x) * 180 / Math.PI }
            });
            
            page.drawRectangle({
              x: end.x,
              y: end.y,
              width: rightLength,
              height: element.strokeWidth / scale,
              color: rgb(color.r, color.g, color.b),
              rotate: { type: 'degrees', angle: Math.atan2(rightY - end.y, rightX - end.x) * 180 / Math.PI }
            });
          }
        }
        break;
    }
  }
  
  private static parseColor(colorStr: string): { r: number; g: number; b: number } {
    // Handle hex colors
    if (colorStr.startsWith('#')) {
      const hex = colorStr.slice(1);
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return { r, g, b };
    }
    
    // Default to red if parsing fails
    return { r: 1, g: 0, b: 0 };
  }
}
