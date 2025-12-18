import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const ConfidentialitePage: React.FC = () => {
  useDocumentTitle('Politique de Confidentialité');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-accent-mint mb-8">Politique de Confidentialité</h1>

      {/* Introduction */}
      <section className="mb-8">
        <div className="text-gray-300 space-y-4">
          <p>
            L'ADIIL (Association du Département Informatique de l'IUT de Laval) s'engage à protéger
            la vie privée des utilisateurs de son site <span className="text-accent-mint font-semibold">adiil.fr</span>.
          </p>
          <p>
            Cette politique de confidentialité décrit comment nous collectons, utilisons et protégeons
            vos données personnelles conformément au Règlement Général sur la Protection des Données
            (RGPD - Règlement UE 2016/679).
          </p>
        </div>
      </section>

      {/* Article 1 - Responsable du traitement */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">1. Responsable du traitement</h2>
        <div className="bg-dark-card p-4 rounded-lg text-gray-300">
          <p className="mb-2"><strong>Responsable :</strong> ADIIL (Association du Département Informatique de l'IUT de Laval)</p>
          <p className="mb-2"><strong>Adresse :</strong> IUT de Laval, 52 Rue des Docteurs Calmette et Guérin, 53000 Laval</p>
          <p className="mb-2"><strong>Email DPO :</strong> <a href="mailto:association.adiil@gmail.com" className="text-accent-mint hover:underline">association.adiil@gmail.com</a></p>
        </div>
      </section>

      {/* Article 2 - Données collectées */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">2. Données personnelles collectées</h2>
        <div className="text-gray-300 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">2.1 Données d'identification</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Mot de passe (stocké sous forme chiffrée)</li>
              <li>Groupe/Classe (pour les étudiants)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">2.2 Données de transaction</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Historique des commandes</li>
              <li>Historique des inscriptions aux événements</li>
              <li>Historique des recharges du Solde ADIIL</li>
              <li>Identifiants de transaction (PayPal, HelloAsso)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">2.3 Données techniques</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Adresse IP (pour la sécurité)</li>
              <li>Cookies de session (authentification)</li>
              <li>Logs de connexion</li>
            </ul>
          </div>
          <div className="bg-dark-card p-4 rounded-lg border border-accent-mint/30">
            <p className="text-accent-mint font-semibold mb-2">Important :</p>
            <p>
              Nous ne collectons <strong>aucune donnée bancaire</strong>. Les paiements sont
              intégralement gérés par nos prestataires sécurisés (HelloAsso, PayPal) qui disposent
              de leurs propres politiques de confidentialité.
            </p>
          </div>
        </div>
      </section>

      {/* Article 3 - Finalités */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">3. Finalités du traitement</h2>
        <div className="text-gray-300 space-y-4">
          <p>Vos données personnelles sont collectées pour les finalités suivantes :</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-dark-card">
                  <th className="border border-gray-700 p-3 text-left text-white">Finalité</th>
                  <th className="border border-gray-700 p-3 text-left text-white">Base légale</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-700 p-3">Gestion de votre compte utilisateur</td>
                  <td className="border border-gray-700 p-3">Exécution du contrat</td>
                </tr>
                <tr>
                  <td className="border border-gray-700 p-3">Traitement des commandes et inscriptions</td>
                  <td className="border border-gray-700 p-3">Exécution du contrat</td>
                </tr>
                <tr>
                  <td className="border border-gray-700 p-3">Gestion des paiements et remboursements</td>
                  <td className="border border-gray-700 p-3">Exécution du contrat</td>
                </tr>
                <tr>
                  <td className="border border-gray-700 p-3">Envoi d'informations sur les événements</td>
                  <td className="border border-gray-700 p-3">Intérêt légitime</td>
                </tr>
                <tr>
                  <td className="border border-gray-700 p-3">Sécurité et prévention de la fraude</td>
                  <td className="border border-gray-700 p-3">Intérêt légitime</td>
                </tr>
                <tr>
                  <td className="border border-gray-700 p-3">Respect des obligations légales</td>
                  <td className="border border-gray-700 p-3">Obligation légale</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Article 4 - Destinataires */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">4. Destinataires des données</h2>
        <div className="text-gray-300 space-y-4">
          <p>Vos données peuvent être partagées avec :</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Les membres du bureau de l'ADIIL :</strong> pour la gestion des commandes
              et événements
            </li>
            <li>
              <strong>HelloAsso :</strong> prestataire de paiement
              (<a href="https://www.helloasso.com/confidentialite" target="_blank" rel="noopener noreferrer" className="text-accent-mint hover:underline">Politique de confidentialité</a>)
            </li>
            <li>
              <strong>PayPal :</strong> prestataire de paiement
              (<a href="https://www.paypal.com/fr/legalhub/privacy-full" target="_blank" rel="noopener noreferrer" className="text-accent-mint hover:underline">Politique de confidentialité</a>)
            </li>
            <li>
              <strong>Notre hébergeur (Contabo GmbH) :</strong> pour le stockage sécurisé des données
            </li>
          </ul>
          <p className="mt-4">
            Nous ne vendons jamais vos données personnelles à des tiers. Aucun transfert de données
            hors de l'Union Européenne n'est effectué.
          </p>
        </div>
      </section>

      {/* Article 5 - Durée de conservation */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">5. Durée de conservation</h2>
        <div className="text-gray-300 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-dark-card">
                  <th className="border border-gray-700 p-3 text-left text-white">Type de données</th>
                  <th className="border border-gray-700 p-3 text-left text-white">Durée de conservation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-700 p-3">Données de compte</td>
                  <td className="border border-gray-700 p-3">Jusqu'à suppression du compte + 1 an</td>
                </tr>
                <tr>
                  <td className="border border-gray-700 p-3">Données de transaction</td>
                  <td className="border border-gray-700 p-3">10 ans (obligation comptable)</td>
                </tr>
                <tr>
                  <td className="border border-gray-700 p-3">Données de connexion</td>
                  <td className="border border-gray-700 p-3">1 an</td>
                </tr>
                <tr>
                  <td className="border border-gray-700 p-3">Cookies de session</td>
                  <td className="border border-gray-700 p-3">Durée de la session</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Article 6 - Vos droits */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">6. Vos droits</h2>
        <div className="text-gray-300 space-y-4">
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-dark-card p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Droit d'accès</h4>
              <p className="text-sm">Obtenir la confirmation que vos données sont traitées et en recevoir une copie.</p>
            </div>
            <div className="bg-dark-card p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Droit de rectification</h4>
              <p className="text-sm">Corriger vos données personnelles inexactes ou incomplètes.</p>
            </div>
            <div className="bg-dark-card p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Droit à l'effacement</h4>
              <p className="text-sm">Demander la suppression de vos données dans certains cas.</p>
            </div>
            <div className="bg-dark-card p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Droit à la limitation</h4>
              <p className="text-sm">Restreindre le traitement de vos données dans certains cas.</p>
            </div>
            <div className="bg-dark-card p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Droit à la portabilité</h4>
              <p className="text-sm">Recevoir vos données dans un format structuré et lisible.</p>
            </div>
            <div className="bg-dark-card p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Droit d'opposition</h4>
              <p className="text-sm">Vous opposer au traitement de vos données pour motifs légitimes.</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-accent-mint/10 border border-accent-mint/30 rounded-lg">
            <p className="font-semibold text-white mb-2">Comment exercer vos droits ?</p>
            <p>
              Envoyez votre demande par email à{' '}
              <a href="mailto:association.adiil@gmail.com" className="text-accent-mint hover:underline">
                association.adiil@gmail.com
              </a>{' '}
              en précisant votre identité et le droit que vous souhaitez exercer.
              Nous répondrons dans un délai d'un mois.
            </p>
          </div>
        </div>
      </section>

      {/* Article 7 - Cookies */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">7. Cookies</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            Notre site utilise uniquement des cookies strictement nécessaires au fonctionnement du service :
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-dark-card">
                  <th className="border border-gray-700 p-3 text-left text-white">Cookie</th>
                  <th className="border border-gray-700 p-3 text-left text-white">Finalité</th>
                  <th className="border border-gray-700 p-3 text-left text-white">Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-700 p-3">auth_token</td>
                  <td className="border border-gray-700 p-3">Authentification de l'utilisateur</td>
                  <td className="border border-gray-700 p-3">Session</td>
                </tr>
                <tr>
                  <td className="border border-gray-700 p-3">cart</td>
                  <td className="border border-gray-700 p-3">Contenu du panier</td>
                  <td className="border border-gray-700 p-3">7 jours</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Ces cookies étant strictement nécessaires, ils ne requièrent pas votre consentement.
            Vous pouvez les bloquer via les paramètres de votre navigateur, mais cela pourrait
            affecter le fonctionnement du site.
          </p>
        </div>
      </section>

      {/* Article 8 - Sécurité */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">8. Sécurité des données</h2>
        <div className="text-gray-300 space-y-4">
          <p>Nous mettons en place des mesures de sécurité appropriées :</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Chiffrement des mots de passe (bcrypt)</li>
            <li>Communication sécurisée (HTTPS/TLS)</li>
            <li>Accès restreint aux données (principe du moindre privilège)</li>
            <li>Journalisation des accès administratifs</li>
            <li>Sauvegardes régulières des données</li>
          </ul>
        </div>
      </section>

      {/* Article 9 - Mineurs */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">9. Protection des mineurs</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            Notre site est principalement destiné aux étudiants majeurs. Si vous êtes mineur,
            nous vous invitons à obtenir l'autorisation de vos parents ou tuteurs légaux avant
            de créer un compte ou d'effectuer des achats.
          </p>
        </div>
      </section>

      {/* Article 10 - Modifications */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">10. Modifications de cette politique</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            Nous pouvons mettre à jour cette politique de confidentialité pour refléter les
            changements dans nos pratiques. La date de dernière mise à jour est indiquée en bas
            de cette page. Nous vous encourageons à consulter régulièrement cette page.
          </p>
        </div>
      </section>

      {/* Article 11 - Réclamation */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">11. Réclamation</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une
            réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) :
          </p>
          <div className="bg-dark-card p-4 rounded-lg">
            <p className="mb-2"><strong>CNIL</strong></p>
            <p className="mb-2">3 Place de Fontenoy, TSA 80715</p>
            <p className="mb-2">75334 Paris Cedex 07</p>
            <p>
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-accent-mint hover:underline">
                www.cnil.fr
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">Contact</h2>
        <p className="text-gray-300">
          Pour toute question concernant cette politique de confidentialité ou vos données personnelles,
          contactez-nous à :{' '}
          <a href="mailto:association.adiil@gmail.com" className="text-accent-mint hover:underline">
            association.adiil@gmail.com
          </a>
        </p>
      </section>

      {/* Liens */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">Documents associés</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/legal" className="px-4 py-2 bg-dark-card rounded-lg text-accent-mint hover:bg-gray-800 transition-colors">
            Mentions Légales
          </Link>
          <Link to="/cgu" className="px-4 py-2 bg-dark-card rounded-lg text-accent-mint hover:bg-gray-800 transition-colors">
            Conditions Générales d'Utilisation
          </Link>
          <Link to="/cgv" className="px-4 py-2 bg-dark-card rounded-lg text-accent-mint hover:bg-gray-800 transition-colors">
            Conditions Générales de Vente
          </Link>
        </div>
      </section>

      <div className="mt-8 pt-8 border-t border-gray-700 text-sm text-gray-400">
        <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
  );
};

export default ConfidentialitePage;
