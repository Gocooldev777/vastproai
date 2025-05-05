import React from 'react';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import './ChartCard.css';

function ChartCard({ title, children, isExpanded, onToggleExpand }) {
  return (
    <div className={`chart-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="chart-header">
        <h3>{title}</h3>
        <button 
          className="expand-button" 
          onClick={onToggleExpand}
          aria-label={isExpanded ? "Minimize chart" : "Maximize chart"}
        >
          {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
        </button>
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );
}

export default ChartCard; 