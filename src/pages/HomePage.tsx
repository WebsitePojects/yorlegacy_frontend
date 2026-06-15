import { ContentPage } from './ContentPage';
import { PublicBulletinContact } from '../components/pages/PublicBulletinContact';

export function HomePage() {
  return (
    <>
      <ContentPage slug="home" />
      <PublicBulletinContact />
    </>
  );
}
