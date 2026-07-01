'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// --- ASSETS (ACTIVOS) ---
export async function createAsset(formData: FormData) {
  const supabase = await createClient();
  const company_id = 'c10a4e76-0000-0000-0000-000000000001'; // Default company for now
  
  const { error } = await supabase.from('assets').insert({
    company_id,
    name: formData.get('name'),
    type: formData.get('type'),
    description: formData.get('description'),
    owner: formData.get('owner'),
    is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
  });

  if (error) throw new Error(error.message);
  revalidatePath('/activos');
}

export async function updateAsset(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('assets').update({
    name: formData.get('name'),
    type: formData.get('type'),
    description: formData.get('description'),
    owner: formData.get('owner'),
    is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
  }).eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/activos');
}

export async function deleteAsset(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('assets').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/activos');
}

// --- THREATS (AMENAZAS) ---
export async function createThreat(formData: FormData) {
  const supabase = await createClient();
  const company_id = 'c10a4e76-0000-0000-0000-000000000001';
  
  const { error } = await supabase.from('threats').insert({
    company_id,
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
  });

  if (error) throw new Error(error.message);
  revalidatePath('/amenazas');
}

export async function updateThreat(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('threats').update({
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
  }).eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/amenazas');
}

export async function deleteThreat(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('threats').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/amenazas');
}

// --- VULNERABILITIES (VULNERABILIDADES) ---
export async function createVulnerability(formData: FormData) {
  const supabase = await createClient();
  const company_id = 'c10a4e76-0000-0000-0000-000000000001';
  
  const { error } = await supabase.from('vulnerabilities').insert({
    company_id,
    name: formData.get('name'),
    description: formData.get('description'),
    is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
  });

  if (error) throw new Error(error.message);
  revalidatePath('/vulnerabilidades');
}

export async function updateVulnerability(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('vulnerabilities').update({
    name: formData.get('name'),
    description: formData.get('description'),
    is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
  }).eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/vulnerabilidades');
}

export async function deleteVulnerability(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('vulnerabilities').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/vulnerabilidades');
}

// --- RISKS (RIESGOS) ---
export async function createRisk(formData: FormData) {
  const supabase = await createClient();
  const company_id = 'c10a4e76-0000-0000-0000-000000000001';
  
  const { error } = await supabase.from('risks').insert({
    company_id,
    asset_id: formData.get('asset_id'),
    threat_id: formData.get('threat_id'),
    vulnerability_id: formData.get('vulnerability_id'),
    name: formData.get('name'),
    description: formData.get('description'),
    probability: parseInt(formData.get('probability') as string, 10),
    impact: parseInt(formData.get('impact') as string, 10),
    recommended_mitigation: formData.get('recommended_mitigation'),
    owner: formData.get('owner'),
    status: formData.get('status') || 'Identificado',
  });

  if (error) throw new Error(error.message);
  revalidatePath('/riesgos');
  revalidatePath('/matriz');
  revalidatePath('/mapa-calor');
}

export async function updateRisk(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('risks').update({
    asset_id: formData.get('asset_id'),
    threat_id: formData.get('threat_id'),
    vulnerability_id: formData.get('vulnerability_id'),
    name: formData.get('name'),
    description: formData.get('description'),
    probability: parseInt(formData.get('probability') as string, 10),
    impact: parseInt(formData.get('impact') as string, 10),
    recommended_mitigation: formData.get('recommended_mitigation'),
    owner: formData.get('owner'),
    status: formData.get('status'),
  }).eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/riesgos');
  revalidatePath('/matriz');
  revalidatePath('/mapa-calor');
}

export async function deleteRisk(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('risks').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/riesgos');
  revalidatePath('/matriz');
  revalidatePath('/mapa-calor');
}

