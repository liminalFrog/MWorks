import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import CanvasEditor from './components/CanvasEditor';
import PropertiesPanel from './components/PropertiesPanel';
import LevelsPanel from './components/LevelsPanel';
import Toolbar from './components/Toolbar';
import DrawingToolbar from './components/DrawingToolbar';
import StatusBar from './components/StatusBar';

function AppContent() {
  const { state } = useApp();
  
  console.log('AppContent rendering with state:', {
    elementsCount: state.elements.length,
    currentTool: state.currentTool,
    showPropertiesPanel: state.showPropertiesPanel,
    showLevelsPanel: state.showLevelsPanel
  });

  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
      <DrawingToolbar />
      <div className="flex flex-1">
        {state.showPropertiesPanel && <PropertiesPanel />}
        <CanvasEditor />
        {state.showLevelsPanel && <LevelsPanel />}
      </div>
      <StatusBar />
    </div>
  );
}

function App() {
  console.log('App component mounting...');
  
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;