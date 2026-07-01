import { createClient } from '@/lib/supabase/server';
import TratamientosClient from './TratamientosClient';

export default async function TratamientosPage() {
  const supabase = await createClient();
  
  const [
    { data: tratamientos, error },
    { data: riesgos }
  ] = await Promise.all([
    supabase
      .from('risk_treatments')
      .select('*, risks(name, risk_level)')
      .order('created_at', { ascending: false }),
    supabase.from('risks').select('id, name, risk_level')
  ]);

  if (error) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="text-red-500">Error cargando tratamientos: {error.message}</p>
      </div>
    );
  }

  return (
    <TratamientosClient 
      initialTratamientos={tratamientos || []} 
      riesgos={riesgos || []}
    />
  );
}
