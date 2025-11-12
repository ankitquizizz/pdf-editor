# PDF Editor

A powerful React-based PDF editor that allows users to upload, view, annotate, and save PDF documents with comprehensive editing capabilities.

## Features

### Core Functionality
- ✅ **PDF Upload & Viewing**: Drag and drop or click to upload PDF files
- ✅ **Page Navigation**: Navigate through multi-page PDF documents
- ✅ **Zoom Controls**: Zoom in/out for detailed editing
- ✅ **Real-time Preview**: See changes as you make them

### Annotation Tools
- ✅ **Text Annotations**: Add custom text anywhere on the PDF
- ✅ **Freehand Drawing**: Draw with customizable pen tool
- ✅ **Shape Tools**: Add rectangles, circles, and arrows
- ✅ **Highlight Tool**: Highlight important text sections
- ✅ **Eraser**: Remove unwanted annotations

### Advanced Features
- ✅ **Undo/Redo**: Full history management for all edits
- ✅ **Export with Annotations**: Merge all annotations into the original PDF
- ✅ **Customizable Tools**: Adjust colors, stroke width, and font sizes
- ✅ **Dark Mode Support**: Automatic dark/light theme switching
- ✅ **Responsive Design**: Works on desktop and tablet devices

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **PDF Rendering**: react-pdf (PDF.js)
- **PDF Editing**: pdf-lib
- **File Operations**: FileSaver.js
- **UI Components**: Tailwind CSS, Lucide React icons
- **Styling**: CSS with dark mode support

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pdf-editor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Guide

### 1. Upload a PDF
- Click the green upload button in the toolbar
- Select a PDF file from your device
- The PDF will load and display in the viewer

### 2. Use Annotation Tools
- **Select Tool**: Default mode for panning and viewing
- **Text Tool**: Click anywhere to add text annotations
- **Draw Tool**: Click and drag to draw freehand
- **Highlight Tool**: Click and drag to highlight text areas
- **Shape Tools**: Add rectangles, circles, and arrows
- **Eraser**: Remove unwanted annotations

### 3. Customize Your Tools
- Use the sidebar to adjust:
  - Color picker for all annotation tools
  - Stroke width for drawing tools
  - Font size for text annotations

### 4. Navigate Your Document
- Use the navigation controls to move between pages
- Zoom in/out for detailed work
- View page counter to track your position

### 5. Save Your Work
- Click the blue download button to export your edited PDF
- All annotations will be permanently merged into the PDF
- The original file remains unchanged

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── PDFEditor.tsx       # Main editor component
│   │   ├── PDFViewer.tsx       # PDF display component
│   │   ├── Toolbar.tsx         # Tool selection and controls
│   │   ├── CanvasDrawing.tsx   # Drawing and annotation logic
│   │   └── PDFExporter.tsx     # PDF merging and export
│   ├── globals.css             # Global styles and themes
│   ├── layout.tsx              # App layout and metadata
│   └── page.tsx                # Main page component
├── public/                     # Static assets
└── package.json               # Dependencies and scripts
```

## Development

### Key Components

- **PDFEditor**: Main orchestrator component managing state and coordination
- **PDFViewer**: Handles PDF rendering using react-pdf
- **Toolbar**: Provides tool selection and file operations
- **CanvasDrawing**: Manages canvas overlay for annotations
- **PDFExporter**: Merges annotations with original PDF using pdf-lib

### State Management
The application uses React hooks for state management:
- PDF file and document state
- Current page and zoom level
- Active tool and tool settings
- Drawing elements and history
- Undo/redo functionality

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Limitations

- Canvas-based annotations work best on desktop/tablet devices
- Very large PDF files may impact performance
- Mobile touch drawing is supported but may be less precise
- Complex PDF forms and interactive elements are view-only

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the browser console for errors
2. Ensure your PDF file is valid and not corrupted
3. Try refreshing the page if the interface becomes unresponsive
4. Clear browser cache if you experience loading issues

---

**Note**: This PDF editor runs entirely in the browser - no files are uploaded to any server. All processing happens locally for maximum privacy and security.