import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/tailwind.css';

console.log('Renderer process starting...');

const container = document.getElementById('root');
if (!container) {
  console.error('Root container not found!');
} else {
  console.log('Root container found, creating React app...');
  const root = createRoot(container);
  root.render(<App />);
  console.log('React app rendered successfully');
}
