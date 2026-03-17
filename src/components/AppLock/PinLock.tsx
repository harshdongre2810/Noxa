import React, { useState } from 'react';
import { Delete, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';

interface PinLockProps {
  onComplete: (pin: string) => void;
  error?: boolean;
}

export default function PinLock({ onComplete, error }: PinLockProps) {
  const [pin, setPin] = useState('');
  const theme = useStore((state) => state.theme);

  const handleNumber = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4 || newPin.length === 6) {
        // We allow 4 or 6 digit pins, but for setup we might want to be explicit.
        // For now, let's just use a "Confirm" button or auto-complete at 6.
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex gap-4 h-12 items-center">
        <AnimatePresence mode="popLayout">
          {Array.from({ length: Math.max(pin.length, 4) }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`w-4 h-4 rounded-full border-2 transition-colors duration-200 ${
                i < pin.length 
                  ? error ? 'bg-red-500 border-red-500' : 'bg-indigo-500 border-indigo-500'
                  : 'border-zinc-700'
              }`}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumber(num.toString())}
            className={clsx(
              "w-16 h-16 rounded-full text-2xl font-bold transition-colors flex items-center justify-center border",
              theme === 'light' 
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200' 
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-zinc-800'
            )}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => setPin('')}
          className="w-16 h-16 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <button
          onClick={() => handleNumber('0')}
          className={clsx(
            "w-16 h-16 rounded-full text-2xl font-bold transition-colors flex items-center justify-center border",
            theme === 'light' 
              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200' 
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-zinc-800'
          )}
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      <button
        disabled={pin.length < 4}
        onClick={() => onComplete(pin)}
        className={clsx(
          "w-full py-4 rounded-2xl font-bold transition-all",
          pin.length >= 4
            ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
            : theme === 'light' ? 'bg-zinc-200 text-zinc-400' : 'bg-zinc-800 text-zinc-500'
        )}
      >
        Confirm PIN
      </button>
    </div>
  );
}
