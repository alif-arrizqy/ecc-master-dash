import { cn } from "@/shared/lib/utils";
import { MonthlyReportSummary } from "@/shared/types/api";

interface SummaryTableProps {
  data: MonthlyReportSummary | undefined;
}

const SummaryTable = ({ data }: SummaryTableProps) => {
  if (!data) {
    return (
      <div className="bg-card rounded-lg card-shadow p-4">
        <p className="text-sm text-muted-foreground text-center">Memuat data...</p>
      </div>
    );
  }

  const rows = [
    { 
      label: 'Talis5 Full', 
      totalSites: data.detail.talis5.summary.totalSites,
      avgSLA: data.detail.talis5.summary.sla,
      color: 'bg-battery-talis5Full' 
    },
    { 
      label: 'Talis5 Mix', 
      totalSites: data.detail.mix.summary.totalSites,
      avgSLA: data.detail.mix.summary.sla,
      color: 'bg-battery-talis5Mix' 
    },
    { 
      label: 'JS PRO', 
      totalSites: data.detail.jspro.summary.totalSites,
      avgSLA: data.detail.jspro.summary.sla,
      color: 'bg-battery-jspro' 
    },
  ];

  return (
    <div className="bg-card rounded-lg card-shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th className="py-2 px-3 text-left font-semibold">Baterai</th>
            <th className="py-2 px-3 text-center font-semibold">Total Site</th>
            <th className="py-2 px-3 text-center font-semibold">AVG SLA</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.label} className={cn("border-b border-border", idx % 2 === 0 ? "bg-muted/30" : "bg-card")}>
              <td className="py-2 px-3 font-medium flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", row.color)} />
                {row.label}
              </td>
              <td className="py-2 px-3 text-center">{row.totalSites}</td>
              <td className={cn(
                "py-2 px-3 text-center font-semibold",
                row.avgSLA >= 95.5 ? "text-status-good" : "text-status-warning"
              )}>
                {row.avgSLA.toFixed(2)}%
              </td>
            </tr>
          ))}
          <tr className="bg-primary/10 font-bold">
            <td className="py-2 px-3">TOTAL</td>
            <td className="py-2 px-3 text-center">{data.summary.totalSite}</td>
            <td className={cn(
              "py-2 px-3 text-center",
              data.summary.sla >= 95.5 ? "text-status-good" : "text-status-warning"
            )}>
              {data.summary.sla.toFixed(2)}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SummaryTable;
