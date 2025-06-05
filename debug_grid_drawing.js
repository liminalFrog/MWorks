
/**
 * Debug utility to inject into the CanvasEditor.jsx file
 * to check if grid drawing is actually being called.
 * 
 * Instructions:
 * 1. Add the following code to the drawGrid function at the start:
 *    console.log('GRID DRAWING CALLED', { showGrid: state.showGrid, zoom: state.zoom });
 * 
 * 2. Also add a console log to the setupCanvas function at the start:
 *    console.log('SETUP CANVAS CALLED', { showGrid: state.showGrid, zoom: state.zoom, elements: state.elements.length });
 * 
 * 3. Add a console log to the draw function near where it checks state.showGrid:
 *    console.log('DRAW FUNCTION checking showGrid:', state.showGrid);
 * 
 * These logs will help determine if the drawing functions are being called
 * and if they're receiving the correct state values.
 */

// Usage: open DevTools in Electron app and check console for these messages
