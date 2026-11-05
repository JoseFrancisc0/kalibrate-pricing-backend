import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const config = {
  maxDuration: 15 // Límite seguro dentro del plan Hobby
};

export async function POST(req) {
  // Manejo de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200 });
  }

  try {
    const { messages, contextoEstaciones } = await req.json();

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: `Eres el Agente Experto en Pricing de Primax (Red COESTI - Operación Directa).
Tu objetivo es asistir al equipo comercial y analistas de pricing respondiendo consultas sobre:
- Precios de pizarra propios vs competencia (Diesel, Regular, Premium, GNV, GLP).
- Desempeño comercial (volumen en galones y ventas en Soles).
- Identificación de competidores cercanos y deltas de mercado.

Sé directo, profesional, estructurado y enfocado en números concretos. Si el usuario te hace una pregunta analítica, básate en el contexto recibido o en las herramientas disponibles.`,
      messages,
      tools: {
        analizarEstacion: tool({
          description: 'Obtiene el detalle de precios y rivales de una estación específica',
          parameters: z.object({
            estacion: z.string().describe('Nombre de la estación a buscar')
          }),
          execute: async ({ estacion }) => {
            if (!contextoEstaciones || !Array.isArray(contextoEstaciones)) {
              return { error: 'No se suministró contexto de estaciones en la petición' };
            }
            const query = estacion.toLowerCase();
            const matches = contextoEstaciones.filter(e => 
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