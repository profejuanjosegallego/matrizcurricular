// GET  /api/aportes            -> lista todos los aportes
// GET  /api/aportes?materia=ID -> lista aportes de una materia
// POST /api/aportes            -> crea/actualiza el aporte de un docente en una materia
const { getDb } = require('../lib/mongo');

const MATERIAS_VALIDAS = [
  'logica', 'intro', 'bd', 'agiles', 'backend1',
  'frontend1', 'nuevastec', 'backend2', 'frontend2'
];

module.exports = async (req, res) => {
  try {
    const db = await getDb();
    const col = db.collection('aportes');

    if (req.method === 'GET') {
      const materia = req.query && req.query.materia;
      const filtro = materia ? { materiaId: materia } : {};
      const items = await col.find(filtro).sort({ updatedAt: -1 }).toArray();
      return res.status(200).json(items);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      const materiaId = String(b.materiaId || '').trim();
      const profesor = String(b.profesor || '').trim();

      if (!MATERIAS_VALIDAS.includes(materiaId)) {
        return res.status(400).json({ error: 'materiaId invalido' });
      }
      if (!profesor) {
        return res.status(400).json({ error: 'El nombre del docente es obligatorio' });
      }

      const now = new Date();
      const datos = {
        materiaId,
        profesor,
        comprension: String(b.comprension || '').trim(),
        saber: String(b.saber || '').trim(),
        saberHacer: String(b.saberHacer || '').trim(),
        saberSer: String(b.saberSer || '').trim(),
        updatedAt: now
      };

      await col.updateOne(
        { materiaId, profesor },
        { $set: datos, $setOnInsert: { createdAt: now } },
        { upsert: true }
      );
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Metodo no permitido' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
