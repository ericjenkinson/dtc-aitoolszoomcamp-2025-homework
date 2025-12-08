import React, { useEffect, useState } from 'react';

export function Toast({ message, type = 'info', onClose, duration = 3000 }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Small delay to trigger animation
        setIsVisible(true);

        const timer = setTimeout(() => {
            setIsVisible(false);
            // Wait for animation to finish before calling close
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = type === 'success' ? 'var(--success-color)' :
        type === 'error' ? 'var(--danger-color)' :
            'var(--accent-color)';

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: bgColor,
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            zIndex: 2000, // Above editors and sidebars
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500'
        }}>
            {type === 'success' && <span>✓</span>}
            {type === 'error' && <span>⚠</span>}
            {message}
        </div>
    );
}
