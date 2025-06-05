import React from 'react';
import { useApp } from '../context/AppContext';

function DrawingToolbar() {
  const { state, actions } = useApp();
  
  console.log('DrawingToolbar rendering with showGrid:', state.showGrid);

  const handleToolSelect = (toolId) => {
    actions.setCurrentTool(toolId);
    actions.setStatusMessage(`${toolId.charAt(0).toUpperCase() + toolId.slice(1)} tool selected`);
  };

  const handleZoomIn = () => {
    actions.setZoom(Math.min(5, state.zoom * 1.2));
  };

  const handleZoomOut = () => {
    actions.setZoom(Math.max(0.1, state.zoom * 0.8));
  };

  const handleZoomReset = () => {
    actions.setZoom(1);
    actions.setPanOffset({ x: 0, y: 0 });
  };

  const toggleGrid = () => {
    console.log('DrawingToolbar toggleGrid clicked, current state:', state.showGrid);
    actions.toggleGrid();
    // We need to use the previous state here, as the toggle hasn't taken effect yet
    actions.setStatusMessage(!state.showGrid ? 'Grid shown' : 'Grid hidden');
  };

  return (
    <div className="bg-white border-b border-gray-300 shadow-sm">
      <div className="flex items-center px-4 py-2 space-x-2">
        {/* Tool Buttons */}
        <div className="flex items-center space-x-1 border-r border-gray-300 pr-4 mr-4">
          <button
            onClick={() => handleToolSelect('select')}
            className={`px-3 py-2 rounded ${
              state.currentTool === 'select' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Select Tool (V)"
          >
            Select
          </button>
          
          <button
            onClick={() => handleToolSelect('wall')}
            className={`px-3 py-2 rounded ${
              state.currentTool === 'wall' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Wall Tool (W)"
          >
            Wall
          </button>
          
          <button
            onClick={() => handleToolSelect('door')}
            className={`px-3 py-2 rounded ${
              state.currentTool === 'door' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Door Tool (D)"
          >
            Door
          </button>
          
          <button
            onClick={() => handleToolSelect('window')}
            className={`px-3 py-2 rounded ${
              state.currentTool === 'window' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Window Tool (N)"
          >
            Window
          </button>
          
          <button
            onClick={() => handleToolSelect('measure')}
            className={`px-3 py-2 rounded ${
              state.currentTool === 'measure' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Measure Tool (M)"
          >
            Measure
          </button>
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-2 border-r border-gray-300 pr-4 mr-4">
          <button
            onClick={handleZoomOut}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded"
            title="Zoom Out"
          >
            -
          </button>
          
          <span className="text-sm text-gray-600 min-w-16 text-center">
            {Math.round(state.zoom * 100)}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded"
            title="Zoom In"
          >
            +
          </button>
          
          <button
            onClick={handleZoomReset}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>

        {/* Grid Toggle */}
        <button
          onClick={toggleGrid}
          className={`px-3 py-2 rounded ${
            state.showGrid
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title="Toggle Grid"
        >
          Grid: {state.showGrid ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}

export default DrawingToolbar;
