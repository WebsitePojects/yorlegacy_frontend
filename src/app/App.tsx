import { ScrollRestoration } from 'react-router-dom';
import { SiteFrame } from '../components/layout/SiteFrame';
import { Outlet } from 'react-router-dom';

export default function App() {
  return (
    <SiteFrame>
      <ScrollRestoration />
      <main className="app-shell">
        <Outlet />
      </main>
    </SiteFrame>
  );
}
