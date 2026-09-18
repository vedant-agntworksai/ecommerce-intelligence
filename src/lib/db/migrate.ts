import fs from "node:fs";
import path from "node:path";
import { getDb } from "./index";

async function main(){
  const db = await getDb();
  const dir = path.join(process.cwd(),"src/lib/db/migrations");
  const files = fs.readdirSync(dir).filter(f=>f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir,file),"utf8");
    for (const statement of sql.split(";").map(s=>s.trim()).filter(Boolean)) await db.query(statement);
    console.log(`applied ${file}`);
  }
  await db.close();
}
main().catch(e=>{console.error(e);process.exit(1);});
