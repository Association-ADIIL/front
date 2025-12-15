import React from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const LegalPage: React.FC = () => {
  useDocumentTitle('Mentions Legales');
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-accent-mint mb-8">Mentions Légales</h1>

      {/* Éditeur du site */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">1. Éditeur du site</h2>
        <p className="text-gray-300 mb-2">
          Le site <span className="text-accent-mint font-semibold">adiil.fr</span> est édité par :
        </p>
        <div className="bg-dark-card p-4 rounded-lg">
          <p className="mb-2"><strong>Association :</strong> ADIIL (Association du Département Informatique de l'IUT de Laval)</p>
          <p className="mb-2"><strong>Adresse :</strong> IUT de Laval, 52 Rue des Docteurs Calmette et Guérin, 53000 Laval</p>
          <p className="mb-2"><strong>Email :</strong> <a href="mailto:association.adiil@gmail.com" className="text-accent-mint hover:underline">association.adiil@gmail.com</a></p>
          <p className="mb-2"><strong>Type :</strong> Association loi 1901</p>
        </div>
      </section>

      {/* Hébergement */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">2. Hébergement</h2>
        <p className="text-gray-300 mb-2">
          Le site est hébergé par : Contabo GmbH.
        </p>
        <div className="bg-dark-card p-4 rounded-lg">
          <p className="mb-2"><strong>Hébergeur :</strong> Contabo GmbH </p>
          <p className="mb-2"><strong>Adresse :</strong> Landshuter Allee 8, 80637 Munich, Allemagne</p>
        </div>
      </section>

      {/* Protection des données personnelles */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">3. Protection des données personnelles (RGPD)</h2>
        <div className="text-gray-300 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">3.1 Responsable du traitement</h3>
            <p>
              L'ADIIL est responsable du traitement des données personnelles collectées sur ce site.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">3.2 Données collectées</h3>
            <p className="mb-2">Les données personnelles collectées sont :</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Groupe (pour les étudiants)</li>
              <li>Informations de connexion (mot de passe chiffré)</li>
              <li>Historique des inscriptions et commandes</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">3.3 Finalité du traitement</h3>
            <p className="mb-2">Les données sont collectées pour :</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>La gestion des comptes utilisateurs</li>
              <li>La gestion des inscriptions aux événements</li>
              <li>La gestion des commandes sur la boutique</li>
              <li>Le traitement des paiements</li>
              <li>L'envoi d'informations relatives aux événements</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">3.4 Durée de conservation</h3>
            <p>
              Les données personnelles sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées,
              et conformément aux obligations légales (durée maximale de 3 ans après la fin de la relation).
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">3.5 Vos droits</h3>
            <p className="mb-2">Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Droit d'accès à vos données personnelles</li>
              <li>Droit de rectification de vos données</li>
              <li>Droit à l'effacement de vos données</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit d'opposition au traitement</li>
              <li>Droit à la portabilité de vos données</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits, contactez-nous à : <a href="mailto:association.adiil@gmail.com" className="text-accent-mint hover:underline">association.adiil@gmail.com</a>
            </p>
          </div>
        </div>
      </section>

      {/* Cookies */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">4. Cookies</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            Le site utilise des cookies pour améliorer l'expérience utilisateur et assurer le bon fonctionnement des services.
          </p>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">4.1 Cookies utilisés</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Cookies de session :</strong> Nécessaires au fonctionnement du site (authentification, panier)</li>
              <li><strong>Cookies de préférence :</strong> Pour mémoriser vos préférences</li>
            </ul>
          </div>
          <p>
            Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter le fonctionnement du site.
          </p>
        </div>
      </section>

      {/* Propriété intellectuelle */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">5. Propriété intellectuelle</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            L'ensemble du contenu de ce site (textes, images, logos, structure) est la propriété exclusive de l'ADIIL,
            sauf mention contraire.
          </p>
          <p>
            Toute reproduction, distribution ou utilisation sans autorisation préalable est interdite et constitue une contrefaçon.
          </p>
        </div>
      </section>

      {/* Conditions d'utilisation */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">6. Conditions d'utilisation</h2>
        <div className="text-gray-300 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">6.1 Paiements</h3>
            <p>
              Les paiements sont sécurisés et traités via PayPal et HelloAsso. Aucune donnée bancaire n'est stockée sur nos serveurs.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">6.2 Inscriptions aux événements</h3>
            <p>
              Les inscriptions aux événements sont soumises aux conditions spécifiques de chaque événement.
              En cas d'annulation, les remboursements sont traités au cas par cas.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-2">6.3 Commandes</h3>
            <p>
              Les commandes passées sur la boutique sont à récupérer auprès de l'ADIIL selon les modalités communiquées.
              Le paiement en ligne confirme la commande.
            </p>
          </div>
        </div>
      </section>

      {/* Responsabilité */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">7. Limitation de responsabilité</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            L'ADIIL s'efforce de maintenir le site accessible et à jour, mais ne peut être tenue responsable :
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Des interruptions de service ou des problèmes techniques</li>
            <li>Des erreurs ou omissions dans le contenu</li>
            <li>Des dommages directs ou indirects résultant de l'utilisation du site</li>
          </ul>
        </div>
      </section>

      {/* Droit applicable */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">8. Droit applicable</h2>
        <p className="text-gray-300">
          Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">9. Contact</h2>
        <p className="text-gray-300">
          Pour toute question concernant ces mentions légales ou l'utilisation de vos données personnelles,
          vous pouvez nous contacter à : <a href="mailto:association.adiil@gmail.com" className="text-accent-mint hover:underline">association.adiil@gmail.com</a>
        </p>
      </section>

      <div className="mt-8 pt-8 border-t border-gray-700 text-sm text-gray-400">
        <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
  );
};

export default LegalPage;
