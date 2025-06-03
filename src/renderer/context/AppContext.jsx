import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// Initial state
const initialState = {
  // Canvas state
  elements: [],
  selectedElement: null,
  selectedElements: [], // Multi-selection support
  currentTool: 'select',
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  showGrid: true,
  isPanning: false, // Pan mode tracking
  
  // Project state
  projectName: 'Untitled Project.mw',
  isDirty: false,
  projectPath: null,
  
  // Levels state
  levels: [
    { id: 1, name: 'Ground Floor', height: 0, visible: true, locked: false, active: true },
    { id: 2, name: 'Structure', height: 12, visible: true, locked: false, active: false },
  ],
  activeLevel: 1,
  
  // UI state
  showPropertiesPanel: true,
  showLevelsPanel: true,
  
  // Status
  statusMessage: 'Ready',
  coordinates: { x: 0, y: 0 },
  
  // Undo/Redo system
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
};

// Action types
const ACTIONS = {
  // Element actions
  ADD_ELEMENT: 'ADD_ELEMENT',
  UPDATE_ELEMENT: 'UPDATE_ELEMENT',
  DELETE_ELEMENT: 'DELETE_ELEMENT',
  SELECT_ELEMENT: 'SELECT_ELEMENT',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  
  // Tool actions
  SET_CURRENT_TOOL: 'SET_CURRENT_TOOL',
  
  // Canvas actions
  SET_ZOOM: 'SET_ZOOM',
  SET_PAN_OFFSET: 'SET_PAN_OFFSET',
  TOGGLE_GRID: 'TOGGLE_GRID',
  
  // Project actions
  SET_PROJECT_NAME: 'SET_PROJECT_NAME',
  SET_DIRTY: 'SET_DIRTY',
  SET_PROJECT_PATH: 'SET_PROJECT_PATH',
  NEW_PROJECT: 'NEW_PROJECT',
  LOAD_PROJECT: 'LOAD_PROJECT',
  
  // Levels actions
  ADD_LEVEL: 'ADD_LEVEL',
  UPDATE_LEVEL: 'UPDATE_LEVEL',
  DELETE_LEVEL: 'DELETE_LEVEL',
  SET_ACTIVE_LEVEL: 'SET_ACTIVE_LEVEL',
  TOGGLE_LEVEL_VISIBILITY: 'TOGGLE_LEVEL_VISIBILITY',
  TOGGLE_LEVEL_LOCK: 'TOGGLE_LEVEL_LOCK',
  
  // UI actions
  TOGGLE_PROPERTIES_PANEL: 'TOGGLE_PROPERTIES_PANEL',
  TOGGLE_LEVELS_PANEL: 'TOGGLE_LEVELS_PANEL',
  
  // Status actions
  SET_STATUS_MESSAGE: 'SET_STATUS_MESSAGE',
  SET_COORDINATES: 'SET_COORDINATES',
  
  // History actions
  UNDO: 'UNDO',
  REDO: 'REDO',
  SAVE_STATE_TO_HISTORY: 'SAVE_STATE_TO_HISTORY',
  
  // Multi-selection actions
  SELECT_MULTIPLE_ELEMENTS: 'SELECT_MULTIPLE_ELEMENTS',
  ADD_TO_SELECTION: 'ADD_TO_SELECTION',
  REMOVE_FROM_SELECTION: 'REMOVE_FROM_SELECTION',
  
  // Pan actions
  SET_PANNING: 'SET_PANNING',
  
  // File operations
  SAVE_PROJECT: 'SAVE_PROJECT',
  SAVE_PROJECT_AS: 'SAVE_PROJECT_AS',
};

