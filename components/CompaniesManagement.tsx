import React, { useState } from 'react';
import type { Company, Employee, PermissionProfile } from '../types';
import { PlusCircleIcon, PencilIcon, TrashIcon, XMarkIcon, UserGroupIcon, KeyIcon } from './icons/Icons';

const getStatusClass = (status: 'Ativo' | 'Inativo') => {
  switch (status) {
    case 'Ativo':
      return 'bg-green-100 text-green-800';
    case 'Inativo':
      return 'bg-gray-200 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface CompaniesManagementProps {
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  permissionProfiles: PermissionProfile[];
}

const CompaniesManagement: React.FC<CompaniesManagementProps> = ({ companies, setCompanies, employees, setEmployees, permissionProfiles }) => {
  // State for Company Modals
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isCompanyConfirmOpen, setIsCompanyConfirmOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Partial<Company> | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [companyModalMode, setCompanyModalMode] = useState<'create' | 'edit'>('create');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for Employees Modals
  const [isEmployeesModalOpen, setIsEmployeesModalOpen] = useState(false);
  const [selectedCompanyForEmployees, setSelectedCompanyForEmployees] = useState<Company | null>(null);
  const [isEmployeeFormModalOpen, setIsEmployeeFormModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee> | null>(null);
  const [employeeModalMode, setEmployeeModalMode] = useState<'create' | 'edit'>('create');
  const [isEmployeeConfirmOpen, setIsEmployeeConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

  // --- Company Management Handlers ---
  const openCompanyCreateModal = () => {
    setCompanyModalMode('create');
    setCurrentCompany({ 
      name: '', 
      cnpj: '', 
      contact: '', 
      status: 'Ativo', 
      address: { text: '', coordinates: { lat: 0, lng: 0 } }, 
      contractedPassengers: 0 
    });
    setErrors({});
    setIsCompanyModalOpen(true);
  };

  const openCompanyEditModal = (company: Company) => {
    setCompanyModalMode('edit');
    setCurrentCompany({ ...company });
    setErrors({});
    setIsCompanyModalOpen(true);
  };

  const openCompanyConfirmModal = (companyId: string) => {
    setCompanyToDelete(companyId);
    setIsCompanyConfirmOpen(true);
  };

  const handleCompanyClose = () => {
    setIsCompanyModalOpen(false);
    setIsCompanyConfirmOpen(false);
    setCurrentCompany(null);
    setCompanyToDelete(null);
    setErrors({});
  };
  
  const validateCompany = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!currentCompany || !currentCompany.name?.trim()) newErrors.name = 'O nome da empresa é obrigatório.';
    if (!currentCompany.address?.text?.trim()) newErrors.address = 'O endereço completo é obrigatório.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCompanySave = () => {
    if (!validateCompany() || !currentCompany) return;

    if (companyModalMode === 'create') {
      const newCompany: Company = {
        id: `c${Date.now()}`,
        name: currentCompany.name!,
        cnpj: currentCompany.cnpj || 'N/A',
        contact: currentCompany.contact || 'N/A',
        status: currentCompany.status || 'Ativo',
        address: { 
          text: currentCompany.address?.text || '', 
          coordinates: currentCompany.address?.coordinates || { lat: 0, lng: 0 }
        },
        contractedPassengers: currentCompany.contractedPassengers || 0,
      };
      setCompanies(prev => [newCompany, ...prev]);
    } else if (companyModalMode === 'edit' && currentCompany.id) {
       setCompanies(prev => prev.map(c => (c.id === currentCompany.id ? currentCompany as Company : c)));
    }
    handleCompanyClose();
  };

  const handleCompanyDelete = () => {
    if (!companyToDelete) return;
    setCompanies(prev => prev.filter(c => c.id !== companyToDelete));
    handleCompanyClose();
  };

  const handleCompanyInputChange = (field: keyof Company, value: string | number) => {
    if(currentCompany) {
        if (field === 'address') {
            setCurrentCompany({ 
                ...currentCompany, 
                address: { 
                    text: value as string,
                    coordinates: currentCompany.address?.coordinates || { lat: 0, lng: 0 }
                }
            });
        } else {
            setCurrentCompany({ ...currentCompany, [field]: value });
        }
        if(errors[field]) {
            const newErrors = { ...errors };
            delete newErrors[field];
            setErrors(newErrors);
        }
    }
  };

  // --- Employee Management Handlers ---

  const openEmployeesModal = (company: Company) => {
    setSelectedCompanyForEmployees(company);
    setIsEmployeesModalOpen(true);
  };
  
  const handleEmployeesClose = () => {
    setIsEmployeesModalOpen(false);
    setSelectedCompanyForEmployees(null);
  };

  const openEmployeeCreateModal = () => {
    setEmployeeModalMode('create');
    setCurrentEmployee({ name: '', cpf: '', email: '', address: '', status: 'Ativo', password: '', permissionProfileId: 'p_passenger' });
    setIsEmployeeFormModalOpen(true);
  };

  const openEmployeeEditModal = (employee: Employee) => {
    setEmployeeModalMode('edit');
    setCurrentEmployee({ ...employee });
    setIsEmployeeFormModalOpen(true);
  };

  const openEmployeeConfirmModal = (employeeId: string) => {
    setEmployeeToDelete(employeeId);
    setIsEmployeeConfirmOpen(true);
  };
  
  const handleEmployeeFormClose = () => {
      setIsEmployeeFormModalOpen(false);
      setCurrentEmployee(null);
  };
  
  const handleEmployeeConfirmClose = () => {
      setIsEmployeeConfirmOpen(false);
      setEmployeeToDelete(null);
  };

  const handleEmployeeSave = () => {
    if (!currentEmployee || !currentEmployee.name || !currentEmployee.cpf || !selectedCompanyForEmployees) return;

    if (employeeModalMode === 'create') {
      const newEmployee: Employee = {
        id: `e${Date.now()}`,
        companyId: selectedCompanyForEmployees.id,
        ...currentEmployee,
      } as Employee;
      setEmployees(prev => [newEmployee, ...prev]);
    } else if (employeeModalMode === 'edit' && currentEmployee.id) {
       setEmployees(prev => prev.map(e => (e.id === currentEmployee.id ? currentEmployee as Employee : e)));
    }
    handleEmployeeFormClose();
  };

  const handleEmployeeDelete = () => {
      if (!employeeToDelete) return;
      setEmployees(prev => prev.filter(e => e.id !== employeeToDelete));
      handleEmployeeConfirmClose();
  };

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-golffox-gray-dark">Gerenciamento de Empresas</h2>
        <button
          onClick={openCompanyCreateModal}
          className="bg-golffox-orange-primary text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-orange-600 transition-colors touch-manipulation no-tap-highlight min-h-[44px]">
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          <span className="text-sm sm:text-base">Cadastrar Nova Empresa</span>
        </button>
      </div>
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-golffox-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-golffox-blue-dark text-white">
            <tr>
              <th className="py-3 px-6 text-left font-semibold">Nome da Empresa</th>
              <th className="py-3 px-6 text-left font-semibold">Endereço</th>
              <th className="py-3 px-6 text-center font-semibold">Passageiros (Contrato)</th>
              <th className="py-3 px-6 text-center font-semibold">Status</th>
              <th className="py-3 px-6 text-center font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="text-golffox-gray-medium">
            {companies.map((company: Company, index: number) => (
              <tr key={company.id} className={index % 2 === 0 ? 'bg-white' : 'bg-golffox-gray-light'}>
                <td className="py-4 px-6 font-medium text-golffox-gray-dark">{company.name}</td>
                <td className="py-4 px-6">{company.address.text}</td>
                <td className="py-4 px-6 text-center">{company.contractedPassengers}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(company.status)}`}>
                    {company.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex justify-center items-center space-x-2">
                    <button onClick={() => openEmployeesModal(company)} className="text-golffox-blue-dark hover:text-golffox-orange-primary p-1" title="Ver Funcionários">
                        <UserGroupIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => openCompanyEditModal(company)} className="text-golffox-blue-light hover:text-golffox-blue-dark p-1" title="Editar Empresa">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => openCompanyConfirmModal(company.id)} className="text-golffox-red hover:text-red-700 p-1" title="Excluir Empresa">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {companies.map((company: Company) => (
          <div key={company.id} className="bg-white rounded-lg shadow-md p-4 border border-golffox-gray-light">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-golffox-gray-dark">{company.name}</h3>
                <p className="text-sm text-golffox-gray-medium mt-1">{company.address.text}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(company.status)} ml-2`}>
                {company.status}
              </span>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-golffox-gray-dark">Passageiros Contratados:</span>
                <span className="text-sm font-bold text-golffox-blue-dark">{company.contractedPassengers}</span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-3 border-t border-golffox-gray-light">
              <button 
                onClick={() => openEmployeesModal(company)} 
                className="text-golffox-blue-dark hover:text-golffox-orange-primary p-2 touch-manipulation no-tap-highlight" 
                title="Ver Funcionários"
              >
                <UserGroupIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => openCompanyEditModal(company)} 
                className="text-golffox-blue-light hover:text-golffox-blue-dark p-2 touch-manipulation no-tap-highlight" 
                title="Editar Empresa"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => openCompanyConfirmModal(company.id)} 
                className="text-golffox-red hover:text-red-700 p-2 touch-manipulation no-tap-highlight" 
                title="Excluir Empresa"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Company Edit/Create Modal */}
      {isCompanyModalOpen && currentCompany && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in-down">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-golffox-gray-dark">{companyModalMode === 'create' ? 'Cadastrar Nova Empresa' : 'Editar Empresa'}</h3>
              <button onClick={handleCompanyClose} className="p-1 rounded-full hover:bg-golffox-gray-light"><XMarkIcon className="h-6 w-6 text-golffox-gray-medium" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-golffox-gray-dark">Nome da Empresa</label>
                <input type="text" value={currentCompany.name || ''} onChange={(e) => handleCompanyInputChange('name', e.target.value)} className={`mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 ${errors.name ? 'border-golffox-red focus:border-golffox-red focus:ring-golffox-red' : 'border-golffox-gray-light focus:border-golffox-orange-primary focus:ring-golffox-orange-primary'}`}/>
                {errors.name && <p className="text-golffox-red mt-1 text-xs font-semibold">{errors.name}</p>}
              </div>
               <div>
                <label className="block text-sm font-medium text-golffox-gray-dark">Endereço Completo</label>
                <input type="text" value={currentCompany.address?.text || ''} onChange={(e) => handleCompanyInputChange('address', e.target.value)} className={`mt-1 block w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 ${errors.address ? 'border-golffox-red focus:border-golffox-red focus:ring-golffox-red' : 'border-golffox-gray-light focus:border-golffox-orange-primary focus:ring-golffox-orange-primary'}`}/>
                 {errors.address && <p className="text-golffox-red mt-1 text-xs font-semibold">{errors.address}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-golffox-gray-dark">CNPJ</label><input type="text" value={currentCompany.cnpj || ''} onChange={(e) => handleCompanyInputChange('cnpj', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-golffox-gray-light rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-golffox-orange-primary"/></div>
                 <div><label className="block text-sm font-medium text-golffox-gray-dark">Passageiros (Contrato)</label><input type="number" value={currentCompany.contractedPassengers || 0} onChange={(e) => handleCompanyInputChange('contractedPassengers', parseInt(e.target.value, 10) || 0)} className="mt-1 block w-full px-3 py-2 border border-golffox-gray-light rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-golffox-orange-primary"/></div>
              </div>
              <div><label className="block text-sm font-medium text-golffox-gray-dark">Contato (Email ou Telefone)</label><input type="text" value={currentCompany.contact || ''} onChange={(e) => handleCompanyInputChange('contact', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-golffox-gray-light rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-golffox-orange-primary"/></div>
              <div><label className="block text-sm font-medium text-golffox-gray-dark">Status</label><select value={currentCompany.status || 'Ativo'} onChange={(e) => handleCompanyInputChange('status', e.target.value as 'Ativo' | 'Inativo')} className="mt-1 block w-full px-3 py-2 border border-golffox-gray-light rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-golffox-orange-primary"><option>Ativo</option><option>Inativo</option></select></div>
            </div>
            <div className="mt-6 flex justify-end space-x-2 border-t pt-4"><button onClick={handleCompanyClose} className="px-4 py-2 bg-golffox-gray-light text-golffox-gray-dark font-semibold rounded-lg hover:bg-gray-300">Cancelar</button><button onClick={handleCompanySave} className="px-4 py-2 bg-golffox-orange-primary text-white font-semibold rounded-lg hover:bg-orange-600">Salvar</button></div>
          </div>
        </div>
      )}

      {/* Company Delete Confirmation Modal */}
      {isCompanyConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in-down">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm"><h3 className="text-xl font-bold text-golffox-gray-dark">Confirmar Exclusão</h3><p className="text-golffox-gray-medium my-4">Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.</p><div className="mt-6 flex justify-end space-x-2"><button onClick={handleCompanyClose} className="px-4 py-2 bg-golffox-gray-light text-golffox-gray-dark font-semibold rounded-lg hover:bg-gray-300">Cancelar</button><button onClick={handleCompanyDelete} className="px-4 py-2 bg-golffox-red text-white font-semibold rounded-lg hover:bg-red-700">Excluir</button></div></div>
        </div>
      )}

      {/* Employees Management Modal */}
      {isEmployeesModalOpen && selectedCompanyForEmployees && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] animate-fade-in-down">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                      <h3 className="text-xl font-bold text-golffox-gray-dark">Funcionários de {selectedCompanyForEmployees.name}</h3>
                      <button onClick={handleEmployeesClose} className="p-1 rounded-full hover:bg-golffox-gray-light"><XMarkIcon className="h-6 w-6 text-golffox-gray-medium" /></button>
                  </div>
                  <div className="flex-grow overflow-y-auto pr-2">
                      <button onClick={openEmployeeCreateModal} className="mb-4 bg-golffox-orange-primary text-white font-bold py-2 px-4 rounded-lg flex items-center hover:bg-orange-600 transition-colors"><PlusCircleIcon className="h-5 w-5 mr-2" />Cadastrar Novo Funcionário</button>
                      <table className="min-w-full text-sm">
                          <thead className="bg-golffox-gray-light">
                              <tr>
                                <th className="py-2 px-3 text-left font-semibold text-golffox-gray-dark">Nome Completo</th>
                                <th className="py-2 px-3 text-left font-semibold text-golffox-gray-dark">CPF (Login)</th>
                                <th className="py-2 px-3 text-left font-semibold text-golffox-gray-dark">Endereço</th>
                                <th className="py-2 px-3 text-left font-semibold text-golffox-gray-dark">Senha</th>
                                <th className="py-2 px-3 text-center font-semibold text-golffox-gray-dark">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="text-golffox-gray-medium">
                              {employees.filter(e => e.companyId === selectedCompanyForEmployees.id).map((employee) => (
                                  <tr key={employee.id} className="border-b">
                                      <td className="py-2 px-3">{employee.name}</td>
                                      <td className="py-2 px-3">{employee.cpf}</td>
                                      <td className="py-2 px-3">{employee.address}</td>
                                      <td className="py-2 px-3 font-mono">{employee.password}</td>
                                      <td className="py-2 px-3 text-center">
                                          <div className="flex justify-center items-center space-x-1">
                                              <button onClick={() => openEmployeeEditModal(employee)} className="text-golffox-blue-light hover:text-golffox-blue-dark p-1" title="Editar Funcionário"><PencilIcon className="h-5 w-5" /></button>
                                              <button onClick={() => openEmployeeConfirmModal(employee.id)} className="text-golffox-red hover:text-red-700 p-1" title="Excluir Funcionário"><TrashIcon className="h-5 w-5" /></button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* Employee Form Modal */}
      {isEmployeeFormModalOpen && currentEmployee && (
           <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] animate-fade-in-down">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">{employeeModalMode === 'create' ? 'Cadastrar Novo Funcionário' : 'Editar Funcionário'}</h3><button onClick={handleEmployeeFormClose}><XMarkIcon className="h-6 w-6" /></button></div>
                    <div className="space-y-3">
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
                                {permissionProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center space-x-2"><input type="text" placeholder="Senha" value={currentEmployee.password || ''} onChange={e => setCurrentEmployee({...currentEmployee, password: e.target.value})} className="w-full p-2 border rounded"/><button onClick={generatePassword} className="p-2 bg-golffox-blue-light text-white rounded hover:bg-golffox-blue-dark" title="Gerar Senha Forte"><KeyIcon className="h-5 w-5"/></button></div>
                        <select value={currentEmployee.status} onChange={e => setCurrentEmployee({...currentEmployee, status: e.target.value as 'Ativo' | 'Inativo'})} className="w-full p-2 border rounded"><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select>
                    </div>
                    <div className="mt-6 flex justify-end space-x-2"><button onClick={handleEmployeeFormClose} className="px-4 py-2 bg-golffox-gray-light rounded-lg">Cancelar</button><button onClick={handleEmployeeSave} className="px-4 py-2 bg-golffox-orange-primary text-white rounded-lg">Salvar</button></div>
                </div>
            </div>
      )}

      {/* Employee Delete Confirmation Modal */}
      {isEmployeeConfirmOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70]">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                  <h3 className="text-xl font-bold">Confirmar Exclusão</h3><p className="my-4">Tem certeza que deseja excluir este funcionário?</p>
                  <div className="mt-6 flex justify-end space-x-2"><button onClick={handleEmployeeConfirmClose} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button><button onClick={handleEmployeeDelete} className="px-4 py-2 bg-red-600 text-white rounded">Excluir</button></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CompaniesManagement;