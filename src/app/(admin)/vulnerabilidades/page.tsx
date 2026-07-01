import { createClient } from '@/lib/supabase/server';
import VulnerabilidadesClient from './VulnerabilidadesClient';

export default async function VulnerabilidadesPage() {
  const supabase = await createClient();
  const { data: vulnerabilidades, error } = await supabase
    .from('vulnerabilities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="text-red-500">Error cargando vulnerabilidades: {error.message}</p>
      </div>
    );
  }

  return <VulnerabilidadesClient initialVulnerabilidades={vulnerabilidades || []} />;
}
