import { getDb } from "@/lib/db";
import { getOverviewAnalytics } from "@/lib/analytics";
import { BarList } from "@/components/bar-list";
import { LineChart } from "@/components/line-chart";
import { formatCurrency } from "@/lib/format";

export const dynamic="force-dynamic";

export default async function Analytics(){
  const data=await getOverviewAnalytics(await getDb());
  return <div className="p-8">
    <p className="text-sm text-cyan-400">Analytics</p>
    <h2 className="mt-1 text-3xl font-semibold">Portfolio analytics</h2>
    <p className="muted mt-2">Descriptive statistics from stored data. Historical charts are shown only after historical observations exist.</p>
    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      <LineChart title="Products discovered over time" points={data.charts.productsDiscovered}/>
      <LineChart title="Reviews collected over time" points={data.charts.reviewsCollected}/>
      <BarList title="Products by retailer" points={data.charts.productsByRetailer}/>
      <BarList title="Retailer coverage" points={data.charts.productsByRetailer}/>
      <BarList title="Products by brand" points={data.charts.productsByBrand}/>
      <BarList title="Rating distribution" points={data.charts.ratingDistribution}/>
      {data.charts.priceHistory.length>1&&<LineChart title="Average observed price over time" points={data.charts.priceHistory} valueFormatter={formatCurrency}/>}
    </div>
  </div>;
}
