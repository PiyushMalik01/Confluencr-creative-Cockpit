import { MongoClient } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
}

const SRC = process.argv[2] || '019e7055-a0db-7a84-9e18-68e2b55c3886';
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'confluencr';

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const out = {
  source: SRC,
  capturedAt: new Date().toISOString(),
  project: await db.collection('projects').findOne({ _id: SRC }),
  brief: await db.collection('briefs').findOne({ projectId: SRC }),
  styleReport: await db.collection('styleReports').findOne({ projectId: SRC }),
  angleProposals: await db.collection('angleProposals').findOne({ projectId: SRC }),
  conceptBriefs: await db.collection('conceptBriefs').find({ projectId: SRC }).sort({ position: 1 }).toArray(),
  promptDeck: await db.collection('promptDecks').findOne({ projectId: SRC }),
};

const outPath = path.resolve(process.cwd(), 'scripts', 'bewakoof-snapshot.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log('wrote', outPath, 'bytes:', fs.statSync(outPath).size);
console.log('concepts:', out.conceptBriefs.length, 'deck cards:', out.promptDeck?.cards?.length ?? 0, 'angles:', out.angleProposals?.angles?.length ?? 0);
await client.close();
