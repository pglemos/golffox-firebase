import React, { useState } from 'react';
import { ALL_ACCESS_AREAS } from '../constants';
import type { PermissionProfile } from '../types';
import { AdjustmentsHorizontalIcon, CheckCircleIcon, PencilIcon, XMarkIcon } from './icons/Icons';

interface PermissionsManagementProps {
    permissionProfiles: PermissionProfile[];
    setPermissionProfiles: React.Dispatch<React.SetStateAction<PermissionProfile[]>>;
}

const PermissionsManagement: React.FC<PermissionsManagementProps> = ({ permissionProfiles, setPermissionProfiles }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PermissionProfile | null>(null);
  const [tempAccess, setTempAccess] = useState<string[]>([]);

  const openEditModal = (profile: PermissionProfile) => {
    setEditingProfile(profile);
    setTempAccess([...profile.access]);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingProfile(null);
    setTempAccess([]);
  };

  const handleAccessChange = (area: string) => {
    setTempAccess(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleSave = () => {
    if (!editingProfile) return;
    setPermissionProfiles(prevProfiles =>
      prevProfiles.map(p =>
        p.id === editingProfile.id ? { ...p, access: tempAccess } : p
      )
    );
    handleClose();
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <AdjustmentsHorizontalIcon className="h-8 w-8 mr-3 text-golffox-blue-dark" />
        <h2 className="text-3xl font-bold text-golffox-gray-dark">Gerenciamento de Permissões</h2>
      </div>
      <p className="text-golffox-gray-medium mb-8 max-w-3xl">
        Esta seção define os perfis de acesso ao sistema Golffox. O administrador pode editar as permissões para determinar quais áreas cada perfil pode acessar.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {permissionProfiles.map((profile: PermissionProfile) => (
          <div key={profile.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col border-t-4 border-golffox-blue-dark">
            <div className="flex-grow">
                <h3 className="text-xl font-bold text-golffox-gray-dark mb-2">{profile.name}</h3>
                <p className="text-sm text-golffox-gray-medium mb-4 h-20">{profile.description}</p>
                
                <h4 className="text-sm font-semibold text-golffox-gray-dark mb-2">Acesso Principal:</h4>
                <ul className="space-y-2">
                {profile.access.map((area, index) => (
                    <li key={index} className="flex items-center text-sm text-golffox-gray-medium">
                    <CheckCircleIcon className="h-5 w-5 mr-2 text-golffox-orange-primary" />
                    {area}
                    </li>
                ))}
                </ul>
            </div>

            <div className="mt-6 border-t pt-4">
                <button 
                    onClick={() => openEditModal(profile)}
                    className="w-full bg-golffox-blue-light hover:bg-golffox-blue-dark text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Editar Permissões
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Permissions Modal */}
      {isModalOpen && editingProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in-down">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-golffox-gray-dark">Editar Permissões: {editingProfile.name}</h3>
              <button onClick={handleClose} className="p-1 rounded-full hover:bg-golffox-gray-light">
                <XMarkIcon className="h-6 w-6 text-golffox-gray-medium" />
              </button>
            </div>
            
            <p className="text-sm text-golffox-gray-medium mb-4">Selecione as áreas do sistema que este perfil pode acessar.</p>

            <div className="space-y-2">
                {ALL_ACCESS_AREAS.map(area => (
                    <label key={area} className="flex items-center p-3 bg-golffox-gray-light rounded-md cursor-pointer">
                        <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-golffox-orange-primary focus:ring-golffox-orange-primary"
                            checked={tempAccess.includes(area)}
                            onChange={() => handleAccessChange(area)}
                            disabled={editingProfile.isAdminFeature}
                        />
                        <span className="ml-3 text-sm text-golffox-gray-dark">{area}</span>
                    </label>
                ))}
            </div>

            {editingProfile.isAdminFeature && (
                 <p className="text-xs text-center text-golffox-blue-dark font-semibold mt-4 p-2 bg-blue-50 rounded-md">As permissões do perfil Admin não podem ser alteradas para garantir a segurança do sistema.</p>
            )}

            <div className="mt-6 flex justify-end space-x-2 border-t pt-4">
              <button onClick={handleClose} className="px-4 py-2 bg-golffox-gray-light text-golffox-gray-dark font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
              <button 
                onClick={handleSave} 
                disabled={editingProfile.isAdminFeature}
                className="px-4 py-2 bg-golffox-orange-primary text-white font-semibold rounded-lg hover:bg-orange-600 disabled:bg-golffox-gray-medium disabled:cursor-not-allowed">
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PermissionsManagement;