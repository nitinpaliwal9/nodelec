'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Upload, Loader2, AlertTriangle, FileSpreadsheet, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { listFiles, uploadFile, ApiError, type FileSummary } from '@/lib/api';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  processing: 'secondary',
  pending: 'secondary',
  failed: 'destructive',
};

export default function FilesPage() {
  const [files, setFiles] = useState<FileSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [distributorId, setDistributorId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await listFiles();
      setFiles(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load files.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      await uploadFile(file, distributorId.trim() || 'dashboard-upload');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Files</h1>
        <p className="text-muted-foreground text-sm mt-1">Every BOM uploaded to your organization.</p>
      </div>

      <Card className="border-border/50 border-dashed">
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <Input
              placeholder="Submitted by (optional, e.g. your name or branch)"
              value={distributorId}
              onChange={(e) => setDistributorId(e.target.value)}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            className="w-full sm:w-auto shrink-0"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? 'Uploading...' : 'Upload BOM'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {files === null && !error && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading files...
        </div>
      )}

      {files !== null && files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
        </div>
      )}

      {files !== null && files.length > 0 && (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Submitted by</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((f) => (
                <TableRow key={f.file_id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/dashboard/files/${f.file_id}`} className="contents">
                      <Badge variant={STATUS_VARIANT[f.status] ?? 'outline'} className="capitalize">
                        {f.status}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/files/${f.file_id}`} className="contents">
                      {f.distributor}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/files/${f.file_id}`} className="contents text-muted-foreground">
                      {new Date(f.created_at).toLocaleString()}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/files/${f.file_id}`}>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
