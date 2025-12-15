import Navbar from '@/components/layout/Navbar';
import FileUpload from '@/components/report/FileUpload';
import SLADataTable from '@/components/report/SLADataTable';

const Report = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Report & Data</h1>
          <p className="text-muted-foreground mt-1">
            Upload dan kelola data SLA site Sundaya
          </p>
        </div>
        
        {/* Upload Section */}
        <section className="mb-8">
          <FileUpload />
        </section>
        
        {/* Data Table */}
        <section className="mb-8">
          <SLADataTable />
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 SLA Dash Sundaya. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Report;
