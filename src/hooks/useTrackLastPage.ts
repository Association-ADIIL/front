import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password', '/complete-profile'];

export const useTrackLastPage = () => {
  const location = useLocation();

  useEffect(() => {
    const isAuthPage = AUTH_PAGES.some(path => location.pathname.startsWith(path));
    if (!isAuthPage) {
      sessionStorage.setItem('lastVisitedPage', location.pathname);
    }
  }, [location]);
};