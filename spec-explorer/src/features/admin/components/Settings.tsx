import { useState } from 'react';
import { useTenantContext } from '@/app/providers/TenantProvider';
import { useSyncContext } from '@/app/providers/SyncProvider';
import { useDataContext } from '@/app/providers/DataProvider';
import { db } from '@/data/db/indexedDB';
import {
  CloudIcon,
  ShieldCheckIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export function Settings() {
  const { current: tenant, stats } = useTenantContext();
  const { isCloudEnabled, status, lastSyncedAt, sync } = useSyncContext();
  const { sources, deleteSource } = useDataContext();
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const data = await db.exportData(tenant?.id || 'local');
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spec-explorer-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to delete ALL local data? This cannot be undone.')) {
      return;
    }
    setIsClearing(true);
    try {
      await db.clearAllData();
      window.location.reload();
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your workspace and data
        </p>
      </div>

      {/* Workspace Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Workspace</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Name</span>
            <span className="font-medium">{tenant?.name || 'Local Workspace'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Plan</span>
            <span className="font-medium capitalize">{tenant?.plan || 'Free'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">DNA Sequences</span>
            <span className="font-medium">{stats?.total_dna_sequences?.toLocaleString() || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Taxonomy Sources</span>
            <span className="font-medium">{stats?.total_taxonomy_sources || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Projects</span>
            <span className="font-medium">{stats?.total_projects || 0}</span>
          </div>
        </div>
      </div>

      {/* Cloud Sync */}
      <div className="card mb-6">
        <div className="flex items-center mb-4">
          <CloudIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Cloud Sync</h2>
        </div>

        {isCloudEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-700">Connected</p>
                <p className="text-sm text-gray-500">
                  {lastSyncedAt
                    ? `Last synced: ${new Date(lastSyncedAt).toLocaleString()}`
                    : 'Not synced yet'}
                </p>
              </div>
              <button
                onClick={sync}
                disabled={status === 'syncing'}
                className="btn-secondary"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${status === 'syncing' ? 'animate-spin' : ''}`} />
                {status === 'syncing' ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600 mb-2">Cloud sync is not configured</p>
            <p className="text-sm text-gray-500">
              To enable cloud sync, add your Supabase credentials to the environment variables.
              Your data is currently stored locally only.
            </p>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="card mb-6">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Security</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Local Encryption</span>
            <span className="text-green-600 font-medium">Enabled (AES-256)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Tenant Isolation</span>
            <span className="text-green-600 font-medium">Strict</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Data Storage</span>
            <span className="font-medium">IndexedDB (Local)</span>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Taxonomy Sources</h2>
        {sources.length === 0 ? (
          <p className="text-gray-500 text-sm">No taxonomy sources imported yet</p>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{source.name}</p>
                  <p className="text-xs text-gray-500">
                    {source.meta.total_sequences?.toLocaleString()} sequences
                  </p>
                </div>
                <button
                  onClick={() => deleteSource(source.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
        <div className="space-y-4">
          <button
            onClick={handleExportAll}
            disabled={isExporting}
            className="btn-secondary w-full justify-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export All Data'}
          </button>

          <button
            onClick={handleClearData}
            disabled={isClearing}
            className="btn-danger w-full justify-center"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            {isClearing ? 'Clearing...' : 'Clear All Local Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
