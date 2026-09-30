// Deja programados en ntfy los avisos de publicacion de los proximos dias.
// El calendario (AVISOS_JSON) y el canal (NTFY_TOPIC) son secretos del repositorio:
// aqui solo esta el codigo. enviados.json guarda huellas, no nombres.
//
// La tarea de GitHub corre cada hora pero puede llegar tarde varios minutos, y el
// aviso tiene que sonar 5 minutos antes de publicar. Por eso no se manda a su hora:
// en cuanto un aviso cae dentro de las proximas 71 h (ntfy guarda hasta 3 dias),
// se le entrega a ntfy con la hora exacta y es ntfy quien lo suelta al minuto.
import fs from 'node:fs';
import crypto from 'node:crypto';

const topic = process.env.NTFY_TOPIC;
const avisos = JSON.parse(process.env.AVISOS_JSON || '[]');
if (!topic) throw new Error('falta el secreto NTFY_TOPIC');
const huella = (id) => crypto.createHash('sha256').update(id).digest('hex').slice(0, 16);
const enviados = fs.existsSync('enviados.json') ? JSON.parse(fs.readFileSync('enviados.json', 'utf8')) : [];
const ahora = Date.now();
const tocan = avisos.filter((a) => {
  const t = Date.parse(a.cuando);
  return !enviados.includes(huella(a.id)) && t > ahora - 3600e3 && t <= ahora + 71 * 3600e3;
});
for (const a of tocan) {
  const t = Date.parse(a.cuando);
  const cuerpo = { topic, title: a.titulo, message: a.mensaje, click: a.click, tags: a.tags, priority: 4 };
  if (t > ahora + 60e3) cuerpo.delay = String(Math.floor(t / 1000));
  const r = await fetch('https://ntfy.sh', { method: 'POST', body: JSON.stringify(cuerpo) });
  console.log(`aviso ${huella(a.id)} para ${a.cuando}: ${r.status}`);
  if (r.ok) enviados.push(huella(a.id));
}
fs.writeFileSync('enviados.json', `${JSON.stringify(enviados, null, 2)}\n`);
