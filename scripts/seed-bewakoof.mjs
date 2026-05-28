import { MongoClient } from 'mongodb';
import { uuidv7 } from 'uuidv7';
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

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'confluencr';
if (!uri) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

// Snapshot was captured from a real end-to-end run of the cockpit on
// 2026-05-29 using a BYO gpt-5 key. Every concept, every prompt, every
// craft-depth block is verbatim model output. No mockups.
const snapshotPath = path.resolve(process.cwd(), 'scripts', 'bewakoof-snapshot.json');
if (!fs.existsSync(snapshotPath)) {
  console.error('Missing snapshot at', snapshotPath);
  process.exit(1);
}
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const PROJECT_ID = uuidv7();
const now = new Date();

console.log('[1/7] Project');
await db.collection('projects').insertOne({
  ...snapshot.project,
  _id: PROJECT_ID,
  createdAt: now,
  lastTouchedAt: now,
  step: snapshot.project?.step ?? 6,
  theme: snapshot.project?.theme ?? 'dark',
  testBrand: 'bewakoof',
});

console.log('[2/7] Brief');
{
  const briefId = uuidv7();
  const doc = { ...snapshot.brief };
  delete doc._id;
  doc.projectId = PROJECT_ID;
  doc.updatedAt = now;
  await db.collection('briefs').insertOne({ _id: briefId, ...doc });
}

console.log('[3/7] Style Report');
if (snapshot.styleReport) {
  const id = uuidv7();
  const doc = { ...snapshot.styleReport };
  delete doc._id;
  doc.projectId = PROJECT_ID;
  await db.collection('styleReports').insertOne({ _id: id, ...doc });
}

console.log('[4/7] Angle Proposals');
let angleIdMap = new Map();
if (snapshot.angleProposals) {
  const id = uuidv7();
  const doc = { ...snapshot.angleProposals };
  delete doc._id;
  doc.projectId = PROJECT_ID;
  // Reassign angle ids so external links never collide with the source project
  const remappedAngles = (doc.angles ?? []).map((a) => {
    const fresh = uuidv7();
    angleIdMap.set(a.id, fresh);
    return { ...a, id: fresh };
  });
  doc.angles = remappedAngles;
  doc.pickedAngleIds = (doc.pickedAngleIds ?? []).map((oldId) => angleIdMap.get(oldId) ?? oldId);
  await db.collection('angleProposals').insertOne({ _id: id, ...doc });
}

console.log('[5/7] Concept Briefs');
for (const concept of snapshot.conceptBriefs ?? []) {
  const id = uuidv7();
  const doc = { ...concept };
  delete doc._id;
  doc.projectId = PROJECT_ID;
  if (doc.angleId && angleIdMap.has(doc.angleId)) {
    doc.angleId = angleIdMap.get(doc.angleId);
  }
  await db.collection('conceptBriefs').insertOne({ _id: id, ...doc });
}

console.log('[6/7] Prompt Deck');
if (snapshot.promptDeck) {
  const id = uuidv7();
  const doc = { ...snapshot.promptDeck };
  delete doc._id;
  doc.projectId = PROJECT_ID;
  await db.collection('promptDecks').insertOne({ _id: id, ...doc });
}

console.log('[7/7] Done.');
console.log('Seeded project:', PROJECT_ID);
console.log('Open: http://localhost:3000/p/' + PROJECT_ID);

await client.close();
