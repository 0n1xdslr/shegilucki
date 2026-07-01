'use client';

import { useState, useEffect } from 'react';
import { FileText, DollarSign, Calendar, TrendingUp, BarChart3, Users, Wrench, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReportesClientProps {
  role: string;
  sales: any[];
  services: any[];
  currentProfile: any;
}

export default function ReportesClient({ role, sales, services, currentProfile }: ReportesClientProps) {
  const [activeTab, setActiveTab] = useState<'ventas' | 'servicios'>(
    role === 'mecanico' ? 'servicios' : 'ventas'
  );
  const [isMounted, setIsMounted] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleExportToSignedPdf = async () => {
    setIsPdfLoading(true);
    try {
      const response = await fetch(`/api/reportes/firmar?type=${activeTab}`);
      if (!response.ok) {
        throw new Error('Error al generar PDF firmado');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${activeTab}_firmado_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Hubo un error al generar el PDF firmado digitalmente.');
    } finally {
      setIsPdfLoading(false);
    }
  };

  // --- STATS CALCULATIONS ---
  // Sales
  const totalSalesAmount = sales.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalSalesCount = sales.length;
  const avgSaleAmount = totalSalesCount > 0 ? (totalSalesAmount / totalSalesCount).toFixed(2) : '0.00';

  // Services
  const totalServicesCost = services.reduce((acc, curr) => acc + Number(curr.cost), 0);
  const totalServicesCount = services.length;
  const avgServiceCost = totalServicesCount > 0 ? (totalServicesCost / totalServicesCount).toFixed(2) : '0.00';

  // --- CHART DATA PREPARATION ---
  // Group sales/services by date
  const getSalesChartData = () => {
    const grouped: { [key: string]: number } = {};
    sales.slice(0, 10).reverse().forEach(s => {
      const date = new Date(s.sale_date).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] || 0) + Number(s.amount);
    });
    return Object.keys(grouped).map(key => ({ date: key, Monto: grouped[key] }));
  };

  const getServicesChartData = () => {
    const grouped: { [key: string]: number } = {};
    services.slice(0, 10).reverse().forEach(s => {
      const date = new Date(s.service_date).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] || 0) + Number(s.cost);
    });
    return Object.keys(grouped).map(key => ({ date: key, Costo: grouped[key] }));
  };

  const salesChartData = getSalesChartData();
  const servicesChartData = getServicesChartData();

  // --- WORD EXPORTER FUNCTION ---
  const handleExportToWord = () => {
    const dateStr = new Date().toLocaleDateString('es-PE');
    let contentHtml = '';

    if (role === 'vendedor' || (role !== 'mecanico' && activeTab === 'ventas')) {
      contentHtml = `
        <h1 style="text-align: center; color: #dc2626; font-family: 'Arial', sans-serif;">LUCKY MOTORS - REPORTE DE VENTAS</h1>
        <p style="text-align: center; color: #555; font-family: 'Arial', sans-serif;">Fecha de generación: ${dateStr} | Generado por: ${currentProfile.full_name} (${currentProfile.email})</p>
        <hr style="border: 1px solid #dc2626; margin-bottom: 20px;">
        
        <h3 style="color: #1e293b; font-family: 'Arial', sans-serif;">Resumen Estadístico</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-family: 'Arial', sans-serif;">
          <tr style="background-color: #dc2626; color: white;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Métrica</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Valor</th>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Total de Ventas Realizadas</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${totalSalesCount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Monto Total Facturado</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #16a34a;">S/ ${totalSalesAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Monto Promedio por Venta</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">S/ ${avgSaleAmount}</td>
          </tr>
        </table>

        <h3 style="color: #1e293b; font-family: 'Arial', sans-serif;">Listado Detallado de Ventas</h3>
        <table style="width: 100%; border-collapse: collapse; font-family: 'Arial', sans-serif;">
          <thead>
            <tr style="background-color: #f3f4f6; color: #111827;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Fecha</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Cliente</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Vehículo</th>
              ${role !== 'vendedor' ? '<th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Vendedor</th>' : ''}
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">Monto</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Notas</th>
            </tr>
          </thead>
          <tbody>
            ${sales.map(s => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${new Date(s.sale_date).toLocaleDateString('es-PE')}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${s.customer_name}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${s.vehicle_details}</td>
                ${role !== 'vendedor' ? `<td style="border: 1px solid #d1d5db; padding: 8px;">${s.profiles?.full_name || 'Sin asignar'}</td>` : ''}
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: bold;">S/ ${Number(s.amount).toFixed(2)}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; color: #555; font-style: italic;">${s.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      contentHtml = `
        <h1 style="text-align: center; color: #dc2626; font-family: 'Arial', sans-serif;">LUCKY MOTORS - REPORTE DE SERVICIOS</h1>
        <p style="text-align: center; color: #555; font-family: 'Arial', sans-serif;">Fecha de generación: ${dateStr} | Generado por: ${currentProfile.full_name} (${currentProfile.email})</p>
        <hr style="border: 1px solid #dc2626; margin-bottom: 20px;">
        
        <h3 style="color: #1e293b; font-family: 'Arial', sans-serif;">Resumen Estadístico</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-family: 'Arial', sans-serif;">
          <tr style="background-color: #dc2626; color: white;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Métrica</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Valor</th>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Total de Servicios Atendidos</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${totalServicesCount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Costo Total Facturado</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #16a34a;">S/ ${totalServicesCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">Costo Promedio por Servicio</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">S/ ${avgServiceCost}</td>
          </tr>
        </table>

        <h3 style="color: #1e293b; font-family: 'Arial', sans-serif;">Listado Detallado de Servicios</h3>
        <table style="width: 100%; border-collapse: collapse; font-family: 'Arial', sans-serif;">
          <thead>
            <tr style="background-color: #f3f4f6; color: #111827;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Fecha</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Cliente</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Vehículo</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Descripción</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Estado</th>
              ${role !== 'mecanico' ? '<th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Mecánico</th>' : ''}
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: right;">Costo</th>
            </tr>
          </thead>
          <tbody>
            ${services.map(s => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${new Date(s.service_date).toLocaleDateString('es-PE')}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${s.customer_name}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${s.vehicle_details}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${s.description}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold;">${s.status}</td>
                ${role !== 'mecanico' ? `<td style="border: 1px solid #d1d5db; padding: 8px;">${s.profiles?.full_name || 'Sin asignar'}</td>` : ''}
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: bold;">S/ ${Number(s.cost).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
          "xmlns:w='urn:schemas-microsoft-com:office:word' " +
          "xmlns='http://www.w3.org/TR/REC-html40'>" +
          "<head><title>Reporte Lucky Motors</title><meta charset='utf-8'></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + contentHtml + footer;
    
    const blob = new Blob(['\ufeff' + sourceHTML], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = url;
    fileDownload.download = `reporte_${role === 'vendedor' || (role !== 'mecanico' && activeTab === 'ventas') ? 'ventas' : 'servicios'}_${new Date().toISOString().split('T')[0]}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const showVentas = role === 'super_admin' || role === 'admin' || role === 'auditor' || role === 'vendedor';
  const showServicios = role === 'super_admin' || role === 'admin' || role === 'auditor' || role === 'mecanico';
  const isMultipleTabs = showVentas && showServicios;

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER CARD */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div>
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Reportes y Estadísticas
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Visualiza y descarga reportes formales de Lucky Motors.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportToWord}
            className="inline-flex items-center justify-center gap-2.5 rounded-md bg-red-600 px-6 py-2.5 text-center font-medium text-white hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FileText size={20} />
            Exportar a Word
          </button>
          <button
            onClick={handleExportToSignedPdf}
            disabled={isPdfLoading}
            className="inline-flex items-center justify-center gap-2.5 rounded-md bg-green-600 px-6 py-2.5 text-center font-medium text-white hover:bg-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <ShieldAlert size={20} />
            {isPdfLoading ? 'Firmando...' : 'Exportar PDF Firmado'}
          </button>
        </div>
      </div>

      {/* TABS FOR ADMINS/AUDITORS */}
      {isMultipleTabs && (
        <div className="flex gap-4 border-b border-stroke dark:border-strokedark">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-all ${
              activeTab === 'ventas'
                ? 'border-red-600 text-red-600 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-red-600'
            }`}
          >
            <DollarSign size={18} />
            Reporte de Ventas
          </button>
          <button
            onClick={() => setActiveTab('servicios')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-all ${
              activeTab === 'servicios'
                ? 'border-red-600 text-red-600 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-red-600'
            }`}
          >
            <Wrench size={18} />
            Reporte de Servicios
          </button>
        </div>
      )}

      {/* KPI GRID */}
      {activeTab === 'ventas' && showVentas && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-500">Monto Total Facturado</span>
              <h4 className="text-2xl font-bold text-black dark:text-white mt-1">S/ {totalSalesAmount.toFixed(2)}</h4>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-meta-2 text-green-500 bg-green-500/10 dark:bg-green-950/20">
              <DollarSign size={22} />
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-500">Ventas Registradas</span>
              <h4 className="text-2xl font-bold text-black dark:text-white mt-1">{totalSalesCount}</h4>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-meta-2 text-blue-500 bg-blue-500/10 dark:bg-blue-950/20">
              <TrendingUp size={22} />
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-500">Ticket Promedio</span>
              <h4 className="text-2xl font-bold text-black dark:text-white mt-1">S/ {avgSaleAmount}</h4>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-meta-2 text-purple-500 bg-purple-500/10 dark:bg-purple-950/20">
              <BarChart3 size={22} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'servicios' && showServicios && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-500">Costo Total Facturado</span>
              <h4 className="text-2xl font-bold text-black dark:text-white mt-1">S/ {totalServicesCost.toFixed(2)}</h4>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-meta-2 text-green-500 bg-green-500/10 dark:bg-green-950/20">
              <DollarSign size={22} />
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-500">Servicios Atendidos</span>
              <h4 className="text-2xl font-bold text-black dark:text-white mt-1">{totalServicesCount}</h4>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-meta-2 text-blue-500 bg-blue-500/10 dark:bg-blue-950/20">
              <Wrench size={22} />
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-500">Costo Promedio</span>
              <h4 className="text-2xl font-bold text-black dark:text-white mt-1">S/ {avgServiceCost}</h4>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-meta-2 text-purple-500 bg-purple-500/10 dark:bg-purple-950/20">
              <BarChart3 size={22} />
            </div>
          </div>
        </div>
      )}

      {/* GRAPH CHART VIEW */}
      {isMounted && (
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h4 className="mb-4 text-lg font-semibold text-black dark:text-white">
            Tendencia Reciente
          </h4>
          <div className="h-75 w-full">
            {activeTab === 'ventas' && salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#8a99ad" />
                  <YAxis stroke="#8a99ad" />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="Monto" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : activeTab === 'servicios' && servicesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#8a99ad" />
                  <YAxis stroke="#8a99ad" />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="Costo" fill="#3c50e0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-500">
                No hay datos suficientes para graficar.
              </div>
            )}
          </div>
        </div>
      )}

      {/* DATA TABLES SUMMARY */}
      {activeTab === 'ventas' && showVentas && (
        <div className="rounded-sm border border-stroke bg-white px-5 pb-5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h4 className="mb-4 text-lg font-semibold text-black dark:text-white">
            Detalle de Transacciones
          </h4>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-slate-100 text-left dark:bg-meta-4">
                  <th className="px-4 py-3 font-medium text-black dark:text-white">Fecha</th>
                  <th className="px-4 py-3 font-medium text-black dark:text-white">Cliente</th>
                  <th className="px-4 py-3 font-medium text-black dark:text-white">Vehículo</th>
                  {role !== 'vendedor' && <th className="px-4 py-3 font-medium text-black dark:text-white">Vendedor</th>}
                  <th className="px-4 py-3 font-medium text-black dark:text-white text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={role === 'vendedor' ? 4 : 5} className="text-center py-4 text-slate-500">
                      No hay transacciones registradas.
                    </td>
                  </tr>
                ) : (
                  sales.map((s, idx) => (
                    <tr key={idx} className="border-b border-stroke dark:border-strokedark">
                      <td className="px-4 py-3.5 text-black dark:text-white">
                        {new Date(s.sale_date).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-4 py-3.5 text-black dark:text-white font-medium">{s.customer_name}</td>
                      <td className="px-4 py-3.5 text-black dark:text-white">{s.vehicle_details}</td>
                      {role !== 'vendedor' && (
                        <td className="px-4 py-3.5 text-black dark:text-white">
                          {s.profiles?.full_name || 'Sin asignar'}
                        </td>
                      )}
                      <td className="px-4 py-3.5 text-right font-bold text-green-600 dark:text-green-400">
                        S/ {Number(s.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'servicios' && showServicios && (
        <div className="rounded-sm border border-stroke bg-white px-5 pb-5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h4 className="mb-4 text-lg font-semibold text-black dark:text-white">
            Detalle de Servicios
          </h4>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-slate-100 text-left dark:bg-meta-4">
                  <th className="px-4 py-3 font-medium text-black dark:text-white">Fecha</th>
                  <th className="px-4 py-3 font-medium text-black dark:text-white">Cliente</th>
                  <th className="px-4 py-3 font-medium text-black dark:text-white">Vehículo</th>
                  <th className="px-4 py-3 font-medium text-black dark:text-white">Descripción</th>
                  <th className="px-4 py-3 font-medium text-black dark:text-white">Estado</th>
                  {role !== 'mecanico' && <th className="px-4 py-3 font-medium text-black dark:text-white">Mecánico</th>}
                  <th className="px-4 py-3 font-medium text-black dark:text-white text-right">Costo</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={role === 'mecanico' ? 6 : 7} className="text-center py-4 text-slate-500">
                      No hay servicios registrados.
                    </td>
                  </tr>
                ) : (
                  services.map((s, idx) => (
                    <tr key={idx} className="border-b border-stroke dark:border-strokedark">
                      <td className="px-4 py-3.5 text-black dark:text-white">
                        {new Date(s.service_date).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-4 py-3.5 text-black dark:text-white font-medium">{s.customer_name}</td>
                      <td className="px-4 py-3.5 text-black dark:text-white">{s.vehicle_details}</td>
                      <td className="px-4 py-3.5 text-black dark:text-white text-sm max-w-60 truncate" title={s.description}>
                        {s.description}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          s.status === 'Realizado' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                          s.status === 'En progreso' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      {role !== 'mecanico' && (
                        <td className="px-4 py-3.5 text-black dark:text-white">
                          {s.profiles?.full_name || 'Sin asignar'}
                        </td>
                      )}
                      <td className="px-4 py-3.5 text-right font-bold text-black dark:text-white">
                        S/ {Number(s.cost).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
