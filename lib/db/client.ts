import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'confluencr';

declare global {
  // eslint-disable-next-line no-var
  var _mongo: { client: MongoClient; db: Db } | undefined;
}

export async function getDb(): Promise<Db> {
  if (!uri) throw new Error('MONGODB_URI not set');
  if (globalThis._mongo) return globalThis._mongo.db;
  const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(dbName);
  globalThis._mongo = { client, db };
  return db;
}
