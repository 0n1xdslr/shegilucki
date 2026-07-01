import { createClient } from '@/lib/supabase/server';
import ServiciosClient from './ServiciosClient';
import { redirect } from 'next/navigation';

export default async function ServiciosPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch user profile and role
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!currentProfile) {
    redirect('/login');
  }

  const role = currentProfile.role;
  const isAuthorized = role === 'admin' || role === 'super_admin' || role === 'mecanico';
  if (!isAuthorized) {
    redirect('/dashboard');
  }

  // Fetch services: show all for admins/super_admins, or only own services for mechanic
  let query = supabase.from('services').select('*, profiles:mechanic_id(full_name, email)');
  if (role === 'mecanico') {
    query = query.eq('mechanic_id', user.id);
  }
  
  const { data: services, error } = await query.order('service_date', { ascending: false });

  if (error) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="text-red-500">Error cargando servicios: {error.message}</p>
      </div>
    );
  }

  // Fetch all mechanic profiles for admin assignments
  let mechanicsList: any[] = [];
  if (role === 'admin' || role === 'super_admin') {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'mecanico');
    mechanicsList = profiles || [];
  }

  return (
    <ServiciosClient 
      initialServices={services || []} 
      mechanics={mechanicsList} 
      currentProfile={currentProfile} 
    />
  );
}
