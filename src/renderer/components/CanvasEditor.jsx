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

  // Grid and canvas setup
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    draw();
  }, [state.elements, state.showGrid, state.zoom, state.panOffset]);

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
    if (state.showGrid) {
      drawGrid(ctx, canvas);
    }
    
    // Draw elements (only visible levels)
    const visibleLevels = state.levels.filter(level => level.visible).map(level => level.id);
    state.elements
      .filter(element => visibleLevels.includes(element.levelId || state.activeLevel))
      .forEach(element => {
        const isSelected = element.id === state.selectedElement?.id || 
                          state.selectedElements.some(sel => sel.id === element.id);
        drawElement(ctx, element, isSelected);
      });
    
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
  }, [state.elements, state.selectedElement, state.selectedElements, state.showGrid, state.zoom, state.panOffset, state.levels, state.activeLevel, selectionBox]);

  const drawGrid = (ctx, canvas) => {
    // Base grid size represents 1 foot = 48 pixels at 100% zoom
    const baseFeetGridSize = 48;
    const baseInchGridSize = baseFeetGridSize / 12; // 4 pixels per inch at 100% zoom
    
    // Adjust grid sizes based on zoom level
    const feetGridSize = baseFeetGridSize * state.zoom;
    const inchGridSize = baseInchGridSize * state.zoom;
    
    // Grid colors
    const feetGridColor = '#d1d5db';        // Darker for feet
    const majorFeetGridColor = '#9ca3af';   // Even darker for 5-foot markers
    const inchGridColor = '#f3f4f6';        // Light for inches
    
    const startX = -state.panOffset.x / state.zoom;
    const startY = -state.panOffset.y / state.zoom;
    const endX = (canvas.width - state.panOffset.x) / state.zoom;
    const endY = (canvas.height - state.panOffset.y) / state.zoom;
    
    // Draw inch grid when zoomed in enough (when inch grid is >= 2 pixels)
    if (inchGridSize >= 2) {
      ctx.strokeStyle = inchGridColor;
      ctx.lineWidth = 0.25;
      
      // Vertical inch lines
      for (let x = Math.floor(startX / baseInchGridSize) * baseInchGridSize; x <= endX; x += baseInchGridSize) {
        if (x % baseFeetGridSize !== 0) { // Skip if it's a foot line
          ctx.beginPath();
          ctx.moveTo(x, startY);
          ctx.lineTo(x, endY);
          ctx.stroke();
        }
      }
      
      // Horizontal inch lines
      for (let y = Math.floor(startY / baseInchGridSize) * baseInchGridSize; y <= endY; y += baseInchGridSize) {
        if (y % baseFeetGridSize !== 0) { // Skip if it's a foot line
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();
        }
      }
    }
    
    // Draw feet grid (always visible when grid is enabled)
    ctx.lineWidth = 0.5;
    
    // Vertical feet lines
    for (let x = Math.floor(startX / baseFeetGridSize) * baseFeetGridSize; x <= endX; x += baseFeetGridSize) {
      // Every 5 feet gets a thicker line
      const isMajorGrid = (x / baseFeetGridSize) % 5 === 0;
      ctx.strokeStyle = isMajorGrid ? majorFeetGridColor : feetGridColor;
      ctx.lineWidth = isMajorGrid ? 1 : 0.5;
      
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    // Horizontal feet lines
    for (let y = Math.floor(startY / baseFeetGridSize) * baseFeetGridSize; y <= endY; y += baseFeetGridSize) {
      // Every 5 feet gets a thicker line
      const isMajorGrid = (y / baseFeetGridSize) % 5 === 0;
      ctx.strokeStyle = isMajorGrid ? majorFeetGridColor : feetGridColor;
      ctx.lineWidth = isMajorGrid ? 1 : 0.5;
      
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  };

  const drawElement = (ctx, element, isSelected) => {
    ctx.save();
    
    if (isSelected) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = element.color || '#374151';
      ctx.lineWidth = 2;
    }
    
    ctx.fillStyle = element.fillColor || 'rgba(156, 163, 175, 0.1)';
    
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
    
    ctx.restore();
  };

  const drawWall = (ctx, element) => {
    ctx.beginPath();
    ctx.rect(element.x, element.y, element.width, element.height);
    ctx.fill();
    ctx.stroke();
  };

  const drawDoor = (ctx, element) => {
    // Door frame
    ctx.beginPath();
    ctx.rect(element.x, element.y, element.width, element.height);
    ctx.stroke();
    
    // Door swing arc
    ctx.beginPath();
    ctx.arc(element.x, element.y, element.width, 0, Math.PI / 2);
    ctx.stroke();
  };

  const drawWindow = (ctx, element) => {
    // Window frame
    ctx.beginPath();
    ctx.rect(element.x, element.y, element.width, element.height);
    ctx.fill();
    ctx.stroke();
    
    // Cross lines
    ctx.beginPath();
    ctx.moveTo(element.x, element.y);
    ctx.lineTo(element.x + element.width, element.y + element.height);
    ctx.moveTo(element.x + element.width, element.y);
    ctx.lineTo(element.x, element.y + element.height);
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

  // Mouse event handlers
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - state.panOffset.x) / state.zoom,
      y: (e.clientY - rect.top - state.panOffset.y) / state.zoom
    };
  };

  // Enhanced grid snapping utility with intelligent foot/inch snapping
  const snapToGrid = (value) => {
    const baseFeetGridSize = 48; // 1 foot = 48 pixels at 100% zoom
    const baseInchGridSize = baseFeetGridSize / 12; // 4 pixels per inch at 100% zoom
    
    // Calculate actual grid sizes at current zoom level
    const inchGridSize = baseInchGridSize * state.zoom;
    
    // If zoomed in enough to see inch grid clearly (>=2 pixels), snap to inches
    if (inchGridSize >= 2) {
      return Math.round(value / baseInchGridSize) * baseInchGridSize;
    } else {
      // Otherwise snap to feet
      return Math.round(value / baseFeetGridSize) * baseFeetGridSize;
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
    
    if (state.currentTool === 'select') {
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
        // Single selection
        actions.selectElement(element);
        actions.setStatusMessage(`Selected: ${element.type} (${formatFeetInches(element.width)} x ${formatFeetInches(element.height)})`);
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
    
    if (!isDrawing || !dragStart) {
      // Show hover information
      const element = findElementAt(snappedPos.x, snappedPos.y);        if (element && state.currentTool === 'select') {
          actions.setStatusMessage(`Hover: ${element.type} (${formatFeetInches(element.width)} x ${formatFeetInches(element.height)})`);
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
        
        if (selectedElements.length > 0) {
          actions.selectMultipleElements(selectedElements);
          actions.setStatusMessage(`Selected ${selectedElements.length} elements`);
        } else {
          actions.clearSelection();
          actions.setStatusMessage('No elements selected');
        }
        setSelectionBox(null);
      } else {
        // Complete element drawing
        const lastElement = state.elements[state.elements.length - 1];
        if (lastElement && (lastElement.width === 0 || lastElement.height === 0)) {
          // Remove element if it has no size
          actions.deleteElement(lastElement.id);
          actions.setStatusMessage('Element too small - removed');
        } else if (lastElement) {
          actions.setStatusMessage(`Created ${lastElement.type}: ${formatFeetInches(lastElement.width)} x ${formatFeetInches(lastElement.height)}`);
        }
      }
    }
    setIsDrawing(false);
    setDragStart(null);
  };

  const findElementAt = (x, y) => {
    for (let i = state.elements.length - 1; i >= 0; i--) {
      const element = state.elements[i];
      if (x >= element.x && x <= element.x + element.width &&
          y >= element.y && y <= element.y + element.height) {
        return element;
      }
    }
    return null;
  };

  // Zoom and pan handlers with zoom-to-cursor functionality
  const handleWheel = (e) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate the world position before zoom
    const worldPosBeforeZoom = {
      x: (mouseX - state.panOffset.x) / state.zoom,
      y: (mouseY - state.panOffset.y) / state.zoom
    };
    
    // Calculate new zoom level
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, state.zoom * scaleFactor));
    
    // Calculate the world position after zoom
    const worldPosAfterZoom = {
      x: (mouseX - state.panOffset.x) / newZoom,
      y: (mouseY - state.panOffset.y) / newZoom
    };
    
    // Calculate the offset needed to keep the world position under the cursor
    const deltaWorldPos = {
      x: worldPosAfterZoom.x - worldPosBeforeZoom.x,
      y: worldPosAfterZoom.y - worldPosBeforeZoom.y
    };
    
    // Adjust pan offset to maintain cursor position
    const newPanOffset = {
      x: state.panOffset.x + deltaWorldPos.x * newZoom,
      y: state.panOffset.y + deltaWorldPos.y * newZoom
    };
    
    // Apply zoom and pan
    actions.setZoom(newZoom);
    actions.setPanOffset(newPanOffset);
    
    // Update status message with zoom percentage
    actions.setStatusMessage(`Zoom: ${Math.round(newZoom * 100)}%`);
  };

  // Context menu handler
  const handleContextMenu = (e) => {
    e.preventDefault();
    const pos = getMousePos(e);
    const element = findElementAt(pos.x, pos.y);
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      element: element
    });
  };

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Hide context menu
  const hideContextMenu = () => {
    setContextMenu(null);
  };

  // Helper function to convert pixels to feet and inches
  const pixelsToFeetInches = (pixels) => {
    const totalInches = pixels / 4; // 4 pixels = 1 inch at 100% zoom
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  };

  // Helper function to format feet and inches for display
  const formatFeetInches = (pixels) => {
    const { feet, inches } = pixelsToFeetInches(pixels);
    if (feet === 0) {
      return `${inches}"`;
    } else if (inches === 0) {
      return `${feet}'`;
    } else {
      return `${feet}'-${inches}"`;
    }
  };

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="flex-1 bg-white relative overflow-hidden">
      {/* Canvas Controls */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <button
          onClick={actions.toggleGrid}
          className={`px-3 py-1 text-xs rounded ${
            state.showGrid ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Grid {state.showGrid ? 'On' : 'Off'}
        </button>
        <button
          onClick={() => actions.setZoom(1)}
          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Reset Zoom
        </button>
        <span className="px-3 py-1 text-xs bg-gray-100 rounded">
          {Math.round(state.zoom * 100)}%
        </span>
        <button
          onClick={actions.undo}
          disabled={state.historyIndex <= 0}
          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>
        <button
          onClick={actions.redo}
          disabled={state.historyIndex >= state.history.length - 1}
          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
          title="Redo (Ctrl+Y)"
        >
          ↷ Redo
        </button>
      </div>

      {/* Tool Selection */}
      <div className="absolute top-4 right-4 z-10 flex space-x-1 bg-white rounded-lg shadow-lg p-1">
        {['select', 'wall', 'door', 'window', 'column', 'beam'].map(tool => (
          <button
            key={tool}
            onClick={() => actions.setCurrentTool(tool)}
            className={`px-3 py-2 text-xs rounded capitalize ${
              state.currentTool === tool 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tool}
          </button>
        ))}
      </div>

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${
          isPanning ? 'cursor-grabbing' : 
          state.currentTool === 'select' ? 'cursor-default' : 'cursor-crosshair'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="absolute bg-white border rounded shadow-lg z-20"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={hideContextMenu}
        >
          <button 
            onClick={() => {
              actions.deleteElement(state.selectedElement.id);
              hideContextMenu();
            }}
            className="block px-4 py-2 text-sm text-red-600 hover:bg-red-100 w-full text-left"
          >
            Delete Element
          </button>
          <button 
            onClick={() => {
              actions.clearSelection();
              hideContextMenu();
            }}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          >
            Deselect All
          </button>
        </div>
      )}

      {/* Coordinates Display with Real-world Measurements */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
        Elements: {state.elements.length} | 
        Zoom: {Math.round(state.zoom * 100)}% | 
        Selected: {state.selectedElement ? state.selectedElement.type : 
                  state.selectedElements.length > 0 ? `${state.selectedElements.length} elements` : 'None'} |
        Position: {formatFeetInches(state.coordinates.x)} x {formatFeetInches(state.coordinates.y)} |
        History: {state.historyIndex + 1}/{state.history.length}
      </div>
    </div>
  );
}

export default CanvasEditor;