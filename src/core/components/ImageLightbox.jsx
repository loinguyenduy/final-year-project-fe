import React, { useEffect } from 'react';

const ImageLightbox = ({ src, onClose }) => {
    // Close on Escape key
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    if (!src) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'zoom-out',
                padding: '1rem',
            }}
        >
            <img
                src={src}
                alt="Preview"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '90vw', maxHeight: '90vh',
                    borderRadius: '8px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                    objectFit: 'contain',
                    cursor: 'default',
                }}
            />
            <button
                onClick={onClose}
                style={{
                    position: 'fixed', top: '1rem', right: '1.25rem',
                    background: 'rgba(255,255,255,0.15)', border: 'none',
                    color: 'white', fontSize: '1.5rem', fontWeight: 'bold',
                    width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', lineHeight: 1,
                }}
                aria-label="Close"
            >
                ×
            </button>
        </div>
    );
};

export default ImageLightbox;
