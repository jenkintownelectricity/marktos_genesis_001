import { useSyncContext } from '@/app/providers/SyncProvider';
import { useTenantContext } from '@/app/providers/TenantProvider';
import { useAuthContext } from '@/app/providers/AuthProvider';
import {
  CloudIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  SignalSlashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export function Header() {
  const { status, lastSyncedAt, sync, isCloudEnabled } = useSyncContext();
  const { current: tenant, stats } = useTenantContext();
  const { user, isOfflineMode, logout } = useAuthContext();

  const getSyncIcon = () => {
    switch (status) {
      case 'syncing':
        return <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'offline':
        return <SignalSlashIcon className="h-5 w-5 text-gray-400" />;
      default:
        return isCloudEnabled ? (
          <CloudIcon className="h-5 w-5 text-green-500" />
        ) : (
          <SignalSlashIcon className="h-5 w-5 text-gray-400" />
        );
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left: Tenant info */}
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            {tenant?.name || 'Local Workspace'}
          </h2>
          <p className="text-xs text-gray-500">
            {stats?.total_dna_sequences || 0} DNA sequences
          </p>
        </div>
      </div>

      {/* Right: Sync status & User */}
      <div className="flex items-center space-x-4">
        {/* Sync status */}
        <button
          onClick={sync}
          disabled={!isCloudEnabled || status === 'syncing'}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm
                     hover:bg-gray-100 transition-colors disabled:opacity-50"
          title={lastSyncedAt ? `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Not synced'}
        >
          {getSyncIcon()}
          <span className="text-gray-600">
            {isOfflineMode ? 'Offline' : status === 'syncing' ? 'Syncing...' : isCloudEnabled ? 'Cloud' : 'Local'}
          </span>
        </button>

        {/* User menu */}
        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.email?.split('@')[0] || 'Local User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role || 'owner'}
            </p>
          </div>
          {!isOfflineMode && (
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
