'use client';

import { useState } from 'react';
import { PlusCircle, Search, Edit2, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { createThreat, updateThreat, deleteThreat } from '@/actions';

export default function AmenazasClient({ initialAmenazas }: { initialAmenazas: any[] }) {
  const [amenazas, setAmenazas] = useState(initialAmenazas);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAmenaza, setEditingAmenaza] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredAmenazas = amenazas.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    (a.category && a.category.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenModal = (amenaza?: any) => {
    setEditingAmenaza(amenaza || null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (amenaza: any) => {
    setEditingAmenaza(amenaza);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (editingAmenaza) {
        await updateThreat(editingAmenaza.id, formData);
        setAmenazas(amenazas.map(a => a.id === editingAmenaza.id ? { ...a, ...Object.fromEntries(formData), is_active: formData.get('is_active') === 'on' } : a));
      } else {
        await createThreat(formData);
        window.location.reload();
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error guardando la amenaza');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAmenaza) return;
    setIsSubmitting(true);
    try {
      await deleteThreat(editingAmenaza.id);
      setAmenazas(amenazas.filter(a => a.id !== editingAmenaza.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error eliminando la amenaza');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Catálogo de Amenazas
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded bg-red-600 px-4.5 py-2 font-medium text-white hover:bg-opacity-90"
        >
          <PlusCircle size={20} />
          Nueva Amenaza
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
                placeholder="Buscar amenaza..."
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-10 py-2 font-medium outline-none transition focus:border-red-500 active:border-red-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-red-500"
              />
           </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-100 text-left dark:bg-meta-4">
                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Nombre</th>
                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Categoría</th>
                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Descripción</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Estado</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAmenazas.length === 0 && (
                 <tr>
                    <td colSpan={5} className="text-center py-4">No se encontraron amenazas.</td>
                 </tr>
              )}
              {filteredAmenazas.map((amenaza) => (
                <tr key={amenaza.id}>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white font-medium">{amenaza.name}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white">{amenaza.category || 'N/A'}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white">{amenaza.description}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                        amenaza.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      }`}>
                      {amenaza.is_active ? 'Activo' : 'Inactivo'}
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <div className="flex items-center space-x-3.5">
                      <button onClick={() => handleOpenModal(amenaza)} className="hover:text-blue-500">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteClick(amenaza)} className="hover:text-red-500">
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
        title={editingAmenaza ? 'Editar Amenaza' : 'Nueva Amenaza'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Nombre de la Amenaza</label>
            <input 
              name="name"
              required 
              defaultValue={editingAmenaza?.name || ''} 
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4" 
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Categoría</label>
            <input 
              name="category"
              defaultValue={editingAmenaza?.category || ''} 
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4" 
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Descripción</label>
            <textarea 
              name="description" 
              rows={3} 
              defaultValue={editingAmenaza?.description || ''} 
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4"
            ></textarea>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              name="is_active" 
              id="is_active"
              defaultChecked={editingAmenaza ? editingAmenaza.is_active : true}
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
        title="Eliminar Amenaza"
      >
        <div className="p-2">
          <p className="mb-6 text-black dark:text-white">
            ¿Estás seguro que deseas eliminar la amenaza <strong>{editingAmenaza?.name}</strong>?
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
