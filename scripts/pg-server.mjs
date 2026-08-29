import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PGlite } from '@electric-sql/pglite';
import { createServer } from 'pglite-server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const dataDir = path.join(root, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const pgDataPath = path.join(dataDir, 'postgres_db');
const PORT = parseInt(process.env.PG_PORT || '5433', 10);

async function startServer() {
  console.log('--- تشغيل خادم PostgreSQL المحلي (PGlite Wire Protocol Daemon) ---');
  const pidFile = path.join(pgDataPath, 'postmaster.pid');
  if (fs.existsSync(pidFile)) {
    try { fs.unlinkSync(pidFile); } catch (e) {}
  }
  const pglite = new PGlite(pgDataPath);
  await pglite.waitReady;

  const server = createServer(pglite);

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 خادم PostgreSQL يستمع بنجاح على: postgresql://postgres:postgres@127.0.0.1:${PORT}/student_notes`);
    console.log('✅ جاهز لاستقبال اتصالات Next.js والاختبارات بشكل متزامن وبدون تعارض.');
  });

  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

startServer().catch((err) => {
  console.error('❌ خطأ في بدء خادم PostgreSQL:', err);
  process.exit(1);
});
