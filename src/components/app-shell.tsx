import Link from "next/link";
import { BarChart3, Boxes, Building2, Database, Download, LayoutDashboard, Search, Settings, Star, Store } from "lucide-react";

const nav = [
  ["Overview","/",LayoutDashboard],["Brands","/brands",Building2],["Products","/products",Boxes],
  ["Competitors","/competitors",Search],["Reviews","/reviews",Star],["Retailers","/retailers",Store],
  ["Scrape Jobs","/jobs",Database],["Analytics","/analytics",BarChart3],["Exports","/exports",Download],["Settings","/settings",Settings],
] as const;

export function AppShell({children}:{children:React.ReactNode}) {
  return <div className="min-h-screen grid grid-cols-[240px_1fr]">
    <aside className="border-r border-slate-800 bg-slate-950 p-5">
      <div className="mb-8"><div className="text-xs uppercase tracking-[.25em] text-cyan-400">Unified Retail Intel</div><h1 className="mt-2 text-xl font-semibold">Ecommerce Intelligence</h1></div>
      <nav className="space-y-1">{nav.map(([label,href,Icon])=><Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 hover:text-white"><Icon size={16}/>{label}</Link>)}</nav>
    </aside>
    <main className="min-w-0">{children}</main>
  </div>;
}
