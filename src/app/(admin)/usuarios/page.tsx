import { createClient } from '@/lib/supabase/server';
import UsuariosClient from './UsuariosClient';
import { redirect } from 'next/navigation';

export default async function UsuariosPage() {
  const supabase = await createClient();
  
  // Validate that user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Validate admin permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/dashboard');
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="text-red-500">Error cargando usuarios: {error.message}</p>
      </div>
    );
  }

  return <UsuariosClient initialUsers={profiles || []} />;
}
