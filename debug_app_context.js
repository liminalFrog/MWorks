
/**
 * Debug utility to inject into the AppContext.jsx file
 * to check the grid toggle functionality
 * 
 * Instructions:
 * 1. Add the following code to the toggleGrid function in AppContext.jsx:
 *    console.log('TOGGLE GRID CALLED - current state:', state.showGrid);
 * 
 * 2. Add the following code to the TOGGLE_GRID case in the reducer:
 *    console.log('TOGGLING GRID from', state.showGrid, 'to', !state.showGrid);
 * 
 * These logs will help determine if the toggle function is being called
 * and if the state is being updated correctly.
 */
