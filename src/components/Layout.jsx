import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

// Wraps every public page with the shared header and footer.
export default function Layout() {
  const { pathname, search } = useLocation();

  // Multi-page sites start each page at the top; a single-page app has to do that itself.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
