import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';

function CanvasEditor() {
  const { state, actions } = useApp();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [cursorGridPos, setCursorGridPos] = useState(null);
  // New states for element manipulation
  const [resizeHandle, setResizeHandle] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // New states for measurement tool
  const [measureStart, setMeasureStart] = useState(null);
  const [measureEnd, setMeasureEnd] = useState(null);
  const [measurements, setMeasurements] = useState([]);

  // Grid and canvas setup
  const setupCanvas = useCallback(() => {
    console.log('SETUP CANVAS CALLED', { showGrid: state.showGrid, zoom: state.zoom, elements: state.elements.length });
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    console.log('Canvas dimensions:', {
      width: canvas.width,
      height: canvas.height,
      containerWidth: container.clientWidth,
      containerHeight: container.clientHeight
    });
    
    draw();
  }, [state.elements, state.showGrid, state.zoom, state.panOffset, cursorGridPos]);

  // Drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context state
    ctx.save();
    
    // Apply zoom and pan
    ctx.translate(state.panOffset.x, state.panOffset.y);
    ctx.scale(state.zoom, state.zoom);
    
    // Draw grid
    console.log('DRAW FUNCTION checking showGrid:', state.showGrid);
    if (state.showGrid) {
      drawGrid(ctx, canvas);
    }
    
    // Draw cursor grid highlight
    if (state.showGrid && cursorGridPos) {
      drawCursorHighlight(ctx);
    }
    
    // Draw measurements
    drawMeasurements(ctx);
    
    // Draw elements (only visible levels)
    const visibleLevels = state.levels.filter(level => level.visible).map(level => level.id);
    state.elements
      .filter(element => visibleLevels.includes(element.levelId || state.activeLevel))
      .forEach(element => {
        const isSelected = element.id === state.selectedElement?.id || 
                          state.selectedElements.some(sel => sel.id === element.id);
        drawElement(ctx, element, isSelected);
      });
    
    // Draw resize handles for selected element
    if (state.selectedElement && state.currentTool === 'select') {
      drawResizeHandles(ctx, state.selectedElement);
    }
    
    // Draw measurement tool preview
    if (state.currentTool === 'measure' && measureStart && measureEnd) {
      drawMeasurementLine(ctx, measureStart, measureEnd, true);
    }
    
    // Draw selection box
    if (selectionBox) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        selectionBox.x, 
        selectionBox.y, 
        selectionBox.width, 
        selectionBox.height
      );
      ctx.setLineDash([]);
    }
    
    // Restore context state
    ctx.restore();
  }, [state.elements, state.selectedElement, state.selectedElements, state.showGrid, state.zoom, state.panOffset, state.levels, state.activeLevel, selectionBox, cursorGridPos, measureStart, measureEnd, measurements]);

  const drawGrid = (ctx, canvas) => {
    console.log('GRID DRAWING CALLED', { showGrid: state.showGrid, zoom: state.zoom });
    // Professional hierarchical grid system:
    // - 1 inch = 20 pixels at 100% zoom
    // - 1 foot = 240 pixels at 100% zoom (12 inches * 20 pixels)
    // - 5 feet = 1200 pixels (major grid lines)
    // - 10 feet = 2400 pixels (super major grid lines when zoomed out)
    
    const baseInchSize = 20; // pixels per inch at 100% zoom
    const baseFeetSize = baseInchSize * 12; // 240 pixels per foot
    const base5FeetSize = baseFeetSize * 5; // 1200 pixels per 5 feet
    const base10FeetSize = baseFeetSize * 10; // 2400 pixels per 10 feet
    
    // Adjust grid sizes based on zoom level - these are used for visibility checks
    const inchGridSize = baseInchSize * state.zoom;
    const feetGridSize = baseFeetSize * state.zoom;
    const fiveFeetGridSize = base5FeetSize * state.zoom;
    const tenFeetGridSize = base10FeetSize * state.zoom;
    
    // Professional grid colors with hierarchy - EXTREMELY bold colors for guaranteed visibility
    const inchGridColor = '#a1a1aa';      // Medium gray for inches - was #c7cbd1
    const feetGridColor = '#71717a';      // Darker gray for feet - was #9ca3af
    const fiveFeetGridColor = '#3f3f46';  // Very dark gray for 5-foot marks - was #6b7280
    const tenFeetGridColor = '#18181b';   // Nearly black for 10-foot marks - was #4b5563
    
    // Calculate visible area in world coordinates
    const leftX = -state.panOffset.x / state.zoom;
    const topY = -state.panOffset.y / state.zoom;
    const rightX = leftX + canvas.width / state.zoom;
    const bottomY = topY + canvas.height / state.zoom;
    
    // Draw appropriate grid based on zoom level
    let gridSize, lineColor, lineWidth;
    
    // Determine which grid level to show based on zoom
    if (state.zoom >= 0.5) {
      // Show inch grid when zoomed in enough
      gridSize = baseInchSize;
      lineColor = inchGridColor;
      lineWidth = 1.5; // Significantly increased thickness - was 1.0
    } else if (state.zoom >= 0.1) {
      // Show foot grid at medium zoom
      gridSize = baseFeetSize;
      lineColor = feetGridColor;
      lineWidth = 2.0; // Significantly increased thickness - was 1.5
    } else if (state.zoom >= 0.05) {
      // Show 5-foot grid when zoomed out
      gridSize = base5FeetSize;
      lineColor = fiveFeetGridColor;
      lineWidth = 2.5; // Significantly increased thickness - was 2.0
    } else {
      // Show 10-foot grid when very zoomed out
      gridSize = base10FeetSize;
      lineColor = tenFeetGridColor;
      lineWidth = 3.0; // Significantly increased thickness - was 2.5
    }
    
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([]);
    
    // Draw vertical lines
    const startX = Math.floor(leftX / gridSize) * gridSize;
    for (let x = startX; x <= rightX + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    const startY = Math.floor(topY / gridSize) * gridSize;
    for (let y = startY; y <= bottomY + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(leftX, y);
      ctx.lineTo(rightX, y);
      ctx.stroke();
    }
    
    // Draw major grid lines (feet) if showing inch grid
    if (state.zoom >= 0.5 && feetGridSize > 10) {
      ctx.strokeStyle = feetGridColor;
      ctx.lineWidth = 2.0; // Increased for better visibility - was 1.5
      
      // Major vertical lines
      const startMajorX = Math.floor(leftX / baseFeetSize) * baseFeetSize;
      for (let x = startMajorX; x <= rightX + baseFeetSize; x += baseFeetSize) {
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.stroke();
      }
      
      // Major horizontal lines
      const startMajorY = Math.floor(topY / baseFeetSize) * baseFeetSize;
      for (let y = startMajorY; y <= bottomY + baseFeetSize; y += baseFeetSize) {
        ctx.beginPath();
        ctx.moveTo(leftX, y);
        ctx.lineTo(rightX, y);
        ctx.stroke();
      }
    }
    
    // Draw super major grid lines (5 feet) if showing foot or inch grid
    if (state.zoom >= 0.1 && fiveFeetGridSize > 20) {
      ctx.strokeStyle = fiveFeetGridColor;
      ctx.lineWidth = 2.5; // Increased for better visibility - was 2.0
      
      // Super major vertical lines
      const startSuperX = Math.floor(leftX / base5FeetSize) * base5FeetSize;
      for (let x = startSuperX; x <= rightX + base5FeetSize; x += base5FeetSize) {
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.stroke();
      }
      
      // Super major horizontal lines
      const startSuperY = Math.floor(topY / base5FeetSize) * base5FeetSize;
      for (let y = startSuperY; y <= bottomY + base5FeetSize; y += base5FeetSize) {
        ctx.beginPath();
        ctx.moveTo(leftX, y);
        ctx.lineTo(rightX, y);
        ctx.stroke();
      }
    }
    
    // Add subtle origin indicators (0,0 crosshairs)
    if (leftX <= 0 && rightX >= 0 && topY <= 0 && bottomY >= 0) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      
      // Origin crosshairs
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 10);
      ctx.stroke();
      
      ctx.globalAlpha = 1;
    }
    
    // DEBUG: Draw a bold border around the entire grid area to make it easy to see
    ctx.strokeStyle = '#ff00ff'; // Magenta border
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.rect(leftX, topY, rightX - leftX, bottomY - topY);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const drawCursorHighlight = (ctx) => {
    if (!cursorGridPos) return;
    
    const baseInchSize = 20; // pixels per inch at 100% zoom
    
    // Draw a highlighted circle at the grid intersection
    ctx.save();
    
    // Create a pulsing effect by varying the radius slightly
    const time = Date.now() / 400; // Slower pulse for better visibility
    const pulseRadius = 5 + Math.sin(time) * 2; // Larger base radius
    
    // Outer glow
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // Semi-transparent blue
    ctx.beginPath();
    ctx.arc(cursorGridPos.x, cursorGridPos.y, pulseRadius + 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Main highlight circle
    ctx.fillStyle = '#3b82f6'; // Blue color for highlight
    ctx.strokeStyle = '#1d4ed8'; // Darker blue for border
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cursorGridPos.x, cursorGridPos.y, pulseRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Add crosshair lines extending from the highlight point (shorter lines)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    
    const crosshairLength = baseInchSize * 0.75; // Slightly shorter crosshairs
    
    // Horizontal crosshair
    ctx.beginPath();
    ctx.moveTo(cursorGridPos.x - crosshairLength, cursorGridPos.y);
    ctx.lineTo(cursorGridPos.x + crosshairLength, cursorGridPos.y);
    ctx.stroke();
    
    // Vertical crosshair
    ctx.beginPath();
    ctx.moveTo(cursorGridPos.x, cursorGridPos.y - crosshairLength);
    ctx.lineTo(cursorGridPos.x, cursorGridPos.y + crosshairLength);
    ctx.stroke();
    
    ctx.setLineDash([]);
    ctx.restore();
  };

  const drawElement = (ctx, element, isSelected) => {
    ctx.save();
    
    // Professional color scheme for different element types
    const elementStyles = {
      wall: {
        fillColor: 'rgba(107, 114, 128, 0.8)',  // Gray-500 with transparency
        strokeColor: '#374151',                 // Gray-700
        selectedColor: '#3b82f6'               // Blue-500
      },
      door: {
        fillColor: 'rgba(239, 68, 68, 0.6)',   // Red-500 with transparency
        strokeColor: '#dc2626',                 // Red-600
        selectedColor: '#ef4444'               // Red-500
      },
      window: {
        fillColor: 'rgba(59, 130, 246, 0.6)',  // Blue-500 with transparency
        strokeColor: '#2563eb',                 // Blue-600
        selectedColor: '#3b82f6'               // Blue-500
      },
      column: {
        fillColor: 'rgba(16, 185, 129, 0.7)',  // Emerald-500 with transparency
        strokeColor: '#059669',                 // Emerald-600
        selectedColor: '#10b981'               // Emerald-500
      },
      beam: {
        fillColor: 'rgba(245, 158, 11, 0.7)',  // Amber-500 with transparency
        strokeColor: '#d97706',                 // Amber-600
        selectedColor: '#f59e0b'               // Amber-500
      }
    };
    
    const style = elementStyles[element.type] || elementStyles.wall;
    
    if (isSelected) {
      ctx.strokeStyle = style.selectedColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = style.selectedColor;
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      ctx.strokeStyle = style.strokeColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }
    
    ctx.fillStyle = element.fillColor || style.fillColor;
    
    switch (element.type) {
      case 'wall':
        drawWall(ctx, element);
        break;
      case 'door':
        drawDoor(ctx, element);
        break;
      case 'window':
        drawWindow(ctx, element);
        break;
      case 'column':
        drawColumn(ctx, element);
        break;
      case 'beam':
        drawBeam(ctx, element);
        break;
      default:
        break;
    }
    
    // Add element labels when zoomed in enough
    if (state.zoom > 0.3) {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillStyle = isSelected ? '#ffffff' : '#000000';
      ctx.font = `${Math.max(10, 12 * state.zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      const label = element.type.charAt(0).toUpperCase() + element.type.slice(1);
      
      // Add text background for better readability
      const textMetrics = ctx.measureText(label);
      const textWidth = textMetrics.width;
      const textHeight = 14 * state.zoom;
      
      ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(
        centerX - textWidth / 2 - 2,
        centerY - textHeight / 2 - 1,
        textWidth + 4,
        textHeight + 2
      );
      
      ctx.fillStyle = isSelected ? '#ffffff' : '#000000';
      ctx.fillText(label, centerX, centerY);
    }
    
    ctx.restore();
  };

  const drawWall = (ctx, element) => {
    // Draw main wall body
    ctx.beginPath();
    ctx.rect(element.x, element.y, element.width, element.height);
    ctx.fill();
    ctx.stroke();
    
    // Add texture pattern for walls when zoomed in
    if (state.zoom > 0.5) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 0.5;
      
      // Horizontal mortar lines
      const mortarSpacing = 8; // pixels
      for (let y = element.y; y < element.y + element.height; y += mortarSpacing) {
        ctx.beginPath();
        ctx.moveTo(element.x, y);
        ctx.lineTo(element.x + element.width, y);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const drawDoor = (ctx, element) => {
    const margin = 2; // Door frame margin
    
    // Door frame (thicker outline)
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.rect(element.x, element.y, element.width, element.height);
    ctx.stroke();
    
    // Door panel (inner rectangle)
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(139, 69, 19, 0.4)'; // Brown wood color
    ctx.beginPath();
    ctx.rect(
      element.x + margin, 
      element.y + margin, 
      element.width - 2 * margin, 
      element.height - 2 * margin
    );
    ctx.fill();
    ctx.stroke();
    
    // Door swing arc (90-degree arc from hinge point)
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(element.x, element.y + element.height, element.width, -Math.PI/2, 0);
    ctx.stroke();
    ctx.restore();
    
    // Door handle
    if (state.zoom > 0.4) {
      ctx.fillStyle = '#fbbf24'; // Gold handle
      ctx.beginPath();
      ctx.arc(
        element.x + element.width - 8, 
        element.y + element.height / 2, 
        3, 
        0, 
        2 * Math.PI
      );
      ctx.fill();
    }
  };

  const drawWindow = (ctx, element) => {
    const margin = 3; // Window frame margin
    
    // Window frame (outer)
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(element.x, element.y, element.width, element.height);
    ctx.stroke();
    
    // Window glass area
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; // Light blue glass
    ctx.beginPath();
    ctx.rect(
      element.x + margin, 
      element.y + margin, 
      element.width - 2 * margin, 
      element.height - 2 * margin
    );
    ctx.fill();
    
    // Window mullions (cross pattern)
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#374151';
    ctx.beginPath();
    
    // Vertical mullion
    const centerX = element.x + element.width / 2;
    ctx.moveTo(centerX, element.y + margin);
    ctx.lineTo(centerX, element.y + element.height - margin);
    
    // Horizontal mullion
    const centerY = element.y + element.height / 2;
    ctx.moveTo(element.x + margin, centerY);
    ctx.lineTo(element.x + element.width - margin, centerY);
    
    ctx.stroke();
    
    // Window sill (bottom accent)
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#9ca3af';
    ctx.beginPath();
    ctx.moveTo(element.x - 2, element.y + element.height);
    ctx.lineTo(element.x + element.width + 2, element.y + element.height);
    ctx.stroke();
  };

  const drawColumn = (ctx, element) => {
    ctx.beginPath();
    ctx.ellipse(
      element.x + element.width / 2, 
      element.y + element.height / 2, 
      element.width / 2, 
      element.height / 2, 
      0, 0, 2 * Math.PI
    );
    ctx.fill();
    ctx.stroke();
  };

  const drawBeam = (ctx, element) => {
    ctx.beginPath();
    ctx.rect(element.x, element.y, element.width, element.height);
    ctx.fill();
    ctx.stroke();
    
    // Beam hatching
    for (let i = element.x; i < element.x + element.width; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, element.y);
      ctx.lineTo(i, element.y + element.height);
      ctx.stroke();
    }
  };

  // Helper function to format feet and inches for display
  const formatFeetInches = (pixels) => {
    const totalInches = pixels / 20; // 20 pixels = 1 inch at 100% zoom
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    if (feet === 0) {
      return `${inches} in`;
    } else if (inches === 0) {
      return `${feet} ft`;
    } else {
      return `${feet} ft - ${inches} in`;
    }
  };

  // Find element at given coordinates
  const findElementAt = (x, y) => {
    // Check in reverse order to find topmost element
    for (let i = state.elements.length - 1; i >= 0; i--) {
      const element = state.elements[i];
      if (x >= element.x && x <= element.x + element.width &&
          y >= element.y && y <= element.y + element.height) {
        return element;
      }
    }
    return null;
  };

  // Draw measurement lines and annotations
  const drawMeasurements = (ctx) => {
    if (measurements.length === 0) return;
    
    ctx.save();
    measurements.forEach(measurement => {
      drawMeasurementLine(ctx, measurement.start, measurement.end, false);
    });
    ctx.restore();
  };

  // Draw a single measurement line with dimension text
  const drawMeasurementLine = (ctx, start, end, isPreview = false) => {
    ctx.save();
    
    // Line style
    ctx.strokeStyle = isPreview ? '#ff6b35' : '#2563eb';
    ctx.lineWidth = 2;
    ctx.setLineDash(isPreview ? [5, 5] : []);
    
    // Draw measurement line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Draw end markers
    const markerSize = 4;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillRect(start.x - markerSize/2, start.y - markerSize/2, markerSize, markerSize);
    ctx.fillRect(end.x - markerSize/2, end.y - markerSize/2, markerSize, markerSize);
    
    // Calculate distance and draw text
    const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const distanceText = formatFeetInches(distance);
    
    // Text position (middle of line)
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Draw text background
    ctx.font = '12px Arial';
    const textMetrics = ctx.measureText(distanceText);
    const textWidth = textMetrics.width;
    const textHeight = 16;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(midX - textWidth/2 - 4, midY - textHeight/2 - 2, textWidth + 8, textHeight + 4);
    
    // Draw text
    ctx.fillStyle = ctx.strokeStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(distanceText, midX, midY);
    
    ctx.restore();
  };

  // Draw resize handles for selected element
  const drawResizeHandles = (ctx, element) => {
    if (!element) return;
    
    ctx.save();
    
    const handleSize = 6;
    const handles = [
      { x: element.x, y: element.y, cursor: 'nw-resize', type: 'top-left' },
      { x: element.x + element.width/2, y: element.y, cursor: 'n-resize', type: 'top' },
      { x: element.x + element.width, y: element.y, cursor: 'ne-resize', type: 'top-right' },
      { x: element.x + element.width, y: element.y + element.height/2, cursor: 'e-resize', type: 'right' },
      { x: element.x + element.width, y: element.y + element.height, cursor: 'se-resize', type: 'bottom-right' },
      { x: element.x + element.width/2, y: element.y + element.height, cursor: 's-resize', type: 'bottom' },
      { x: element.x, y: element.y + element.height, cursor: 'sw-resize', type: 'bottom-left' },
      { x: element.x, y: element.y + element.height/2, cursor: 'w-resize', type: 'left' }
    ];
    
    handles.forEach(handle => {
      // Handle background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
      
      // Handle border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
    });
    
    ctx.restore();
  };

  // Get resize handle at position
  const getResizeHandleAt = (x, y, element) => {
    if (!element) return null;
    
    const handleSize = 6;
    const tolerance = handleSize / 2 + 2;
    
    const handles = [
      { x: element.x, y: element.y, type: 'top-left' },
      { x: element.x + element.width/2, y: element.y, type: 'top' },
      { x: element.x + element.width, y: element.y, type: 'top-right' },
      { x: element.x + element.width, y: element.y + element.height/2, type: 'right' },
      { x: element.x + element.width, y: element.y + element.height, type: 'bottom-right' },
      { x: element.x + element.width/2, y: element.y + element.height, type: 'bottom' },
      { x: element.x, y: element.y + element.height, type: 'bottom-left' },
      { x: element.x, y: element.y + element.height/2, type: 'left' }
    ];
    
    for (const handle of handles) {
      if (Math.abs(x - handle.x) <= tolerance && Math.abs(y - handle.y) <= tolerance) {
        return handle.type;
      }
    }
    
    return null;
  };

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, state.zoom * zoomFactor));
    
    // Zoom toward cursor position
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate new pan offset to zoom toward cursor
    const worldX = (mouseX - state.panOffset.x) / state.zoom;
    const worldY = (mouseY - state.panOffset.y) / state.zoom;
    
    const newPanOffsetX = mouseX - worldX * newZoom;
    const newPanOffsetY = mouseY - worldY * newZoom;
    
    actions.setZoom(newZoom);
    actions.setPanOffset({ x: newPanOffsetX, y: newPanOffsetY });
  }, [state.zoom, state.panOffset, actions]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  // Mouse event handlers
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - state.panOffset.x) / state.zoom,
      y: (e.clientY - rect.top - state.panOffset.y) / state.zoom
    };
  };

  // Enhanced grid snapping utility with hierarchical grid system
  const snapToGrid = (value) => {
    const baseInchSize = 20; // 20 pixels per inch at 100% zoom
    const baseFeetSize = baseInchSize * 12; // 240 pixels per foot
    const base5FeetSize = baseFeetSize * 5; // 1200 pixels per 5 feet
    const base10FeetSize = baseFeetSize * 10; // 2400 pixels per 10 feet
    
    // Calculate actual grid sizes at current zoom level
    const inchGridSize = baseInchSize * state.zoom;
    const feetGridSize = baseFeetSize * state.zoom;
    const fiveFeetGridSize = base5FeetSize * state.zoom;
    
    // Hierarchical snapping based on zoom level
    if (inchGridSize >= 8) {
      // Zoomed in enough to see inches clearly - snap to inches
      return Math.round(value / baseInchSize) * baseInchSize;
    } else if (feetGridSize >= 8) {
      // Medium zoom - snap to feet
      return Math.round(value / baseFeetSize) * baseFeetSize;
    } else if (fiveFeetGridSize >= 8) {
      // Zoomed out - snap to 5-foot grid
      return Math.round(value / base5FeetSize) * base5FeetSize;
    } else {
      // Very zoomed out - snap to 10-foot grid
      return Math.round(value / base10FeetSize) * base10FeetSize;
    }
  };

  // Enhanced mouse event handlers with grid snapping, panning, and multi-selection
  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    
    // Snap to grid if enabled
    const snappedPos = state.showGrid ? {
      x: snapToGrid(pos.x),
      y: snapToGrid(pos.y)
    } : pos;
    
    actions.setCoordinates(snappedPos);
    
    // Handle middle mouse button or space key for panning
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      actions.setStatusMessage('Panning...');
      return;
    }
    
    // Save state to history before making changes
    actions.saveStateToHistory();

    // Handle measurement tool
    if (state.currentTool === 'measure') {
      if (!measureStart) {
        setMeasureStart(snappedPos);
        actions.setStatusMessage('Click second point to complete measurement');
      } else {
        setMeasureEnd(snappedPos);
        // Add measurement to permanent list
        const newMeasurement = {
          id: Date.now(),
          start: measureStart,
          end: snappedPos
        };
        setMeasurements(prev => [...prev, newMeasurement]);
        
        // Reset for next measurement
        setMeasureStart(null);
        setMeasureEnd(null);
        
        const distance = Math.sqrt(Math.pow(snappedPos.x - measureStart.x, 2) + Math.pow(snappedPos.y - measureStart.y, 2));
        actions.setStatusMessage(`Measurement: ${formatFeetInches(distance)}`);
      }
      return;
    }
    
    if (state.currentTool === 'select') {
      // Check for resize handle on selected element first
      if (state.selectedElement) {
        const handle = getResizeHandleAt(snappedPos.x, snappedPos.y, state.selectedElement);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setDragStart(snappedPos);
          actions.setStatusMessage(`Resizing ${state.selectedElement.type}...`);
          return;
        }
      }
      
      // Find element at click position
      const element = findElementAt(snappedPos.x, snappedPos.y);
      
      if (e.shiftKey && element) {
        // Multi-selection mode
        if (state.selectedElements.some(sel => sel.id === element.id)) {
          actions.removeFromSelection(element.id);
        } else {
          actions.addToSelection(element);
        }
        actions.setStatusMessage(`Multi-select: ${state.selectedElements.length + 1} elements`);
      } else if (element) {
        // Check if clicking on already selected element to start dragging
        if (state.selectedElement && state.selectedElement.id === element.id) {
          setIsDraggingElement(true);
          setDragStart(snappedPos);
          setDragOffset({
            x: snappedPos.x - element.x,
            y: snappedPos.y - element.y
          });
          actions.setStatusMessage(`Moving ${element.type}...`);
        } else {
          // Single selection
          actions.selectElement(element);
          actions.setStatusMessage(`Selected: ${element.type} (${formatFeetInches(element.width)} x ${formatFeetInches(element.height)})`);
        }
      } else {
        // Start selection box
        setIsDrawing(true);
        setDragStart(snappedPos);
        actions.clearSelection();
        actions.setStatusMessage('Drag to select multiple elements');
      }
    } else {
      // Start drawing new element
      setIsDrawing(true);
      setDragStart(snappedPos);
      const newElement = {
        id: Date.now(),
        type: state.currentTool,
        x: snappedPos.x,
        y: snappedPos.y,
        width: 0,
        height: 0,
        color: '#374151',
        fillColor: 'rgba(156, 163, 175, 0.1)',
        levelId: state.activeLevel,
        material: 'Steel',
        gauge: '14'
      };
      actions.addElement(newElement);
      actions.setStatusMessage(`Drawing ${state.currentTool}...`);
    }
  };

  const handleMouseMove = (e) => {
    const pos = getMousePos(e);
    
    // Update cursor grid position for highlighting (only when grid is visible)
    if (state.showGrid) {
      const baseInchSize = 20; // pixels per inch at 100% zoom
      const baseFeetSize = baseInchSize * 12; // 240 pixels per foot
      const base5FeetSize = baseFeetSize * 5; // 1200 pixels per 5 feet
      const base10FeetSize = baseFeetSize * 10; // 2400 pixels per 10 feet
      
      // Calculate actual grid sizes at current zoom level
      const inchGridSize = baseInchSize * state.zoom;
      const feetGridSize = baseFeetSize * state.zoom;
      const fiveFeetGridSize = base5FeetSize * state.zoom;
      
      // Choose grid granularity based on zoom level (same as snapToGrid)
      let gridSize;
      if (inchGridSize >= 8) {
        gridSize = baseInchSize; // Snap to inches
      } else if (feetGridSize >= 8) {
        gridSize = baseFeetSize; // Snap to feet
      } else if (fiveFeetGridSize >= 8) {
        gridSize = base5FeetSize; // Snap to 5-foot grid
      } else {
        gridSize = base10FeetSize; // Snap to 10-foot grid
      }
      
      setCursorGridPos({
        x: Math.round(pos.x / gridSize) * gridSize,
        y: Math.round(pos.y / gridSize) * gridSize
      });
    } else {
      setCursorGridPos(null);
    }
    
    // Handle panning
    if (isPanning && panStart) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      actions.setPanOffset({
        x: state.panOffset.x + deltaX,
        y: state.panOffset.y + deltaY
      });
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    
    // Snap to grid if enabled
    const snappedPos = state.showGrid ? {
      x: snapToGrid(pos.x),
      y: snapToGrid(pos.y)
    } : pos;
    
    actions.setCoordinates(snappedPos);

    // Handle measurement tool preview
    if (state.currentTool === 'measure' && measureStart && !measureEnd) {
      setMeasureEnd(snappedPos);
      const distance = Math.sqrt(Math.pow(snappedPos.x - measureStart.x, 2) + Math.pow(snappedPos.y - measureStart.y, 2));
      actions.setStatusMessage(`Distance: ${formatFeetInches(distance)}`);
      return;
    }

    // Handle element resizing
    if (isResizing && dragStart && state.selectedElement && resizeHandle) {
      const deltaX = snappedPos.x - dragStart.x;
      const deltaY = snappedPos.y - dragStart.y;
      
      const originalElement = state.selectedElement;
      let newProps = {};
      
      switch (resizeHandle) {
        case 'top-left':
          newProps = {
            x: originalElement.x + deltaX,
            y: originalElement.y + deltaY,
            width: Math.max(20, originalElement.width - deltaX),
            height: Math.max(20, originalElement.height - deltaY)
          };
          break;
        case 'top':
          newProps = {
            y: originalElement.y + deltaY,
            height: Math.max(20, originalElement.height - deltaY)
          };
          break;
        case 'top-right':
          newProps = {
            y: originalElement.y + deltaY,
            width: Math.max(20, originalElement.width + deltaX),
            height: Math.max(20, originalElement.height - deltaY)
          };
          break;
        case 'right':
          newProps = {
            width: Math.max(20, originalElement.width + deltaX)
          };
          break;
        case 'bottom-right':
          newProps = {
            width: Math.max(20, originalElement.width + deltaX),
            height: Math.max(20, originalElement.height + deltaY)
          };
          break;
        case 'bottom':
          newProps = {
            height: Math.max(20, originalElement.height + deltaY)
          };
          break;
        case 'bottom-left':
          newProps = {
            x: originalElement.x + deltaX,
            width: Math.max(20, originalElement.width - deltaX),
            height: Math.max(20, originalElement.height + deltaY)
          };
          break;
        case 'left':
          newProps = {
            x: originalElement.x + deltaX,
            width: Math.max(20, originalElement.width - deltaX)
          };
          break;
      }
      
      actions.updateElement(originalElement.id, newProps);
      actions.setStatusMessage(`Resizing: ${formatFeetInches(newProps.width || originalElement.width)} x ${formatFeetInches(newProps.height || originalElement.height)}`);
      return;
    }

    // Handle element dragging
    if (isDraggingElement && dragStart && state.selectedElement) {
      const newX = snappedPos.x - dragOffset.x;
      const newY = snappedPos.y - dragOffset.y;
      
      actions.updateElement(state.selectedElement.id, {
        x: newX,
        y: newY
      });
      
      actions.setStatusMessage(`Moving ${state.selectedElement.type}: ${formatFeetInches(newX)} x ${formatFeetInches(newY)}`);
      return;
    }
    
    if (!isDrawing || !dragStart) {
      // Show hover information and cursor changes
      const element = findElementAt(snappedPos.x, snappedPos.y);
      
      // Update cursor based on context
      const canvas = canvasRef.current;
      if (canvas) {
        if (state.currentTool === 'select' && state.selectedElement) {
          const handle = getResizeHandleAt(snappedPos.x, snappedPos.y, state.selectedElement);
          if (handle) {
            const cursorMap = {
              'top-left': 'nw-resize',
              'top': 'n-resize',
              'top-right': 'ne-resize',
              'right': 'e-resize',
              'bottom-right': 'se-resize',
              'bottom': 's-resize',
              'bottom-left': 'sw-resize',
              'left': 'w-resize'
            };
            canvas.style.cursor = cursorMap[handle];
          } else if (element && element.id === state.selectedElement.id) {
            canvas.style.cursor = 'move';
          } else {
            canvas.style.cursor = 'default';
          }
        } else if (state.currentTool === 'measure') {
          canvas.style.cursor = 'crosshair';
        } else {
          canvas.style.cursor = state.currentTool === 'select' ? 'default' : 'crosshair';
        }
      }
      
      if (element && state.currentTool === 'select') {
        actions.setStatusMessage(`Hover: ${element.type} (${formatFeetInches(element.width)} x ${formatFeetInches(element.height)})`);
      } else if (state.currentTool === 'measure') {
        actions.setStatusMessage(measureStart ? 'Click second point to complete measurement' : 'Click first point to start measurement');
      } else if (state.currentTool !== 'select') {
        actions.setStatusMessage(`${state.currentTool} tool active - Click and drag to create`);
      } else {
        actions.setStatusMessage('Ready');
      }
      return;
    }
    
    if (state.currentTool === 'select' && !state.selectedElement) {
      // Update selection box
      const selBox = {
        x: Math.min(snappedPos.x, dragStart.x),
        y: Math.min(snappedPos.y, dragStart.y),
        width: Math.abs(snappedPos.x - dragStart.x),
        height: Math.abs(snappedPos.y - dragStart.y)
      };
      setSelectionBox(selBox);
      
      // Find elements within selection box
      const selectedElements = state.elements.filter(element => 
        element.x >= selBox.x &&
        element.y >= selBox.y &&
        element.x + element.width <= selBox.x + selBox.width &&
        element.y + element.height <= selBox.y + selBox.height
      );
      
      actions.setStatusMessage(`Selecting ${selectedElements.length} elements`);
    } else {
      // Update the last element (currently being drawn)
      const lastElement = state.elements[state.elements.length - 1];
      if (lastElement) {
        const width = Math.abs(snappedPos.x - dragStart.x);
        const height = Math.abs(snappedPos.y - dragStart.y);
        const updatedElement = {
          width,
          height,
          x: Math.min(snappedPos.x, dragStart.x),
          y: Math.min(snappedPos.y, dragStart.y)
        };
        actions.updateElement(lastElement.id, updatedElement);
        actions.setStatusMessage(`Drawing ${lastElement.type}: ${formatFeetInches(width)} x ${formatFeetInches(height)}`);
      }
    }
  };

  const handleMouseUp = () => {
    // End panning
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      actions.setStatusMessage('Ready');
      return;
    }
    
    if (isDrawing) {
      if (state.currentTool === 'select' && selectionBox) {
        // Complete selection box operation
        const selectedElements = state.elements.filter(element => 
          element.x >= selectionBox.x &&
          element.y >= selectionBox.y &&
          element.x + element.width <= selectionBox.x + selectionBox.width &&
          element.y + element.height <= selectionBox.y + selectionBox.height
        );
        
        actions.setSelectedElements(selectedElements.map(el => el.id));
        actions.setStatusMessage(`Selected ${selectedElements.length} element(s)`);
        setSelectionBox(null);
      }
      
      setIsDrawing(false);
      setDragStart(null);
    }

    // End resizing
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      actions.setStatusMessage('Ready');
    }

    // End element dragging
    if (isDraggingElement) {
      setIsDraggingElement(false);
      setDragOffset({ x: 0, y: 0 });
      actions.setStatusMessage('Ready');
    }

    // Handle measurement tool completion
    if (state.currentTool === 'measure' && measureStart && measureEnd) {
      const distance = Math.sqrt(
        Math.pow(measureEnd.x - measureStart.x, 2) + 
        Math.pow(measureEnd.y - measureStart.y, 2)
      );
      
      // Add to persistent measurements
      setMeasurements(prev => [...prev, {
        id: Date.now(),
        start: measureStart,
        end: measureEnd,
        distance
      }]);
      
      actions.setStatusMessage(`Measurement: ${formatFeetInches(distance)}`);
      setMeasureStart(null);
      setMeasureEnd(null);
    }
  };

  // Helper function for dynamic cursor styling
  const getCursorStyle = () => {
    if (state.currentTool === 'measure') return 'crosshair';
    if (isPanning) return 'grabbing';
    if (isResizing) return 'nw-resize';
    if (isDraggingElement) return 'move';
    return 'default';
  };

  // Add useEffect hook to initialize canvas and handle window resizing
  useEffect(() => {
    console.log('CANVAS EFFECT RUNNING');
    setupCanvas();
    
    // Add window resize listener
    const handleResize = () => {
      console.log('WINDOW RESIZE - Calling setupCanvas');
      setupCanvas();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setupCanvas]);

  // Add useEffect hook to update canvas when showGrid changes
  useEffect(() => {
    console.log('GRID STATE CHANGED', { showGrid: state.showGrid });
    draw();
  }, [draw, state.showGrid]);

  return (
    <div className="canvas-container relative w-full h-full bg-gray-50 overflow-hidden"
         style={{ width: '100%', height: 'calc(100vh - 120px)' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        className="block w-full h-full border-2 border-gray-300 rounded-lg shadow-sm"
        style={{ 
          cursor: getCursorStyle(),
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
        }}
      />
      
      {/* Professional overlay for coordinates and info */}
      {cursorGridPos && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-md text-sm font-mono">
          X: {Math.round(cursorGridPos.x / 20)}" Y: {Math.round(cursorGridPos.y / 20)}"
          {state.zoom !== 1 && (
            <span className="ml-3">Zoom: {Math.round(state.zoom * 100)}%</span>
          )}
        </div>
      )}
      
      {/* Tool indicator */}
      <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-semibold capitalize">
        {state.currentTool} Tool
      </div>
      
      {/* Selection info */}
      {state.selectedElements.length > 0 && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-semibold">
          {state.selectedElements.length} Selected
        </div>
      )}
    </div>
  );
};

export default CanvasEditor;