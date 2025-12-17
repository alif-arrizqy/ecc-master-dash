import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Check, Loader2, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UploadResponse {
  preview: {
    summary: {
      total: number;
      valid: number;
      duplicate: number;
      invalid: number;
      invalidSiteId: number;
    };
    validData?: Array<{
      date: string;
      inserted: number;
    }>;
    duplicates?: Array<{
      date: string;
      siteId: string;
      siteName: string;
    }>;
    errors?: Array<{
      message?: string;
      [key: string]: unknown;
    }>;
  };
  save: {
    inserted: number;
    skipped: number;
  };
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'warning' | 'error';
  error?: string;
  response?: UploadResponse;
}

const FileUpload = () => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Record<number, boolean>>({});
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
        
        const response = await slaApi.uploadSLAFile(fileWithProgress.file) as UploadResponse;
        
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        
        // Determine status based on response
        const summary = response.preview.summary;
        const hasDuplicates = summary.duplicate > 0;
        const hasInvalid = summary.invalid > 0 || summary.invalidSiteId > 0;
        const hasValid = summary.valid > 0;
        
        // Set status: warning if duplicates, success if all valid
        const finalStatus = hasDuplicates || hasInvalid ? 'warning' : 'success';
        
        // Update status with response data
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: finalStatus, progress: 100, response } : f
        ));
        
        // Show appropriate toast based on response
        if (hasDuplicates && hasValid) {
          toast.warning(`${fileWithProgress.file.name} diupload dengan peringatan`, {
            description: `${summary.valid} data valid tersimpan, ${summary.duplicate} data duplikat ditemukan${summary.invalidSiteId > 0 ? `, ${summary.invalidSiteId} invalid site ID` : ''}`
          });
        } else if (hasDuplicates && !hasValid) {
          toast.error(`${fileWithProgress.file.name} - Semua data duplikat`, {
            description: `${summary.duplicate} data duplikat ditemukan, tidak ada data baru yang tersimpan`
          });
        } else if (hasInvalid && !hasValid) {
          toast.error(`${fileWithProgress.file.name} - Tidak ada data valid`, {
            description: `${summary.invalidSiteId} invalid site ID${summary.invalid > 0 ? `, ${summary.invalid} data invalid` : ''}`
          });
        } else {
          toast.success(`${fileWithProgress.file.name} berhasil diupload!`, {
            description: `${summary.valid} data valid, ${response.save.inserted} data tersimpan`
          });
        }
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
    
    // Show summary after all uploads - use setTimeout to ensure state is updated
    setTimeout(() => {
      setFiles(currentFiles => {
        const successCount = currentFiles.filter(f => f.status === 'success').length;
        const warningCount = currentFiles.filter(f => f.status === 'warning').length;
        const errorCount = currentFiles.filter(f => f.status === 'error').length;
        
        if (successCount > 0 && warningCount === 0 && errorCount === 0) {
          toast.success(`Semua file berhasil diupload! (${successCount} file)`);
        } else if (warningCount > 0 && errorCount === 0) {
          toast.warning(`Upload selesai: ${successCount} berhasil, ${warningCount} dengan peringatan`);
        } else if (errorCount > 0) {
          toast.error(`Upload selesai: ${successCount} berhasil, ${warningCount} peringatan, ${errorCount} gagal`);
        }
        
        return currentFiles; // Return unchanged
      });
    }, 100);
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleClearAll = () => {
    setFiles([]);
    setExpandedResults({});
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  const pendingFiles = files.filter(f => f.status === 'pending');
  const uploadingFiles = files.filter(f => f.status === 'uploading');
  const successFiles = files.filter(f => f.status === 'success');
  const warningFiles = files.filter(f => f.status === 'warning');
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
                      fileWithProgress.status === 'warning' ? 'secondary' :
                      fileWithProgress.status === 'error' ? 'destructive' :
                      fileWithProgress.status === 'uploading' ? 'secondary' :
                      'outline'
                    }
                    className={cn(
                      "text-xs",
                      fileWithProgress.status === 'warning' && "bg-status-warning/10 text-status-warning border-status-warning/20"
                    )}
                  >
                    {fileWithProgress.status === 'success' && '✓ Berhasil'}
                    {fileWithProgress.status === 'warning' && '⚠ Ada Peringatan'}
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
              {(fileWithProgress.status === 'uploading' || fileWithProgress.status === 'success' || fileWithProgress.status === 'warning') && (
                <div className="space-y-1">
                  <Progress 
                    value={fileWithProgress.progress} 
                    className={cn(
                      "h-2",
                      fileWithProgress.status === 'warning' && "bg-status-warning/20"
                    )} 
                  />
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
              
              {/* Upload Results */}
              {(fileWithProgress.status === 'success' || fileWithProgress.status === 'warning') && fileWithProgress.response && (
                <div className="mt-3 pt-3 border-t">
                  {/* Quick Summary */}
                  <div className={cn(
                    "mb-3 p-3 rounded-lg border",
                    fileWithProgress.status === 'warning' 
                      ? "bg-status-warning/5 border-status-warning/20" 
                      : "bg-status-good/5 border-status-good/20"
                  )}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                      <span className="text-muted-foreground font-medium">Ringkasan Cepat:</span>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {fileWithProgress.response.preview.summary.valid > 0 && (
                          <Badge variant="outline" className="text-status-good border-status-good/30 bg-status-good/10 text-xs px-2 py-0.5">
                            ✓ {fileWithProgress.response.preview.summary.valid} valid
                          </Badge>
                        )}
                        {fileWithProgress.response.preview.summary.duplicate > 0 && (
                          <Badge variant="outline" className="text-status-warning border-status-warning/30 bg-status-warning/10 text-xs px-2 py-0.5">
                            ⚠ {fileWithProgress.response.preview.summary.duplicate} duplikat
                          </Badge>
                        )}
                        {(fileWithProgress.response.preview.summary.invalidSiteId > 0 || fileWithProgress.response.preview.summary.invalid > 0) && (
                          <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10 text-xs px-2 py-0.5">
                            ✗ {fileWithProgress.response.preview.summary.invalidSiteId + fileWithProgress.response.preview.summary.invalid} invalid
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-foreground border-border bg-background text-xs px-2 py-0.5">
                          💾 {fileWithProgress.response.save.inserted} tersimpan
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedResults(prev => ({
                      ...prev,
                      [index]: !prev[index]
                    }))}
                    className="w-full justify-between h-9 text-xs font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Info className="h-3.5 w-3.5" />
                      {expandedResults[index] ? 'Sembunyikan Detail' : 'Lihat Detail Lengkap'}
                    </span>
                    {expandedResults[index] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  
                  {expandedResults[index] && (
                    <div className="mt-3 space-y-3">
                      {/* Summary Card */}
                      <Card className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Ringkasan Data
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Total Data</p>
                              <p className="text-sm font-semibold">{fileWithProgress.response.preview.summary.total}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Valid</p>
                              <p className="text-sm font-semibold text-status-good">
                                {fileWithProgress.response.preview.summary.valid}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Duplikat</p>
                              <p className="text-sm font-semibold text-status-warning">
                                {fileWithProgress.response.preview.summary.duplicate}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Invalid</p>
                              <p className="text-sm font-semibold text-destructive">
                                {fileWithProgress.response.preview.summary.invalid}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Invalid Site ID</p>
                              <p className="text-sm font-semibold text-destructive">
                                {fileWithProgress.response.preview.summary.invalidSiteId}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Tersimpan</p>
                              <p className="text-sm font-semibold text-status-good">
                                {fileWithProgress.response.save.inserted}
                              </p>
                            </div>
                          </div>
                          
                          {/* Valid Data by Date */}
                          {fileWithProgress.response.preview.validData && 
                           fileWithProgress.response.preview.validData.length > 0 && (
                            <div className="pt-2 border-t">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Data Valid per Tanggal:
                              </p>
                              <div className="space-y-1">
                                {fileWithProgress.response.preview.validData.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-foreground">{item.date}</span>
                                    <span className="text-status-good font-medium">
                                      {item.inserted} data
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      {/* Duplicates Table */}
                      {fileWithProgress.response.preview.duplicates && 
                       fileWithProgress.response.preview.duplicates.length > 0 && (
                        <Card className="border-2 border-status-warning/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2 text-status-warning">
                              <AlertCircle className="h-4 w-4" />
                              Data Duplikat ({fileWithProgress.response.preview.duplicates.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="max-h-64 overflow-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Tanggal</TableHead>
                                    <TableHead className="text-xs">Site ID</TableHead>
                                    <TableHead className="text-xs">Site Name</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {fileWithProgress.response.preview.duplicates.map((duplicate, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell className="text-xs">{duplicate.date}</TableCell>
                                      <TableCell className="text-xs font-mono">{duplicate.siteId}</TableCell>
                                      <TableCell className="text-xs">{duplicate.siteName}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Save Results */}
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Hasil Penyimpanan:</span>
                          <div className="flex items-center gap-3">
                            <span className="text-status-good font-medium">
                              ✓ {fileWithProgress.response.save.inserted} tersimpan
                            </span>
                            {fileWithProgress.response.save.skipped > 0 && (
                              <span className="text-muted-foreground">
                                ⊘ {fileWithProgress.response.save.skipped} dilewati
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
      {files.length > 0 && !isUploading && (successFiles.length > 0 || warningFiles.length > 0 || errorFiles.length > 0) && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ringkasan Upload:</span>
            <div className="flex items-center gap-3">
              {successFiles.length > 0 && (
                <span className="text-status-good font-medium">
                  ✓ {successFiles.length} berhasil
                </span>
              )}
              {warningFiles.length > 0 && (
                <span className="text-status-warning font-medium">
                  ⚠ {warningFiles.length} peringatan
                </span>
              )}
              {errorFiles.length > 0 && (
                <span className="text-status-danger font-medium">
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

