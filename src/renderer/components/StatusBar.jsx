import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

function StatusBar() {
  const { state, actions } = useApp();

  useEffect(() => {
    // Update coordinates on mouse move
    const handleMouseMove = (e) => {
      actions.setCoordinates({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [actions]);

  // Calculate project statistics
  const projectStats = {
    elements: state.elements.length,
    totalArea: state.elements.reduce((sum, el) => sum + ((el.width || 0) * (el.height || 0)), 0),
    totalWeight: state.elements.reduce((sum, el) => {
      // Simple weight calculation - can be enhanced with material properties
      const area = (el.width || 0) * (el.height || 0);
      const materialWeight = el.material === 'Steel' ? 490 : el.material === 'Concrete' ? 150 : 50; // lbs per sq ft
      return sum + (area * materialWeight / 144); // convert sq inches to sq ft
    }, 0)
  };

  return (
    <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between text-sm border-t border-gray-700">
      {/* Left side - Status message */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>{state.statusMessage}</span>
        </div>
        
        <div className="text-gray-400">|</div>
        
        <div className="text-gray-300">
          Mouse: X:{state.coordinates.x}, Y:{state.coordinates.y}
        </div>
      </div>

      {/* Center - Project statistics */}
      <div className="flex items-center space-x-6 text-gray-300">
        <div className="flex items-center space-x-2">
          <span className="text-blue-400">Elements:</span>
          <span>{projectStats.elements}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-green-400">Area:</span>
          <span>{projectStats.totalArea.toFixed(1)} sq ft</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-yellow-400">Weight:</span>
          <span>{projectStats.totalWeight.toFixed(1)} lbs</span>
        </div>
      </div>

      {/* Right side - Application info */}
      <div className="flex items-center space-x-4 text-gray-400">
        <div>Scale: 1:100</div>
        <div className="text-gray-500">|</div>
        <div>Units: Imperial</div>
        <div className="text-gray-500">|</div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Auto-save enabled</span>
        </div>
      </div>
    </div>
  );
}

export default StatusBar;