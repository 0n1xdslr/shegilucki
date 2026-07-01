'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, Sun, Moon } from 'lucide-react';

export default function Header({ 
  sidebarOpen, 
  setSidebarOpen,
  userProfile 
}: { 
  sidebarOpen: boolean, 
  setSidebarOpen: (val: boolean) => void,
  userProfile: any
}) {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = storedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('login_logged');
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrador';
      case 'vendedor': return 'Vendedor';
      case 'mecanico': return 'Mecánico';
      case 'auditor': return 'Auditor';
      case 'viewer': return 'Lector';
      default: return role;
    }
  };

  return (
    <header className="sticky top-0 z-999 flex w-full bg-white dark:bg-slate-900 drop-shadow-1 dark:drop-shadow-none">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-sm md:px-6 2xl:px-11">
        
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
            className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
 
        <div className="hidden sm:block">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            Lucky Motors Risk & Operations
          </h2>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7 ml-auto">
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <span className="block text-sm font-medium text-slate-800 dark:text-white">
                {userProfile?.full_name || 'Cargando...'}
              </span>
              <span className="block text-xs font-medium text-slate-500">
                {getRoleLabel(userProfile?.role)} - {userProfile?.email}
              </span>
            </div>
            
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 rounded-md bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-md bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 hover:text-red-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