// Helper functions for undo/redo system
const saveStateToHistory = (state) => {
  const stateToSave = {
    elements: state.elements,
    selectedElement: state.selectedElement,
    selectedElements: state.selectedElements,
    levels: state.levels,
    activeLevel: state.activeLevel,
  };
  
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(stateToSave);
  
  // Limit history size
  if (newHistory.length > state.maxHistorySize) {
    newHistory.shift();
  }
  
  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

const canUndo = (state) => state.historyIndex > 0;
const canRedo = (state) => state.historyIndex < state.history.length - 1;

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_ELEMENT:
      return {
        ...state,
        elements: [...state.elements, action.payload],
        isDirty: true,
      };
      
    case ACTIONS.UPDATE_ELEMENT:
      return {
        ...state,
        elements: state.elements.map(el => 
          el.id === action.payload.id ? { ...el, ...action.payload.updates } : el
        ),
        isDirty: true,
      };
      
    case ACTIONS.DELETE_ELEMENT:
      return {
        ...state,
        elements: state.elements.filter(el => el.id !== action.payload),
        selectedElement: state.selectedElement?.id === action.payload ? null : state.selectedElement,
        isDirty: true,
      };
      
    case ACTIONS.SELECT_ELEMENT:
      return {
        ...state,
        selectedElement: action.payload,
        currentTool: 'select',
      };
      
    case ACTIONS.CLEAR_SELECTION:
      return {
        ...state,
        selectedElement: null,
      };
      
    case ACTIONS.SET_CURRENT_TOOL:
      return {
        ...state,
        currentTool: action.payload,
        selectedElement: action.payload === 'select' ? state.selectedElement : null,
      };
      
    case ACTIONS.SET_ZOOM:
      return {
        ...state,
        zoom: action.payload,
      };
      
    case ACTIONS.SET_PAN_OFFSET:
      return {
        ...state,
        panOffset: action.payload,
      };
      
    case ACTIONS.TOGGLE_GRID:
      return {
        ...state,
        showGrid: !state.showGrid,
      };
      
    case ACTIONS.SET_PROJECT_NAME:
      return {
        ...state,
        projectName: action.payload,
      };
      
    case ACTIONS.SET_DIRTY:
      return {
        ...state,
        isDirty: action.payload,
      };
      
    case ACTIONS.SET_PROJECT_PATH:
      return {
        ...state,
        projectPath: action.payload,
      };
      
    case ACTIONS.NEW_PROJECT:
      return {
        ...initialState,
        projectName: 'Untitled Project.mw',
      };
      
    case ACTIONS.LOAD_PROJECT:
      return {
        ...state,
        ...action.payload,
        isDirty: false,
      };
      
    case ACTIONS.ADD_LEVEL:
      return {
        ...state,
        levels: [...state.levels, action.payload],
        isDirty: true,
      };
      
    case ACTIONS.UPDATE_LEVEL:
      return {
        ...state,
        levels: state.levels.map(level => 
          level.id === action.payload.id ? { ...level, ...action.payload.updates } : level
        ),
        isDirty: true,
      };
      
    case ACTIONS.DELETE_LEVEL:
      if (state.levels.length <= 1) return state;
      return {
        ...state,
        levels: state.levels.filter(level => level.id !== action.payload),
        activeLevel: state.activeLevel === action.payload ? state.levels[0].id : state.activeLevel,
        isDirty: true,
      };
      
    case ACTIONS.SET_ACTIVE_LEVEL:
      return {
        ...state,
        levels: state.levels.map(level => ({
          ...level,
          active: level.id === action.payload
        })),
        activeLevel: action.payload,
      };
      
    case ACTIONS.TOGGLE_LEVEL_VISIBILITY:
      return {
        ...state,
        levels: state.levels.map(level => 
          level.id === action.payload ? { ...level, visible: !level.visible } : level
        ),
      };
      
    case ACTIONS.TOGGLE_LEVEL_LOCK:
      return {
        ...state,
        levels: state.levels.map(level => 
          level.id === action.payload ? { ...level, locked: !level.locked } : level
        ),
      };
      
    case ACTIONS.TOGGLE_PROPERTIES_PANEL:
      return {
        ...state,
        showPropertiesPanel: !state.showPropertiesPanel,
      };
      
    case ACTIONS.TOGGLE_LEVELS_PANEL:
      return {
        ...state,
        showLevelsPanel: !state.showLevelsPanel,
      };
      
    case ACTIONS.SET_STATUS_MESSAGE:
      return {
        ...state,
        statusMessage: action.payload,
      };
      
    case ACTIONS.SET_COORDINATES:
      return {
        ...state,
        coordinates: action.payload,
      };
      
    case ACTIONS.UNDO: {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const previousState = state.history[newIndex];
      return {
        ...state,
        ...previousState,
        historyIndex: newIndex,
        isDirty: true,
      };
    }
      
    case ACTIONS.REDO: {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const nextState = state.history[newIndex];
      return {
        ...state,
        ...nextState,
        historyIndex: newIndex,
        isDirty: true,      };
    }
      
    case ACTIONS.SAVE_STATE_TO_HISTORY:
      return saveStateToHistory(state);
      
    case ACTIONS.SELECT_MULTIPLE_ELEMENTS:
      return {
        ...state,
        selectedElements: action.payload,
        selectedElement: null,
      };
      
    case ACTIONS.ADD_TO_SELECTION:
      return {
        ...state,
        selectedElements: [...state.selectedElements, action.payload],
      };
      
    case ACTIONS.REMOVE_FROM_SELECTION:
      return {
        ...state,
        selectedElements: state.selectedElements.filter(el => el.id !== action.payload),
      };
      
    case ACTIONS.SET_PANNING:
      return {
        ...state,
        isPanning: action.payload,
      };

    default:
      return state;
  }
}

