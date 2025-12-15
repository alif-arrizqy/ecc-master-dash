import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface UnderDevelopmentProps {
  title?: string;
  description?: string;
}

const UnderDevelopment = ({ 
  title = 'Under Development', 
  description = 'Halaman ini sedang dalam pengembangan' 
}: UnderDevelopmentProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full card-shadow animate-slide-up">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                  <Construction className="h-12 w-12 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription className="mt-2">{description}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Halaman ini akan segera tersedia. Terima kasih atas kesabaran Anda.
              </p>
            </CardContent>
          </Card>
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

export default UnderDevelopment;

