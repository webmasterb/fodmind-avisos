// Manda por ntfy los avisos de publicacion que ya tocan.
// El calendario (AVISOS_JSON) y el canal (NTFY_TOPIC) son secretos del repositorio:
// aqui solo esta el codigo. enviados.json guarda huellas, no nombres.
import fs from 'node:fs';
import crypto from 'node:crypto';

const topic = process.env.NTFY_TOPIC;
const avisos = JSON.parse(process.env.AVISOS_JSON || '[]');
if (!topic) throw new Error('falta el secreto NTFY_TOPIC');
const huella = (id) => crypto.createHash('sha256').update(id).digest('hex').slice(0, 16);
const enviados = fs.existsSync('enviados.json') ? JSON.parse(fs.readFileSync('enviados.json', 'utf8')) : [];
const ahora = Date.now();
// Si GitHub se salta una hora, sale en la siguiente; uno de hace mas de 6 h ya no sirve.
const tocan = avisos.filter((a) => !enviados.includes(huella(a.id)) && Date.parse(a.cuando) <= ahora && Date.parse(a.cuando) > ahora - 6 * 3600e3);
for (const a of tocan) {
  const r = await fetch('https://ntfy.sh', {
    method: 'POST',
    body: JSON.stringify({ topic, title: a.titulo, message: a.mensaje, click: a.click, tags: a.tags, priority: 4 }),
  });
  console.log(`aviso ${huella(a.id)}: ${r.status}`);
  if (r.ok) enviados.push(huella(a.id));
}
fs.writeFileSync('enviados.json', `${JSON.stringify(enviados, null, 2)}\n`);
