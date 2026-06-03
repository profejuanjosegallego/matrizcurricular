// POST /api/sintesis  { materiaId, soloPrompt? }
// Construye el prompt a partir de los aportes y genera la sintesis con Groq.
// Si soloPrompt=true, devuelve solo el prompt (sin llamar al modelo).
const { getDb } = require('../lib/mongo');

const MATERIAS = {
  logica: 'Lógica de Programación',
  intro: 'Introducción a la Programación',
  bd: 'Gestión de Bases de Datos',
  agiles: 'Metodologías Ágiles',
  backend1: 'Backend I',
  frontend1: 'Frontend I',
  nuevastec: 'Nuevas Tecnologías de Programación',
  backend2: 'Backend II',
  frontend2: 'Frontend II'
};

const SYSTEM = 'Eres un experto en diseño curricular por competencias para programas técnicos de desarrollo de software. Redactas siempre en español, en tercera persona y con un tono académico, claro y preciso.';

function construirPrompt(nombreMateria, aportes) {
  const bloques = aportes.map((a, i) =>
    `Docente ${i + 1} (${a.profesor}):\n` +
    `- Comprensión del consultor: ${a.comprension || '(no registrada)'}\n` +
    `- Saber: ${a.saber || '(no registrado)'}\n` +
    `- Saber-hacer: ${a.saberHacer || '(no registrado)'}\n` +
    `- Saber-ser: ${a.saberSer || '(no registrado)'}`
  ).join('\n\n');

  return `Objetivo: A partir de los aportes de los docentes sobre el perfil del «consultor» en el submódulo "${nombreMateria}" del programa Técnico Laboral como Asistente en Desarrollo de Software (CESDE), construye UNA única definición consensuada que integre y sintetice las distintas visiones. Esta definición servirá como base para realizar los ajustes del programa.

Instrucciones:
- Integra los aportes sin repetir ideas; resuelve los solapamientos y unifica la terminología.
- Conserva lo esencial de cada docente y mantén un nivel de exigencia acorde a la formación técnica laboral.
- Redacta en tercera persona y con tono académico.

Entrega la respuesta EXACTAMENTE con esta estructura:

Comprensión del consultor:
<un párrafo que defina cómo se entiende al consultor en este submódulo>

Saber (conocimientos):
<síntesis>

Saber-hacer (habilidades):
<síntesis>

Saber-ser (actitudes y valores):
<síntesis>

Aportes de los docentes:
${bloques}`;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Método no permitido' });
    }
    const b = req.body || {};
    const materiaId = String(b.materiaId || '').trim();
    const nombreMateria = MATERIAS[materiaId];
    if (!nombreMateria) return res.status(400).json({ error: 'materiaId inválido' });

    const db = await getDb();
    const aportes = await db.collection('aportes').find({ materiaId }).toArray();
    if (!aportes.length) {
      return res.status(400).json({ error: 'Aún no hay aportes de docentes para sintetizar en este submódulo.' });
    }

    const prompt = construirPrompt(nombreMateria, aportes);
    if (b.soloPrompt) return res.status(200).json({ prompt });

    const key = process.env.GROQ_API_KEY;
    if (!key) return res.status(500).json({ error: 'Falta la variable de entorno GROQ_API_KEY' });

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await groqRes.json();
    if (!groqRes.ok) {
      return res.status(502).json({ error: 'Groq: ' + ((data.error && data.error.message) || groqRes.status) });
    }
    const sintesis = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!sintesis) return res.status(502).json({ error: 'La IA no devolvió contenido' });

    return res.status(200).json({ prompt, sintesis: sintesis.trim() });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
