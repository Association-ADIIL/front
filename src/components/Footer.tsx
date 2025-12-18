import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-darker-bg text-white py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} ADIIL. Tous droits réservés.</p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
          <Link to="/legal" className="text-accent-mint hover:underline">Mentions Légales</Link>
          <Link to="/cgu" className="text-accent-mint hover:underline">CGU</Link>
          <Link to="/cgv" className="text-accent-mint hover:underline">CGV</Link>
          <Link to="/confidentialite" className="text-accent-mint hover:underline">Confidentialité</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;