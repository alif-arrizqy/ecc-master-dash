import { cn } from '@/shared/lib/utils';

interface SLACause {
  batteryVersion: string;
  cause: string;
}

interface SLACausesTableProps {
  causes: SLACause[];
}

const batteryColors: Record<string, string> = {
  'Talis5 Full': 'bg-battery-talis5Full',
  'Talis5 Mix': 'bg-battery-talis5Mix',
  'JS PRO': 'bg-battery-jspro',
};

const SLACausesTable = ({ causes }: SLACausesTableProps) => {
  if (causes.length === 0) {
    return (
      <div className="bg-card rounded-lg card-shadow overflow-hidden">
        <div className="bg-status-warning/80 text-white py-2 px-3">
          <h3 className="text-sm font-semibold">Penyebab AVG SLA &lt; 95.5%</h3>
        </div>
        <div className="p-3 text-center text-muted-foreground text-sm">
          Tidak ada data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg card-shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-status-warning/80 text-white">
            <th className="py-2 px-3 text-left font-semibold">Baterai</th>
            <th className="py-2 px-3 text-left font-semibold">Penyebab AVG SLA &lt; 95.5%</th>
          </tr>
        </thead>
        <tbody>
          {causes.map((cause, index) => (
            <tr key={index} className={cn("border-b border-border", index % 2 === 0 ? "bg-muted/30" : "bg-card")}>
              <td className="py-2 px-3 font-medium">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", batteryColors[cause.batteryVersion])} />
                  {cause.batteryVersion}
                </div>
              </td>
              <td className="py-2 px-3 text-muted-foreground text-xs">{cause.cause}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SLACausesTable;
