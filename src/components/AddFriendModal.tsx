import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode, Camera, Share2, Copy, Check, UserPlus, Search } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddFriendModal({ isOpen, onClose }: AddFriendModalProps) {
  const user = useStore((state) => state.user);
  const addContact = useStore((state) => state.addContact);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'my-qr' | 'scan' | 'link'>('my-qr');
  const [copied, setCopied] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const theme = useStore((state) => state.theme);
  const profileLink = `${window.location.origin}/add/${user?.username}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (activeTab === 'scan' && isOpen) {
      setIsScanning(true);
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          setScanResult(decodedText);
          if (scanner) {
            scanner.clear().catch(console.error);
          }
          setIsScanning(false);
          handleScannedResult(decodedText);
        },
        (error) => {
          // console.warn(error);
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [activeTab, isOpen]);

  const handleScannedResult = async (text: string) => {
    // Expected format: https://.../add/username or just username
    let username = text;
    if (text.includes('/add/')) {
      username = text.split('/add/').pop() || '';
    }

    if (username) {
      try {
        const res = await fetch(`/api/users/by-username/${username}`);
        if (res.ok) {
          const userData = await res.json();
          addContact({
            id: userData.id,
            username: userData.username,
            publicKey: userData.public_key,
            displayName: userData.display_name || userData.username,
            avatarUrl: userData.avatar_url,
          });
          navigate(`/chat/${userData.id}`);
          onClose();
        } else {
          alert('User not found');
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className={clsx(
              "relative w-full max-w-md border-t sm:border rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl transition-colors duration-200",
              theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
            )}
          >
            <div className={clsx(
              "p-6 border-b flex items-center justify-between",
              theme === 'light' ? 'border-zinc-200' : 'border-zinc-800'
            )}>
              <div>
                <h3 className={clsx(
                  "text-xl font-bold",
                  theme === 'light' ? 'text-zinc-900' : 'text-white'
                )}>Add Friends</h3>
                <p className="text-sm text-zinc-500">Connect with others instantly</p>
              </div>
              <button 
                onClick={onClose}
                className={clsx(
                  "p-2 rounded-full transition-colors text-zinc-400",
                  theme === 'light' ? 'hover:bg-zinc-200' : 'hover:bg-zinc-800'
                )}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className={clsx(
              "flex border-b",
              theme === 'light' ? 'border-zinc-200' : 'border-zinc-800'
            )}>
              <button
                onClick={() => setActiveTab('my-qr')}
                className={clsx(
                  "flex-1 py-4 text-sm font-bold transition-colors relative",
                  activeTab === 'my-qr' ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                My QR
                {activeTab === 'my-qr' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />}
              </button>
              <button
                onClick={() => setActiveTab('scan')}
                className={clsx(
                  "flex-1 py-4 text-sm font-bold transition-colors relative",
                  activeTab === 'scan' ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Scan QR
                {activeTab === 'scan' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />}
              </button>
              <button
                onClick={() => setActiveTab('link')}
                className={clsx(
                  "flex-1 py-4 text-sm font-bold transition-colors relative",
                  activeTab === 'link' ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Share Link
                {activeTab === 'link' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />}
              </button>
            </div>

            <div className="p-8 min-h-[350px] flex flex-col items-center justify-center">
              {activeTab === 'my-qr' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="p-4 bg-white rounded-3xl shadow-2xl shadow-indigo-500/20">
                    <QRCodeSVG 
                      value={profileLink} 
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-center">
                    <h4 className={clsx(
                      "text-lg font-bold",
                      theme === 'light' ? 'text-zinc-900' : 'text-white'
                    )}>@{user?.username}</h4>
                    <p className="text-sm text-zinc-500">Scan this code to add me</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'scan' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full flex flex-col items-center gap-4"
                >
                  <div id="reader" className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-inner"></div>
                  {!isScanning && !scanResult && (
                    <p className="text-sm text-zinc-500">Initializing camera...</p>
                  )}
                  {scanResult && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="text-sm text-zinc-300 font-medium">Scanned successfully!</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'link' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full space-y-6"
                >
                  <div className={clsx(
                    "p-6 rounded-2xl border space-y-4",
                    theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-800/50 border-zinc-700/50'
                  )}>
                    <div className="flex items-center justify-center w-12 h-12 bg-indigo-500/20 rounded-xl mx-auto">
                      <Share2 className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="text-center">
                      <h4 className={clsx(
                        "text-lg font-bold",
                        theme === 'light' ? 'text-zinc-900' : 'text-white'
                      )}>Share Profile Link</h4>
                      <p className="text-sm text-zinc-500">Anyone with this link can add you</p>
                    </div>
                    <div className={clsx(
                      "flex items-center gap-2 p-3 rounded-xl border",
                      theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-700'
                    )}>
                      <p className="flex-1 text-xs text-zinc-400 truncate">{profileLink}</p>
                      <button 
                        onClick={handleCopyLink}
                        className={clsx(
                          "p-2 rounded-lg transition-colors text-indigo-400",
                          theme === 'light' ? 'hover:bg-zinc-200' : 'hover:bg-zinc-800'
                        )}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        Copied to Clipboard
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy Link
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
