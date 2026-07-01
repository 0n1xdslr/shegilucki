import { createClient } from '@/lib/supabase/server';
import RiesgosClient from './RiesgosClient';

export default async function RiesgosPage() {
  const supabase = await createClient();
  
  const [
    { data: riesgos, error },
    { data: assets },
    { data: threats },
    { data: vulnerabilities }
  ] = await Promise.all([
    supabase
      .from('risks')
      .select('*, assets(name), threats(name), vulnerabilities(name)')
      .order('risk_score', { ascending: false }),
    supabase.from('assets').select('id, name'),
    supabase.from('threats').select('id, name'),
    supabase.from('vulnerabilities').select('id, name')
  ]);

  if (error) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="text-red-500">Error cargando riesgos: {error.message}</p>
      </div>
    );
  }

  return (
    <RiesgosClient 
      initialRiesgos={riesgos || []} 
      assets={assets || []}
      threats={threats || []}
      vulnerabilities={vulnerabilities || []}
    />
  );
}
