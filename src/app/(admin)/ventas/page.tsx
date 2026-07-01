import { createClient } from '@/lib/supabase/server';
import VentasClient from './VentasClient';
import { redirect } from 'next/navigation';

export default async function VentasPage() {
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
  const isAuthorized = role === 'admin' || role === 'super_admin' || role === 'vendedor';
  if (!isAuthorized) {
    redirect('/dashboard');
  }

  // Fetch sales: show all for admins/super_admins, or only own sales for seller
  let query = supabase.from('sales').select('*, profiles:seller_id(full_name, email)');
  if (role === 'vendedor') {
    query = query.eq('seller_id', user.id);
  }
  
  const { data: sales, error } = await query.order('sale_date', { ascending: false });

  if (error) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="text-red-500">Error cargando ventas: {error.message}</p>
      </div>
    );
  }

  // Fetch all vendedor profiles for admin assignments
  let sellersList: any[] = [];
  if (role === 'admin' || role === 'super_admin') {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'vendedor');
    sellersList = profiles || [];
  }

  return (
    <VentasClient 
      initialSales={sales || []} 
      sellers={sellersList} 
      currentProfile={currentProfile} 
    />
  );
}
