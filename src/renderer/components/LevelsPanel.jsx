import React from 'react';
import { useApp } from '../context/AppContext';

function LevelsPanel() {
  const { state, actions } = useApp();

  const addLevel = () => {
    const newLevel = {
      id: Date.now(),
      name: `Level ${state.levels.length + 1}`,
      height: state.levels.length * 12,
      visible: true,
      locked: false,
      active: false
    };
    actions.addLevel(newLevel);
  };

  const toggleVisibility = (id) => {
    actions.toggleLevelVisibility(id);
  };

  const toggleLock = (id) => {
    actions.toggleLevelLock(id);
  };

  const deleteLevel = (id) => {
    if (state.levels.length > 1) {
      actions.deleteLevel(id);
    }
  };

  const updateLevelName = (id, name) => {
    actions.updateLevel(id, { name });
  };

  const updateLevelHeight = (id, height) => {
    actions.updateLevel(id, { height: parseInt(height) || 0 });
  };

  const showAllLevels = () => {
    state.levels.forEach(level => {
      if (!level.visible) {
        actions.toggleLevelVisibility(level.id);
      }
    });
  };

  const hideAllLevels = () => {
    state.levels.forEach(level => {
      if (level.visible && level.id !== state.activeLevel) {
        actions.toggleLevelVisibility(level.id);
      }
    });
  };

  const lockAllLevels = () => {
    state.levels.forEach(level => {
      if (!level.locked) {
        actions.toggleLevelLock(level.id);
      }
    });
  };

  const unlockAllLevels = () => {
    state.levels.forEach(level => {
      if (level.locked) {
        actions.toggleLevelLock(level.id);
      }
    });
  };

  return (
    <div className="w-64 bg-gray-200 border-l border-gray-300 flex flex-col">
      {/* Header */}
      <div className="bg-gray-300 px-4 py-2 border-b border-gray-400">
        <h2 className="text-sm font-semibold text-gray-800">Levels & Layers</h2>
      </div>
      
      {/* Levels List */}
      <div className="flex-1 overflow-y-auto">
        {state.levels.map((level) => (
          <div 
            key={level.id}
            className={`border-b border-gray-300 ${
              state.activeLevel === level.id ? 'bg-blue-100 border-l-4 border-l-blue-500' : 'bg-white'
            }`}
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => actions.setActiveLevel(level.id)}
                >
                  <div className="font-medium text-sm text-gray-800">{level.name}</div>
                  <div className="text-xs text-gray-500">Height: {level.height}ft</div>
                </div>
                
                {/* Level controls */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => toggleVisibility(level.id)}
                    className={`w-6 h-6 text-xs rounded ${
                      level.visible 
                        ? 'bg-green-500 text-white hover:bg-green-600' 
                        : 'bg-gray-400 text-white hover:bg-gray-500'
                    }`}
                    title={level.visible ? 'Hide layer' : 'Show layer'}
                  >
                    👁
                  </button>
                  <button
                    onClick={() => toggleLock(level.id)}
                    className={`w-6 h-6 text-xs rounded ${
                      level.locked 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-gray-400 text-white hover:bg-gray-500'
                    }`}
                    title={level.locked ? 'Unlock layer' : 'Lock layer'}
                  >
                    🔒
                  </button>
                  <button
                    onClick={() => deleteLevel(level.id)}
                    className="w-6 h-6 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    title="Delete level"
                    disabled={state.levels.length <= 1}
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* Level details when active */}
              {state.activeLevel === level.id && (
                <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                  <input
                    type="text"
                    value={level.name}
                    onChange={(e) => updateLevelName(level.id, e.target.value)}
                    className="w-full p-1 text-xs border border-gray-300 rounded"
                    placeholder="Level name"
                  />
                  <input
                    type="number"
                    value={level.height}
                    onChange={(e) => updateLevelHeight(level.id, e.target.value)}
                    className="w-full p-1 text-xs border border-gray-300 rounded"
                    placeholder="Height (ft)"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Add Level Button */}
      <div className="p-3 border-t border-gray-300">
        <button 
          onClick={addLevel}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded transition-colors"
        >
          + Add Level
        </button>
      </div>
      
      {/* Layer Tools */}
      <div className="p-3 border-t border-gray-300 bg-gray-100">
        <div className="text-xs text-gray-600 mb-2">Layer Tools</div>
        <div className="grid grid-cols-2 gap-1">
          <button 
            onClick={showAllLevels}
            className="bg-gray-500 hover:bg-gray-600 text-white text-xs py-1 px-2 rounded"
          >
            Show All
          </button>
          <button 
            onClick={hideAllLevels}
            className="bg-gray-500 hover:bg-gray-600 text-white text-xs py-1 px-2 rounded"
          >
            Hide All
          </button>
          <button 
            onClick={lockAllLevels}
            className="bg-gray-500 hover:bg-gray-600 text-white text-xs py-1 px-2 rounded"
          >
            Lock All
          </button>
          <button 
            onClick={unlockAllLevels}
            className="bg-gray-500 hover:bg-gray-600 text-white text-xs py-1 px-2 rounded"
          >
            Unlock All
          </button>
        </div>
      </div>
    </div>
  );
}

export default LevelsPanel;