import { useEffect } from 'react';
import { useOutlet, useLocation } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Header from './Header';
import Footer from './Footer';
import Toaster from './Toaster';

// Wraps every public page with the announcement bar, header, footer and toasts.
export default function Layout() {
  const { pathname, search } = useLocation();
  const outlet = useOutlet();

  // Multi-page sites start each page at the top; a single-page app has to do that itself.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <div key={pathname} className="route-transition">{outlet}</div>
      <Footer />
      <Toaster />
    </>
  );
}
