import React, { useState } from 'react';

export default function SecurityTooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  const tooltipStyles = {
    position: 'relative',
    display: 'inline-block'
  };

  const tooltipContentStyles = {
    position: 'absolute',
    zIndex: 1000,
    backgroundColor: '#1a2332',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '500',
    lineHeight: '1.4',
    maxWidth: '300px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #E1E4E8',
    ...(position === 'top' ? {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: '8px'
    } : position === 'bottom' ? {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '8px'
    } : position === 'left' ? {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: '8px'
    } : {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: '8px'
    }),
    opacity: isVisible ? 1 : 0,
    visibility: isVisible ? 'visible' : 'hidden',
    transition: 'opacity 0.2s ease, visibility 0.2s ease'
  };

  const arrowStyles = {
    position: 'absolute',
    width: 0,
    height: 0,
    ...(position === 'top' ? {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      borderTop: '6px solid #1a2332'
    } : position === 'bottom' ? {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      borderBottom: '6px solid #1a2332'
    } : position === 'left' ? {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
      borderLeft: '6px solid #1a2332'
    } : {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
      borderRight: '6px solid #1a2332'
    })
  };

  return (
    <div
      style={tooltipStyles}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <div style={tooltipContentStyles}>
        <div style={arrowStyles}></div>
        {content}
      </div>
    </div>
  );
}
