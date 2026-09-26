import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsRight, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

/**
 * SwipeToConfirm Component
 * Slider button requiring user to swipe from left to right to trigger confirmation.
 * Prevents accidental clicks in high-tempo POS / cashier environments.
 */
export default function SwipeToConfirm({
  onConfirm,
  loading = false,
  disabled = false,
  text = 'Geser untuk Verifikasi (Serahkan Pesanan)',
  loadingText = 'Memverifikasi Pengambilan...',
  successText = 'Pengambilan Berhasil!',
  resetTrigger = null,
  className = ''
}) {
  const containerRef = useRef(null);
  const thumbRef = useRef(null);

  const [dragX, setDragX] = useState(0);
  const [maxDrag, setMaxDrag] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const startXRef = useRef(0);

  // Measure max draggable distance
  const updateDimensions = useCallback(() => {
    if (containerRef.current && thumbRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const thumbWidth = thumbRef.current.clientWidth;
      // padding is 4px on each side (p-1 = 4px)
      const available = Math.max(0, containerWidth - thumbWidth - 8);
      setMaxDrag(available);
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  // Reset when error or external trigger changes
  useEffect(() => {
    if (resetTrigger !== null) {
      setDragX(0);
      setIsConfirmed(false);
    }
  }, [resetTrigger]);

  // If loading becomes false and not confirmed, reset
  useEffect(() => {
    if (!loading && isConfirmed && resetTrigger) {
      setDragX(0);
      setIsConfirmed(false);
    }
  }, [loading, isConfirmed, resetTrigger]);

  const handlePointerDown = (e) => {
    if (disabled || loading || isConfirmed) return;
    updateDimensions();
    setIsDragging(true);
    startXRef.current = e.clientX - dragX;
    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging || isConfirmed) return;
    const currentX = e.clientX - startXRef.current;
    const clampedX = Math.max(0, Math.min(maxDrag, currentX));
    setDragX(clampedX);
  };

  const handlePointerEnd = (e) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (e.currentTarget.releasePointerCapture) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    // Threshold: 88% of max drag
    const threshold = maxDrag * 0.88;
    if (dragX >= threshold && maxDrag > 0) {
      // Snapped to full
      setDragX(maxDrag);
      setIsConfirmed(true);

      // Tactile haptic feedback on mobile devices
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 50, 40]);
        } catch (_) {}
      }

      if (onConfirm) {
        onConfirm();
      }
    } else {
      // Snap back smoothly
      setDragX(0);
    }
  };

  const progress = maxDrag > 0 ? Math.min(1, dragX / maxDrag) : 0;

  return (
    <div
      ref={containerRef}
      className={`relative h-13 rounded-2xl overflow-hidden select-none border-2 transition-all p-1 flex items-center ${
        disabled
          ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
          : isConfirmed || loading
          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
          : 'bg-emerald-50/80 border-emerald-400/40 hover:border-emerald-500/60 shadow-xs'
      } ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Green fill progress track */}
      {!isConfirmed && !loading && (
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl pointer-events-none"
          style={{
            width: `${dragX + (thumbRef.current?.clientWidth || 44) + 4}px`,
            transition: isDragging ? 'none' : 'width 0.25s ease-out'
          }}
        />
      )}

      {/* Center Text Labels */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-12 text-center">
        {loading ? (
          <div className="flex items-center gap-2 font-bold text-xs tracking-wide text-white animate-pulse">
            <Loader2 size={16} className="animate-spin" />
            <span>{loadingText}</span>
          </div>
        ) : isConfirmed ? (
          <div className="flex items-center gap-2 font-bold text-xs tracking-wide text-white">
            <CheckCircle2 size={16} />
            <span>{successText}</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1 font-bold text-xs tracking-wide text-emerald-900 transition-opacity duration-150"
            style={{ opacity: Math.max(0, 1 - progress * 1.6) }}
          >
            <span>{text}</span>
            <ChevronsRight size={16} className="text-emerald-700 animate-pulse ml-0.5" />
          </div>
        )}
      </div>

      {/* Swipe Thumb Button */}
      <div
        ref={thumbRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className={`relative z-20 h-11 w-11 rounded-xl flex items-center justify-center transition-shadow ${
          disabled
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : isConfirmed || loading
            ? 'bg-white text-emerald-600 shadow-md'
            : isDragging
            ? 'bg-white text-emerald-600 shadow-lg scale-105 cursor-grabbing ring-4 ring-emerald-300/40'
            : 'bg-white text-emerald-600 shadow-md hover:shadow-lg cursor-grab hover:scale-[1.02]'
        }`}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
          touchAction: 'none'
        }}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin text-emerald-600" />
        ) : isConfirmed ? (
          <CheckCircle2 size={20} className="text-emerald-600" />
        ) : (
          <ArrowRight
            size={18}
            className={`transition-transform duration-150 ${
              isDragging ? 'translate-x-0.5' : ''
            }`}
          />
        )}
      </div>
    </div>
  );
}
