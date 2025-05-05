import React from 'react';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './components/ThemeContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}

export default App;