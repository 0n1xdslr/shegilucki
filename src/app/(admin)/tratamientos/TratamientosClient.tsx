'use client';

import { useState } from 'react';
import { PlusCircle, Search, Edit2, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { createTreatment, updateTreatment, deleteTreatment } from '@/actions';

interface TratamientosClientProps {
  initialTratamientos: any[];
  riesgos: any[];
}

export default function TratamientosClient({ initialTratamientos, riesgos }: TratamientosClientProps) {
  const [tratamientos, setTratamientos] = useState(initialTratamientos);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTratamiento, setEditingTratamiento] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTratamientos = tratamientos.filter(t => 
    (t.strategy && t.strategy.toLowerCase().includes(search.toLowerCase())) || 
    (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
    (t.risks?.name && t.risks.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenModal = (tratamiento?: any) => {
    setEditingTratamiento(tratamiento || null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (tratamiento: any) => {
    setEditingTratamiento(tratamiento);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (editingTratamiento) {
        await updateTreatment(editingTratamiento.id, formData);
      } else {
        await createTreatment(formData);
      }
      window.location.reload();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error guardando el plan de tratamiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTratamiento) return;
    setIsSubmitting(true);
    try {
      await deleteTreatment(editingTratamiento.id);
      setTratamientos(tratamientos.filter(t => t.id !== editingTratamiento.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error eliminando el plan de tratamiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Plan de Tratamiento
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded bg-red-600 px-4.5 py-2 font-medium text-white hover:bg-opacity-90"
        >
          <PlusCircle size={20} />
          Nuevo Tratamiento
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
                placeholder="Buscar tratamiento..."
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-10 py-2 font-medium outline-none transition focus:border-red-500 active:border-red-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-red-500"
              />
           </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-100 text-left dark:bg-meta-4">
                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Riesgo Asociado</th>
                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Estrategia</th>
                <th className="min-w-[250px] px-4 py-4 font-medium text-black dark:text-white">Acción / Descripción</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Responsable</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Estado</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Costo Est.</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTratamientos.length === 0 && (
                 <tr>
                    <td colSpan={7} className="text-center py-4">No se encontraron tratamientos.</td>
                 </tr>
              )}
              {filteredTratamientos.map((tratamiento) => (
                <tr key={tratamiento.id}>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white font-medium">{tratamiento.risks?.name}</p>
                    <p className="text-sm text-slate-500">Nivel: {tratamiento.risks?.risk_level}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className={`inline-flex rounded-full bg-opacity-10 px-3 py-1 text-sm font-medium ${
                        tratamiento.strategy === 'Mitigar' ? 'bg-success text-success' :
                        tratamiento.strategy === 'Evitar' ? 'bg-primary text-primary' :
                        tratamiento.strategy === 'Transferir' ? 'bg-warning text-warning' :
                        'bg-danger text-danger'
                      }`}>
                      {tratamiento.strategy}
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white">{tratamiento.description}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white">{tratamiento.responsible}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white font-medium">{tratamiento.status}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white">${tratamiento.estimated_cost}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <div className="flex items-center space-x-3.5">
                      <button onClick={() => handleOpenModal(tratamiento)} className="hover:text-blue-500">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteClick(tratamiento)} className="hover:text-red-500">
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
        title={editingTratamiento ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Riesgo</label>
            <select 
              name="risk_id" 
              required
              defaultValue={editingTratamiento?.risk_id || ''} 
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4"
            >
              <option value="">Seleccione...</option>
              {riesgos.map(r => <option key={r.id} value={r.id}>{r.name} - Nivel: {r.risk_level}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Estrategia</label>
              <select 
                name="strategy" 
                required
                defaultValue={editingTratamiento?.strategy || 'Mitigar'} 
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4"
              >
                <option value="Mitigar">Mitigar</option>
                <option value="Evitar">Evitar</option>
                <option value="Transferir">Transferir</option>
                <option value="Aceptar">Aceptar</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Estado</label>
              <select 
                name="status" 
                required
                defaultValue={editingTratamiento?.status || 'Pendiente'} 
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En progreso">En progreso</option>
                <option value="Implementado">Implementado</option>
                <option value="Evaluación">Evaluación</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Descripción de la Acción</label>
            <textarea 
              name="description" 
              rows={2} 
              defaultValue={editingTratamiento?.description || ''} 
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4"
            ></textarea>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Responsable</label>
              <input 
                name="responsible"
                defaultValue={editingTratamiento?.responsible || ''} 
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4" 
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Costo Estimado ($)</label>
              <input 
                type="number"
                name="estimated_cost"
                step="0.01"
                min="0"
                defaultValue={editingTratamiento?.estimated_cost || 0} 
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4" 
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="rounded bg-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex justify-center rounded bg-red-600 px-4 py-2 font-medium text-gray hover:bg-red-700 disabled:opacity-50"
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
        title="Eliminar Tratamiento"
      >
        <div className="p-2">
          <p className="mb-6 text-black dark:text-white">
            ¿Estás seguro que deseas eliminar este tratamiento?
          </p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded bg-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
            >
              Cancelar
            </button>
            <button 
              onClick={handleDelete}
              disabled={isSubmitting}
              className="rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
