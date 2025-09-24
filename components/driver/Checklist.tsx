import React, { useState, useMemo } from 'react';
import { MOCK_CHECKLIST_ITEMS } from '../../constants';
import type { ChecklistItem } from '../../types';
import { CheckCircleIcon, ExclamationCircleIcon, WrenchScrewdriverIcon, TruckIcon, ShieldCheckIcon, UserIcon, DocumentTextIcon } from '../icons/Icons';

interface ChecklistProps {
    onComplete: () => void;
}

const categoryIcons: { [key: string]: React.ReactNode } = {
    'Mecânicos': <WrenchScrewdriverIcon className="h-6 w-6" />,
    'Estrutura': <TruckIcon className="h-6 w-6" />,
    'Segurança': <ShieldCheckIcon className="h-6 w-6" />,
    'Conforto': <UserIcon className="h-6 w-6" />,
    'Documentação': <DocumentTextIcon className="h-6 w-6" />,
};


const Checklist: React.FC<ChecklistProps> = ({ onComplete }) => {
    const [checkedItems, setCheckedItems] = useState<Record<string, 'ok' | 'nok'>>({});

    const allItems = useMemo(() => Object.values(MOCK_CHECKLIST_ITEMS).flat(), []);
    const criticalItems = useMemo(() => allItems.filter(item => item.isCritical), [allItems]);

    const handleCheck = (itemId: string, status: 'ok' | 'nok') => {
        setCheckedItems(prev => ({ ...prev, [itemId]: status }));
    };

    const isChecklistComplete = useMemo(() => {
        return criticalItems.every(item => checkedItems[item.id] === 'ok');
    }, [checkedItems, criticalItems]);
    
    const totalChecked = Object.keys(checkedItems).length;
    const progress = (totalChecked / allItems.length) * 100;

    return (
        <div className="flex flex-col h-full">
            <header className="bg-golffox-blue-dark text-white p-4 text-center shadow-md z-10">
                <h1 className="text-xl font-bold">Checklist Pré-Rota</h1>
                <p className="text-sm opacity-80">Veículo: ABC-1234</p>
            </header>

            <div className="flex-grow overflow-y-auto p-4 bg-golffox-white">
                <div className="w-full bg-golffox-gray-light rounded-full h-2.5 mb-4">
                    <div className="bg-golffox-orange-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>

                {Object.entries(MOCK_CHECKLIST_ITEMS).map(([category, items]) => (
                    <div key={category} className="mb-4">
                        <h2 className="flex items-center text-lg font-bold text-golffox-gray-dark mb-2">
                            {categoryIcons[category]}
                            <span className="ml-2">{category}</span>
                        </h2>
                        <div className="bg-golffox-gray-light rounded-lg p-3 space-y-2">
                            {items.map((item: ChecklistItem) => (
                                <div 
                                    key={item.id} 
                                    className={`p-3 rounded-md flex justify-between items-center transition-colors ${
                                        checkedItems[item.id] === 'nok' && item.isCritical ? 'bg-golffox-red/20' : 'bg-white'
                                    }`}
                                >
                                    <span className={`text-sm ${item.isCritical ? 'font-bold' : ''} text-golffox-gray-medium`}>
                                        {item.label} {item.isCritical && <span className="text-golffox-red">*</span>}
                                    </span>
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleCheck(item.id, 'nok')} className={`p-1 rounded-full ${checkedItems[item.id] === 'nok' ? 'bg-golffox-red text-white' : 'text-golffox-gray-medium'}`}>
                                            <ExclamationCircleIcon className="h-6 w-6"/>
                                        </button>
                                        <button onClick={() => handleCheck(item.id, 'ok')} className={`p-1 rounded-full ${checkedItems[item.id] === 'ok' ? 'bg-golffox-orange-primary text-white' : 'text-golffox-gray-medium'}`}>
                                            <CheckCircleIcon className="h-6 w-6"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <footer className="p-4 border-t border-golffox-gray-light bg-white">
                <button
                    onClick={onComplete}
                    disabled={!isChecklistComplete}
                    className="w-full bg-golffox-orange-primary text-white font-bold py-4 rounded-lg transition-all duration-300 disabled:bg-golffox-gray-medium disabled:cursor-not-allowed transform hover:enabled:scale-105"
                >
                    {isChecklistComplete ? 'Iniciar Rota' : 'Itens Críticos Pendentes'}
                </button>
            </footer>
        </div>
    );
};

export default Checklist;