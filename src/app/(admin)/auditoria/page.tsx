import { createClient } from '@/lib/supabase/server';
import SearchInput from '@/components/audit/SearchInput';
import JsonModal from '@/components/audit/JsonModal';

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;
  const supabase = await createClient();
  
  let dbQuery = supabase
    .from('audit_logs')
    .select('*, profiles(email)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (query) {
    dbQuery = dbQuery.or(`action.ilike.%${query}%,entity_type.ilike.%${query}%`);
  }

  const { data: logs, error } = await dbQuery;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Logs de Auditoría
        </h2>
      </div>

      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
           <SearchInput defaultValue={query || ''} />
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-100 text-left dark:bg-meta-4">
                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                  Fecha
                </th>
                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">
                  Usuario
                </th>
                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                  Acción
                </th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">
                  Entidad
                </th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody>
              {error && (
                 <tr>
                    <td colSpan={5} className="text-center py-4 text-red-500">Error cargando auditoría.</td>
                 </tr>
              )}
              {logs?.length === 0 && (
                 <tr>
                    <td colSpan={5} className="text-center py-4">No hay logs registrados.</td>
                 </tr>
              )}
              {logs?.map((log: any) => (
                <tr key={log.id}>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white text-sm">
                      {new Date(log.created_at).toLocaleString('es-PE')}
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white font-medium">
                      {log.profiles?.email || 'Sistema'}
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                      log.action === 'INSERT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      log.action === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    }`}>
                      {log.action}
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white text-sm">
                      {log.entity_type}
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <JsonModal data={log.new_data || log.old_data} title={`Detalles: ${log.entity_type}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
