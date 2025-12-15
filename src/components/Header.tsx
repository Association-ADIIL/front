import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';

const Header: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { totalItems } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-header bg-darker-bg shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-koulen text-accent-mint hover:text-white transition-colors">ADIIL</Link>
        <div className="flex space-x-4 items-center">
          <Link to="/events" className="header-link">Événements</Link>
          <Link to="/shop" className="header-link">Boutique</Link>
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
      </nav>
    </header>
  );
};

export default Header;