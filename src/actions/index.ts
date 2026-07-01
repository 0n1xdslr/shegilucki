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
