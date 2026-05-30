import { ScrollRestoration } from 'react-router-dom';
import { FeedbackProvider } from '../components/feedback/FeedbackProvider';
import { SiteFrame } from '../components/layout/SiteFrame';
import { Outlet } from 'react-router-dom';
import { SmoothScrollProvider } from '../components/motion/SmoothScrollProvider';

export default function App() {
  return (
    <FeedbackProvider>
      <SmoothScrollProvider>
        <SiteFrame>
          <ScrollRestoration />
          <main className="app-shell">
            <Outlet />
          </main>
        </SiteFrame>
      </SmoothScrollProvider>
    </FeedbackProvider>
  );
}
