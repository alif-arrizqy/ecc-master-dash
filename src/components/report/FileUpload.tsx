import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const FileUpload = () => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
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
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      validateAndAddFiles(droppedFiles);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      validateAndAddFiles(selectedFiles);
    }
  };
  
  const validateAndAddFiles = (newFiles: File[]) => {
    const validFiles: FileWithProgress[] = [];
    const invalidFiles: string[] = [];
    
    newFiles.forEach((file) => {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      const isValid = validTypes.includes(file.type) || 
                     file.name.endsWith('.xlsx') || 
                     file.name.endsWith('.xls');
      
      if (isValid) {
        // Check if file already exists
        const exists = files.some(f => f.file.name === file.name && f.file.size === file.size);
        if (!exists) {
          validFiles.push({
            file,
            progress: 0,
            status: 'pending'
          });
        }
      } else {
        invalidFiles.push(file.name);
      }
    });
    
    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} file tidak valid`, {
        description: 'Hanya file Excel (.xlsx atau .xls) yang diperbolehkan'
      });
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file siap diupload`, {
        description: validFiles.map(f => f.file.name).join(', ')
      });
    }
  };
  
  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    const { slaApi } = await import('@/lib/api');
    
    // Upload files sequentially
    for (let i = 0; i < files.length; i++) {
      const fileWithProgress = files[i];
      
      // Skip if already uploaded
      if (fileWithProgress.status === 'success') continue;
      
      // Update status to uploading
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading', progress: 0 } : f
      ));
      
      let progressInterval: NodeJS.Timeout | null = null;
      
      try {
        // Simulate progress (since we don't have real progress from API)
        progressInterval = setInterval(() => {
          setFiles(prev => prev.map((f, idx) => {
            if (idx === i && f.status === 'uploading' && f.progress < 90) {
              return { ...f, progress: f.progress + 10 };
            }
            return f;
          }));
        }, 200);
        
        await slaApi.uploadSLAFile(fileWithProgress.file);
        
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        
        // Update to success
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'success', progress: 100 } : f
        ));
        
        toast.success(`${fileWithProgress.file.name} berhasil diupload!`);
      } catch (error) {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        
        // Update to error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error', error: errorMessage, progress: 0 } : f
        ));
        
        toast.error(`Gagal mengupload ${fileWithProgress.file.name}`, {
          description: errorMessage
        });
      }
    }
    
    setIsUploading(false);
    
    // Show summary
    const successCount = files.filter(f => f.status === 'success').length;
    const errorCount = files.filter(f => f.status === 'error').length;
    
    if (successCount > 0 && errorCount === 0) {
      toast.success(`Semua file berhasil diupload! (${successCount} file)`);
    } else if (successCount > 0) {
      toast.warning(`Upload selesai: ${successCount} berhasil, ${errorCount} gagal`);
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleClearAll = () => {
    setFiles([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  const pendingFiles = files.filter(f => f.status === 'pending');
  const uploadingFiles = files.filter(f => f.status === 'uploading');
  const successFiles = files.filter(f => f.status === 'success');
  const errorFiles = files.filter(f => f.status === 'error');
  const canUpload = files.length > 0 && !isUploading && pendingFiles.length > 0;
  
  return (
    <div className="bg-card rounded-lg p-6 card-shadow animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Upload Data SLA</h3>
        {files.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {files.length} file{files.length > 1 ? 's' : ''} dipilih
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={isUploading}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Hapus Semua
            </Button>
          </div>
        )}
      </div>
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          files.length > 0 && "border-status-good bg-status-good/5"
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
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            files.length > 0 ? "bg-status-good/10" : "bg-muted"
          )}>
            {files.length > 0 ? (
              <FileSpreadsheet className="h-6 w-6 text-status-good" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {files.length > 0 
                ? `${files.length} file${files.length > 1 ? 's' : ''} siap diupload`
                : 'Drag & drop file Excel di sini atau klik untuk memilih'
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {files.length === 0 && 'Pilih satu atau lebih file (.xlsx, .xls)'}
            </p>
          </div>
        </div>
      </div>
      
      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          {files.map((fileWithProgress, index) => (
            <div
              key={`${fileWithProgress.file.name}-${index}`}
              className="border rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {fileWithProgress.file.name}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    ({(fileWithProgress.file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant={
                      fileWithProgress.status === 'success' ? 'default' :
                      fileWithProgress.status === 'error' ? 'destructive' :
                      fileWithProgress.status === 'uploading' ? 'secondary' :
                      'outline'
                    }
                    className="text-xs"
                  >
                    {fileWithProgress.status === 'success' && '✓ Berhasil'}
                    {fileWithProgress.status === 'error' && '✗ Gagal'}
                    {fileWithProgress.status === 'uploading' && 'Uploading...'}
                    {fileWithProgress.status === 'pending' && 'Menunggu'}
                  </Badge>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              {(fileWithProgress.status === 'uploading' || fileWithProgress.status === 'success') && (
                <div className="space-y-1">
                  <Progress value={fileWithProgress.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    {fileWithProgress.progress}%
                  </p>
                </div>
              )}
              
              {/* Error Message */}
              {fileWithProgress.status === 'error' && fileWithProgress.error && (
                <p className="text-xs text-destructive">
                  {fileWithProgress.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      
      <Button 
        onClick={handleUpload}
        disabled={!canUpload}
        className="w-full mt-4"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Mengupload... ({uploadingFiles.length} file)
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" />
            Upload {pendingFiles.length > 0 ? `${pendingFiles.length} ` : ''}File{pendingFiles.length > 1 ? 's' : ''} & Simpan
          </>
        )}
      </Button>
      
      {/* Summary */}
      {files.length > 0 && !isUploading && (successFiles.length > 0 || errorFiles.length > 0) && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ringkasan:</span>
            <div className="flex items-center gap-3">
              {successFiles.length > 0 && (
                <span className="text-status-good">
                  ✓ {successFiles.length} berhasil
                </span>
              )}
              {errorFiles.length > 0 && (
                <span className="text-status-danger">
                  ✗ {errorFiles.length} gagal
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
