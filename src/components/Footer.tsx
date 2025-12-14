import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-darker-bg text-white py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} ADIIL. Tous droits réservés.</p>
        <div className="flex justify-center space-x-4 mt-4">
          <Link to="/legal" className="text-accent-mint hover:underline">Mentions Légales</Link>
          <Link to="/legal" className="text-accent-mint hover:underline">Politique de Confidentialité</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;