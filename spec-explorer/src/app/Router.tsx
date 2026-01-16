import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../shared/components/Layout';
import { TaxonomyExplorer } from '../features/taxonomy/components/TaxonomyExplorer';
import { ProjectList } from '../features/projects/components/ProjectList';
import { ManufacturerGenerator } from '../features/manufacturer/components/ManufacturerGenerator';
import { Settings } from '../features/admin/components/Settings';
import { LoginForm } from '../features/auth/components/LoginForm';
import { useAuth } from '../features/auth/hooks/useAuth';

export function Router() {
  const { isAuthenticated, isOfflineMode } = useAuth();

  // Allow access in offline mode or when authenticated
  const canAccess = isOfflineMode || isAuthenticated;

  if (!canAccess) {
    return (
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/explorer" replace />} />
        <Route path="/explorer" element={<TaxonomyExplorer />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/generator" element={<ManufacturerGenerator />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Navigate to="/explorer" replace />} />
        <Route path="*" element={<Navigate to="/explorer" replace />} />
      </Routes>
    </Layout>
  );
}
