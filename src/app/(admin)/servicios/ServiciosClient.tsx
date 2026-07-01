'use client';

import { useState } from 'react';
import { PlusCircle, Search, Edit2, Trash2, DollarSign, Wrench, CheckCircle, Clock } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { createServiceAction, updateServiceAction, deleteServiceAction } from '@/actions';

interface ServiciosClientProps {
  initialServices: any[];
  mechanics: any[];
  currentProfile: any;
}

export default function ServiciosClient({ initialServices, mechanics, currentProfile }: ServiciosClientProps) {
  const [services, setServices] = useState(initialServices);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentProfile.role === 'admin' || currentProfile.role === 'super_admin';

  const filteredServices = services.filter(s => 
    s.customer_name.toLowerCase().includes(search.toLowerCase()) || 
    s.vehicle_details.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase()) ||
    (s.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (service?: any) => {
    setEditingService(service || null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (service: any) => {
    setEditingService(service);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // If not admin, append current user's profile ID as the mechanic ID
    if (!isAdmin) {
      formData.append('mechanic_id', currentProfile.id);
    }

    try {
      if (editingService) {
        await updateServiceAction(editingService.id, formData);
        
        // Optimistic UI update
        const updatedServiceData: any = {
          customer_name: formData.get('customer_name') as string,
          vehicle_details: formData.get('vehicle_details') as string,
          description: formData.get('description') as string,
          cost: parseFloat(formData.get('cost') as string),
          service_date: formData.get('service_date') as string,
          status: formData.get('status') as string,
          notes: formData.get('notes') as string,
        };

        if (isAdmin && formData.get('mechanic_id')) {
          const selectedMechanic = mechanics.find(mec => mec.id === formData.get('mechanic_id'));
          updatedServiceData.profiles = selectedMechanic ? { full_name: selectedMechanic.full_name } : null;
        } else {
          updatedServiceData.profiles = { full_name: currentProfile.full_name };
        }

        setServices(services.map(s => s.id === editingService.id ? { ...s, ...updatedServiceData } : s));
        setIsModalOpen(false);
      } else {
        await createServiceAction(formData);
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      alert('Error al guardar el servicio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingService) return;
    setIsSubmitting(true);
    try {
      await deleteServiceAction(editingService.id);
      setServices(services.filter(s => s.id !== editingService.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error al eliminar el servicio');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Realizado': return 'bg-success/10 text-success border border-success/20';
      case 'En progreso': return 'bg-warning/10 text-warning border border-warning/20';
      case 'Pendiente': return 'bg-danger/10 text-danger border border-danger/20';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Control de Servicios Técnicos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAdmin 
              ? 'Supervisa todos los mantenimientos y servicios de taller mecánico realizados.'
              : 'Registra los servicios mecánicos que realizas y mantén tu historial al día.'
            }
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded bg-red-600 px-4.5 py-2 font-medium text-white hover:bg-opacity-90 transition-all shadow-md"
        >
          <PlusCircle size={20} />
          Nuevo Servicio
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
                placeholder="Buscar por cliente, vehículo o servicio..."
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-10 py-2 font-medium outline-none transition focus:border-red-500 active:border-red-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-red-500 text-slate-800 dark:text-white"
              />
           </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-100 text-left dark:bg-meta-4">
                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Cliente</th>
                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Vehículo</th>
                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Servicio Realizado</th>
                {isAdmin && <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Mecánico</th>}
                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">Costo</th>
                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Fecha</th>
                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Estado</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.length === 0 && (
                 <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="text-center py-6 text-slate-500">No se encontraron registros de servicios.</td>
                 </tr>
              )}
              {filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-slate-50/50 dark:hover:bg-meta-4/20 transition-colors">
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white font-medium">{service.customer_name}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white">{service.vehicle_details}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <div className="flex items-start gap-1.5">
                      <Wrench size={16} className="text-slate-500 mt-0.5 shrink-0" />
                      <p className="text-slate-800 dark:text-slate-200 text-sm">{service.description}</p>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                      <p className="text-slate-800 dark:text-slate-200">{service.profiles?.full_name || 'Desconocido'}</p>
                    </td>
                  )}
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark font-semibold text-black dark:text-white">
                    {formatCurrency(service.cost)}
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      {service.service_date ? new Date(service.service_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) : '-'}
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(service.status)}`}>
                      {service.status === 'Realizado' && <CheckCircle size={12} />}
                      {service.status === 'En progreso' && <Clock size={12} />}
                      {service.status}
                    </span>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <div className="flex items-center space-x-3.5">
                      <button onClick={() => handleOpenModal(service)} className="text-slate-500 hover:text-blue-600 transition-colors" title="Editar">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteClick(service)} className="text-slate-500 hover:text-red-600 transition-colors" title="Eliminar">
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
        title={editingService ? 'Editar Servicio Mecánico' : 'Registrar Nuevo Servicio'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Cliente (Nombre Completo)</label>
            <input 
              name="customer_name"
              required 
              defaultValue={editingService?.customer_name || ''} 
              placeholder="Ej. Pedro Huamán"
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white" 
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Vehículo (Modelo / Placa)</label>
            <input 
              name="vehicle_details"
              required 
              defaultValue={editingService?.vehicle_details || ''} 
              placeholder="Ej. Honda CC125 Azul - Placa 4532-3X"
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white" 
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Servicio Realizado / Diagnóstico</label>
            <textarea 
              name="description" 
              required
              rows={2} 
              placeholder="Ej. Cambio de aceite de motor, ajuste de frenos y mantenimiento de suspensión delantera."
              defaultValue={editingService?.description || ''} 
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Costo del Servicio (S/.)</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                name="cost"
                required 
                defaultValue={editingService?.cost || ''} 
                placeholder="Ej. 120.00"
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white" 
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Fecha</label>
              <input 
                type="date"
                name="service_date"
                required 
                defaultValue={editingService?.service_date || new Date().toISOString().split('T')[0]} 
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white" 
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Estado</label>
              <select 
                name="status" 
                required
                defaultValue={editingService?.status || 'Realizado'} 
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white"
              >
                <option value="Realizado" className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">Realizado</option>
                <option value="En progreso" className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">En progreso</option>
                <option value="Pendiente" className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">Pendiente</option>
              </select>
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Asignar Mecánico</label>
              <select 
                name="mechanic_id" 
                required
                defaultValue={editingService?.mechanic_id || ''} 
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white"
              >
                <option value="" className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">-- Seleccionar Mecánico --</option>
                {mechanics.map((mec) => (
                  <option key={mec.id} value={mec.id} className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">
                    {mec.full_name} ({mec.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Notas / Repuestos Utilizados</label>
            <textarea 
              name="notes" 
              rows={3} 
              placeholder="Ej. Se usó aceite Honda original y pastillas de freno marca Brembo."
              defaultValue={editingService?.notes || ''} 
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
        title="Eliminar Servicio"
      >
        <div className="p-2">
          <p className="mb-6 text-black dark:text-white">
            ¿Estás seguro que deseas eliminar el registro de este servicio técnico para <strong>{editingService?.customer_name}</strong>? Esta acción no se puede deshacer.
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
