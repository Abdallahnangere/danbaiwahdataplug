import { neon } from '@neondatabase/serverless';

const db = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4Juszq9nIWpk@ep-rapid-flower-amdw7k6j-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

const before = await db('SELECT id, name, phone, balance FROM "User" WHERE LOWER(name) LIKE LOWER($1) ORDER BY "createdAt" DESC', ['%bashir%lawan%']);
console.log('before', JSON.stringify(before));

await db('UPDATE "User" SET balance = 0 WHERE phone = $1', ['08086973538']);
await db('UPDATE "User" SET balance = $1 WHERE LOWER(name) LIKE LOWER($2) AND phone <> $3', [1510.83, '%bashir%lawan%', '08086973538']);

const after = await db('SELECT id, name, phone, balance FROM "User" WHERE LOWER(name) LIKE LOWER($1) ORDER BY "createdAt" DESC', ['%bashir%lawan%']);
console.log('after', JSON.stringify(after));
