import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { motion } from 'motion/react';
import { UserPlus, Loader2, AlertCircle, Check } from 'lucide-react';
import clsx from 'clsx';

export default function AddFriendByLink() {
  const { username } = useParams();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const addContact = useStore((state) => state.addContact);
  const theme = useStore((state) => state.theme);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAdd = async () => {
      if (!username) return;
      if (!user) {
        // Redirect to login if not logged in, but save the intent
        localStorage.setItem('pending_add_friend', username);
        navigate('/login');
        return;
      }

      if (user.username === username) {
        setStatus('error');
        setError("You can't add yourself as a friend.");
        return;
      }

      try {
        const res = await fetch(`/api/users/by-username/${encodeURIComponent(username)}`);
        if (res.ok) {
          const userData = await res.json();
          addContact({
            id: userData.id,
            username: userData.username,
            publicKey: userData.public_key,
            displayName: userData.display_name || userData.username,
            avatarUrl: userData.avatar_url,
          });
          setStatus('success');
          setTimeout(() => {
            navigate(`/chat/${userData.id}`);
          }, 1500);
        } else {
          setStatus('error');
          setError('User not found.');
        }
      } catch (err) {
        setStatus('error');
        setError('Something went wrong. Please try again.');
      }
    };

    handleAdd();
  }, [username, user, addContact, navigate]);

  return (
    <div className={clsx(
      "flex-1 flex flex-col items-center justify-center p-6 transition-colors duration-200",
      theme === 'light' ? 'bg-zinc-50 text-zinc-900' : 'bg-black text-white'
    )}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl"
      >
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Adding Friend...</h2>
              <p className="text-sm text-zinc-500 mt-1">Connecting you with @{username}</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Friend Added!</h2>
              <p className="text-sm text-zinc-500 mt-1">Redirecting you to the chat...</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Oops!</h2>
              <p className="text-sm text-zinc-500 mt-1">{error}</p>
            </div>
            <button
              onClick={() => navigate('/home')}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-colors"
            >
              Go Home
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
