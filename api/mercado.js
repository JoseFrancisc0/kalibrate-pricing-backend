// api/mercado.js
import fs from 'node:fs';
import path from 'node:path';

export const config = {
  maxDuration: 10
};

export async function GET(req) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'volumen_ventas_calle.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const volumenData = JSON.parse(fileContent);

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
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}