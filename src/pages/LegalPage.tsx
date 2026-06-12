import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const LegalPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SEO
        title="Mentions Legales"
        description="Mentions legales du site ADIIL - Association des Etudiants en Informatique de l'IUT de Laval. Informations sur l'editeur et l'hebergeur."
        url="/legal"
      />
      <h1 className="text-4xl font-bold text-accent-mint mb-8">Mentions Légales</h1>

      {/* Éditeur du site */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">1. Éditeur du site</h2>
        <div className="bg-dark-card p-4 rounded-lg text-gray-300">
          <p className="mb-2"><strong>Raison sociale :</strong> ADIIL (Association du Département Informatique de l'IUT de Laval)</p>
          <p className="mb-2"><strong>Forme juridique :</strong> Association loi 1901</p>
          <p className="mb-2"><strong>Siège social :</strong> IUT de Laval, 52 Rue des Docteurs Calmette et Guérin, 53000 Laval</p>
          <p className="mb-2"><strong>Email :</strong> <a href="mailto:association.adiil@gmail.com" className="text-accent-mint hover:underline">association.adiil@gmail.com</a></p>
          <p><strong>Directeur de la publication :</strong> Le Président de l'ADIIL</p>
        </div>
      </section>

      {/* Hébergement */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">2. Hébergement</h2>
        <div className="bg-dark-card p-4 rounded-lg text-gray-300">
          <p className="mb-2"><strong>Hébergeur :</strong> Contabo GmbH</p>
          <p className="mb-2"><strong>Adresse :</strong> Aschauer Straße 32a, 81549 Munich, Allemagne</p>
          <p><strong>Site web :</strong> <a href="https://contabo.com" target="_blank" rel="noopener noreferrer" className="text-accent-mint hover:underline">contabo.com</a></p>
        </div>
      </section>

      {/* Propriété intellectuelle */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">3. Propriété intellectuelle</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            L'ensemble du contenu de ce site (textes, images, logos, graphismes, icônes, structure générale)
            est la propriété exclusive de l'ADIIL, sauf mention contraire.
          </p>
          <p>
            Toute reproduction, représentation, modification, distribution ou exploitation, totale ou partielle,
            du contenu de ce site, par quelque procédé que ce soit, sans autorisation écrite préalable de l'ADIIL,
            est strictement interdite et constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants
            du Code de la Propriété Intellectuelle.
          </p>
        </div>
      </section>

      {/* Responsabilité */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">4. Limitation de responsabilité</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            L'ADIIL s'efforce de maintenir le site accessible et de fournir des informations exactes et à jour.
            Cependant, l'ADIIL ne peut être tenue responsable :
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Des interruptions temporaires ou permanentes du site, quelles qu'en soient les causes</li>
            <li>Des erreurs ou omissions présentes sur le site</li>
            <li>Des dommages directs ou indirects résultant de l'utilisation du site</li>
            <li>Du contenu des sites externes vers lesquels des liens hypertextes renvoient</li>
          </ul>
        </div>
      </section>

      {/* Liens hypertextes */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">5. Liens hypertextes</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            Le site peut contenir des liens vers des sites tiers. L'ADIIL n'exerce aucun contrôle sur ces sites
            et décline toute responsabilité quant à leur contenu.
          </p>
          <p>
            La création de liens hypertextes vers le site adiil.fr est soumise à l'autorisation préalable
            de l'ADIIL.
          </p>
        </div>
      </section>

      {/* Droit applicable */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">6. Droit applicable et juridiction</h2>
        <p className="text-gray-300">
          Les présentes mentions légales sont régies par le droit français. En cas de litige relatif à
          l'interprétation ou l'exécution des présentes, les tribunaux français seront seuls compétents.
        </p>
      </section>

      {/* Documents associés */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">Documents juridiques associés</h2>
        <p className="text-gray-300 mb-4">
          Pour plus d'informations sur vos droits et nos conditions, consultez les documents suivants :
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/cgu" className="block p-4 bg-dark-card rounded-lg hover:bg-gray-800 transition-colors">
            <h3 className="font-semibold text-accent-mint mb-2">Conditions Générales d'Utilisation</h3>
            <p className="text-sm text-gray-400">Règles d'utilisation du site et des services</p>
          </Link>
          <Link to="/cgv" className="block p-4 bg-dark-card rounded-lg hover:bg-gray-800 transition-colors">
            <h3 className="font-semibold text-accent-mint mb-2">Conditions Générales de Vente</h3>
            <p className="text-sm text-gray-400">Conditions des achats et transactions</p>
          </Link>
          <Link to="/confidentialite" className="block p-4 bg-dark-card rounded-lg hover:bg-gray-800 transition-colors">
            <h3 className="font-semibold text-accent-mint mb-2">Politique de Confidentialité</h3>
            <p className="text-sm text-gray-400">Protection de vos données personnelles (RGPD)</p>
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">Contact</h2>
        <p className="text-gray-300">
          Pour toute question concernant ces mentions légales :{' '}
          <a href="mailto:association.adiil@gmail.com" className="text-accent-mint hover:underline">
            association.adiil@gmail.com
          </a>
        </p>
      </section>

      <div className="mt-8 pt-8 border-t border-gray-700 text-sm text-gray-400">
        <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
  );
};

export default LegalPage;
