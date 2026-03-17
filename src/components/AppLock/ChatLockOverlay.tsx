import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../store/useStore';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import PatternLock from './PatternLock';
import PinLock from './PinLock';
import PasswordLock from './PasswordLock';
import clsx from 'clsx';

interface ChatLockOverlayProps {
  contactId: string;
}

export default function ChatLockOverlay({ contactId }: ChatLockOverlayProps) {
  const { contacts, unlockedChats, setChatUnlocked, theme } = useStore();
  const [error, setError] = useState(false);
  
  const contact = contacts[contactId];
  const isUnlocked = unlockedChats[contactId];

  // If chat is not locked or already unlocked, don't show anything
  if (!contact?.isLocked || isUnlocked) return null;

  const handleUnlock = (secret: string) => {
    if (secret === contact.lockSecret) {
      setChatUnlocked(contactId, true);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={clsx(
          "absolute inset-0 z-[9999] flex flex-col items-center justify-center p-6 transition-colors duration-200",
          theme === 'light' ? 'bg-zinc-50 text-zinc-900' : 'bg-black text-white'
        )}
      >
        <div className="w-full max-w-md flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="mb-12"
          >
            <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/20">
              <Lock className="w-10 h-10 text-indigo-500" />
            </div>
            <h1 className={clsx(
              "text-3xl font-bold mb-2",
              theme === 'light' ? 'text-zinc-900' : 'text-white'
            )}>Chat Locked</h1>
            <p className="text-zinc-400">Unlock to view messages with {contact.customName || contact.displayName || contact.username}</p>
          </motion.div>

          <div className="w-full flex flex-col items-center">
            {contact.lockType === 'pattern' && (
              <PatternLock onComplete={handleUnlock} error={error} />
            )}
            {contact.lockType === 'pin' && (
              <PinLock onComplete={handleUnlock} error={error} />
            )}
            {contact.lockType === 'alphabetic' && (
              <PasswordLock onComplete={handleUnlock} error={error} />
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex items-center gap-2 text-red-500 text-sm font-medium"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Incorrect {contact.lockType === 'alphabetic' ? 'Password' : contact.lockType?.toUpperCase()}</span>
            </motion.div>
          )}

          <div className="mt-auto pt-12 text-zinc-600 flex items-center gap-2 text-xs">
            <Shield className="w-3 h-3" />
            <span>End-to-end encrypted security</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
