import { getDb } from "@/lib/db";
import { SettingsRepository } from "@/lib/db/repositories/settings-repository";
import { SettingsForm } from "@/components/settings-form";
export const dynamic="force-dynamic";
export default async function Settings(){
  const settings=await new SettingsRepository(await getDb()).get();
  return <div className="p-8"><p className="text-sm text-cyan-400">Settings</p><h2 className="mt-1 text-3xl font-semibold">Cost and matching controls</h2><p className="muted mt-2 mb-6">These values are persisted in the application database. Oxylabs credentials stay server-side in environment variables.</p><SettingsForm initial={settings}/></div>;
}
