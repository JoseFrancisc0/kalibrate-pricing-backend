import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY
});

export const config = {
  maxDuration: 15
};

export async function POST(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200 });
  }

  try {
    const { messages, contextoEstaciones } = await req.json();

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: `Eres el Agente Experto en Pricing de Primax (Red COESTI - Operación Directa).
Asiste a analistas comerciales respondiendo sobre precios de combustibles, volúmenes de venta y competencia.
Responde de forma ejecutiva, concisa y basada en datos numéricos concretos.`,
      messages,
      tools: {
        analizarEstacion: tool({
          description: 'Obtiene precios y rivales de una estación específica',
          parameters: z.object({
            estacion: z.string().describe('Nombre de la estación')
          }),
          execute: async ({ estacion }) => {
            const query = estacion.toLowerCase();
            const matches = (contextoEstaciones || []).filter(e => 
              (e.estacion || e.estacion_cabecera || '').toLowerCase().includes(query)
            );
            return matches.slice(0, 3);
          }
        })
      }
    });

    // getErrorMessage expone el motivo real del error en el stream
    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        if (error == null) return 'unknown error';
        if (typeof error === 'string') return error;
        if (error instanceof Error) return error.message;
        return JSON.stringify(error);
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}