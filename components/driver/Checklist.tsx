import React, { useState, useMemo } from 'react';
import { MOCK_CHECKLIST_ITEMS } from '../../constants';
import type { ChecklistItem } from '../../types';
import { CheckCircleIcon, ExclamationCircleIcon, WrenchScrewdriverIcon, TruckIcon, ShieldCheckIcon, UserIcon, DocumentTextIcon } from '../icons/Icons';

interface ChecklistProps {
    onComplete: () => void;
}

const categoryIcons: { [key: string]: React.ReactNode } = {
    'Mecânicos': <WrenchScrewdriverIcon className="h-6 w-6" variant="rotate" />,
    'Estrutura': <TruckIcon className="h-6 w-6" variant="scale" />,
    'Segurança': <ShieldCheckIcon className="h-6 w-6" variant="glow" />,
    'Conforto': <UserIcon className="h-6 w-6" variant="hover" />,
    'Documentação': <DocumentTextIcon className="h-6 w-6" variant="float" />,
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
        <div className="flex flex-col h-full min-h-0">
            <header className="flex-shrink-0 bg-golffox-blue-dark text-white p-3 sm:p-4 text-center shadow-md z-10">
                <h1 className="text-lg sm:text-xl font-bold">Checklist Pré-Rota</h1>
                <p className="text-xs sm:text-sm opacity-80">Veículo: ABC-1234</p>
            </header>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-golffox-white min-h-0" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <div className="w-full bg-golffox-gray-light rounded-full h-2.5 mb-4 sticky top-0 z-10">
                    <div className="bg-golffox-orange-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="space-y-4 pb-4">
                    {Object.entries(MOCK_CHECKLIST_ITEMS).map(([category, items]) => (
                        <div key={category} className="mb-4">
                            <h2 className="flex items-center text-base sm:text-lg font-bold text-golffox-gray-dark mb-2 sticky top-8 bg-golffox-white py-1 z-5">
                                {categoryIcons[category]}
                                <span className="ml-2">{category}</span>
                            </h2>
                            <div className="bg-golffox-gray-light rounded-lg p-2 sm:p-3 space-y-2">
                                {items.map((item: ChecklistItem) => (
                                    <div 
                                        key={item.id} 
                                        className={`p-2 sm:p-3 rounded-md flex justify-between items-center transition-colors min-h-[60px] ${
                                            checkedItems[item.id] === 'nok' && item.isCritical ? 'bg-golffox-red/20' : 'bg-white'
                                        }`}
                                    >
                                        <span className={`text-xs sm:text-sm ${item.isCritical ? 'font-bold' : ''} text-golffox-gray-medium flex-1 pr-2`}>
                                            {item.label} {item.isCritical && <span className="text-golffox-red">*</span>}
                                        </span>
                                        <div className="flex space-x-2 flex-shrink-0">
                                            <button 
                                                onClick={() => handleCheck(item.id, 'nok')} 
                                                className={`p-2 rounded-full transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                                                    checkedItems[item.id] === 'nok' ? 'bg-golffox-red text-white scale-110' : 'text-golffox-gray-medium hover:bg-golffox-red/10'
                                                }`}
                                                aria-label={`Marcar ${item.label} como problema`}
                                            >
                                                <ExclamationCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" variant="pulse"/>
                                            </button>
                                            <button 
                                                onClick={() => handleCheck(item.id, 'ok')} 
                                                className={`p-2 rounded-full transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${
                                                    checkedItems[item.id] === 'ok' ? 'bg-golffox-orange-primary text-white scale-110' : 'text-golffox-gray-medium hover:bg-golffox-orange-primary/10'
                                                }`}
                                                aria-label={`Marcar ${item.label} como ok`}
                                            >
                                                <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" variant="bounce"/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="flex-shrink-0 p-3 sm:p-4 border-t border-golffox-gray-light bg-white">
                <button
                    onClick={onComplete}
                    disabled={!isChecklistComplete}
                    className="w-full bg-golffox-orange-primary text-white font-bold py-3 sm:py-4 rounded-lg transition-all duration-300 disabled:bg-golffox-gray-medium disabled:cursor-not-allowed transform hover:enabled:scale-105 min-h-[48px] text-sm sm:text-base"
                >
                    {isChecklistComplete ? 'Iniciar Rota' : 'Itens Críticos Pendentes'}
                </button>
            </footer>
        </div>
    );
};

export default Checklist;