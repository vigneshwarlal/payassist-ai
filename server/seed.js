import { initDb } from './db.js';

console.log('Force reseeding SQLite database...');
try {
  await initDb(true);
  console.log('Database successfully re-seeded with fresh data!');
  process.exit(0);
} catch (err) {
  console.error('Failed to seed database:', err);
  process.exit(1);
}
