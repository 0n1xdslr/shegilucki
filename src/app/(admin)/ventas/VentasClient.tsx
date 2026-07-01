'use client';

import { useState } from 'react';
import { PlusCircle, Search, Edit2, Trash2, DollarSign, Car } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { createSaleAction, updateSaleAction, deleteSaleAction } from '@/actions';

interface VentasClientProps {
  initialSales: any[];
  sellers: any[];
  currentProfile: any;
}

export default function VentasClient({ initialSales, sellers, currentProfile }: VentasClientProps) {
  const [sales, setSales] = useState(initialSales);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentProfile.role === 'admin' || currentProfile.role === 'super_admin';

  const filteredSales = sales.filter(s => 
    s.customer_name.toLowerCase().includes(search.toLowerCase()) || 
    s.vehicle_details.toLowerCase().includes(search.toLowerCase()) ||
    (s.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (sale?: any) => {
    setEditingSale(sale || null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (sale: any) => {
    setEditingSale(sale);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // If not admin, append current user's profile ID as the seller ID
    if (!isAdmin) {
      formData.append('seller_id', currentProfile.id);
    }

    try {
      if (editingSale) {
        await updateSaleAction(editingSale.id, formData);
        
        // Optimistic UI update
        const updatedSaleData: any = {
          customer_name: formData.get('customer_name') as string,
          vehicle_details: formData.get('vehicle_details') as string,
          amount: parseFloat(formData.get('amount') as string),
          sale_date: formData.get('sale_date') as string,
          notes: formData.get('notes') as string,
        };

        if (isAdmin && formData.get('seller_id')) {
          const selectedSeller = sellers.find(sel => sel.id === formData.get('seller_id'));
          updatedSaleData.profiles = selectedSeller ? { full_name: selectedSeller.full_name } : null;
        } else {
          updatedSaleData.profiles = { full_name: currentProfile.full_name };
        }

        setSales(sales.map(s => s.id === editingSale.id ? { ...s, ...updatedSaleData } : s));
        setIsModalOpen(false);
      } else {
        await createSaleAction(formData);
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      alert('Error al guardar la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSale) return;
    setIsSubmitting(true);
    try {
      await deleteSaleAction(editingSale.id);
      setSales(sales.filter(s => s.id !== editingSale.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error al eliminar la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Registro de Ventas
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAdmin 
              ? 'Administra y audita todas las ventas de mototaxis y repuestos de Lucky Motors.'
              : 'Registra tus ventas y realiza el seguimiento de tus comisiones.'
            }
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded bg-red-600 px-4.5 py-2 font-medium text-white hover:bg-opacity-90 transition-all shadow-md"
        >
          <PlusCircle size={20} />
          Nueva Venta
        </button>
      </div>

      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="relative w-full sm:w-1/2 md:w-1/3">
              <span className="absolute left-4.5 top-1/2 -translate-y-1/2">
                <Search size={18} className="text-slate-500" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente o vehículo..."
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-10 py-2 font-medium outline-none transition focus:border-red-500 active:border-red-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-red-500 text-slate-800 dark:text-white"
              />
           </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-100 text-left dark:bg-meta-4">
                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Cliente</th>
                <th className="min-w-[180px] px-4 py-4 font-medium text-black dark:text-white">Vehículo / Producto</th>
                {isAdmin && <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Vendedor</th>}
                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Fecha</th>
                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">Monto</th>
                <th className="min-w-[180px] px-4 py-4 font-medium text-black dark:text-white">Notas</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 && (
                 <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="text-center py-6 text-slate-500">No se encontraron registros de ventas.</td>
                 </tr>
              )}
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-meta-4/20 transition-colors">
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white font-medium">{sale.customer_name}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <div className="flex items-center gap-1.5">
                      <Car size={16} className="text-slate-500" />
                      <p className="text-black dark:text-white">{sale.vehicle_details}</p>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <p className="text-slate-800 dark:text-slate-200">{sale.profiles?.full_name || 'Desconocido'}</p>
                    </td>
                  )}
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white">
                      {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) : '-'}
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <div className="flex items-center gap-1 text-success font-semibold">
                      <DollarSign size={15} />
                      <span>{formatCurrency(sale.amount)}</span>
                    </div>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-slate-500 dark:text-slate-400 text-sm italic">{sale.notes || '-'}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <div className="flex items-center space-x-3.5">
                      <button onClick={() => handleOpenModal(sale)} className="text-slate-500 hover:text-blue-600 transition-colors" title="Editar">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteClick(sale)} className="text-slate-500 hover:text-red-600 transition-colors" title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FOR CREATE/EDIT */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingSale ? 'Editar Venta' : 'Registrar Nueva Venta'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Cliente (Nombre Completo)</label>
            <input 
              name="customer_name"
              required 
              defaultValue={editingSale?.customer_name || ''} 
              placeholder="Ej. María Rojas Huamán"
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white" 
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Vehículo / Detalle del Producto</label>
            <input 
              name="vehicle_details"
              required 
              defaultValue={editingSale?.vehicle_details || ''} 
              placeholder="Ej. Mototaxi Honda CC125 Rojo o Repuestos Varios"
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Monto (S/.)</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                name="amount"
                required 
                defaultValue={editingSale?.amount || ''} 
                placeholder="Ej. 7500.00"
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white" 
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Fecha de Venta</label>
              <input 
                type="date"
                name="sale_date"
                required 
                defaultValue={editingSale?.sale_date || new Date().toISOString().split('T')[0]} 
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white" 
              />
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Asignar Vendedor</label>
              <select 
                name="seller_id" 
                required
                defaultValue={editingSale?.seller_id || ''} 
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white"
              >
                <option value="" className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">-- Seleccionar Vendedor --</option>
                {sellers.map((sel) => (
                  <option key={sel.id} value={sel.id} className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">
                    {sel.full_name} ({sel.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Notas / Observaciones</label>
            <textarea 
              name="notes" 
              rows={3} 
              placeholder="Ej. Pago realizado en efectivo, garantía de 1 año..."
              defaultValue={editingSale?.notes || ''} 
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white"
            ></textarea>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="rounded bg-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex justify-center rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL FOR DELETE CONFIRMATION */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Eliminar Venta"
      >
        <div className="p-2">
          <p className="mb-6 text-black dark:text-white">
            ¿Estás seguro que deseas eliminar el registro de venta para <strong>{editingSale?.customer_name}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded bg-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleDelete}
              disabled={isSubmitting}
              className="rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
