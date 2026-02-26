import { cn } from "@/shared/lib/utils";

interface MQTTSummaryCardProps {
  totalSites: number;
  avgSla: number;
  slaStatus: string;
  isLoading?: boolean;
}

const MQTTSummaryCard = ({ totalSites, avgSla, slaStatus, isLoading }: MQTTSummaryCardProps) => {
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg card-shadow p-3">
        <p className="text-sm text-muted-foreground text-center">Memuat data MQTT...</p>
      </div>
    );
  }

  const meetsTarget = avgSla >= 95.5;

  return (
    <div className="bg-card rounded-lg card-shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-primary/80 text-primary-foreground">
            <th className="py-2 px-3 text-center font-semibold">Total Site MQTT</th>
            <th className="py-2 px-3 text-center font-semibold">AVG SLA MQTT</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-muted/20">
            <td className="py-2 px-3 text-center font-bold text-lg">{totalSites}</td>
            <td
              className={cn(
                "py-2 px-3 text-center font-bold text-lg",
                meetsTarget ? "text-status-good" : "text-status-warning"
              )}
            >
              {avgSla.toFixed(2)}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default MQTTSummaryCard;