// --- TREATMENT PLANS (TRATAMIENTOS) ---
export async function createTreatment(formData: FormData) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('treatment_plans').insert({
    risk_id: formData.get('risk_id'),
    strategy: formData.get('strategy'),
    action_plan: formData.get('action_plan'),
    owner: formData.get('owner'),
    start_date: formData.get('start_date') || null,
    end_date: formData.get('end_date') || null,
    status: formData.get('status') || 'Pendiente',
    progress_percentage: parseInt(formData.get('progress_percentage') as string, 10) || 0,
    observations: formData.get('observations'),
  });

  if (error) throw new Error(error.message);
  revalidatePath('/tratamientos');
}

export async function updateTreatment(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('treatment_plans').update({
    risk_id: formData.get('risk_id'),
    strategy: formData.get('strategy'),
    action_plan: formData.get('action_plan'),
    owner: formData.get('owner'),
    start_date: formData.get('start_date') || null,
    end_date: formData.get('end_date') || null,
    status: formData.get('status'),
    progress_percentage: parseInt(formData.get('progress_percentage') as string, 10) || 0,
    observations: formData.get('observations'),
  }).eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/tratamientos');
}

export async function deleteTreatment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('treatment_plans').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tratamientos');
}

// --- USER MANAGEMENT ---
export async function createUserAction(formData: FormData) {
  const supabase = await createClient();
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const full_name = formData.get('full_name') as string;
  const role = formData.get('role') as string;

  const { data, error } = await supabase.rpc('create_new_user', {
    user_email: email,
    user_password: password,
    user_full_name: full_name,
    user_role: role
  });

  if (error) throw new Error(error.message);
  revalidatePath('/usuarios');
  return data;
}

export async function updateUserAction(id: string, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string || null;
  const full_name = formData.get('full_name') as string;
  const role = formData.get('role') as string;

  const { error } = await supabase.rpc('update_existing_user', {
    target_user_id: id,
    new_email: email,
    new_password: password,
    new_full_name: full_name,
    new_role: role
  });

  if (error) throw new Error(error.message);
  revalidatePath('/usuarios');
}

export async function deleteUserAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('delete_existing_user', {
    target_user_id: id
  });

  if (error) throw new Error(error.message);
  revalidatePath('/usuarios');
}

// --- SALES (VENTAS) ---
export async function createSaleAction(formData: FormData) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('sales').insert({
    seller_id: formData.get('seller_id') || null,
    customer_name: formData.get('customer_name'),
    vehicle_details: formData.get('vehicle_details'),
    amount: parseFloat(formData.get('amount') as string),
    sale_date: formData.get('sale_date') || new Date().toISOString().split('T')[0],
    notes: formData.get('notes'),
  });

  if (error) throw new Error(error.message);
  revalidatePath('/ventas');
}

export async function updateSaleAction(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from('sales').update({
    customer_name: formData.get('customer_name'),
    vehicle_details: formData.get('vehicle_details'),
    amount: parseFloat(formData.get('amount') as string),
    sale_date: formData.get('sale_date'),
    notes: formData.get('notes'),
  }).eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/ventas');
}

export async function deleteSaleAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/ventas');
}

// --- SERVICES (SERVICIOS) ---
export async function createServiceAction(formData: FormData) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('services').insert({
    mechanic_id: formData.get('mechanic_id') || null,
    customer_name: formData.get('customer_name'),
    vehicle_details: formData.get('vehicle_details'),
    description: formData.get('description'),
    cost: parseFloat(formData.get('cost') as string),
    service_date: formData.get('service_date') || new Date().toISOString().split('T')[0],
    status: formData.get('status') || 'Realizado',
    notes: formData.get('notes'),
  });

  if (error) throw new Error(error.message);
  revalidatePath('/servicios');
}

export async function updateServiceAction(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from('services').update({
    customer_name: formData.get('customer_name'),
    vehicle_details: formData.get('vehicle_details'),
    description: formData.get('description'),
    cost: parseFloat(formData.get('cost') as string),
    service_date: formData.get('service_date'),
    status: formData.get('status'),
    notes: formData.get('notes'),
  }).eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/servicios');
}

export async function deleteServiceAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/servicios');
}
