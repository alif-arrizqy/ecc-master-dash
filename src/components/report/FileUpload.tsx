import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };
  
  const validateAndSetFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Format file tidak valid', {
        description: 'Silakan upload file Excel (.xlsx atau .xls)'
      });
      return;
    }
    
    setFile(file);
    toast.success('File siap diupload', {
      description: file.name
    });
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      const { slaApi } = await import('@/lib/api');
      await slaApi.uploadSLAFile(file);
      
      toast.success('Data berhasil diupload!', {
        description: `${file.name} telah disimpan ke database`
      });
      
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Gagal mengupload file', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  return (
    <div className="bg-card rounded-lg p-6 card-shadow animate-slide-up">
      <h3 className="text-lg font-semibold text-foreground mb-4">Upload Data SLA</h3>
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          file && "border-status-good bg-status-good/5"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileSelect}
        />
        
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-status-good/10 flex items-center justify-center">
              <FileSpreadsheet className="h-6 w-6 text-status-good" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Hapus
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drag & drop file Excel di sini
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                atau klik untuk memilih file (.xlsx, .xls)
              </p>
            </div>
          </div>
        )}
      </div>
      
      <Button 
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full mt-4"
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
            Mengupload...
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" />
            Upload & Simpan
          </>
        )}
      </Button>
    </div>
  );
};

export default FileUpload;
