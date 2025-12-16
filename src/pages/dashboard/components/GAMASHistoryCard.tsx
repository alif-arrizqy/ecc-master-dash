interface GAMASHistoryItem {
  date: string;
  description: string;
  affectedSites: number;
}

interface GAMASHistoryCardProps {
  history: GAMASHistoryItem[];
}

const GAMASHistoryCard = ({ history }: GAMASHistoryCardProps) => {
  const hasData = history.length > 0;
  
  return (
    <div className="bg-card rounded-lg card-shadow overflow-hidden">
      <div className="bg-destructive/80 text-white py-2 px-3">
        <h3 className="text-sm font-semibold">History GAMAS (Gangguan Massal)</h3>
      </div>
      
      {hasData ? (
        <div className="p-3 space-y-2">
          {history.map((item, index) => (
            <div key={index} className="text-xs bg-muted/30 p-2 rounded border border-border/50">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{item.date}</span>
                <span className="text-destructive font-medium">{item.affectedSites} site</span>
              </div>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 text-center text-muted-foreground text-sm">
          -
        </div>
      )}
    </div>
  );
};

export default GAMASHistoryCard;
