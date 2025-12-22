import Navbar from '@/components/layout/Navbar';
import FileUpload from './components/FileUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet } from 'lucide-react';

const UploadPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Upload File Excel
              </h1>
              <p className="text-muted-foreground mt-1">
                Upload dan kelola data SLA Bakti dari file Excel
              </p>
            </div>
          </div>
        </div>
        
        {/* Upload Section */}
        <Card className="card-shadow border-2 border-primary/10 animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              SLA Bakti Data Management
            </CardTitle>
            <CardDescription>
              Upload file Excel (.xlsx) untuk memproses dan menyimpan data SLA Bakti ke database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload />
          </CardContent>
        </Card>
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

export default UploadPage;

