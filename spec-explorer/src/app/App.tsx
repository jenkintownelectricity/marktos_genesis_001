import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { TenantProvider } from './providers/TenantProvider';
import { DataProvider } from './providers/DataProvider';
import { SyncProvider } from './providers/SyncProvider';
import { Router } from './Router';
import { Toaster } from '../shared/components/Toast';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TenantProvider>
          <DataProvider>
            <SyncProvider>
              <Router />
              <Toaster />
            </SyncProvider>
          </DataProvider>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
