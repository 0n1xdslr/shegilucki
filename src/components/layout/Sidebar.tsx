import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  AlertTriangle, 
  Activity, 
  Grid, 
  CheckSquare, 
  FileText, 
  History, 
  BarChart3, 
  Settings 
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Activos', path: '/activos', icon: Users },
  { name: 'Amenazas', path: '/amenazas', icon: ShieldAlert },
  { name: 'Vulnerabilidades', path: '/vulnerabilidades', icon: AlertTriangle },
  { name: 'Riesgos', path: '/riesgos', icon: Activity },
  { name: 'Matriz', path: '/matriz', icon: Grid },
  { name: 'Mapa de Calor', path: '/mapa-calor', icon: Grid },
  { name: 'Tratamientos', path: '/tratamientos', icon: CheckSquare },
  { name: 'Evidencias', path: '/evidencias', icon: FileText },
  { name: 'Auditoría', path: '/auditoria', icon: History },
  { name: 'Reportes', path: '/reportes', icon: BarChart3 },
  { name: 'Configuración', path: '/configuracion', icon: Settings },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (val: boolean) => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72 flex-col overflow-y-hidden bg-slate-900 duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* SIDEBAR HEADER */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5 mt-4 mb-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 overflow-hidden rounded-md bg-white flex items-center justify-center">
             <img src="/logo.jpeg" alt="Lucky Motors Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-bold text-white">Lucky Motors</span>
        </Link>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden text-white"
        >
          <svg className="fill-current" width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z" fill="" />
          </svg>
        </button>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-1 px-4 lg:px-6">
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-slate-400">
              MENÚ PRINCIPAL
            </h3>
            <ul className="mb-6 flex flex-col gap-1.5">
              {MENU_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.path);
                const Icon = item.icon;
                
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-slate-200 duration-300 ease-in-out hover:bg-slate-800 ${
                        isActive ? 'bg-slate-800 text-white' : ''
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
}
