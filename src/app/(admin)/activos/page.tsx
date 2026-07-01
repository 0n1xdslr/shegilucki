import { createClient } from '@/lib/supabase/server';
import ActivosClient from './ActivosClient';

export default async function ActivosPage() {
  const supabase = await createClient();
  const { data: activos, error } = await supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="text-red-500">Error cargando activos: {error.message}</p>
      </div>
    );
  }

  return <ActivosClient initialActivos={activos || []} />;
}

