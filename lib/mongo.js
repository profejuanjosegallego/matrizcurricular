// Conexion reutilizable a MongoDB (cacheada entre invocaciones serverless).
const { MongoClient } = require('mongodb');

let cached = global._mongoCache;
if (!cached) cached = global._mongoCache = { client: null, promise: null };

async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Falta la variable de entorno MONGODB_URI');
  }
  if (!cached.promise) {
    cached.promise = MongoClient.connect(uri);
  }
  cached.client = await cached.promise;
  return cached.client.db(process.env.MONGODB_DB || 'cesde_consultor');
}

module.exports = { getDb };
