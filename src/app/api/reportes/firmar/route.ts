import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAndSignReportPdf } from '@/lib/pdfSigner';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Validar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    // 2. Obtener perfil y rol del usuario
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!currentProfile) {
      return new NextResponse('Perfil no encontrado', { status: 404 });
    }

    // 3. Leer tipo de reporte del query param (?type=ventas o ?type=servicios)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'ventas' | 'servicios';

    if (type !== 'ventas' && type !== 'servicios') {
      return new NextResponse('Tipo de reporte inválido', { status: 400 });
    }

    // 4. Validar autorizaciones por Rol
    const role = currentProfile.role;
    const isAuthorized = ['super_admin', 'admin', 'auditor', 'vendedor', 'mecanico'].includes(role);
    if (!isAuthorized) {
      return new NextResponse('No autorizado para ver reportes', { status: 403 });
    }

    if (type === 'ventas' && !['super_admin', 'admin', 'auditor', 'vendedor'].includes(role)) {
      return new NextResponse('No autorizado para reportes de ventas', { status: 403 });
    }

    if (type === 'servicios' && !['super_admin', 'admin', 'auditor', 'mecanico'].includes(role)) {
      return new NextResponse('No autorizado para reportes de servicios', { status: 403 });
    }

    // 5. Cargar datos desde la base de datos
    let data: any[] = [];

    if (type === 'ventas') {
      let query = supabase.from('sales').select('*, profiles:seller_id(full_name, email)');
      if (role === 'vendedor') {
        query = query.eq('seller_id', user.id);
      }
      const { data: salesData, error: dbError } = await query.order('sale_date', { ascending: false });
      if (dbError) throw dbError;
      data = salesData || [];
    } else {
      let query = supabase.from('services').select('*, profiles:mechanic_id(full_name, email)');
      if (role === 'mecanico') {
        query = query.eq('mechanic_id', user.id);
      }
      const { data: servicesData, error: dbError } = await query.order('service_date', { ascending: false });
      if (dbError) throw dbError;
      data = servicesData || [];
    }

    // 6. Generar el PDF firmado
    const signedPdfBuffer = await generateAndSignReportPdf(data, type, {
      full_name: currentProfile.full_name,
      email: currentProfile.email,
    });

    // 7. Retornar el archivo PDF
    return new NextResponse(new Uint8Array(signedPdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte_${type}_firmado_${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error al generar PDF firmado:', error);
    return new NextResponse(`Error interno del servidor: ${error.message}`, { status: 500 });
  }
}
