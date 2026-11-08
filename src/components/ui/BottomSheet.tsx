'use client';

import React, { useEffect, useId } from 'react';
import './BottomSheet.css';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Sheets can be stacked (consent banner + settings). Track them so body scroll
// is restored only after the last closes, and Escape only closes the top one.
const openSheets: string[] = [];

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const sheetId = useId();
  const titleId = `${sheetId}-title`;

  useEffect(() => {
    if (!isOpen) return;

    openSheets.push(sheetId);
    document.body.style.overflow = 'hidden';

    return () => {
      const index = openSheets.indexOf(sheetId);
      if (index !== -1) openSheets.splice(index, 1);
      if (openSheets.length === 0) document.body.style.overflow = '';
    };
  }, [isOpen, sheetId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (openSheets[openSheets.length - 1] !== sheetId) return;
      onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, sheetId]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="bottom-sheet-overlay" onClick={handleOverlayClick}>
      <div
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="bottom-sheet-drag-handle" />
        <div className="bottom-sheet-header">
          <h2 id={titleId}>{title}</h2>
          <button
            className="bottom-sheet-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="bottom-sheet-body">{children}</div>
      </div>
    </div>
  );
};

export default BottomSheet;
