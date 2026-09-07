import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useBanner } from '../context/BannerContext';

const Header: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isOpen: bannerOpen, message: bannerMessage, loading: bannerLoading } = useBanner();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-header bg-darker-bg shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-koulen text-accent-mint hover:text-white transition-colors">ADIIL</Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-4 items-center">
          <Link to="/events" className="header-link">Événements</Link>
          <Link to="/shop" className="header-link">Boutique</Link>
          <Link to="/battle-pass" className="header-link">Battle PAF</Link>
          <Link to="/about" className="header-link">À Propos</Link>

          {isAdmin && (
            <Link to="/admin" className="header-link text-red-400 hover:bg-red-900/20 hover:text-red-300">Admin</Link>
          )}

          {user && (
            <Link to="/cart" className="relative header-link p-2">
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent-mint text-darker-bg font-bold rounded-full text-xs w-5 h-5 flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <Link to="/my-account" className="header-link">Mon Compte</Link>
          ) : (
            <Link to="/login" className="header-link bg-accent-mint text-darker-bg rounded-md px-3 py-2 hover:bg-white transition-colors">Connexion</Link>
          )}
        </div>

        {/* Mobile: Cart + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <Link to="/cart" className="relative p-2 text-white">
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent-mint text-darker-bg font-bold rounded-full text-xs w-5 h-5 flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:text-accent-mint transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Bandeau d'information */}
      {!bannerLoading && bannerOpen && bannerMessage.trim() && (
          <div className="bg-accent-mint text-darker-bg py-2.5 px-4 text-center font-semibold text-sm leading-snug">
            {bannerMessage}
          </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-darker-bg border-t border-gray-800">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-2">
            <Link to="/events" onClick={closeMobileMenu} className="header-link-mobile">Événements</Link>
            <Link to="/shop" onClick={closeMobileMenu} className="header-link-mobile">Boutique</Link>
            <Link to="/battle-pass" onClick={closeMobileMenu} className="header-link-mobile">Battle PAF</Link>
            <Link to="/about" onClick={closeMobileMenu} className="header-link-mobile">À Propos</Link>

            {isAdmin && (
              <Link to="/admin" onClick={closeMobileMenu} className="header-link-mobile text-red-400">Admin</Link>
            )}

            {user ? (
              <Link to="/my-account" onClick={closeMobileMenu} className="header-link-mobile">Mon Compte</Link>
            ) : (
              <Link to="/login" onClick={closeMobileMenu} className="header-link-mobile bg-accent-mint text-darker-bg rounded-md text-center">Connexion</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;