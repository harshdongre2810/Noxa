import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useStore } from '../../store/useStore';

interface PatternLockProps {
  onComplete: (pattern: string) => void;
  error?: boolean;
}

export default function PatternLock({ onComplete, error }: PatternLockProps) {
  const [activeNodes, setActiveNodes] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useStore((state) => state.theme);

  const nodes = Array.from({ length: 9 }, (_, i) => i);

  const getRelativePos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setActiveNodes([]);
    setMousePos(getRelativePos(e));
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!isDrawing) return;
    const pos = getRelativePos(e);
    setMousePos(pos);

    // Check if near any node
    nodes.forEach((node) => {
      const nodeEl = containerRef.current?.querySelector(`[data-node="${node}"]`);
      if (nodeEl) {
        const rect = nodeEl.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        const centerX = rect.left - containerRect.left + rect.width / 2;
        const centerY = rect.top - containerRect.top + rect.height / 2;
        const dist = Math.sqrt(Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2));

        if (dist < 25 && !activeNodes.includes(node)) {
          setActiveNodes((prev) => [...prev, node]);
        }
      }
    });
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (activeNodes.length > 0) {
      onComplete(activeNodes.join(''));
    }
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => handleMove(e);
    const handleGlobalEnd = () => handleEnd();

    if (isDrawing) {
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalEnd);
      window.addEventListener('touchmove', handleGlobalMove);
      window.addEventListener('touchend', handleGlobalEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDrawing, activeNodes]);

  return (
    <div 
      ref={containerRef}
      className="relative w-72 h-72 grid grid-cols-3 gap-8 p-4 touch-none select-none"
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      {nodes.map((node) => (
        <div
          key={node}
          data-node={node}
          className="relative flex items-center justify-center"
        >
          <div className={`w-4 h-4 rounded-full transition-colors duration-200 ${
            activeNodes.includes(node) 
              ? error ? 'bg-red-500' : 'bg-indigo-500' 
              : theme === 'light' ? 'bg-zinc-200' : 'bg-zinc-700'
          }`} />
          {activeNodes.includes(node) && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute w-12 h-12 rounded-full border-2 ${
                error ? 'border-red-500/30 bg-red-500/10' : 'border-indigo-500/30 bg-indigo-500/10'
              }`}
            />
          )}
        </div>
      ))}

      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        <g>
          {activeNodes.map((node, i) => {
            if (i === 0) return null;
            const prevNode = activeNodes[i - 1];
            const start = containerRef.current?.querySelector(`[data-node="${prevNode}"]`)?.getBoundingClientRect();
            const end = containerRef.current?.querySelector(`[data-node="${node}"]`)?.getBoundingClientRect();
            const container = containerRef.current?.getBoundingClientRect();

            if (!start || !end || !container) return null;

            return (
              <line
                key={`${prevNode}-${node}`}
                x1={start.left - container.left + start.width / 2}
                y1={start.top - container.top + start.height / 2}
                x2={end.left - container.left + end.width / 2}
                y2={end.top - container.top + end.height / 2}
                stroke={error ? '#ef4444' : '#6366f1'}
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.6"
              />
            );
          })}
          {isDrawing && activeNodes.length > 0 && (
            (() => {
              const lastNode = activeNodes[activeNodes.length - 1];
              const start = containerRef.current?.querySelector(`[data-node="${lastNode}"]`)?.getBoundingClientRect();
              const container = containerRef.current?.getBoundingClientRect();
              if (!start || !container) return null;

              return (
                <line
                  x1={start.left - container.left + start.width / 2}
                  y1={start.top - container.top + start.height / 2}
                  x2={mousePos.x}
                  y2={mousePos.y}
                  stroke={error ? '#ef4444' : '#6366f1'}
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.4"
                />
              );
            })()
          )}
        </g>
      </svg>
    </div>
  );
}
