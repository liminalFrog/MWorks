import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

function PropertiesPanel() {
  const { state, actions } = useApp();

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

  const [properties, setProperties] = useState({
    type: 'Wall',
    width: '6',
    height: '12',
    material: 'Steel',
    gauge: '14',
    color: '#888888',
    description: 'Exterior Wall'
  });

  // Update properties when selected element changes
  useEffect(() => {
    if (state.selectedElement) {
      // Convert pixel measurements to inches for display in input fields
      const widthInInches = Math.round((state.selectedElement.width || 24) / 4); // 4 pixels = 1 inch
      const heightInInches = Math.round((state.selectedElement.height || 48) / 4);
      
      setProperties({
        type: state.selectedElement.type || 'Wall',
        width: widthInInches.toString(),
        height: heightInInches.toString(),
        material: state.selectedElement.material || 'Steel',
        gauge: state.selectedElement.gauge || '14',
        color: state.selectedElement.color || '#888888',
        description: state.selectedElement.description || 'Element'
      });
    } else if (state.selectedElements.length > 0) {
      // Multi-selection - show common properties or mixed values
      const firstElement = state.selectedElements[0];
      const hasCommonType = state.selectedElements.every(el => el.type === firstElement.type);
      const hasCommonMaterial = state.selectedElements.every(el => el.material === firstElement.material);
      const hasCommonGauge = state.selectedElements.every(el => el.gauge === firstElement.gauge);
      
      setProperties({
        type: hasCommonType ? firstElement.type : 'Mixed',
        width: 'Mixed',
        height: 'Mixed', 
        material: hasCommonMaterial ? firstElement.material : 'Mixed',
        gauge: hasCommonGauge ? firstElement.gauge : 'Mixed',
        color: '#888888',
        description: `${state.selectedElements.length} elements selected`
      });
    }
  }, [state.selectedElement, state.selectedElements]);

  const materialOptions = ['Steel', 'Concrete', 'Wood', 'Aluminum'];
  const gaugeOptions = ['14', '16', '18', '20', '22'];

  const handlePropertyChange = (property, value) => {
    setProperties(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const applyChanges = () => {
    if (state.selectedElement) {
      // Convert inches input back to pixels for storage (4 pixels = 1 inch)
      const widthInPixels = (parseFloat(properties.width) || 0) * 4;
      const heightInPixels = (parseFloat(properties.height) || 0) * 4;
      
      const updates = {
        type: properties.type,
        width: widthInPixels,
        height: heightInPixels,
        material: properties.material,
        gauge: properties.gauge,
        color: properties.color,
        description: properties.description
      };
      actions.updateElement(state.selectedElement.id, updates);
      actions.setStatusMessage('Element properties updated');
    } else if (state.selectedElements.length > 0) {
      // Update all selected elements with common properties
      const updates = {};
      if (properties.material !== 'Mixed') updates.material = properties.material;
      if (properties.gauge !== 'Mixed') updates.gauge = properties.gauge;
      if (properties.color !== '#888888') updates.color = properties.color;
      
      state.selectedElements.forEach(element => {
        actions.updateElement(element.id, updates);
      });
      actions.setStatusMessage(`${state.selectedElements.length} elements updated`);
    }
  };

  const deleteElement = () => {
    if (state.selectedElement) {
      actions.deleteElement(state.selectedElement.id);
      actions.setStatusMessage('Element deleted');
    } else if (state.selectedElements.length > 0) {
      const count = state.selectedElements.length;
      state.selectedElements.forEach(element => {
        actions.deleteElement(element.id);
      });
      actions.setStatusMessage(`${count} elements deleted`);
    }
  };

  return (
    <div className="w-80 bg-gray-100 border-r border-gray-300 flex flex-col">
      {/* Header */}
      <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
        <h2 className="text-sm font-semibold text-gray-800">Properties</h2>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.selectedElement || state.selectedElements.length > 0 ? (
          <>
            {/* Selection Info */}
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-1">
                {state.selectedElement ? 'Single Selection' : `Multi-Selection (${state.selectedElements.length} elements)`}
              </h3>
              <p className="text-xs text-blue-600">
                {state.selectedElement ? 
                  `${state.selectedElement.type} - ${formatFeetInches(state.selectedElement.width)} x ${formatFeetInches(state.selectedElement.height)}` :
                  'Common properties will be applied to all selected elements'
                }
              </p>
            </div>

            {/* Element Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Element Type</label>
              <select 
                value={properties.type}
                onChange={(e) => handlePropertyChange('type', e.target.value)}
                disabled={state.selectedElements.length > 0 && properties.type === 'Mixed'}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                {properties.type === 'Mixed' && <option value="Mixed">Mixed Types</option>}
                <option>Wall</option>
                <option>Door</option>
                <option>Window</option>
                <option>Column</option>
                <option>Beam</option>
              </select>
            </div>

            {/* Dimensions - only show for single selection */}
            {state.selectedElement && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Dimensions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Width (in)</label>
                    <input
                      type="number"
                      value={properties.width}
                      onChange={(e) => handlePropertyChange('width', e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Height (in)</label>
                    <input
                      type="number"
                      value={properties.height}
                      onChange={(e) => handlePropertyChange('height', e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Material Properties */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Material</h3>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Material Type</label>
                <select 
                  value={properties.material}
                  onChange={(e) => handlePropertyChange('material', e.target.value)}
                  disabled={properties.material === 'Mixed'}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  {properties.material === 'Mixed' && <option value="Mixed">Mixed Materials</option>}
                  {materialOptions.map(material => (
                    <option key={material} value={material}>{material}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Gauge/Thickness</label>
                <select 
                  value={properties.gauge}
                  onChange={(e) => handlePropertyChange('gauge', e.target.value)}
                  disabled={properties.gauge === 'Mixed'}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  {properties.gauge === 'Mixed' && <option value="Mixed">Mixed Gauges</option>}
                  {gaugeOptions.map(gauge => (
                    <option key={gauge} value={gauge}>{gauge}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={properties.color}
                  onChange={(e) => handlePropertyChange('color', e.target.value)}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={properties.color}
                  onChange={(e) => handlePropertyChange('color', e.target.value)}
                  className="flex-1 p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="#888888"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={properties.description}
                onChange={(e) => handlePropertyChange('description', e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 resize-none"
                rows="2"
                placeholder="Element description..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <button
                onClick={applyChanges}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                Apply Changes
              </button>
              <button
                onClick={deleteElement}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No element selected</p>
            <p className="text-xs text-gray-400 mt-1">Select an element to view its properties</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertiesPanel;