import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';

export default function Header({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (val: boolean) => void }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
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
            Sistema de Gestión de Riesgos
          </h2>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7 ml-auto">
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <span className="block text-sm font-medium text-slate-800 dark:text-white">
                Auditor
              </span>
              <span className="block text-xs font-medium text-slate-500">
                admin@luckymotors.com
              </span>
            </div>
            
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
