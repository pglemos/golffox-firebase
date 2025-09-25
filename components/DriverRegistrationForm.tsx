import React, { useState, useCallback, useMemo } from 'react';
import { Driver } from '../types';

interface DriverRegistrationFormProps {
    onSubmit: (driver: Partial<Driver>) => void;
    onCancel: () => void;
    initialData?: Partial<Driver>;
}

interface FormErrors {
    [key: string]: string;
}

interface FileUploads {
    photo: File | null;
    transportCourse: File | null;
    cnhFile: File | null;
    residenceProof: File | null;
    courseFile: File | null;
    toxicologicalExam: File | null;
    idPhoto: File | null;
}

const DriverRegistrationForm: React.FC<DriverRegistrationFormProps> = ({
    onSubmit,
    onCancel,
    initialData = {} as Partial<Driver>
}) => {
    const [formData, setFormData] = useState<Partial<Driver>>(() => ({
        // Dados Pessoais
        name: initialData.name || '',
        cpf: initialData.cpf || '',
        rg: initialData.rg || '',
        birthDate: initialData.birthDate || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        cep: initialData.cep || '',
        
        // Dados Profissionais
        cnh: initialData.cnh || '',
        cnhValidity: initialData.cnhValidity || '',
        cnhCategory: initialData.cnhCategory || 'D',
        hasEAR: initialData.hasEAR || false,
        transportCourseValidity: initialData.transportCourseValidity || '',
        lastToxicologicalExam: initialData.lastToxicologicalExam || '',
        
        // Vínculo com a Golffox
        contractType: initialData?.contractType || 'CLT',
        credentialingDate: initialData?.credentialingDate || '',
        status: initialData?.status || 'Ativo',
        linkedCompany: initialData?.linkedCompany || '',
        
        // Rotas e Disponibilidade
        assignedRoutes: initialData?.assignedRoutes || [],
        availability: initialData?.availability || '',
        lastUpdate: new Date().toISOString().split('T')[0]
    }));

    const [errors, setErrors] = useState<FormErrors>({});
    const [files, setFiles] = useState<FileUploads>({
        photo: null,
        transportCourse: null,
        cnhFile: null,
        residenceProof: null,
        courseFile: null,
        toxicologicalExam: null,
        idPhoto: null
    });

    // Validações melhoradas
    const validateCPF = useCallback((cpf: string): boolean => {
        try {
            const cleanCPF = cpf.replace(/\D/g, '');
            
            // Verifica se tem 11 dígitos
            if (cleanCPF.length !== 11) return false;
            
            // Verifica se todos os dígitos são iguais
            if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
            
            // Validação do primeiro dígito verificador
            let sum = 0;
            for (let i = 0; i < 9; i++) {
                sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
            }
            let remainder = (sum * 10) % 11;
            if (remainder === 10 || remainder === 11) remainder = 0;
            if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
            
            // Validação do segundo dígito verificador
            sum = 0;
            for (let i = 0; i < 10; i++) {
                sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
            }
            remainder = (sum * 10) % 11;
            if (remainder === 10 || remainder === 11) remainder = 0;
            return remainder === parseInt(cleanCPF.charAt(10));
        } catch (error) {
            console.error('Erro na validação do CPF:', error);
            return false;
        }
    }, []);

    const validateEmail = useCallback((email: string): boolean => {
        try {
            if (!email || email.trim() === '') return false;
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email.trim());
        } catch (error) {
            console.error('Erro na validação do email:', error);
            return false;
        }
    }, []);

    const validatePhone = useCallback((phone: string): boolean => {
        try {
            const cleanPhone = phone.replace(/\D/g, '');
            return cleanPhone.length >= 10 && cleanPhone.length <= 11;
        } catch (error) {
            console.error('Erro na validação do telefone:', error);
            return false;
        }
    }, []);

    const validateCEP = useCallback((cep: string): boolean => {
        try {
            const cleanCEP = cep.replace(/\D/g, '');
            return cleanCEP.length === 8;
        } catch (error) {
            console.error('Erro na validação do CEP:', error);
            return false;
        }
    }, []);

    const validateCNH = useCallback((cnh: string): boolean => {
        try {
            const cleanCNH = cnh.replace(/\D/g, '');
            return cleanCNH.length === 11;
        } catch (error) {
            console.error('Erro na validação da CNH:', error);
            return false;
        }
    }, []);

    const validateDate = useCallback((date: string): boolean => {
        try {
            if (!date) return false;
            const dateObj = new Date(date);
            return dateObj instanceof Date && !isNaN(dateObj.getTime());
        } catch (error) {
            console.error('Erro na validação da data:', error);
            return false;
        }
    }, []);

    // Formatações melhoradas
    const formatCPF = useCallback((value: string): string => {
        try {
            const cleanValue = value.replace(/\D/g, '').slice(0, 11);
            return cleanValue
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } catch (error) {
            console.error('Erro na formatação do CPF:', error);
            return value;
        }
    }, []);

    const formatPhone = useCallback((value: string): string => {
        try {
            const cleanValue = value.replace(/\D/g, '').slice(0, 11);
            if (cleanValue.length <= 10) {
                return cleanValue
                    .replace(/(\d{2})(\d)/, '($1) $2')
                    .replace(/(\d{4})(\d)/, '$1-$2');
            } else {
                return cleanValue
                    .replace(/(\d{2})(\d)/, '($1) $2')
                    .replace(/(\d{5})(\d)/, '$1-$2');
            }
        } catch (error) {
            console.error('Erro na formatação do telefone:', error);
            return value;
        }
    }, []);

    const formatCEP = useCallback((value: string): string => {
        try {
            const cleanValue = value.replace(/\D/g, '').slice(0, 8);
            return cleanValue.replace(/(\d{5})(\d)/, '$1-$2');
        } catch (error) {
            console.error('Erro na formatação do CEP:', error);
            return value;
        }
    }, []);

    const formatCNH = useCallback((value: string): string => {
        try {
            const cleanValue = value.replace(/\D/g, '').slice(0, 11);
            return cleanValue;
        } catch (error) {
            console.error('Erro na formatação da CNH:', error);
            return value;
        }
    }, []);

    const handleInputChange = useCallback((field: keyof Driver, value: any) => {
        try {
            let formattedValue = value;
            
            // Aplicar máscaras baseadas no tipo de campo
            switch (field) {
                case 'cpf':
                    formattedValue = formatCPF(value);
                    break;
                case 'phone':
                    formattedValue = formatPhone(value);
                    break;
                case 'cep':
                    formattedValue = formatCEP(value);
                    break;
                case 'cnh':
                    formattedValue = formatCNH(value);
                    break;
                case 'name':
                    // Capitalizar primeira letra de cada palavra
                    formattedValue = value.replace(/\b\w/g, (l: string) => l.toUpperCase());
                    break;
                case 'email':
                    formattedValue = value.toLowerCase().trim();
                    break;
                default:
                    formattedValue = value;
            }
            
            setFormData(prev => ({
                ...prev,
                [field]: formattedValue
            }));
            
            // Limpar erro do campo quando o usuário começar a digitar
            if (errors[field]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[field];
                    return newErrors;
                });
            }
        } catch (error) {
            console.error(`Erro ao atualizar campo ${field}:`, error);
        }
    }, [errors, formatCPF, formatPhone, formatCEP, formatCNH]);

    const handleFileChange = useCallback((fileType: keyof FileUploads, file: File | null) => {
        try {
            // Validar tipo e tamanho do arquivo
            if (file) {
                const maxSize = 5 * 1024 * 1024; // 5MB
                const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
                
                if (file.size > maxSize) {
                    setErrors(prev => ({
                        ...prev,
                        [fileType]: 'Arquivo muito grande. Máximo 5MB.'
                    }));
                    return;
                }
                
                if (!allowedTypes.includes(file.type)) {
                    setErrors(prev => ({
                        ...prev,
                        [fileType]: 'Tipo de arquivo não permitido. Use JPG, PNG ou PDF.'
                    }));
                    return;
                }
            }
            
            setFiles(prev => ({
                ...prev,
                [fileType]: file
            }));
            
            // Limpar erro do arquivo se existir
            if (errors[fileType]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[fileType];
                    return newErrors;
                });
            }
        } catch (error) {
            console.error(`Erro ao fazer upload do arquivo ${fileType}:`, error);
            setErrors(prev => ({
                ...prev,
                [fileType]: 'Erro ao fazer upload do arquivo.'
            }));
        }
    }, [errors]);

    const handleRouteChange = useCallback((route: string, checked: boolean) => {
        try {
            const currentRoutes = formData.assignedRoutes || [];
            if (checked) {
                setFormData(prev => ({
                    ...prev,
                    assignedRoutes: [...currentRoutes, route]
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    assignedRoutes: currentRoutes.filter(r => r !== route)
                }));
            }
        } catch (error) {
            console.error('Erro ao atualizar rotas:', error);
        }
    }, [formData.assignedRoutes]);

    const validateForm = useCallback((): boolean => {
        try {
            const newErrors: FormErrors = {};

            // Validação dos dados pessoais
            if (!formData.name?.trim()) {
                newErrors.name = 'Nome é obrigatório';
            } else if (formData.name.trim().length < 2) {
                newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
            }

            if (!formData.cpf || !validateCPF(formData.cpf)) {
                newErrors.cpf = 'CPF inválido';
            }

            if (!formData.rg?.trim()) {
                newErrors.rg = 'RG é obrigatório';
            }

            if (!formData.birthDate) {
                newErrors.birthDate = 'Data de nascimento é obrigatória';
            } else if (!validateDate(formData.birthDate)) {
                newErrors.birthDate = 'Data de nascimento inválida';
            } else {
                // Verificar se é maior de idade
                const birthDate = new Date(formData.birthDate);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                if (age < 18) {
                    newErrors.birthDate = 'Motorista deve ser maior de idade';
                }
            }

            if (!formData.email || !validateEmail(formData.email)) {
                newErrors.email = 'Email inválido';
            }

            if (!formData.phone || !validatePhone(formData.phone)) {
                newErrors.phone = 'Telefone inválido';
            }

            if (!formData.address?.trim()) {
                newErrors.address = 'Endereço é obrigatório';
            }

            if (!formData.cep || !validateCEP(formData.cep)) {
                newErrors.cep = 'CEP inválido';
            }

            // Validação dos dados profissionais
            if (!formData.cnh || !validateCNH(formData.cnh)) {
                newErrors.cnh = 'CNH inválida';
            }

            if (!formData.cnhValidity) {
                newErrors.cnhValidity = 'Validade da CNH é obrigatória';
            } else if (!validateDate(formData.cnhValidity)) {
                newErrors.cnhValidity = 'Data de validade da CNH inválida';
            } else {
                // Verificar se a CNH não está vencida
                const cnhValidity = new Date(formData.cnhValidity);
                const today = new Date();
                if (cnhValidity < today) {
                    newErrors.cnhValidity = 'CNH está vencida';
                }
            }

            if (!formData.cnhCategory) {
                newErrors.cnhCategory = 'Categoria da CNH é obrigatória';
            }

            if (!formData.transportCourseValidity) {
                newErrors.transportCourseValidity = 'Validade do curso de transporte é obrigatória';
            } else if (!validateDate(formData.transportCourseValidity)) {
                newErrors.transportCourseValidity = 'Data de validade do curso inválida';
            }

            if (!formData.lastToxicologicalExam) {
                newErrors.lastToxicologicalExam = 'Data do último exame toxicológico é obrigatória';
            } else if (!validateDate(formData.lastToxicologicalExam)) {
                newErrors.lastToxicologicalExam = 'Data do exame toxicológico inválida';
            }

            // Validação do vínculo Golffox
            if (!formData.linkedCompany?.trim()) {
                newErrors.linkedCompany = 'Empresa vinculada é obrigatória';
            }

            if (!formData.credentialingDate) {
                newErrors.credentialingDate = 'Data de credenciamento é obrigatória';
            } else if (!validateDate(formData.credentialingDate)) {
                newErrors.credentialingDate = 'Data de credenciamento inválida';
            }

            // Validação de arquivos obrigatórios
            const requiredFiles: (keyof FileUploads)[] = [
                'photo', 'cnhFile', 'residenceProof', 'transportCourse', 'toxicologicalExam'
            ];

            requiredFiles.forEach(fileType => {
                if (!files[fileType]) {
                    const fileNames = {
                        photo: 'Foto',
                        cnhFile: 'Arquivo da CNH',
                        residenceProof: 'Comprovante de residência',
                        transportCourse: 'Curso de transporte',
                        toxicologicalExam: 'Exame toxicológico'
                    };
                    newErrors[fileType] = `${fileNames[fileType]} é obrigatório`;
                }
            });

            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        } catch (error) {
            console.error('Erro na validação do formulário:', error);
            setErrors({ general: 'Erro na validação do formulário' });
            return false;
        }
    }, [formData, files, validateCPF, validateEmail, validatePhone, validateCEP, validateCNH, validateDate]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            if (!validateForm()) {
                // Focar no primeiro campo com erro
                const firstErrorField = Object.keys(errors)[0];
                if (firstErrorField) {
                    const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
                    element?.focus();
                }
                return;
            }

            // Preparar dados do motorista
            const driverData: Partial<Driver> = {
                ...formData,
                id: initialData?.id || `driver_${Date.now()}`,
                photoUrl: files.photo ? URL.createObjectURL(files.photo) : '',
                lastUpdate: new Date().toISOString().split('T')[0]
            };

            // Simular upload de arquivos (em produção, seria feito para um servidor)
            if (files.photo) {
                // Aqui seria feito o upload real do arquivo
                console.log('Uploading photo:', files.photo.name);
            }

            await onSubmit(driverData);
        } catch (error) {
            console.error('Erro ao submeter formulário:', error);
            setErrors(prev => ({
                ...prev,
                general: 'Erro ao salvar dados do motorista. Tente novamente.'
            }));
        }
    }, [formData, files, initialData?.id, onSubmit, validateForm, errors]);

    const handleCancel = useCallback(() => {
        try {
            // Limpar arquivos selecionados
            setFiles({
                photo: null,
                transportCourse: null,
                cnhFile: null,
                residenceProof: null,
                courseFile: null,
                toxicologicalExam: null,
                idPhoto: null
            });
            
            onCancel();
        } catch (error) {
            console.error('Erro ao cancelar:', error);
            onCancel();
        }
    }, [onCancel]);

    const availableRoutes = ['Rota 1', 'Rota 2', 'Rota 3', 'Rota 4', 'Rota 5', 'Rota 6'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        {initialData?.id ? 'Editar Motorista' : 'Cadastrar Novo Motorista'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* 1️⃣ Dados Pessoais */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">1️⃣ Dados Pessoais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nome Completo *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Digite o nome completo"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        CPF *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cpf || ''}
                                        onChange={(e) => handleInputChange('cpf', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.cpf ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                    />
                                    {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        RG *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.rg || ''}
                                        onChange={(e) => handleInputChange('rg', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.rg ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="00.000.000-0"
                                    />
                                    {errors.rg && <p className="text-red-500 text-xs mt-1">{errors.rg}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Data de Nascimento *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.birthDate || ''}
                                        onChange={(e) => handleInputChange('birthDate', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.birthDate ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Telefone/WhatsApp *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone || ''}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.phone ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="(00) 00000-0000"
                                        maxLength={15}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        E-mail *
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="email@exemplo.com"
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        CEP *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cep || ''}
                                        onChange={(e) => handleInputChange('cep', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.cep ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="00000-000"
                                        maxLength={9}
                                    />
                                    {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Endereço Completo *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address || ''}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.address ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Rua, número, bairro, cidade - UF"
                                    />
                                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                </div>
                            </div>
                        </div>

                        {/* 2️⃣ Dados Profissionais */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">2️⃣ Dados Profissionais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Número da CNH *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cnh || ''}
                                        onChange={(e) => handleInputChange('cnh', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.cnh ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Digite o número da CNH"
                                    />
                                    {errors.cnh && <p className="text-red-500 text-xs mt-1">{errors.cnh}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Validade da CNH *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.cnhValidity || ''}
                                        onChange={(e) => handleInputChange('cnhValidity', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.cnhValidity ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.cnhValidity && <p className="text-red-500 text-xs mt-1">{errors.cnhValidity}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Categoria da CNH *
                                    </label>
                                    <select
                                        value={formData.cnhCategory || 'D'}
                                        onChange={(e) => handleInputChange('cnhCategory', e.target.value as 'D' | 'E')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="D">Categoria D</option>
                                        <option value="E">Categoria E</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        EAR (Exercício de Atividade Remunerada)
                                    </label>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="hasEAR"
                                                checked={formData.hasEAR === true}
                                                onChange={() => handleInputChange('hasEAR', true)}
                                                className="mr-2"
                                            />
                                            Sim
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="hasEAR"
                                                checked={formData.hasEAR === false}
                                                onChange={() => handleInputChange('hasEAR', false)}
                                                className="mr-2"
                                            />
                                            Não
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Curso de Transporte Coletivo
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => handleFileChange('transportCourse', e.target.files?.[0] || null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Validade do Curso
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.transportCourseValidity || ''}
                                        onChange={(e) => handleInputChange('transportCourseValidity', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Data do Último Exame Toxicológico *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.lastToxicologicalExam || ''}
                                        onChange={(e) => handleInputChange('lastToxicologicalExam', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.lastToxicologicalExam ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.lastToxicologicalExam && <p className="text-red-500 text-xs mt-1">{errors.lastToxicologicalExam}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Foto do Motorista *
                                    </label>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png"
                                        onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.photo ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo}</p>}
                                </div>
                            </div>
                        </div>

                        {/* 3️⃣ Documentos Obrigatórios */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">3️⃣ Documentos Obrigatórios</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        CNH Digitalizada *
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => handleFileChange('cnhFile', e.target.files?.[0] || null)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.cnhFile ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.cnhFile && <p className="text-red-500 text-xs mt-1">{errors.cnhFile}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Comprovante de Residência *
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => handleFileChange('residenceProof', e.target.files?.[0] || null)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.residenceProof ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.residenceProof && <p className="text-red-500 text-xs mt-1">{errors.residenceProof}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Certificado do Curso
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => handleFileChange('courseFile', e.target.files?.[0] || null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Exame Toxicológico *
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => handleFileChange('toxicologicalExam', e.target.files?.[0] || null)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.toxicologicalExam ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.toxicologicalExam && <p className="text-red-500 text-xs mt-1">{errors.toxicologicalExam}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Foto 3x4/Selfie para Crachá *
                                    </label>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png"
                                        onChange={(e) => handleFileChange('idPhoto', e.target.files?.[0] || null)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.idPhoto ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.idPhoto && <p className="text-red-500 text-xs mt-1">{errors.idPhoto}</p>}
                                </div>
                            </div>
                        </div>

                        {/* 4️⃣ Vínculo com a Golffox */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">4️⃣ Vínculo com a Golffox</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo de Contrato *
                                    </label>
                                    <select
                                        value={formData.contractType || 'CLT'}
                                        onChange={(e) => handleInputChange('contractType', e.target.value as 'CLT' | 'terceirizado' | 'autônomo')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="CLT">CLT</option>
                                        <option value="terceirizado">Terceirizado</option>
                                        <option value="autônomo">Autônomo</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Data de Credenciamento *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.credentialingDate || ''}
                                        onChange={(e) => handleInputChange('credentialingDate', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.credentialingDate ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.credentialingDate && <p className="text-red-500 text-xs mt-1">{errors.credentialingDate}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status *
                                    </label>
                                    <select
                                        value={formData.status || 'Em análise'}
                                        onChange={(e) => handleInputChange('status', e.target.value as 'Ativo' | 'Em análise' | 'Inativo')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Ativo">Ativo</option>
                                        <option value="Em análise">Em análise</option>
                                        <option value="Inativo">Inativo</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Empresa/Rota Vinculada *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.linkedCompany || ''}
                                        onChange={(e) => handleInputChange('linkedCompany', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.linkedCompany ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Digite a empresa ou rota vinculada"
                                    />
                                    {errors.linkedCompany && <p className="text-red-500 text-xs mt-1">{errors.linkedCompany}</p>}
                                </div>
                            </div>
                        </div>

                        {/* 5️⃣ Informações Operacionais */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">5️⃣ Informações Operacionais</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Linha/Rota (seleção múltipla)
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {availableRoutes.map(route => (
                                            <label key={route} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.assignedRoutes?.includes(route) || false}
                                                    onChange={(e) => handleRouteChange(route, e.target.checked)}
                                                    className="mr-2"
                                                />
                                                {route}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Disponibilidade de Horários
                                    </label>
                                    <textarea
                                        value={formData.availability || ''}
                                        onChange={(e) => handleInputChange('availability', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Ex: Segunda a Sexta: 06:00-18:00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Última Atualização
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.lastUpdate || ''}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Data gerada automaticamente pelo sistema</p>
                                </div>
                            </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex justify-end space-x-4 pt-6 border-t">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {initialData?.id ? 'Atualizar' : 'Cadastrar'} Motorista
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DriverRegistrationForm;