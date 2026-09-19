import { getDb } from "@/lib/db";
import { JobRepository } from "@/lib/db/repositories/job-repository";
import type { ScrapeJobPayload } from "./types";

export async function enqueueScrape(payload:ScrapeJobPayload){
  return new JobRepository(await getDb()).enqueue("scrape",payload);
}
