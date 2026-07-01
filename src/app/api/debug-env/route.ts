import { NextResponse } from 'next/server';

export async function GET() {
  const envKeys = Object.keys(process.env);
  const nextPublicKeys = envKeys.filter(k => k.startsWith('NEXT_PUBLIC_') || k.includes('SUPABASE'));
  
  // Para mayor diagnóstico, incluimos si cada variable tiene valor o está vacía (sin mostrar el valor sensible)
  const diagnosis = nextPublicKeys.reduce((acc, key) => {
    const value = process.env[key];
    acc[key] = {
      defined: value !== undefined,
      length: value ? value.length : 0,
      prefix: value ? value.substring(0, 5) : 'none'
    };
    return acc;
  }, {} as Record<string, any>);

  return NextResponse.json({
    message: "Diagnóstico de Variables de Entorno en Servidor",
    diagnosis
  });
}
