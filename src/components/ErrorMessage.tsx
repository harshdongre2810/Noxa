import React from 'react';
import { ShieldAlert, AlertCircle, WifiOff, Lock, UserX, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

export type ErrorType = 'auth' | 'connection' | 'permission' | 'validation' | 'not_found' | 'general';

interface ErrorMessageProps {
  message: string;
  type?: ErrorType;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorMessage({ message, type = 'general', onRetry, className }: ErrorMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'auth':
        return <Lock className="w-5 h-5" />;
      case 'connection':
        return <WifiOff className="w-5 h-5" />;
      case 'permission':
        return <ShieldAlert className="w-5 h-5" />;
      case 'validation':
        return <AlertCircle className="w-5 h-5" />;
      case 'not_found':
        return <UserX className="w-5 h-5" />;
      default:
        return <XCircle className="w-5 h-5" />;
    }
  };

  const getFriendlyMessage = () => {
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return "We're having trouble connecting to the server. Please check your internet connection.";
    }
    if (message.includes('Invalid username or password')) {
      return "The username or password you entered doesn't match our records. Please try again.";
    }
    if (message.includes('Username already taken')) {
      return "That username is already claimed. Try adding some numbers or underscores!";
    }
    if (message.includes('permission denied')) {
      return "Access denied. Please check your permissions in settings.";
    }
    return message;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={clsx(
        "bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm flex items-start gap-3 shadow-lg shadow-rose-500/5",
        className
      )}
    >
      <div className="mt-0.5 flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1 space-y-2">
        <p className="font-medium leading-relaxed">
          {getFriendlyMessage()}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-bold uppercase tracking-widest text-rose-300 hover:text-rose-200 transition-colors flex items-center gap-1.5"
          >
            Try Again
          </button>
        )}
      </div>
    </motion.div>
  );
}
