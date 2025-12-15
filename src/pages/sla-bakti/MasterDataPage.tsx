import Navbar from '@/components/layout/Navbar';
import SLADataTable from '@/components/report/SLADataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';

const MasterDataPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SLA Master Data
              </h1>
              <p className="text-muted-foreground mt-1">
                Tabel data SLA bulanan dengan filter dan pencarian lengkap
              </p>
            </div>
          </div>
        </div>
        
        {/* Data Table Section */}
        <div className="animate-slide-up">
          <SLADataTable />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ECC Master Dashboard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MasterDataPage;

