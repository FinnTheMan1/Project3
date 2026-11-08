import "dotenv/config";
import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL не задан. Создайте файл .env на основе .env.example.");
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const schema = fs.readFileSync(path.join(__dirname, "..", "database", "schema.sql"), "utf8");
  const seed = fs.readFileSync(path.join(__dirname, "..", "database", "seed.sql"), "utf8");

  console.log("1/2 Создание структуры БД...");
  await client.query(schema);
  console.log("2/2 Загрузка демонстрационных данных...");
  await client.query(seed);

  const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM users");
  console.log(`Готово. Пользователей в БД: ${rows[0].count}`);
  await client.end();
}

run().catch(async (err) => {
  console.error("Не удалось инициализировать БД:");
  console.error(err.message);
  try { await client.end(); } catch {}
  process.exit(1);
});
