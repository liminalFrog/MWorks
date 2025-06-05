import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { generatePDFReport, generateCSVReport } from './ReportGenerator';

function Toolbar() {
  const { state, actions } = useApp();
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [clipboard, setClipboard] = useState([]);
  const menuRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Check if window is maximized on mount
    const checkMaximized = async () => {
      if (window.electronAPI?.windowIsMaximized) {
        const maximized = await window.electronAPI.windowIsMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();

    // Handle keyboard shortcuts for file operations
    const handleSaveProject = () => handleFileOperation('save');
    const handleSaveProjectAs = () => handleFileOperation('saveAs');

    window.addEventListener('saveProject', handleSaveProject);
    window.addEventListener('saveProjectAs', handleSaveProjectAs);

    // Close menu when clicking outside
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('saveProject', handleSaveProject);
      window.removeEventListener('saveProjectAs', handleSaveProjectAs);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFileOperation = async (operation) => {
    setActiveMenu(null); // Close menu
    switch (operation) {
      case 'new':
        actions.newProject();
        actions.setStatusMessage('New project created');
        break;
      case 'open':
        if (window.electronAPI?.openFileDialog) {
          const result = await window.electronAPI.openFileDialog();
          if (result) {
            try {
              const projectData = JSON.parse(result.content);
              actions.loadProject({
                ...projectData,
                projectName: result.name,
                projectPath: result.path,
              });
              actions.setStatusMessage(`Opened: ${result.name}`);
            } catch (error) {
              actions.setStatusMessage('Error: Invalid project file');
            }
          }
        }
        break;
      case 'save':
        if (window.electronAPI?.saveFile) {
          const projectData = {
            elements: state.elements,
            levels: state.levels,
            zoom: state.zoom,
            panOffset: state.panOffset,
            showGrid: state.showGrid,
          };
          const result = await window.electronAPI.saveFile({
            path: state.projectPath,
            content: JSON.stringify(projectData, null, 2),
          });
          if (result.success) {
            actions.setDirty(false);
            actions.setProjectPath(result.path);
            actions.setStatusMessage('Project saved');
          }
        }
        break;
      case 'saveAs':
        if (window.electronAPI?.saveFile) {
          const projectData = {
            elements: state.elements,
            levels: state.levels,
            zoom: state.zoom,
            panOffset: state.panOffset,
            showGrid: state.showGrid,
          };
          const result = await window.electronAPI.saveFile({
            content: JSON.stringify(projectData, null, 2),
          });
          if (result.success) {
            actions.setDirty(false);
            actions.setProjectPath(result.path);
            actions.setProjectName(result.name);
            actions.setStatusMessage(`Saved as: ${result.name}`);
          }
        }
        break;
      case 'export':
        const reportData = {
          projectName: state.projectName,
          elements: state.elements,
          levels: state.levels,
          statistics: {
            totalElements: state.elements.length,
            totalArea: state.elements.reduce((sum, el) => sum + (el.width * el.height || 0), 0),
            elementsByType: state.elements.reduce((acc, el) => {
              acc[el.type] = (acc[el.type] || 0) + 1;
              return acc;
            }, {}),
          },
        };

        // Show export options dialog
        const exportChoice = await new Promise(resolve => {
          const choice = window.confirm('Generate PDF Report? Click OK for PDF, Cancel for CSV data export.');
          resolve(choice ? 'pdf' : 'csv');
        });

        if (exportChoice === 'pdf') {
          // Find canvas element for PDF generation
          const canvasElement = document.querySelector('canvas');
          const result = await generatePDFReport(reportData, { current: canvasElement });
          if (result.success) {
            actions.setStatusMessage(`PDF report saved: ${result.fileName}`);
          } else {
            actions.setStatusMessage(`Export failed: ${result.error}`);
          }
        } else {
          const result = generateCSVReport(reportData);
          if (result.success) {
            actions.setStatusMessage(`CSV data exported: ${result.fileName}`);
          } else {
            actions.setStatusMessage(`Export failed: ${result.error}`);
          }
        }
        break;
      case 'recent':
        // Handle recent files
        break;
    }
  };

  const handleEditOperation = (operation) => {
    setActiveMenu(null); // Close menu
    switch (operation) {
      case 'cut':
        if (state.selectedElements.length > 0) {
          const selectedElementsData = state.selectedElements.map(id => 
            state.elements.find(el => el.id === id)
          ).filter(Boolean);
          setClipboard(selectedElementsData);
          state.selectedElements.forEach(id => actions.deleteElement(id));
          actions.setStatusMessage(`Cut ${selectedElementsData.length} element(s)`);
        }
        break;
      case 'copy':
        if (state.selectedElements.length > 0) {
          const selectedElementsData = state.selectedElements.map(id => 
            state.elements.find(el => el.id === id)
          ).filter(Boolean);
          setClipboard(selectedElementsData);
          actions.setStatusMessage(`Copied ${selectedElementsData.length} element(s)`);
        }
        break;
      case 'paste':
        if (clipboard.length > 0) {
          clipboard.forEach((element, index) => {
            const newElement = {
              ...element,
              id: Date.now() + index,
              x: element.x + 20, // Offset pasted elements
              y: element.y + 20,
            };
            actions.addElement(newElement);
          });
          actions.setStatusMessage(`Pasted ${clipboard.length} element(s)`);
        }
        break;
      case 'selectAll':
        const allElementIds = state.elements.map(el => el.id);
        actions.setSelectedElements(allElementIds);
        actions.setStatusMessage(`Selected all ${allElementIds.length} element(s)`);
        break;
    }
  };

  // Add keyboard shortcut handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              actions.redo();
            } else {
              actions.undo();
            }
            break;
          case 'y':
            e.preventDefault();
            actions.redo();
            break;
          case 'x':
            e.preventDefault();
            handleEditOperation('cut');
            break;
          case 'c':
            e.preventDefault();
            handleEditOperation('copy');
            break;
          case 'v':
            e.preventDefault();
            handleEditOperation('paste');
            break;
          case 'a':
            e.preventDefault();
            handleEditOperation('selectAll');
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
            actions.setPanOffset({ x: 0, y: 0 });
            break;
        }
      } else {
        // Tool shortcuts (without Ctrl)
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
          case 'm':
            e.preventDefault();
            actions.setCurrentTool('measure');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [actions, state, clipboard]);

  const handleMenuClick = (menuName) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const menuItems = {
    File: [
      { label: 'New Project', shortcut: 'Ctrl+N', action: () => handleFileOperation('new') },
      { label: 'Open...', shortcut: 'Ctrl+O', action: () => handleFileOperation('open') },
      { type: 'separator' },
      { label: 'Save', shortcut: 'Ctrl+S', action: () => handleFileOperation('save') },
      { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: () => handleFileOperation('saveAs') },
      { type: 'separator' },
      { label: 'Export Report...', shortcut: 'Ctrl+E', action: () => handleFileOperation('export') },
      { type: 'separator' },
      { label: 'Recent Files', action: () => handleFileOperation('recent') },
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z', action: () => actions.undo() },
      { label: 'Redo', shortcut: 'Ctrl+Y', action: () => actions.redo() },
      { type: 'separator' },
      { label: 'Cut', shortcut: 'Ctrl+X', action: () => handleEditOperation('cut') },
      { label: 'Copy', shortcut: 'Ctrl+C', action: () => handleEditOperation('copy') },
      { label: 'Paste', shortcut: 'Ctrl+V', action: () => handleEditOperation('paste') },
      { type: 'separator' },
      { label: 'Select All', shortcut: 'Ctrl+A', action: () => handleEditOperation('selectAll') },
    ],
    View: [
      { label: 'Zoom In', shortcut: 'Ctrl++', action: () => actions.setZoom(Math.min(5, state.zoom * 1.2)) },
      { label: 'Zoom Out', shortcut: 'Ctrl+-', action: () => actions.setZoom(Math.max(0.1, state.zoom * 0.8)) },
      { label: 'Zoom to Fit', shortcut: 'Ctrl+0', action: () => actions.setZoom(1) },
      { type: 'separator' },
      { label: 'Grid', shortcut: 'Ctrl+G', action: () => actions.toggleGrid() },
      { label: 'Snap to Grid', shortcut: 'Ctrl+Shift+G', action: () => {} },
      { type: 'separator' },
      { label: 'Properties Panel', action: () => actions.togglePropertiesPanel() },
      { label: 'Levels Panel', action: () => actions.toggleLevelsPanel() },
    ],
    Tools: [
      { label: 'Select Tool', shortcut: 'V', action: () => actions.setCurrentTool('select') },
      { label: 'Wall Tool', shortcut: 'W', action: () => actions.setCurrentTool('wall') },
      { label: 'Door Tool', shortcut: 'D', action: () => actions.setCurrentTool('door') },
      { label: 'Window Tool', shortcut: 'N', action: () => actions.setCurrentTool('window') },
      { type: 'separator' },
      { label: 'Measure', shortcut: 'M', action: () => actions.setCurrentTool('measure') },
      { label: 'Calculate Report', shortcut: 'F5', action: () => handleFileOperation('export') },
    ],
    Help: [
      { label: 'Getting Started', action: () => {} },
      { label: 'Keyboard Shortcuts', action: () => {} },
      { type: 'separator' },
      { label: 'About MWorks', action: () => {} },
    ],
  };

  const renderMenu = (menuName) => {
    if (activeMenu !== menuName) return null;

    return (
      <div className="absolute top-full left-0 bg-gray-800 border border-gray-600 rounded-md shadow-lg py-1 min-w-48 z-50">
        {menuItems[menuName].map((item, index) => {
          if (item.type === 'separator') {
            return <div key={index} className="border-t border-gray-600 my-1" />;
          }
          return (
            <button
              key={index}
              onClick={item.action}
              className="w-full text-left px-3 py-1 text-sm hover:bg-gray-700 flex justify-between items-center"
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <span className="text-gray-400 text-xs">{item.shortcut}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };
  const handleWindowControl = async (action) => {
    switch (action) {
      case 'minimize':
        if (window.electronAPI?.windowMinimize) {
          await window.electronAPI.windowMinimize();
        }
        break;
      case 'maximize':
        if (window.electronAPI?.windowMaximize) {
          await window.electronAPI.windowMaximize();
          setIsMaximized(!isMaximized);
        }
        break;
      case 'close':
        if (window.electronAPI?.windowClose) {
          await window.electronAPI.windowClose();
        }
        break;
    }
  };

  return (
    <div className="bg-gray-900 text-white h-8 flex items-center border-b border-gray-700 select-none relative" style={{ WebkitAppRegion: 'drag' }}>
      {/* Left side - App icon and menu */}
      <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' }} ref={menuRef}>
        {/* App Icon */}
        <div className="px-2 py-1 hover:bg-gray-800 transition-colors cursor-pointer">
          <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-sm flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-white">M</span>
          </div>
        </div>

        {/* Menu items */}
        <div className="flex">
          {Object.keys(menuItems).map((menuName) => (
            <div key={menuName} className="relative">
              <button 
                onClick={() => handleMenuClick(menuName)}
                className={`px-3 py-1 text-sm transition-colors ${
                  activeMenu === menuName ? 'bg-gray-700' : 'hover:bg-gray-800'
                }`}
              >
                {menuName}
              </button>
              {renderMenu(menuName)}
            </div>
          ))}
        </div>
      </div>

      {/* Center - File name */}
      <div className="flex-1 flex justify-center items-center">
        <div className="flex items-center space-x-2 text-sm text-gray-300">
          <span className="flex items-center">
            {state.isDirty && (
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" title="Unsaved changes"></div>
            )}
            <span className="font-medium">{state.projectName}</span>
          </span>
        </div>
      </div>

      {/* Right side - Window controls */}
      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' }}>
        <button 
          onClick={() => handleWindowControl('minimize')}
          className="w-12 h-full flex items-center justify-center hover:bg-gray-800 transition-colors group"
          title="Minimize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" className="fill-current text-gray-300 group-hover:text-white">
            <rect x="1" y="5.5" width="10" height="1"/>
          </svg>
        </button>
        
        <button 
          onClick={() => handleWindowControl('maximize')}
          className="w-12 h-full flex items-center justify-center hover:bg-gray-800 transition-colors group"
          title={isMaximized ? "Restore Down" : "Maximize"}
        >
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12" className="fill-current text-gray-300 group-hover:text-white">
              <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1"/>
              <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" className="fill-current text-gray-300 group-hover:text-white">
              <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1"/>
            </svg>
          )}
        </button>
        
        <button 
          onClick={() => handleWindowControl('close')}
          className="w-12 h-full flex items-center justify-center hover:bg-red-600 transition-colors group"
          title="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" className="fill-current text-gray-300 group-hover:text-white">
            <path d="M2.293 2.293a1 1 0 011.414 0L6 4.586l2.293-2.293a1 1 0 111.414 1.414L7.414 6l2.293 2.293a1 1 0 01-1.414 1.414L6 7.414l-2.293 2.293a1 1 0 01-1.414-1.414L4.586 6 2.293 3.707a1 1 0 010-1.414z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Toolbar;