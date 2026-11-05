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
Tu función es asistir a los analistas comerciales y gerencia respondiendo sobre:
- Precios de combustibles de pizarra propios vs competencia directa (Diesel, Regular, Premium, GNV, GLP).
- Desempeño comercial y volumen en galones / ventas en soles.
- Spreads competitivos y deltas de mercado.

Sé directo, estructurado y enfocado en números exactos. Si el usuario pregunta por una estación o zona en particular, consulta la herramienta disponible o básate en los datos provistos.`,
      messages,
      tools: {
        analizarEstacion: tool({
          description: 'Obtiene precios y rivales de una estación específica',
          parameters: z.object({
            estacion: z.string().describe('Nombre o parte del nombre de la estación')
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

    return result.toDataStreamResponse();
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}