import { createClient } from '@/lib/supabase/server';
import AmenazasClient from './AmenazasClient';

export default async function AmenazasPage() {
  const supabase = await createClient();
  const { data: amenazas, error } = await supabase
    .from('threats')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="text-red-500">Error cargando amenazas: {error.message}</p>
      </div>
    );
  }

  return <AmenazasClient initialAmenazas={amenazas || []} />;
}
