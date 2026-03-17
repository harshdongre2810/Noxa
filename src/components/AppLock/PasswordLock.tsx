import React, { useState } from 'react';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';

interface PasswordLockProps {
  onComplete: (password: string) => void;
  error?: boolean;
}

export default function PasswordLock({ onComplete, error }: PasswordLockProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const theme = useStore((state) => state.theme);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-xs">
      <div className="relative w-full">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter Password"
          className={clsx(
            "w-full border-2 rounded-2xl px-6 py-4 placeholder-zinc-500 focus:outline-none transition-all",
            theme === 'light' ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-zinc-100',
            error 
              ? 'border-red-500/50 focus:border-red-500' 
              : theme === 'light' ? 'border-zinc-200 focus:border-indigo-500' : 'border-zinc-800 focus:border-indigo-500'
          )}
          autoFocus
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Shield className="w-3 h-3" />
        <span>Alphabetic passwords are more secure</span>
      </div>

      <button
        disabled={password.length < 4}
        onClick={() => onComplete(password)}
        className={clsx(
          "w-full py-4 rounded-2xl font-bold transition-all",
          password.length >= 4
            ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
            : theme === 'light' ? 'bg-zinc-200 text-zinc-400' : 'bg-zinc-800 text-zinc-500'
        )}
      >
        Unlock App
      </button>
    </div>
  );
}
