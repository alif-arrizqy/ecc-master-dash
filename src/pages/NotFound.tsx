import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileX, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full card-shadow animate-slide-up">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-destructive/20 to-orange-500/20">
                <FileX className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-4xl font-bold mb-2">404</CardTitle>
            <CardDescription className="text-lg">
              Halaman Tidak Ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Maaf, halaman yang Anda cari tidak dapat ditemukan. URL mungkin telah diubah atau halaman telah dihapus.
            </p>
            {location.pathname && (
              <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                {location.pathname}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild variant="default" className="w-full sm:w-auto">
                <Link to="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Kembali ke Home
                </Link>
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
