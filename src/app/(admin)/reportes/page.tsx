import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ReportesClient from './ReportesClient';

export default async function ReportesPage() {
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
  const isAuthorized = ['super_admin', 'admin', 'vendedor', 'mecanico', 'auditor'].includes(role);
  if (!isAuthorized) {
    redirect('/dashboard');
  }

  let sales: any[] = [];
  let services: any[] = [];

  // Fetch sales if admin/super_admin/auditor or vendedor
  if (['super_admin', 'admin', 'auditor', 'vendedor'].includes(role)) {
    let salesQuery = supabase.from('sales').select('*, profiles:seller_id(full_name, email)');
    if (role === 'vendedor') {
      salesQuery = salesQuery.eq('seller_id', user.id);
    }
    const { data } = await salesQuery.order('sale_date', { ascending: false });
    sales = data || [];
  }

  // Fetch services if admin/super_admin/auditor or mecanico
  if (['super_admin', 'admin', 'auditor', 'mecanico'].includes(role)) {
    let servicesQuery = supabase.from('services').select('*, profiles:mechanic_id(full_name, email)');
    if (role === 'mecanico') {
      servicesQuery = servicesQuery.eq('mechanic_id', user.id);
    }
    const { data } = await servicesQuery.order('service_date', { ascending: false });
    services = data || [];
  }

  return (
    <ReportesClient 
      role={role}
      sales={sales}
      services={services}
      currentProfile={currentProfile}
    />
  );
}