// Context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Keyboard shortcut handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            actions.newProject();
            break;
          case 's':
            e.preventDefault();
            if (e.shiftKey) {
              // Trigger Save As
              window.dispatchEvent(new CustomEvent('saveProjectAs'));
            } else {
              // Trigger Save
              window.dispatchEvent(new CustomEvent('saveProject'));
            }
            break;
          case 'z':
            e.preventDefault();
            actions.undo();
            break;
          case 'y':
            e.preventDefault();
            actions.redo();
            break;
          case 'g':
            e.preventDefault();
            actions.toggleGrid();
            break;
          case '=':
          case '+':
            e.preventDefault();
            actions.setZoom(Math.min(5, state.zoom * 1.2));
            break;
          case '-':
            e.preventDefault();
            actions.setZoom(Math.max(0.1, state.zoom * 0.8));
            break;
          case '0':
            e.preventDefault();
            actions.setZoom(1);
            break;
        }
      } else {
        // Tool shortcuts without modifier keys
        switch (e.key.toLowerCase()) {
          case 'v':
            e.preventDefault();
            actions.setCurrentTool('select');
            break;
          case 'w':
            e.preventDefault();
            actions.setCurrentTool('wall');
            break;
          case 'd':
            e.preventDefault();
            actions.setCurrentTool('door');
            break;
          case 'n':
            e.preventDefault();
            actions.setCurrentTool('window');
            break;
          case 'c':
            e.preventDefault();
            actions.setCurrentTool('column');
            break;
          case 'b':
            e.preventDefault();
            actions.setCurrentTool('beam');
            break;
          case 'escape':
            actions.clearSelection();
            actions.setCurrentTool('select');
            break;
          case 'delete':
          case 'backspace':
            if (state.selectedElement) {
              actions.deleteElement(state.selectedElement.id);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.zoom, state.selectedElement]);
  
  // Action creators
  const actions = {
    // Element actions
    addElement: useCallback((element) => {
      dispatch({ type: ACTIONS.ADD_ELEMENT, payload: element });
    }, []),
    
    updateElement: useCallback((id, updates) => {
      dispatch({ type: ACTIONS.UPDATE_ELEMENT, payload: { id, updates } });
    }, []),
    
    deleteElement: useCallback((id) => {
      dispatch({ type: ACTIONS.DELETE_ELEMENT, payload: id });
    }, []),
    
    selectElement: useCallback((element) => {
      dispatch({ type: ACTIONS.SELECT_ELEMENT, payload: element });
    }, []),
    
    clearSelection: useCallback(() => {
      dispatch({ type: ACTIONS.CLEAR_SELECTION });
    }, []),
    
    // Tool actions
    setCurrentTool: useCallback((tool) => {
      dispatch({ type: ACTIONS.SET_CURRENT_TOOL, payload: tool });
    }, []),
    
    // Canvas actions
    setZoom: useCallback((zoom) => {
      dispatch({ type: ACTIONS.SET_ZOOM, payload: zoom });
    }, []),
    
    setPanOffset: useCallback((offset) => {
      dispatch({ type: ACTIONS.SET_PAN_OFFSET, payload: offset });
    }, []),
    
    toggleGrid: useCallback(() => {
      dispatch({ type: ACTIONS.TOGGLE_GRID });
    }, []),
    
    // Project actions
    setProjectName: useCallback((name) => {
      dispatch({ type: ACTIONS.SET_PROJECT_NAME, payload: name });
    }, []),
    
    setDirty: useCallback((dirty) => {
      dispatch({ type: ACTIONS.SET_DIRTY, payload: dirty });
    }, []),
    
    setProjectPath: useCallback((path) => {
      dispatch({ type: ACTIONS.SET_PROJECT_PATH, payload: path });
    }, []),
    
    newProject: useCallback(() => {
      dispatch({ type: ACTIONS.NEW_PROJECT });
    }, []),
    
    loadProject: useCallback((projectData) => {
      dispatch({ type: ACTIONS.LOAD_PROJECT, payload: projectData });
    }, []),
    
    // Level actions
    addLevel: useCallback((level) => {
      dispatch({ type: ACTIONS.ADD_LEVEL, payload: level });
    }, []),
    
    updateLevel: useCallback((id, updates) => {
      dispatch({ type: ACTIONS.UPDATE_LEVEL, payload: { id, updates } });
    }, []),
    
    deleteLevel: useCallback((id) => {
      dispatch({ type: ACTIONS.DELETE_LEVEL, payload: id });
    }, []),
    
    setActiveLevel: useCallback((id) => {
      dispatch({ type: ACTIONS.SET_ACTIVE_LEVEL, payload: id });
    }, []),
    
    toggleLevelVisibility: useCallback((id) => {
      dispatch({ type: ACTIONS.TOGGLE_LEVEL_VISIBILITY, payload: id });
    }, []),
    
    toggleLevelLock: useCallback((id) => {
      dispatch({ type: ACTIONS.TOGGLE_LEVEL_LOCK, payload: id });
    }, []),
    
    // UI actions
    togglePropertiesPanel: useCallback(() => {
      dispatch({ type: ACTIONS.TOGGLE_PROPERTIES_PANEL });
    }, []),
    
    toggleLevelsPanel: useCallback(() => {
      dispatch({ type: ACTIONS.TOGGLE_LEVELS_PANEL });
    }, []),
    
    // Status actions
    setStatusMessage: useCallback((message) => {
      dispatch({ type: ACTIONS.SET_STATUS_MESSAGE, payload: message });
    }, []),
    
    setCoordinates: useCallback((coordinates) => {
      dispatch({ type: ACTIONS.SET_COORDINATES, payload: coordinates });
    }, []),
    
    // History actions
    undo: useCallback(() => {
      dispatch({ type: ACTIONS.UNDO });
    }, []),
    
    redo: useCallback(() => {
      dispatch({ type: ACTIONS.REDO });
    }, []),
    
    saveStateToHistory: useCallback(() => {
      dispatch({ type: ACTIONS.SAVE_STATE_TO_HISTORY });
    }, []),
    
    // Multi-selection actions
    selectMultipleElements: useCallback((elements) => {
      dispatch({ type: ACTIONS.SELECT_MULTIPLE_ELEMENTS, payload: elements });
    }, []),
    
    addToSelection: useCallback((element) => {
      dispatch({ type: ACTIONS.ADD_TO_SELECTION, payload: element });
    }, []),
    
    removeFromSelection: useCallback((elementId) => {
      dispatch({ type: ACTIONS.REMOVE_FROM_SELECTION, payload: elementId });
    }, []),
    
    // Pan actions
    setPanning: useCallback((isPanning) => {
      dispatch({ type: ACTIONS.SET_PANNING, payload: isPanning });
    }, []),
  };
  
  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
