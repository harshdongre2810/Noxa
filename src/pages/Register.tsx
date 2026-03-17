import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { generateKeyPair, generateRecoveryPhrase } from '../lib/crypto';
import { ShieldAlert, Loader2, KeyRound, ChevronLeft, Copy, Check } from 'lucide-react';
import clsx from 'clsx';
import ErrorMessage from '../components/ErrorMessage';

export default function Register() {
  const [username, setUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const setUser = useStore((state) => state.setUser);
  const theme = useStore((state) => state.theme);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const res = await fetch(`/api/users/check?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch (err) {
        console.error('Failed to check username', err);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (usernameAvailable === false) {
      setError('This username is already taken');
      return;
    }
    if (usernameAvailable === null || isCheckingUsername) {
      setError('Please wait for username verification');
      return;
    }
    setError('');
    if (!recoveryPhrase) {
      setRecoveryPhrase(generateRecoveryPhrase());
    }
    setStep(2);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(recoveryPhrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const keys = await generateKeyPair();
      
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          publicKey: keys.publicKey,
          recoveryKey: recoveryPhrase,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setUser({
        id: data.id,
        username: data.username,
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
      });

      const pendingAdd = localStorage.getItem('pending_add_friend');
      if (pendingAdd) {
        localStorage.removeItem('pending_add_friend');
        navigate(`/add/${pendingAdd}`);
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={clsx(
      "flex-1 flex flex-col p-6 transition-colors duration-200",
      theme === 'light' ? 'bg-zinc-50 text-zinc-900' : 'bg-black text-white'
    )}>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-6">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Create Identity</h1>
              <p className="text-zinc-400">No phone or email required.</p>
            </div>

            {error && (
              <ErrorMessage 
                message={error} 
                type={error.includes('username') ? 'validation' : 'general'} 
              />
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className={clsx(
                      "w-full bg-zinc-900 border rounded-2xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all",
                      usernameAvailable === true ? "border-emerald-500/50 focus:ring-emerald-500" : 
                      usernameAvailable === false ? "border-rose-500/50 focus:ring-rose-500" : 
                      "border-zinc-800 focus:ring-indigo-500"
                    )}
                    placeholder="Choose a unique username"
                    autoComplete="off"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                    {isCheckingUsername ? (
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                    ) : usernameAvailable === true ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : usernameAvailable === false ? (
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                    ) : null}
                  </div>
                </div>
                {usernameAvailable === false && (
                  <p className="text-rose-500 text-xs mt-1.5 ml-1">This username is already taken</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Make it strong"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Repeat your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCheckingUsername || usernameAvailable === false}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-colors mt-8 flex items-center justify-center gap-2"
            >
              {isCheckingUsername ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : 'Continue'}
            </button>

            <p className="text-center text-zinc-500 text-sm mt-6">
              Already have an identity?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Login
              </Link>
            </p>
          </form>
        ) : (
          <div className="space-y-6">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-indigo-400" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Recovery Key</h1>
              <p className="text-zinc-400 text-sm">Write this down. It's the ONLY way to recover your account if you forget your password.</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="font-mono text-lg text-center leading-relaxed text-indigo-300 relative z-10 select-all">
                {recoveryPhrase}
              </p>
              <button 
                onClick={copyToClipboard}
                className="absolute top-2 right-2 p-2 text-zinc-500 hover:text-indigo-400 transition-colors z-20"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 items-start">
              <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200/80 leading-relaxed">
                Do not share this with anyone. NOXA cannot recover your account if you lose this key.
              </p>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors mt-8"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'I have saved it securely'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
