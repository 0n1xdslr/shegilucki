'use client';

import { useState } from 'react';
import { PlusCircle, Search, Edit2, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { createRisk, updateRisk, deleteRisk } from '@/actions';

interface RiesgosClientProps {
  initialRiesgos: any[];
  assets: any[];
  threats: any[];
  vulnerabilities: any[];
}

export default function RiesgosClient({ initialRiesgos, assets, threats, vulnerabilities }: RiesgosClientProps) {
  const [riesgos, setRiesgos] = useState(initialRiesgos);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRiesgo, setEditingRiesgo] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredRiesgos = riesgos.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenModal = (riesgo?: any) => {
    setEditingRiesgo(riesgo || null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (riesgo: any) => {
    setEditingRiesgo(riesgo);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (editingRiesgo) {
        await updateRisk(editingRiesgo.id, formData);
      } else {
        await createRisk(formData);
      }
      window.location.reload();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error guardando el riesgo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingRiesgo) return;
    setIsSubmitting(true);
    try {
      await deleteRisk(editingRiesgo.id);
      setRiesgos(riesgos.filter(r => r.id !== editingRiesgo.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error eliminando el riesgo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Gestión de Riesgos
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded bg-red-600 px-4.5 py-2 font-medium text-white hover:bg-opacity-90"
        >
          <PlusCircle size={20} />
          Nuevo Riesgo
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
                placeholder="Buscar riesgo..."
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-10 py-2 font-medium outline-none transition focus:border-red-500 active:border-red-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-red-500"
              />
           </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-100 text-left dark:bg-meta-4">
                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Riesgo</th>
                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Activo Afectado</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Probabilidad</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Impacto</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Nivel</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiesgos.length === 0 && (
                 <tr>
                    <td colSpan={6} className="text-center py-4">No se encontraron riesgos.</td>
                 </tr>
              )}
              {filteredRiesgos.map((riesgo) => (
                <tr key={riesgo.id}>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white font-medium">{riesgo.name}</p>
                    <p className="text-sm text-slate-500">{riesgo.description}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white">{riesgo.assets?.name}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white">{riesgo.probability}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white">{riesgo.impact}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                        riesgo.risk_level === 'Bajo' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        riesgo.risk_level === 'Medio' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        riesgo.risk_level === 'Alto' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                      {riesgo.risk_level} ({riesgo.risk_score})
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <div className="flex items-center space-x-3.5">
                      <button onClick={() => handleOpenModal(riesgo)} className="hover:text-blue-500">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteClick(riesgo)} className="hover:text-red-500">
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
        title={editingRiesgo ? 'Editar Riesgo' : 'Nuevo Riesgo'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Nombre del Riesgo</label>
            <input 
              name="name"
              required 
              defaultValue={editingRiesgo?.name || ''} 
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4" 
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Descripción</label>
            <textarea 
              name="description" 
              rows={2} 
              defaultValue={editingRiesgo?.description || ''} 
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4"
            ></textarea>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Activo</label>
              <select 
                name="asset_id" 
                required
                defaultValue={editingRiesgo?.asset_id || ''} 
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4"
              >
                <option value="">Seleccione...</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Amenaza</label>
              <select 
                name="threat_id" 
                required
                defaultValue={editingRiesgo?.threat_id || ''} 
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4"
              >
                <option value="">Seleccione...</option>
                {threats.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Vulnerabilidad</label>
              <select 
                name="vulnerability_id" 
                required
                defaultValue={editingRiesgo?.vulnerability_id || ''} 
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4"
              >
                <option value="">Seleccione...</option>
                {vulnerabilities.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Probabilidad (1-5)</label>
              <input 
                type="number"
                name="probability"
                required
                min="1" max="5"
                defaultValue={editingRiesgo?.probability || 1} 
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4" 
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">Impacto (1-5)</label>
              <input 
                type="number"
                name="impact"
                required
                min="1" max="5"
                defaultValue={editingRiesgo?.impact || 1} 
                className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4" 
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Mitigación Recomendada</label>
            <textarea 
              name="recommended_mitigation" 
              rows={2} 
              defaultValue={editingRiesgo?.recommended_mitigation || ''} 
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4"
            ></textarea>
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
        title="Eliminar Riesgo"
      >
        <div className="p-2">
          <p className="mb-6 text-black dark:text-white">
            ¿Estás seguro que deseas eliminar el riesgo <strong>{editingRiesgo?.name}</strong>?
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
