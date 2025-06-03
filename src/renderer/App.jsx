import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import CanvasEditor from './components/CanvasEditor';
import PropertiesPanel from './components/PropertiesPanel';
import LevelsPanel from './components/LevelsPanel';
import Toolbar from './components/Toolbar';
import StatusBar from './components/StatusBar';

function AppContent() {
  const { state } = useApp();

  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
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
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;