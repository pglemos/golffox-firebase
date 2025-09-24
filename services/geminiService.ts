import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_CONFIG } from "../config";

export const generateReport = async (prompt: string, contextData: any): Promise<string> => {
  const API_KEY = GEMINI_CONFIG.apiKey;

  if (!API_KEY) {
    return Promise.resolve("Erro: Chave da API do Gemini não configurada. A funcionalidade de relatório com IA está desativada.");
  }

  // Instantiate the client only when the function is called and the key is available.
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const fullPrompt = `
    Contexto: Você é um assistente de análise de dados para uma empresa de transporte de funcionários chamada Golffox.
    Sua tarefa é responder a perguntas sobre as operações com base nos dados fornecidos.
    Seja conciso e direto.

    Dados brutos do dia (em formato JSON):
    ${JSON.stringify(contextData, null, 2)}

    Pergunta do usuário: "${prompt}"

    Sua resposta:
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
            temperature: 0.3,
            topP: 0.9,
        }
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating report from Gemini:", error);
    if (error instanceof Error) {
        return `Ocorreu um erro ao gerar o relatório: ${error.message}`;
    }
    return "Ocorreu um erro desconhecido ao gerar o relatório.";
  }
};