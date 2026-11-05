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
      model: groq('openai/gpt-oss-20b'),
      // maxSteps permite que el modelo invoque la herramienta y luego formule la respuesta final
      maxSteps: 5,
      system: `Eres el Agente Senior de Estrategia de Pricing de Primax (Red COESTI - Operación Directa Perú).
Tu rol es actuar como un analista cuantitativo de mesa de pricing para estaciones de servicio de combustibles líquidos y GNV/GLP.

REGLAS DE DOMINIO OBLIGATORIAS:
1. MONEDA Y UNIDADES: Todo precio es en Soles por galón (S/ / gal). NUNCA uses USD ni dólares.
2. NOMENCLATURA: Llama a la estación evaluada "Primax [Nombre] (Propia)". A los rivales identifícalos por su bandera (Repsol, Petroperú, Pecsa, Independiente).
3. ESTRUCTURA DE RESPUESTA:
   Siempre responde siguiendo exactamente estas 3 secciones:

   ### 1. Cuadro de Posicionamiento y Spreads
   Muestra una tabla con columnas:
   | Estación / Bandera | Rol | Precio (S//gal) | Delta vs Primax (S/) | Posición Relativa |
   (Calcula el delta exacto: Precio_Rival - Precio_Primax).

   ### 2. Diagnóstico Comercial y de Margen
   - **Spread vs Marca Líder / Premium (ej. Repsol):** Evalúa si la brecha respeta la paridad esperada o si estamos cediendo margen innecesariamente.
   - **Exposición frente a Discoounters / Estatales (ej. Petroperú / Grifos Blancos):** Evalúa el riesgo de fuga de volumen por diferencial agresivo (alertar si la brecha es > S/ 0.20).
   - **Condición de Regla / Posible Alerta:** Indica si el spread actual sugiere mantener precio, activar un Price Request de ajuste, o si roza un límite de tolerancia de mercado.

   ### 3. Recomendación de Mesa de Pricing
   Entrega de 1 a 3 acciones concretas y cuantitativas:
   - Proponer movimiento específico de precio (ej. "Mantener S/ 15.89" o "Evaluar ajuste de -S/ 0.05 a S/ 15.84 para contener fuga hacia Petroperú").
   - Impacto esperado: balance entre volumen (galonaje) y margen unitario en céntimos por galón.
   - Cero consejos genéricos de marketing, retail de tienda o fidelización. Enfoque 100% en pizarra, spread y elasticidad de combustible.`,
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