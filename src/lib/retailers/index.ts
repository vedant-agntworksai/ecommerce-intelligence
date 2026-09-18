import type { Retailer } from "@/lib/domain";
import { AmazonAdapter } from "./amazon"; import { WalmartAdapter } from "./walmart"; import { LowesAdapter } from "./lowes"; import { HomeDepotAdapter } from "./homedepot";
const adapters={amazon:new AmazonAdapter(),walmart:new WalmartAdapter(),lowes:new LowesAdapter(),homedepot:new HomeDepotAdapter()} as const;
export const getRetailerAdapter=(retailer:Retailer)=>adapters[retailer];
export { detectRetailer } from "./base";
