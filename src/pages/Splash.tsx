import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';
import { useStore } from '../store/useStore';
import clsx from 'clsx';

export default function Splash() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        navigate('/home');
      } else {
        navigate('/intro');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate, user]);

  const theme = useStore((state) => state.theme);

  return (
    <div className={clsx(
      "flex-1 flex flex-col items-center justify-center transition-colors duration-200",
      theme === 'light' ? 'bg-zinc-50 text-zinc-900' : 'bg-black text-white'
    )}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-6">
          <Shield className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-5xl font-bold tracking-tighter mb-2">NOXA</h1>
        <p className="text-zinc-400 font-medium tracking-wide">No Number. No Trace. Just Chat.</p>
      </motion.div>
    </div>
  );
}
