// api/precios.js
import fs from 'node:fs';
import path from 'node:path';

export const config = {
  maxDuration: 10
};

export async function GET(req) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'matriz_precios.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const matrizData = JSON.parse(fileContent);

    const url = new URL(req.url);
    const dpto = url.searchParams.get('dpto');
    const query = url.searchParams.get('q');

    let estaciones = matrizData.estaciones || matrizData;

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
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}