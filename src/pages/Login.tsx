import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { generateKeyPair } from '../lib/crypto';
import { ShieldAlert, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import ErrorMessage from '../components/ErrorMessage';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setUser = useStore((state) => state.setUser);
  const theme = useStore((state) => state.theme);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // In a real app, we'd need the private key to decrypt messages.
      // Since we don't store it on the server, a new login on a new device
      // would mean generating a new key pair and updating the server,
      // or recovering the private key from the recovery phrase.
      // For this prototype, we'll generate a new one if it's a new device,
      // but ideally we'd use the recovery phrase.
      // We'll just generate a new one for simplicity in this demo.
      const keys = await generateKeyPair();

      setUser({
        id: data.id,
        username: data.username,
        publicKey: data.publicKey || keys.publicKey, // Use existing or new
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
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
            <p className="text-zinc-400">Enter your identity to continue.</p>
          </div>

          {error && (
            <ErrorMessage 
              message={error} 
              type={error.includes('Username') || error.includes('password') ? 'auth' : 'general'} 
            />
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Your unique username"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors mt-8"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
          </button>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Don't have an identity?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
