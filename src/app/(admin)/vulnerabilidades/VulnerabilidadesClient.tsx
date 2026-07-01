'use client';

import { useState } from 'react';
import { PlusCircle, Search, Edit2, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { createVulnerability, updateVulnerability, deleteVulnerability } from '@/actions';

export default function VulnerabilidadesClient({ initialVulnerabilidades }: { initialVulnerabilidades: any[] }) {
  const [vulnerabilidades, setVulnerabilidades] = useState(initialVulnerabilidades);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingVulnerabilidad, setEditingVulnerabilidad] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredVulnerabilidades = vulnerabilidades.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    (v.description && v.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenModal = (vulnerabilidad?: any) => {
    setEditingVulnerabilidad(vulnerabilidad || null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (vulnerabilidad: any) => {
    setEditingVulnerabilidad(vulnerabilidad);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (editingVulnerabilidad) {
        await updateVulnerability(editingVulnerabilidad.id, formData);
        setVulnerabilidades(vulnerabilidades.map(v => v.id === editingVulnerabilidad.id ? { ...v, ...Object.fromEntries(formData), is_active: formData.get('is_active') === 'on' } : v));
      } else {
        await createVulnerability(formData);
        window.location.reload();
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error guardando la vulnerabilidad');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingVulnerabilidad) return;
    setIsSubmitting(true);
    try {
      await deleteVulnerability(editingVulnerabilidad.id);
      setVulnerabilidades(vulnerabilidades.filter(v => v.id !== editingVulnerabilidad.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error eliminando la vulnerabilidad');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Catálogo de Vulnerabilidades
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded bg-red-600 px-4.5 py-2 font-medium text-white hover:bg-opacity-90"
        >
          <PlusCircle size={20} />
          Nueva Vulnerabilidad
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
                placeholder="Buscar vulnerabilidad..."
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-10 py-2 font-medium outline-none transition focus:border-red-500 active:border-red-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-red-500"
              />
           </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-100 text-left dark:bg-meta-4">
                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Nombre</th>
                <th className="min-w-[300px] px-4 py-4 font-medium text-black dark:text-white">Descripción</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Estado</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredVulnerabilidades.length === 0 && (
                 <tr>
                    <td colSpan={4} className="text-center py-4">No se encontraron vulnerabilidades.</td>
                 </tr>
              )}
              {filteredVulnerabilidades.map((vulnerabilidad) => (
                <tr key={vulnerabilidad.id}>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white font-medium">{vulnerabilidad.name}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white">{vulnerabilidad.description}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                        vulnerabilidad.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      }`}>
                      {vulnerabilidad.is_active ? 'Activo' : 'Inactivo'}
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <div className="flex items-center space-x-3.5">
                      <button onClick={() => handleOpenModal(vulnerabilidad)} className="hover:text-blue-500">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteClick(vulnerabilidad)} className="hover:text-red-500">
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
        title={editingVulnerabilidad ? 'Editar Vulnerabilidad' : 'Nueva Vulnerabilidad'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Nombre de la Vulnerabilidad</label>
            <input 
              name="name"
              required 
              defaultValue={editingVulnerabilidad?.name || ''} 
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4" 
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Descripción</label>
            <textarea 
              name="description" 
              rows={3} 
              defaultValue={editingVulnerabilidad?.description || ''} 
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4"
            ></textarea>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              name="is_active" 
              id="is_active"
              defaultChecked={editingVulnerabilidad ? editingVulnerabilidad.is_active : true}
              className="h-4 w-4 rounded border-stroke text-red-600 focus:ring-red-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-black dark:text-white">
              Estado Activo
            </label>
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
        title="Eliminar Vulnerabilidad"
      >
        <div className="p-2">
          <p className="mb-6 text-black dark:text-white">
            ¿Estás seguro que deseas eliminar la vulnerabilidad <strong>{editingVulnerabilidad?.name}</strong>?
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
