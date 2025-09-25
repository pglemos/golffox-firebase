import React, { useState } from 'react';
import { generateReport } from '../services/geminiService';
import { MOCK_ROUTES, MOCK_ALERTS, MOCK_VEHICLES } from '../constants';
import { PaperAirplaneIcon } from './icons/Icons';

const Reports: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState('');
  const [error, setError] = useState('');
  
  const handleGenerateReport = async () => {
    if (!query.trim()) {
        setError('Por favor, insira uma pergunta para gerar o relatório.');
        return;
    }
    setIsLoading(true);
    setError('');
    setReport('');

    // In a real application, you would fetch this data or have it in a state management store.
    const contextData = {
        routes: MOCK_ROUTES,
        alerts: MOCK_ALERTS,
        vehicles: MOCK_VEHICLES,
    };

    try {
        const result = await generateReport(query, contextData);
        setReport(result);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Falha ao gerar relatório: ${errorMessage}`);
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-3xl font-bold text-golffox-gray-dark mb-6">Relatórios com IA</h2>
      
      <div className="bg-golffox-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-golffox-gray-dark mb-2">Faça uma pergunta sobre as operações</h3>
        <p className="text-golffox-gray-medium mb-4">
            Exemplos: &quot;Qual rota teve o maior atraso?&quot;, &quot;Liste os veículos com problemas.&quot;, &quot;Resuma os alertas críticos de hoje.&quot;
        </p>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite sua pergunta aqui..."
            className="flex-grow p-3 border border-golffox-gray-light rounded-md focus:ring-2 focus:ring-golffox-orange-primary focus:outline-none transition"
            disabled={isLoading}
          />
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="flex items-center justify-center bg-golffox-orange-primary text-white font-bold py-3 px-6 rounded-md hover:bg-orange-600 transition-colors duration-300 disabled:bg-golffox-gray-medium disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gerando...
                </>
            ) : (
                <>
                    <PaperAirplaneIcon className="h-5 w-5 mr-2"/>
                    Gerar
                </>
            )}
          </button>
        </div>
        {error && <p className="text-golffox-red mt-4">{error}</p>}
      </div>

      {(isLoading || report) && (
        <div className="mt-6 bg-golffox-white p-6 rounded-lg shadow-md animate-fade-in">
          <h3 className="text-xl font-semibold text-golffox-gray-dark mb-4">Resultado da Análise</h3>
           {isLoading && !report && (
             <div className="space-y-3">
               <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
               <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
               <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
             </div>
           )}
          {report && <pre className="whitespace-pre-wrap font-sans text-golffox-gray-medium bg-golffox-gray-light/50 p-4 rounded-md">{report}</pre>}
        </div>
      )}
    </div>
  );
};

export default Reports;