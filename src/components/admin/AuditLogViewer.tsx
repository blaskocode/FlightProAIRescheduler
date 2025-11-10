'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userRole: string;
  resourceType: string;
  resourceId: string | null;
  schoolId: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditLogResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    userId: '',
    search: '',
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  async function fetchLogs() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.resourceType) params.append('resourceType', filters.resourceType);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/audit-logs?${params.toString()}`);

      if (response.ok) {
        const data: AuditLogResponse = await response.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch audit logs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      setExporting(true);
      
      // Fetch all logs for export (not just current page)
      const params = new URLSearchParams({
        limit: '10000', // Large limit for export
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.resourceType) params.append('resourceType', filters.resourceType);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      
      if (response.ok) {
        const data: AuditLogResponse = await response.json();
        
        // Convert to CSV
        const headers = ['ID', 'Action', 'User ID', 'User Role', 'Resource Type', 'Resource ID', 'School ID', 'IP Address', 'User Agent', 'Created At'];
        const rows = data.logs.map(log => [
          log.id,
          log.action,
          log.userId,
          log.userRole,
          log.resourceType,
          log.resourceId || '',
          log.schoolId || '',
          log.ipAddress || '',
          log.userAgent || '',
          new Date(log.createdAt).toISOString(),
        ]);

        const csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to export logs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to export logs');
    } finally {
      setExporting(false);
    }
  }

  if (loading && logs.length === 0) {
    return <div>Loading audit logs...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <Input
              placeholder="Filter by action"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            />
            <Input
              placeholder="Filter by resource type"
              value={filters.resourceType}
              onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
            />
            <Input
              placeholder="Filter by user ID"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {logs.length} logs (Page {page} of {totalPages})
            </p>
            <Button
              onClick={handleExport}
              disabled={exporting || logs.length === 0}
              variant="outline"
              size="sm"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>

        {/* Logs */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No audit logs found</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-4 border rounded-lg bg-gray-50 text-sm hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge>{log.action}</Badge>
                    <span className="text-gray-600">{log.userRole}</span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="font-semibold">Resource:</span> {log.resourceType}
                  </div>
                  {log.resourceId && (
                    <div>
                      <span className="font-semibold">ID:</span> {log.resourceId}
                    </div>
                  )}
                  {log.schoolId && (
                    <div>
                      <span className="font-semibold">School:</span> {log.schoolId}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">User:</span> {log.userId.substring(0, 8)}...
                  </div>
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-2 p-2 bg-white rounded text-xs">
                    <span className="font-semibold">Metadata:</span>{' '}
                    <pre className="inline">{JSON.stringify(log.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

