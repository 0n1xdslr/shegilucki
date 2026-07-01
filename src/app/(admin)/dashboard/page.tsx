import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Lock } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'viewer';

  if (role === 'viewer') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <Lock size={40} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">
          ¡Usuario creado correctamente!
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mb-6">
          Tu cuenta ha sido creada con éxito. Sin embargo, actualmente tienes el rol de <strong className="text-yellow-600 dark:text-yellow-400">Lector (Pendiente de asignación)</strong>.
        </p>
        <div className="max-w-md bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            En unos momentos se te asignará un rol operativo (como <strong>Vendedor</strong> o <strong>Mecánico</strong>) por parte de tu supervisor o administrador de Lucky Motors para activar tus accesos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Dashboard
        </h2>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                8
              </h4>
              <span className="text-sm font-medium">Total Activos</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                8
              </h4>
              <span className="text-sm font-medium">Total Riesgos Registrados</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-red-500">
                3
              </h4>
              <span className="text-sm font-medium">Riesgos Críticos</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-orange-500">
                2
              </h4>
              <span className="text-sm font-medium">Riesgos Altos</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
          <h4 className="mb-4 text-xl font-semibold text-black dark:text-white">
            Resumen de Operaciones
          </h4>
          <p className="text-slate-500">
            Bienvenido, {profile?.full_name || 'Usuario'}. Tienes el rol de {
              role === 'super_admin' ? 'Super Administrador' :
              role === 'admin' ? 'Administrador' :
              role === 'vendedor' ? 'Vendedor' :
              role === 'mecanico' ? 'Mecánico' :
              role === 'auditor' ? 'Auditor' : role
            }. Utiliza el menú lateral para acceder a tus módulos autorizados.
          </p>
        </div>
      </div>
    </>
  );
}
