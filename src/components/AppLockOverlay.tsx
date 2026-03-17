import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Lock, Fingerprint, ShieldCheck } from 'lucide-react';
import PinLock from './AppLock/PinLock';
import PatternLock from './AppLock/PatternLock';
import PasswordLock from './AppLock/PasswordLock';
import clsx from 'clsx';

export default function AppLockOverlay({ children }: { children: React.ReactNode }) {
  const appLock = useStore((state) => state.appLock);
  const isAppUnlocked = useStore((state) => state.isAppUnlocked);
  const setAppUnlocked = useStore((state) => state.setAppUnlocked);
  const user = useStore((state) => state.user);
  
  const theme = useStore((state) => state.theme);
  const [error, setError] = useState(false);
  const [isBiometricPrompting, setIsBiometricPrompting] = useState(false);

  const handleUnlock = (secret: string) => {
    if (secret === appLock.secret) {
      setAppUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  const handleBiometric = async () => {
    if (appLock.biometricEnabled) {
      setIsBiometricPrompting(true);
      try {
        // In a real app, we'd use WebAuthn:
        // await navigator.credentials.get({ ... });
        
        // For this demo, we'll simulate a successful biometric check with a realistic delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        setAppUnlocked(true);
      } catch (err) {
        console.error('Biometric failed', err);
      } finally {
        setIsBiometricPrompting(false);
      }
    }
  };

  useEffect(() => {
    if (appLock.enabled && appLock.biometricEnabled && !isAppUnlocked) {
      handleBiometric();
    }
  }, []);

  // If lock is disabled or no user is logged in, don't show overlay
  if (!appLock.enabled || !user) {
    return <>{children}</>;
  }

  return (
    <>
      <AnimatePresence>
        {!isAppUnlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={clsx(
              "fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 transition-colors duration-200",
              theme === 'light' ? 'bg-zinc-50 text-zinc-900' : 'bg-black text-white'
            )}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-8 relative">
                <Lock className="w-10 h-10 text-white" />
                {isBiometricPrompting && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 bg-indigo-600 rounded-3xl flex items-center justify-center"
                  >
                    <Fingerprint className="w-10 h-10 text-white animate-pulse" />
                  </motion.div>
                )}
              </div>
              
              <h2 className={clsx(
                "text-2xl font-bold mb-2",
                theme === 'light' ? 'text-zinc-900' : 'text-white'
              )}>
                {isBiometricPrompting ? 'Authenticating...' : 'App Locked'}
              </h2>
              <p className="text-zinc-500 text-sm mb-12">
                {isBiometricPrompting 
                  ? 'Verifying your identity via biometrics' 
                  : `Enter your ${appLock.type} to continue`}
              </p>

              {!isBiometricPrompting && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full mb-8"
                >
                  {appLock.type === 'pin' && (
                    <PinLock onComplete={handleUnlock} error={error} />
                  )}
                  {appLock.type === 'pattern' && (
                    <PatternLock onComplete={handleUnlock} error={error} />
                  )}
                  {appLock.type === 'alphabetic' && (
                    <PasswordLock onComplete={handleUnlock} error={error} />
                  )}
                </motion.div>
              )}

              {appLock.biometricEnabled && !isBiometricPrompting && (
                <button
                  onClick={handleBiometric}
                  className="flex flex-col items-center gap-2 text-zinc-400 hover:text-indigo-400 transition-colors"
                >
                  <Fingerprint className="w-10 h-10" />
                  <span className="text-xs font-bold uppercase tracking-widest">Retry Biometrics</span>
                </button>
              )}
            </motion.div>

            <div className="absolute bottom-8 flex items-center gap-2 text-zinc-600">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Protected by NOXA Security</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
