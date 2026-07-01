import { createClient } from '@/lib/supabase/server';
import { UploadCloud, File, Search } from 'lucide-react';

export default async function EvidenciasPage() {
  const supabase = await createClient();
  
  const { data: evidencias, error } = await supabase
    .from('evidences')
    .select('*, risks(name), treatment_plans(action_plan)')
    .order('created_at', { ascending: false });

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Gestión de Evidencias
        </h2>
        <button className="flex items-center gap-2 rounded bg-red-600 px-4.5 py-2 font-medium text-white hover:bg-opacity-90">
          <UploadCloud size={20} />
          Subir Evidencia
        </button>
      </div>

      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="relative w-full sm:w-1/2 md:w-1/3">
              <span className="absolute left-4.5 top-1/2 -translate-y-1/2">
                <Search size={18} className="text-slate-500" />
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-10 py-2 font-medium outline-none transition focus:border-red-500 active:border-red-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-red-500"
              />
           </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-100 text-left dark:bg-meta-4">
                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">
                  Archivo
                </th>
                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                  Asociado a
                </th>
                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                  Descripción
                </th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">
                  Fecha
                </th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">
                  Descargar
                </th>
              </tr>
            </thead>
            <tbody>
              {error && (
                 <tr>
                    <td colSpan={5} className="text-center py-4 text-red-500">Error cargando evidencias.</td>
                 </tr>
              )}
              {evidencias?.length === 0 && (
                 <tr>
                    <td colSpan={5} className="text-center py-4">No hay evidencias subidas.</td>
                 </tr>
              )}
              {evidencias?.map((evidencia: any) => (
                <tr key={evidencia.id}>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          <File className="w-5 h-5 text-red-500" />
                       </div>
                       <p className="text-black dark:text-white font-medium">
                         {evidencia.name}
                       </p>
                    </div>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white text-sm">
                      {evidencia.risks ? `Riesgo: ${evidencia.risks.name}` : `Tratamiento: ${evidencia.treatment_plans?.action_plan}`}
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white text-sm">
                      {evidencia.description}
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white text-sm">
                      {new Date(evidencia.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <a 
                      href={evidencia.file_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-red-500 hover:underline font-medium text-sm"
                    >
                      Descargar
                    </a>
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
