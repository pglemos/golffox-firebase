import React, { useState, useMemo } from 'react';
import { MOCK_CHECKLIST_ITEMS } from '../../config/constants';
import type { ChecklistItem } from '../../config/types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    WrenchScrewdriverIcon, 
    TruckIcon, 
    ShieldCheckIcon, 
    UserIcon, 
    DocumentTextIcon,
    ClockIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface ChecklistProps {
    onComplete: () => void;
}

const categoryIcons: { [key: string]: React.ReactNode } = {
    'Mecânicos': <WrenchScrewdriverIcon className="h-5 w-5" />,
    'Estrutura': <TruckIcon className="h-5 w-5" />,
    'Segurança': <ShieldCheckIcon className="h-5 w-5" />,
    'Conforto': <UserIcon className="h-5 w-5" />,
    'Documentação': <DocumentTextIcon className="h-5 w-5" />,
};


const Checklist: React.FC<ChecklistProps> = ({ onComplete }) => {
    const [checkedItems, setCheckedItems] = useState<{ [key: string]: 'ok' | 'nok' | null }>({});

    const allItems = useMemo(() => Object.values(MOCK_CHECKLIST_ITEMS).flat(), []);
    const criticalItems = useMemo(() => allItems.filter(item => item.isCritical), [allItems]);

    const handleCheck = (itemId: string, status: 'ok' | 'nok') => {
        setCheckedItems(prev => ({
            ...prev,
            [itemId]: prev[itemId] === status ? null : status
        }));
    };

    const handleTestMode = () => {
        const testCheckedItems: { [key: string]: 'ok' | 'nok' | null } = {};
        allItems.forEach(item => {
            testCheckedItems[item.id] = 'ok';
        });
        setCheckedItems(testCheckedItems);
    };

    const isChecklistComplete = criticalItems.every(item => checkedItems[item.id] === 'ok');

    const groupedItems = useMemo(() => {
        const groups: { [key: string]: ChecklistItem[] } = {};
        Object.entries(MOCK_CHECKLIST_ITEMS).forEach(([category, items]) => {
            groups[category] = items;
        });
        return groups;
    }, []);

    const completedItems = Object.values(checkedItems).filter(status => status === 'ok').length;
    const totalItems = allItems.length;
    const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-6 sm:px-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Checklist Pré-Rota</h1>
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            <span>Veículo: ABC-1234</span>
                        </div>
                    </div>
                    <Button 
                        onClick={handleTestMode}
                        variant="secondary"
                        size="sm"
                    >
                        Teste
                    </Button>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Progresso: {completedItems}/{totalItems}</span>
                        <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {Object.entries(groupedItems).map(([category, items]) => (
                    <Card key={category} padding="none" className="overflow-hidden">
                        {/* Category Header */}
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="text-blue-600">
                                    {categoryIcons[category]}
                                </div>
                                <h2 className="text-base font-semibold text-gray-900">{category}</h2>
                                <span className="text-sm text-gray-500">
                                    ({items.filter(item => checkedItems[item.id] === 'ok').length}/{items.length})
                                </span>
                            </div>
                        </div>
                        
                        {/* Category Items */}
                        <div className="p-4 space-y-3">
                            {items.map((item) => (
                                <div 
                                    key={item.id} 
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                                        checkedItems[item.id] === 'ok' 
                                            ? 'bg-green-50 border-green-200' 
                                            : checkedItems[item.id] === 'nok' 
                                                ? 'bg-red-50 border-red-200' 
                                                : item.isCritical 
                                                    ? 'bg-amber-50 border-amber-200' 
                                                    : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3 flex-1">
                                        {checkedItems[item.id] === 'ok' && (
                                            <CheckCircleIconSolid className="h-5 w-5 text-green-600" />
                                        )}
                                        {checkedItems[item.id] === 'nok' && (
                                            <XCircleIcon className="h-5 w-5 text-red-600" />
                                        )}
                                        {!checkedItems[item.id] && item.isCritical && (
                                            <ClockIcon className="h-5 w-5 text-amber-600" />
                                        )}
                                        <span className={`text-sm ${item.isCritical ? 'font-semibold' : ''} text-gray-900`}>
                                            {item.label}
                                            {item.isCritical && <span className="text-red-600 ml-1">*</span>}
                                        </span>
                                    </div>
                                    
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => handleCheck(item.id, 'nok')} 
                                            className={`p-2 rounded-full transition-all duration-200 ${
                                                checkedItems[item.id] === 'nok' 
                                                    ? 'bg-red-600 text-white' 
                                                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                            }`}
                                            aria-label={`Marcar ${item.label} como problema`}
                                        >
                                            <XCircleIcon className="h-5 w-5" />
                                        </button>
                                        <button 
                                            onClick={() => handleCheck(item.id, 'ok')} 
                                            className={`p-2 rounded-full transition-all duration-200 ${
                                                checkedItems[item.id] === 'ok' 
                                                    ? 'bg-green-600 text-white' 
                                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                            }`}
                                            aria-label={`Marcar ${item.label} como ok`}
                                        >
                                            <CheckCircleIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-200 p-4 sm:p-6">
                <Button
                    onClick={onComplete}
                    disabled={!isChecklistComplete}
                    fullWidth
                    size="lg"
                    className="font-semibold"
                >
                    {isChecklistComplete ? 'Iniciar Rota' : 'Itens Críticos Pendentes'}
                </Button>
            </div>
        </div>
    );
};

export default Checklist;