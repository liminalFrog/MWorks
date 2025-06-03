import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

function PropertiesPanel() {
  const { state, actions } = useApp();
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
      setProperties({
        type: state.selectedElement.type || 'Wall',
        width: state.selectedElement.width?.toString() || '6',
        height: state.selectedElement.height?.toString() || '12',
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
      const updates = {
        type: properties.type,
        width: parseFloat(properties.width) || 0,
        height: parseFloat(properties.height) || 0,
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
                  `${state.selectedElement.type} - ${state.selectedElement.width}x${state.selectedElement.height} ft` :
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
                    <label className="block text-xs text-gray-600 mb-1">Width (ft)</label>
                    <input
                      type="number"
                      value={properties.width}
                      onChange={(e) => handlePropertyChange('width', e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Height (ft)</label>
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
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  {properties.material === 'Mixed' && <option value="Mixed">Mixed Materials</option>}
                  {materialOptions.map(material => (
                    <option key={material} value={material}>{material}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Gauge</label>
                <select 
                  value={properties.gauge}
                  onChange={(e) => handlePropertyChange('gauge', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  {properties.gauge === 'Mixed' && <option value="Mixed">Mixed Gauges</option>}
                  {gaugeOptions.map(gauge => (
                    <option key={gauge} value={gauge}>{gauge}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Appearance</h3>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={properties.color}
                    onChange={(e) => handlePropertyChange('color', e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={properties.color}
                    onChange={(e) => handlePropertyChange('color', e.target.value)}
                    className="flex-1 p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Description</label>
              <textarea
                value={properties.description}
                onChange={(e) => handlePropertyChange('description', e.target.value)}
                rows="3"
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Element description..."
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <button 
                onClick={applyChanges}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded transition-colors"
              >
                Apply Changes
              </button>
              <button 
                onClick={deleteElement}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded transition-colors"
              >
                Delete Element
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📐</div>
            <p className="text-sm">Select an element to view properties</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertiesPanel;