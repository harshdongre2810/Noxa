import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, User, Shield, Key, Palette, LogOut, Github, ChevronRight, EyeOff, Bell, Lock, Camera, Check, Save, X, Upload, Users, Edit2, Trash2, ShieldCheck, UserPlus, RefreshCw, Download, Fingerprint, Ban, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import ErrorMessage from '../components/ErrorMessage';
import { AppLockType, User as UserType } from '../store/useStore';
import PatternLock from '../components/AppLock/PatternLock';
import PinLock from '../components/AppLock/PinLock';
import PasswordLock from '../components/AppLock/PasswordLock';

export default function Settings() {
  const user = useStore((state) => state.user);
  const accounts = useStore((state) => state.accounts);
  const theme = useStore((state) => state.theme);
  const privacySettings = useStore((state) => state.privacySettings);
  const contacts = useStore((state) => state.contacts);
  const blockedUsers = useStore((state) => state.blockedUsers);
  const appLock = useStore((state) => state.appLock);
  
  const setTheme = useStore((state) => state.setTheme);
  const setUser = useStore((state) => state.setUser);
  const switchAccount = useStore((state) => state.switchAccount);
  const removeAccount = useStore((state) => state.removeAccount);
  const addAccount = useStore((state) => state.addAccount);
  const unblockUser = useStore((state) => state.unblockUser);
  const setAppLock = useStore((state) => state.setAppLock);
  const setPrivacySettings = useStore((state) => state.setPrivacySettings);
  const updateContact = useStore((state) => state.updateContact);
  const navigate = useNavigate();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [noxaId, setNoxaId] = useState(user?.noxaId || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactNickname, setContactNickname] = useState('');
  
  // New states for requested features
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showAppLockSettings, setShowAppLockSettings] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccountUsername, setNewAccountUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const contactList = Object.values(contacts);

  const handleSaveNickname = (id: string) => {
    updateContact(id, { customName: contactNickname.trim() || undefined });
    setEditingContactId(null);
  };

  const predefinedAvatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Buster',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel',
  ];

  const handleLogout = () => {
    if (user) {
      removeAccount(user.id);
    }
    navigate('/intro');
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletePassword) return;
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      
      removeAccount(user.id);
      navigate('/intro');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || passwords.new !== passwords.confirm) {
      setError('Passwords do not match');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: user.id, 
          currentPassword: passwords.current, 
          newPassword: passwords.new 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      
      setSuccess('Password updated successfully');
      setShowChangePassword(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [lockSetup, setLockSetup] = useState<{
    step: 'entry' | 'confirm';
    tempSecret: string;
    error: string | null;
  }>({
    step: 'entry',
    tempSecret: '',
    error: null
  });

  useEffect(() => {
    if (window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setIsBiometricSupported(available))
        .catch(() => setIsBiometricSupported(false));
    }
  }, []);

  const handleBackupAccount = () => {
    if (!user) return;
    try {
      const backupData = JSON.stringify({
        version: '1.0.0',
        timestamp: '2026-03-02T20:31:03-08:00',
        user: {
          id: user.id,
          username: user.username,
          publicKey: user.publicKey,
          privateKey: user.privateKey,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        contacts: Object.values(contacts),
        groups: Object.values(useStore.getState().groups),
        messages: useStore.getState().messages,
        blockedUsers: useStore.getState().blockedUsers,
        appLock: useStore.getState().appLock,
        privacySettings: useStore.getState().privacySettings,
        theme: useStore.getState().theme,
      }, null, 2);
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `noxa_vault_${user.username}_2026-03-02.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Backup downloaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to generate backup');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRestoreAccount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (!data.user || !data.contacts || !data.messages) {
          throw new Error('Invalid backup file format');
        }

        useStore.setState((state) => ({
          ...state,
          user: data.user,
          contacts: (data.contacts as any[]).reduce((acc: any, c: any) => ({ ...acc, [c.id]: c }), {}),
          groups: (data.groups as any[]).reduce((acc: any, g: any) => ({ ...acc, [g.id]: g }), {}),
          messages: data.messages,
          blockedUsers: data.blockedUsers || [],
          appLock: data.appLock || state.appLock,
          privacySettings: data.privacySettings || state.privacySettings,
          theme: data.theme || state.theme,
        }));

        setSuccess('Account restored successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to restore backup: ' + (err as Error).message);
        setTimeout(() => setError(''), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          displayName,
          avatarUrl,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setUser({ ...user, displayName, avatarUrl, noxaId });
        setIsEditingProfile(false);
      }
    } catch (err) {
      console.error('Update failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      setShowAvatarPicker(false);
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <div className={clsx(
      "flex-1 flex flex-col h-full relative overflow-y-auto transition-colors duration-200",
      theme === 'light' ? 'bg-zinc-50 text-zinc-900' : 'bg-black text-white'
    )}>
      <div className="px-4 py-4 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/50 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate('/home')} className="p-2 -ml-2 hover:bg-zinc-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="p-6 space-y-8 pb-24">
        {/* Global Notifications */}
        <AnimatePresence>
          {(success || error) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">{success}</span>
                </div>
              )}
              {error && (
                <ErrorMessage 
                  message={error} 
                  type={error.includes('Password') || error.includes('password') ? 'auth' : 'general'} 
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Section */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <button 
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="text-xs font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
            >
              {isEditingProfile ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="relative group mb-4">
              <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center text-4xl font-bold shadow-xl shadow-indigo-500/20 overflow-hidden border-4 border-zinc-900">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              {isEditingProfile && (
                <button 
                  onClick={() => setShowAvatarPicker(true)}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-zinc-900 hover:bg-indigo-500 transition-colors shadow-lg"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <div className="w-full space-y-4 max-w-xs">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                    placeholder="Display Name"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Noxa ID (Anonymous)</label>
                  <input
                    type="text"
                    value={noxaId}
                    onChange={(e) => setNoxaId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                    placeholder="Enter anonymous ID..."
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-zinc-100">{user.displayName || user.username}</h2>
                <p className="text-sm text-zinc-500 font-mono mt-1">@{user.username}</p>
              </>
            )}
          </div>
        </div>

        {/* Settings Groups */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2">Account Management</h3>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setShowAccountSwitcher(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50"
              >
                <div className="flex items-center gap-3 text-zinc-300">
                  <RefreshCw className="w-5 h-5 text-indigo-400" />
                  <div className="flex flex-col text-left">
                    <span className="font-medium">Switch Account</span>
                    <span className="text-[10px] text-zinc-500">Manage multiple identities</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">{accounts.length} active</span>
                  <ChevronRight className="w-5 h-5 text-zinc-600" />
                </div>
              </button>
              
              <button 
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50"
              >
                <div className="flex items-center gap-3 text-zinc-300">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <span className="font-medium">Change Password</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </button>

              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors text-rose-400"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5" />
                  <span className="font-medium">Delete Account</span>
                </div>
                <ChevronRight className="w-5 h-5 opacity-50" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2">Data & Storage</h3>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
              <button 
                onClick={handleBackupAccount}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50"
              >
                <div className="flex items-center gap-3 text-zinc-300">
                  <Download className="w-5 h-5 text-emerald-400" />
                  <div className="flex flex-col text-left">
                    <span className="font-medium">Backup Account</span>
                    <span className="text-[10px] text-zinc-500">Download your profile, contacts, and messages</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </button>
              
              <label className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <div className="flex flex-col text-left">
                    <span className="font-medium">Restore Account</span>
                    <span className="text-[10px] text-zinc-500">Import data from a backup JSON file</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleRestoreAccount}
                />
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2">Privacy & Security</h3>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setShowAppLockSettings(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50"
              >
                <div className="flex items-center gap-3 text-zinc-300">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <div className="flex flex-col text-left">
                    <span className="font-medium">App Lock</span>
                    <span className="text-[10px] text-zinc-500">{appLock.enabled ? `Enabled (${appLock.type})` : 'Disabled'}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </button>

              <div className="w-full flex items-center justify-between p-4 border-b border-zinc-800/50">
                <div className="flex items-center gap-3 text-zinc-300">
                  <EyeOff className="w-5 h-5 text-indigo-400" />
                  <div className="flex flex-col">
                    <span className="font-medium">Ghost Mode</span>
                    <span className="text-[10px] text-zinc-500">Read messages without seen status</span>
                  </div>
                </div>
                <button 
                  onClick={() => setPrivacySettings({ ghostMode: !privacySettings.ghostMode })}
                  className={clsx(
                    "w-10 h-6 rounded-full relative transition-colors duration-200",
                    privacySettings.ghostMode ? "bg-indigo-600" : "bg-zinc-700"
                  )}
                >
                  <motion.div 
                    animate={{ x: privacySettings.ghostMode ? 18 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                  />
                </button>
              </div>
              <div className="w-full flex items-center justify-between p-4 border-b border-zinc-800/50">
                <div className="flex items-center gap-3 text-zinc-300">
                  <EyeOff className="w-5 h-5 text-rose-400" />
                  <div className="flex flex-col">
                    <span className="font-medium">Screenshot Detection</span>
                    <span className="text-[10px] text-zinc-500">Alerts you when screenshots are taken</span>
                  </div>
                </div>
                <button 
                  onClick={() => setPrivacySettings({ screenshotDetection: !privacySettings.screenshotDetection })}
                  className={clsx(
                    "w-10 h-6 rounded-full relative transition-colors duration-200",
                    privacySettings.screenshotDetection ? "bg-indigo-600" : "bg-zinc-700"
                  )}
                >
                  <motion.div 
                    animate={{ x: privacySettings.screenshotDetection ? 18 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                  />
                </button>
              </div>
              <div className="w-full flex items-center justify-between p-4">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Bell className="w-5 h-5 text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="font-medium">Last Seen</span>
                    <span className="text-[10px] text-zinc-500">Show when you were last active</span>
                  </div>
                </div>
                <button 
                  onClick={() => setPrivacySettings({ lastSeen: !privacySettings.lastSeen })}
                  className={clsx(
                    "w-10 h-6 rounded-full relative transition-colors duration-200",
                    privacySettings.lastSeen ? "bg-indigo-600" : "bg-zinc-700"
                  )}
                >
                  <motion.div 
                    animate={{ x: privacySettings.lastSeen ? 18 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2">Manage Contacts</h3>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
              {contactList.length > 0 ? (
                contactList.map((contact) => (
                  <div key={contact.id} className="p-4 border-b border-zinc-800/50 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden border border-zinc-700">
                          {contact.avatarUrl ? (
                            <img src={contact.avatarUrl} alt={contact.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            contact.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-100">
                              {contact.customName || contact.displayName || contact.username}
                            </span>
                            {contact.customName && (
                              <span className="text-[10px] text-zinc-500 font-mono">(@{contact.username})</span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                            {contact.customName ? 'Nickname Set' : 'No Nickname'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setEditingContactId(contact.id);
                          setContactNickname(contact.customName || '');
                        }}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-indigo-400"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    <AnimatePresence>
                      {editingContactId === contact.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-zinc-800/50"
                        >
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={contactNickname}
                              onChange={(e) => setContactNickname(e.target.value)}
                              placeholder="Enter nickname..."
                              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveNickname(contact.id)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingContactId(null)}
                              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold rounded-xl transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">No contacts found</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2">Manage Block List</h3>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
              {blockedUsers.length > 0 ? (
                blockedUsers.map((blockedId) => {
                  const contact = contacts[blockedId];
                  return (
                    <div 
                      key={blockedId} 
                      onClick={() => unblockUser(blockedId)}
                      className="p-4 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden border border-zinc-700 group-hover:border-indigo-500/50 transition-colors">
                            {contact?.avatarUrl ? (
                              <img src={contact.avatarUrl} alt={contact.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                                <User className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-100 group-hover:text-indigo-400 transition-colors">{contact?.customName || contact?.displayName || contact?.username || 'Blocked User'}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">@{contact?.username || blockedId.substring(0, 8) + '...'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest group-hover:text-rose-500 transition-colors">Tap to Unblock</span>
                          <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-rose-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <Ban className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">No blocked users</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2">Appearance</h3>
            <div className={clsx(
              "border rounded-2xl overflow-hidden transition-colors",
              theme === 'light' ? "bg-white border-zinc-200" : "bg-zinc-900/50 border-zinc-800/50"
            )}>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Palette className={clsx("w-5 h-5", theme === 'light' ? "text-indigo-600" : "text-purple-400")} />
                  <div className="flex flex-col">
                    <span className={clsx("font-medium", theme === 'light' ? "text-zinc-900" : "text-zinc-300")}>Dark Mode</span>
                    <span className="text-[10px] text-zinc-500">AMOLED black friendly</span>
                  </div>
                </div>
                <button 
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className={clsx(
                    "w-10 h-6 rounded-full relative transition-colors duration-200",
                    theme !== 'light' ? "bg-indigo-600" : "bg-zinc-300"
                  )}
                >
                  <motion.div 
                    animate={{ x: theme !== 'light' ? 18 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2">Security</h3>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setShowRecovery(!showRecovery)}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 text-zinc-300">
                  <Key className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">View Recovery Key</span>
                </div>
                <ChevronRight className={clsx("w-5 h-5 text-zinc-600 transition-transform", showRecovery && "rotate-90")} />
              </button>
              <AnimatePresence>
                {showRecovery && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 overflow-hidden"
                  >
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-center">
                      <p className="text-[10px] text-amber-500 mb-2 font-bold uppercase tracking-widest">Keep this private</p>
                      <p className="font-mono text-sm text-zinc-300 select-all blur-md hover:blur-none transition-all duration-500 cursor-pointer p-2 bg-zinc-900/50 rounded-lg">
                        {user.id.split('-').join(' ')} {user.username} recovery key placeholder
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 mt-8 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-colors font-bold text-sm uppercase tracking-widest"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </div>

      {/* Account Switcher Modal */}
      <AnimatePresence>
        {showAccountSwitcher && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowAccountSwitcher(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-lg bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Switch Account</h3>
                  <p className="text-sm text-zinc-500">Manage your identities</p>
                </div>
                <button onClick={() => setShowAccountSwitcher(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      switchAccount(acc.id);
                      setShowAccountSwitcher(false);
                    }}
                    className={clsx(
                      "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                      user.id === acc.id 
                        ? "bg-indigo-600/10 border-indigo-500/50" 
                        : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden border border-zinc-700">
                        {acc.avatarUrl ? (
                          <img src={acc.avatarUrl} alt={acc.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          acc.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white">{acc.displayName || acc.username}</p>
                        <p className="text-xs text-zinc-500 font-mono">@{acc.username}</p>
                      </div>
                    </div>
                    {user.id === acc.id && (
                      <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}

                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 border-dashed hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                    <UserPlus className="w-6 h-6 text-zinc-500 group-hover:text-indigo-400" />
                  </div>
                  <span className="font-bold text-zinc-400 group-hover:text-indigo-400">Add New Account</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePassword && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowChangePassword(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-2">Change Password</h3>
              <p className="text-sm text-zinc-500 mb-6">Update your account security</p>

              <div className="space-y-4">
                {error && <p className="text-xs text-rose-500 bg-rose-500/10 p-3 rounded-xl">{error}</p>}
                {success && <p className="text-xs text-emerald-500 bg-emerald-500/10 p-3 rounded-xl">{success}</p>}
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Current Password</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">New Password</label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowChangePassword(false)}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={isSaving}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                  >
                    {isSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-6"
            >
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Delete Identity?</h3>
              <p className="text-sm text-zinc-500 text-center mb-6">
                This action is permanent. All your messages and contacts will be lost forever.
              </p>

              <div className="space-y-4">
                {error && <p className="text-xs text-rose-500 bg-rose-500/10 p-3 rounded-xl">{error}</p>}
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Confirm Password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    placeholder="Type your password to confirm"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isSaving || !deletePassword}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-rose-600/20"
                  >
                    {isSaving ? 'Deleting...' : 'Delete Forever'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App Lock Settings Modal */}
      <AnimatePresence>
        {showAppLockSettings && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowAppLockSettings(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-lg bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">App Lock</h3>
                  <p className="text-sm text-zinc-500">Secure your entire application</p>
                </div>
                <button onClick={() => setShowAppLockSettings(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-zinc-300">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <span className="font-medium">Enable App Lock</span>
                  </div>
                  <button 
                    onClick={() => setAppLock({ enabled: !appLock.enabled })}
                    className={clsx(
                      "w-10 h-6 rounded-full relative transition-colors duration-200",
                      appLock.enabled ? "bg-indigo-600" : "bg-zinc-700"
                    )}
                  >
                    <motion.div 
                      animate={{ x: appLock.enabled ? 18 : 2 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                    />
                  </button>
                </div>

                {appLock.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 pt-4 border-t border-zinc-800"
                  >
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Lock Type</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {(['pin', 'pattern', 'alphabetic'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setAppLock({ type, secret: '' });
                              setLockSetup({ step: 'entry', tempSecret: '', error: null });
                            }}
                            className={clsx(
                              "p-4 rounded-2xl border text-sm font-bold capitalize transition-all",
                              appLock.type === type 
                                ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-400" 
                                : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3 text-zinc-300">
                          <Fingerprint className="w-5 h-5 text-emerald-400" />
                          <span className="font-medium">Biometric Authentication</span>
                        </div>
                        {!isBiometricSupported && (
                          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-1 ml-8">
                            Not supported by browser
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => setAppLock({ biometricEnabled: !appLock.biometricEnabled })}
                        disabled={!isBiometricSupported && false} // Keep enabled for demo purposes if desired, or disable
                        className={clsx(
                          "w-10 h-6 rounded-full relative transition-colors duration-200",
                          appLock.biometricEnabled ? "bg-indigo-600" : "bg-zinc-700",
                          !isBiometricSupported && "opacity-50"
                        )}
                      >
                        <motion.div 
                          animate={{ x: appLock.biometricEnabled ? 18 : 2 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                        />
                      </button>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">
                          {lockSetup.step === 'entry' ? `Set ${appLock.type}` : `Confirm ${appLock.type}`}
                        </label>
                        {lockSetup.error && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-red-400 font-medium ml-1"
                          >
                            {lockSetup.error}
                          </motion.p>
                        )}
                      </div>

                      <div className="flex justify-center">
                        {appLock.type === 'pin' && (
                          <div key={`pin-${lockSetup.step}`}>
                            <PinLock 
                              onComplete={(pin) => {
                                if (lockSetup.step === 'entry') {
                                  setLockSetup({ step: 'confirm', tempSecret: pin, error: null });
                                } else {
                                  if (pin === lockSetup.tempSecret) {
                                    setAppLock({ secret: pin });
                                    setLockSetup({ step: 'entry', tempSecret: '', error: null });
                                  } else {
                                    setLockSetup({ ...lockSetup, error: 'PINs do not match. Starting over...' });
                                    setTimeout(() => setLockSetup({ step: 'entry', tempSecret: '', error: null }), 1500);
                                  }
                                }
                              }} 
                              error={!!lockSetup.error} 
                            />
                          </div>
                        )}
                        {appLock.type === 'pattern' && (
                          <div key={`pattern-${lockSetup.step}`}>
                            <PatternLock 
                              onComplete={(pattern) => {
                                if (lockSetup.step === 'entry') {
                                  setLockSetup({ step: 'confirm', tempSecret: pattern, error: null });
                                } else {
                                  if (pattern === lockSetup.tempSecret) {
                                    setAppLock({ secret: pattern });
                                    setLockSetup({ step: 'entry', tempSecret: '', error: null });
                                  } else {
                                    setLockSetup({ ...lockSetup, error: 'Patterns do not match. Starting over...' });
                                    setTimeout(() => setLockSetup({ step: 'entry', tempSecret: '', error: null }), 1500);
                                  }
                                }
                              }} 
                              error={!!lockSetup.error} 
                            />
                          </div>
                        )}
                        {appLock.type === 'alphabetic' && (
                          <div className="w-full space-y-4">
                            <input
                              type="text"
                              value={appLock.secret}
                              onChange={(e) => setAppLock({ secret: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                              placeholder="Enter your password"
                            />
                            <p className="text-[10px] text-zinc-500 italic px-1">
                              Alphabetic locks are set immediately. Use a strong password.
                            </p>
                          </div>
                        )}
                      </div>

                      {appLock.secret && !lockSetup.error && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 justify-center text-emerald-400 text-xs font-bold uppercase tracking-widest"
                        >
                          <Check className="w-4 h-4" />
                          <span>{appLock.type} Saved</span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Switcher Modal */}
      <AnimatePresence>
        {showAccountSwitcher && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => {
                setShowAccountSwitcher(false);
                setIsAddingAccount(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Switch Account</h3>
                  <p className="text-xs text-zinc-500">Manage your identities</p>
                </div>
                <button 
                  onClick={() => {
                    setShowAccountSwitcher(false);
                    setIsAddingAccount(false);
                  }} 
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {isAddingAccount ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">New Username</label>
                      <input
                        type="text"
                        value={newAccountUsername}
                        onChange={(e) => setNewAccountUsername(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        placeholder="Enter username"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsAddingAccount(false)}
                        className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (!newAccountUsername.trim()) return;
                          const newAccount: UserType = {
                            id: crypto.randomUUID(),
                            username: newAccountUsername.trim(),
                            publicKey: 'mock-public-key-' + Math.random().toString(36).substring(7),
                            privateKey: 'mock-private-key-' + Math.random().toString(36).substring(7),
                            displayName: newAccountUsername.trim(),
                          };
                          addAccount(newAccount);
                          setNewAccountUsername('');
                          setIsAddingAccount(false);
                        }}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                      >
                        Add Account
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {accounts.map((acc) => (
                        <div 
                          key={acc.id}
                          className={clsx(
                            "flex items-center justify-between p-3 rounded-2xl border transition-all",
                            user?.id === acc.id 
                              ? "bg-indigo-600/10 border-indigo-500/50" 
                              : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                          )}
                        >
                          <button 
                            onClick={() => {
                              switchAccount(acc.id);
                              setShowAccountSwitcher(false);
                            }}
                            className="flex items-center gap-3 flex-1 text-left"
                          >
                            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden border border-zinc-700">
                              {acc.avatarUrl ? (
                                <img src={acc.avatarUrl} alt={acc.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                acc.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-zinc-100">{acc.displayName || acc.username}</p>
                                {user?.id === acc.id && (
                                  <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[8px] font-bold uppercase tracking-widest rounded-md border border-indigo-500/30">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-500 font-mono">@{acc.username}</p>
                            </div>
                          </button>
                          
                          {accounts.length > 1 && (
                            <button 
                              onClick={() => removeAccount(acc.id)}
                              className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors text-zinc-600 hover:text-rose-500"
                              title="Remove Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setIsAddingAccount(true)}
                      className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-all font-bold text-xs uppercase tracking-widest mt-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      Add New Account
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

