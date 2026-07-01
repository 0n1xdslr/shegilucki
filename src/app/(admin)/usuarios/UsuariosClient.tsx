'use client';

import { useState } from 'react';
import { PlusCircle, Search, Edit2, Trash2, Shield, User } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { createUserAction, updateUserAction, deleteUserAction } from '@/actions';
import { validatePassword } from '@/lib/utils/password';

export default function UsuariosClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const passwordInfo = validatePassword(password);

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (user?: any) => {
    setEditingUser(user || null);
    setPassword('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (user: any) => {
    setEditingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    const formData = new FormData(e.currentTarget);
    
    // Check password validation
    const typedPassword = formData.get('password') as string;
    if (!editingUser || (editingUser && typedPassword)) {
      const pwdCheck = validatePassword(typedPassword);
      if (!pwdCheck.isValid) {
        setErrorMessage(pwdCheck.message);
        setIsSubmitting(false);
        return;
      }
    }
    
    try {
      if (editingUser) {
        await updateUserAction(editingUser.id, formData);
        setUsers(users.map(u => u.id === editingUser.id ? { 
          ...u, 
          email: formData.get('email'), 
          full_name: formData.get('full_name'), 
          role: formData.get('role') 
        } : u));
        setIsModalOpen(false);
      } else {
        await createUserAction(formData);
        // Reload page to display new user UUID and state
        window.location.reload();
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Error al guardar el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      await deleteUserAction(editingUser.id);
      setUsers(users.filter(u => u.id !== editingUser.id));
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error(error);
      alert('Error al eliminar el usuario: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'vendedor': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'mecanico': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'auditor': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrador';
      case 'vendedor': return 'Vendedor';
      case 'mecanico': return 'Mecánico';
      case 'auditor': return 'Auditor';
      case 'viewer': return 'Lector';
      default: return role;
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Gestión de Usuarios y Roles
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Administra las cuentas de usuario, contraseñas y roles de Lucky Motors.
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded bg-red-600 px-4.5 py-2 font-medium text-white hover:bg-opacity-90 transition-all shadow-md"
        >
          <PlusCircle size={20} />
          Nuevo Usuario
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
                placeholder="Buscar por nombre, correo o rol..."
                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-10 py-2 font-medium outline-none transition focus:border-red-500 active:border-red-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-red-500 text-slate-800 dark:text-white"
              />
           </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-100 text-left dark:bg-meta-4">
                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Nombre Completo</th>
                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Correo Electrónico</th>
                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Rol</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Fecha de Registro</th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                 <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-500">No se encontraron usuarios registrados.</td>
                 </tr>
              )}
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-meta-4/20 transition-colors">
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <User size={16} />
                      </div>
                      <p className="text-black dark:text-white font-medium">{user.full_name || 'Sin Nombre'}</p>
                    </div>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-black dark:text-white">{user.email}</p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <p className="text-slate-500 text-sm">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                    </p>
                  </td>
                  <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                    <div className="flex items-center space-x-3.5">
                      <button onClick={() => handleOpenModal(user)} className="text-slate-500 hover:text-blue-600 transition-colors" title="Editar">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteClick(user)} className="text-slate-500 hover:text-red-600 transition-colors" title="Eliminar">
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
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMessage && (
            <div className="p-3 rounded bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 text-sm font-medium text-center">
              {errorMessage}
            </div>
          )}
          
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Nombre Completo</label>
            <input 
              name="full_name"
              required 
              defaultValue={editingUser?.full_name || ''} 
              placeholder="Ej. Juan Pérez"
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white" 
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Correo Electrónico</label>
            <input 
              type="email"
              name="email"
              required 
              defaultValue={editingUser?.email || ''} 
              placeholder="juan.perez@luckymotors.com"
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white" 
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              Contraseña {editingUser && <span className="text-xs text-slate-500">(Dejar en blanco para no modificar)</span>}
            </label>
            <input 
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!editingUser}
              placeholder={editingUser ? "••••••••" : "Mínimo 10 caracteres"}
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white" 
            />

            {password && (
              <div className="mt-2 space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded border border-stroke/40">
                {/* Strength Bar */}
                <div className="flex gap-1 h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        i < passwordInfo.score
                          ? passwordInfo.score <= 1
                            ? 'bg-red-500'
                            : passwordInfo.score === 2
                            ? 'bg-orange-500'
                            : passwordInfo.score === 3
                            ? 'bg-yellow-500'
                            : passwordInfo.score === 4
                            ? 'bg-emerald-400'
                            : 'bg-emerald-600'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Strength Label */}
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500">Seguridad de contraseña:</span>
                  <span className={`font-semibold ${
                    passwordInfo.score <= 1
                      ? 'text-red-500'
                      : passwordInfo.score === 2
                      ? 'text-orange-500'
                      : passwordInfo.score === 3
                      ? 'text-yellow-500'
                      : passwordInfo.score === 4
                      ? 'text-emerald-400'
                      : 'text-emerald-600'
                  }`}>
                    {passwordInfo.score <= 1
                      ? 'Muy Débil'
                      : passwordInfo.score === 2
                      ? 'Débil'
                      : passwordInfo.score === 3
                      ? 'Moderada'
                      : passwordInfo.score === 4
                      ? 'Segura'
                      : 'Muy Segura'}
                  </span>
                </div>

                {/* Requirements Checklist */}
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-500">
                  <li className="flex items-center gap-1">
                    <span className={`w-1 h-1 rounded-full transition-colors ${passwordInfo.hasMinLength ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    <span>Mínimo 10 caracteres</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <span className={`w-1 h-1 rounded-full transition-colors ${passwordInfo.hasUppercase ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    <span>Una mayúscula (A-Z)</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <span className={`w-1 h-1 rounded-full transition-colors ${passwordInfo.hasLowercase ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    <span>Una minúscula (a-z)</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <span className={`w-1 h-1 rounded-full transition-colors ${passwordInfo.hasDigit ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    <span>Un número (0-9)</span>
                  </li>
                  <li className="flex items-center gap-1 col-span-2">
                    <span className={`w-1 h-1 rounded-full transition-colors ${passwordInfo.hasSpecial ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    <span>Carácter especial (ej. !, @, #, $, etc.)</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Rol / Nivel de Acceso</label>
            <select 
              name="role" 
              required
              defaultValue={editingUser?.role || 'viewer'} 
              className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-red-500 dark:border-strokedark dark:bg-meta-4 text-slate-800 dark:text-white"
            >
              <option value="super_admin" className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">Super Admin</option>
              <option value="admin" className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">Administrador</option>
              <option value="vendedor" className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">Vendedor</option>
              <option value="mecanico" className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">Mecánico</option>
              <option value="auditor" className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">Auditor</option>
              <option value="viewer" className="bg-white dark:bg-boxdark text-slate-800 dark:text-white">Lector (Viewer)</option>
            </select>
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
        title="Eliminar Usuario"
      >
        <div className="p-2">
          <p className="mb-6 text-black dark:text-white">
            ¿Estás seguro que deseas eliminar la cuenta de <strong>{editingUser?.full_name || editingUser?.email}</strong>? Esta acción borrará permanentemente sus accesos e información relacionada.
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
