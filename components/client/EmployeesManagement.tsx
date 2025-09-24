import React, { useState } from 'react';
import type { Employee, PermissionProfile } from '../../types';
import { PlusCircleIcon, PencilIcon, TrashIcon, XMarkIcon, KeyIcon } from '../icons/Icons';

const getStatusClass = (status: 'Ativo' | 'Inativo') => {
  return status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800';
};

interface EmployeesManagementProps {
  employees: Employee[]; // Receives the pre-filtered list
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>; // The global setter
  companyId?: string;
  permissionProfiles: PermissionProfile[];
}

const EmployeesManagement: React.FC<EmployeesManagementProps> = ({ employees, setEmployees, companyId, permissionProfiles }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee> | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if(currentEmployee) {
        setCurrentEmployee({...currentEmployee, password});
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentEmployee({ name: '', cpf: '', email: '', address: '', status: 'Ativo', password: '', permissionProfileId: 'p_passenger' });
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setModalMode('edit');
    setCurrentEmployee({ ...employee });
    setIsModalOpen(true);
  };

  const openConfirmModal = (employeeId: string) => {
    setEmployeeToDelete(employeeId);
    setIsConfirmOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setIsConfirmOpen(false);
    setCurrentEmployee(null);
    setEmployeeToDelete(null);
  };

  const handleSave = () => {
    if (!currentEmployee || !currentEmployee.name || !currentEmployee.cpf) return;

    if (modalMode === 'create') {
        if (!companyId) {
            console.error("Cannot create an employee without a company ID.");
            return;
        }
      const newEmployee: Employee = {
        id: `e${Date.now()}`,
        companyId: companyId,
        ...currentEmployee,
      } as Employee;
      setEmployees(prevGlobalEmployees => [newEmployee, ...prevGlobalEmployees]);
    } else if (modalMode === 'edit' && currentEmployee.id) {
       setEmployees(prevGlobalEmployees => prevGlobalEmployees.map(e => (e.id === currentEmployee.id ? currentEmployee as Employee : e)));
    }
    handleClose();
  };

  const handleDelete = () => {
    if (!employeeToDelete) return;
    setEmployees(prevGlobalEmployees => prevGlobalEmployees.filter(e => e.id !== employeeToDelete));
    handleClose();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-golffox-gray-dark">Gerenciamento de Funcionários</h2>
        <button
          onClick={openCreateModal}
          className="bg-golffox-orange-primary text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-orange-600 transition-colors">
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Cadastrar Funcionário
        </button>
      </div>
      <div className="bg-golffox-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-golffox-blue-dark text-white">
            <tr>
              <th className="py-3 px-6 text-left font-semibold">Nome</th>
              <th className="py-3 px-6 text-left font-semibold">CPF (Login)</th>
              <th className="py-3 px-6 text-left font-semibold">Email</th>
              <th className="py-3 px-6 text-center font-semibold">Status</th>
              <th className="py-3 px-6 text-center font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="text-golffox-gray-medium">
            {employees.map((employee, index) => (
              <tr key={employee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-golffox-gray-light'}>
                <td className="py-4 px-6 font-medium text-golffox-gray-dark">{employee.name}</td>
                <td className="py-4 px-6">{employee.cpf}</td>
                <td className="py-4 px-6">{employee.email}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(employee.status)}`}>
                    {employee.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex justify-center items-center space-x-2">
                    <button onClick={() => openEditModal(employee)} className="text-golffox-blue-light hover:text-golffox-blue-dark p-1" title="Editar Funcionário">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => openConfirmModal(employee.id)} className="text-golffox-red hover:text-red-700 p-1" title="Excluir Funcionário">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Criar/Editar Funcionário */}
      {isModalOpen && currentEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in-down">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-golffox-gray-dark">{modalMode === 'create' ? 'Cadastrar Novo Funcionário' : 'Editar Funcionário'}</h3>
              <button onClick={handleClose}><XMarkIcon className="h-6 w-6 text-golffox-gray-medium" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Nome Completo" value={currentEmployee.name || ''} onChange={e => setCurrentEmployee({...currentEmployee, name: e.target.value})} className="w-full p-2 border rounded"/>
              <input type="text" placeholder="CPF (será o login)" value={currentEmployee.cpf || ''} onChange={e => setCurrentEmployee({...currentEmployee, cpf: e.target.value})} className="w-full p-2 border rounded"/>
              <input type="email" placeholder="Email" value={currentEmployee.email || ''} onChange={e => setCurrentEmployee({...currentEmployee, email: e.target.value})} className="w-full p-2 border rounded"/>
              <input type="text" placeholder="Endereço" value={currentEmployee.address || ''} onChange={e => setCurrentEmployee({...currentEmployee, address: e.target.value})} className="w-full p-2 border rounded"/>
               <div>
                  <label className="text-sm font-medium text-golffox-gray-dark">Perfil de Permissão</label>
                  <select 
                      value={currentEmployee.permissionProfileId || ''} 
                      onChange={e => setCurrentEmployee({...currentEmployee, permissionProfileId: e.target.value})} 
                      className="w-full p-2 border rounded bg-white"
                  >
                      {permissionProfiles
                        .filter(p => p.name === 'Passageiro' || p.name === 'Operador')
                        .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
              </div>
              <div className="flex items-center space-x-2">
                <input type="text" placeholder="Senha" value={currentEmployee.password || ''} onChange={e => setCurrentEmployee({...currentEmployee, password: e.target.value})} className="w-full p-2 border rounded"/>
                <button onClick={generatePassword} className="p-2 bg-golffox-blue-light text-white rounded hover:bg-golffox-blue-dark" title="Gerar Senha Forte">
                    <KeyIcon className="h-5 w-5"/>
                </button>
              </div>
              <select value={currentEmployee.status} onChange={e => setCurrentEmployee({...currentEmployee, status: e.target.value as 'Ativo' | 'Inativo'})} className="w-full p-2 border rounded">
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button onClick={handleClose} className="px-4 py-2 bg-golffox-gray-light text-golffox-gray-dark font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 bg-golffox-orange-primary text-white font-semibold rounded-lg hover:bg-orange-600">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold">Confirmar Exclusão</h3>
            <p className="my-4">Tem certeza que deseja excluir este funcionário?</p>
            <div className="mt-6 flex justify-end space-x-2">
              <button onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesManagement;