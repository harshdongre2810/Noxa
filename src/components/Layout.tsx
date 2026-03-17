import { Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useEffect } from 'react';
import clsx from 'clsx';
import SocketManager from './SocketManager';

export default function Layout() {
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light', 'amoled');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <div className={clsx(
      'min-h-screen w-full flex flex-col font-sans transition-colors duration-200',
      theme === 'dark' ? 'bg-black text-zinc-50' : 
      theme === 'amoled' ? 'bg-black text-zinc-50' : 
      'bg-zinc-50 text-zinc-900'
    )}>
      <SocketManager />
      <div className="w-full max-w-md mx-auto h-screen flex flex-col overflow-hidden relative shadow-2xl">
        <Outlet />
      </div>
    </div>
  );
}
