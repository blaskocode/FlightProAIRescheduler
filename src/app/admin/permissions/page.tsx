import { PermissionManagement } from '@/components/admin/PermissionManagement';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';

export default function PermissionsPage() {
  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Permission Management</h1>
          <p className="text-gray-600">
            View your permissions and check access to specific resources
          </p>
        </div>
        <PermissionManagement />
        <AuditLogViewer />
      </div>
    </div>
  );
}

