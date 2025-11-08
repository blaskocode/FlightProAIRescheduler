'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Permission {
  permission: string;
  hasAccess: boolean;
}

interface UserPermissions {
  permissions: string[];
  role: string;
}

export function PermissionManagement() {
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkPermission, setCheckPermission] = useState('');
  const [checkResult, setCheckResult] = useState<Permission | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  async function fetchPermissions() {
    try {
      setLoading(true);
      const response = await fetch('/api/permissions');
      if (response.ok) {
        const data = await response.json();
        setUserPermissions(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch permissions');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckPermission() {
    if (!checkPermission.trim()) return;

    try {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission: checkPermission }),
      });

      if (response.ok) {
        const data = await response.json();
        setCheckResult({
          permission: checkPermission,
          hasAccess: data.hasAccess,
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to check permission');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check permission');
    }
  }

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!userPermissions) {
    return <div>No permission data available</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Permissions</CardTitle>
          <CardDescription>
            Current role: <Badge>{userPermissions.role}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {userPermissions.permissions.map((permission) => (
              <div
                key={permission}
                className="p-2 bg-gray-50 rounded text-sm font-mono"
              >
                {permission}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Check Permission</CardTitle>
          <CardDescription>
            Check if you have access to a specific permission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., flights.view.all"
              value={checkPermission}
              onChange={(e) => setCheckPermission(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCheckPermission();
                }
              }}
            />
            <Button onClick={handleCheckPermission}>Check</Button>
          </div>
          {checkResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p className="font-semibold">Permission: {checkResult.permission}</p>
              <p className={checkResult.hasAccess ? 'text-green-600' : 'text-red-600'}>
                Access: {checkResult.hasAccess ? 'Granted' : 'Denied'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

