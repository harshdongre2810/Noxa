import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, EyeOff, Lock, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import clsx from 'clsx';

const slides = [
  {
    title: 'Absolute Privacy',
    description: 'No phone number. No email. No tracking. Your identity is just a username.',
    icon: EyeOff,
  },
  {
    title: 'End-to-End Encrypted',
    description: 'Every message, call, and file is encrypted on your device. Only the receiver can read it.',
    icon: Lock,
  },
  {
    title: 'Open Source & Free',
    description: 'Transparent code, community-driven, and free forever. No ads, no data selling.',
    icon: Shield,
  },
];

export default function Intro() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const theme = useStore((state) => state.theme);

  const nextSlide = () => {
    if (current === slides.length - 1) {
      navigate('/register');
    } else {
      setCurrent(current + 1);
    }
  };

  const CurrentIcon = slides[current].icon;

  return (
    <div className={clsx(
      "flex-1 flex flex-col p-6 justify-between transition-colors duration-200",
      theme === 'light' ? 'bg-zinc-50 text-zinc-900' : 'bg-black text-white'
    )}>
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-32 h-32 bg-zinc-900 rounded-full flex items-center justify-center mb-8 shadow-xl">
              <CurrentIcon className="w-16 h-16 text-indigo-500" />
            </div>
            <h2 className="text-3xl font-bold mb-4 tracking-tight">{slides[current].title}</h2>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-xs">{slides[current].description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-6 pb-8">
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-indigo-500' : 'w-2 bg-zinc-800'
              }`}
            />
          ))}
        </div>
        <button
          onClick={nextSlide}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
        >
          {current === slides.length - 1 ? 'Get Started' : 'Next'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
