// api/mercado.js
import volumenData from '../data/volumen_ventas_calle.json' assert { type: 'json' };

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200 });
  }

  // Precalcula o entrega el resumen consolidado
  const kpis = {
    fecha_corte: volumenData.fecha_corte || new Date().toISOString().split('T')[0],
    volumen_total_gal: volumenData.volumen_total_gal || 0,
    margen_promedio: volumenData.margen_promedio || 0,
    estaciones_activas: volumenData.estaciones_activas || 0,
    alertas_activas: volumenData.alertas_activas || 0
  };

  return new Response(JSON.stringify(kpis), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=300'
    }
  });
}