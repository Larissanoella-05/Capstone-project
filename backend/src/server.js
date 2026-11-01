import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { describeDatabase } from './utils/describeDatabase.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`Umuriro Response API listening on http://localhost:${env.port}`);
  console.log(`Using database ${describeDatabase(env.databaseUrl)}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
