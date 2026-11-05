// api/precios.js
// Si tienes el JSON en el repo o lo sincronizas desde Databricks:
import matrizData from '../data/matriz_precios.json' assert { type: 'json' };

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200 });
  }

  const url = new URL(req.url);
  const dpto = url.searchParams.get('dpto');
  const query = url.searchParams.get('q');

  let estaciones = matrizData.estaciones || matrizData;

  // Filtrado ligero en el intermediario
  if (dpto && dpto !== 'TODOS') {
    estaciones = estaciones.filter(e => 
      (e.departamento || '').toUpperCase() === dpto.toUpperCase()
    );
  }

  if (query) {
    const q = query.toLowerCase();
    estaciones = estaciones.filter(e => 
      (e.estacion_cabecera || e.estacion || '').toLowerCase().includes(q)
    );
  }

  return new Response(JSON.stringify({
    timestamp: new Date().toISOString(),
    total: estaciones.length,
    estaciones
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300' // Caché en Edge de Vercel
    }
  });
}