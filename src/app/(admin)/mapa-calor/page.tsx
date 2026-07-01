import { createClient } from '@/lib/supabase/server';
import RiskHeatMap from '@/components/risk/RiskHeatMap';

export default async function MapaCalorPage() {
  const supabase = await createClient();
  
  const { data: riesgos, error } = await supabase
    .from('risks')
    .select('id, name, probability, impact, risk_score, assets(name)')
    .order('risk_score', { ascending: false });

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Mapa de Calor de Riesgos
        </h2>
      </div>

      <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
        <div className="mb-6">
          <p className="text-slate-500">
            El mapa de calor representa gráficamente la distribución de los riesgos según su probabilidad de ocurrencia (Eje Y) y su impacto (Eje X). Haga clic en cualquier cuadrícula para ver los riesgos asociados a ese nivel.
          </p>
        </div>

        {error ? (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
            Error al cargar los datos del mapa de calor. Asegúrese de que Supabase esté conectado.
          </div>
        ) : (
          <RiskHeatMap risksData={riesgos || []} />
        )}
      </div>
    </>
  );
}
