import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const CGUPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SEO
        title="Conditions Generales d'Utilisation"
        description="CGU de l'ADIIL - Conditions Generales d'Utilisation du site adiil.fr. Regles d'utilisation pour les etudiants de l'IUT de Laval."
        url="/cgu"
      />
      <h1 className="text-4xl font-bold text-accent-mint mb-8">Conditions Générales d'Utilisation</h1>

      {/* Préambule */}
      <section className="mb-8">
        <div className="bg-dark-card p-4 rounded-lg text-gray-300">
          <p className="mb-2">
            Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation
            du site <span className="text-accent-mint font-semibold">adiil.fr</span>, édité par
            l'ADIIL (Association du Département Informatique de l'IUT de Laval).
          </p>
          <p>
            En accédant au site, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas
            ces conditions, veuillez ne pas utiliser le site.
          </p>
        </div>
      </section>

      {/* Article 1 - Objet */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">1. Objet</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            Les présentes CGU définissent les conditions d'accès et d'utilisation des services proposés
            par le site adiil.fr, notamment :
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>La consultation des informations relatives aux événements de l'ADIIL</li>
            <li>L'inscription aux événements organisés par l'ADIIL</li>
            <li>L'achat de produits via la boutique en ligne (Click & Collect)</li>
            <li>La gestion d'un compte utilisateur et d'un solde prépayé</li>
          </ul>
        </div>
      </section>

      {/* Article 2 - Accès au site */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">2. Accès au site</h2>
        <div className="text-gray-300 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">2.1 Accès libre</h3>
            <p>
              L'accès au site est gratuit et ouvert à toute personne disposant d'un accès à Internet.
              Les frais d'accès à Internet et d'équipement nécessaire à la connexion sont à la charge
              exclusive de l'utilisateur.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">2.2 Disponibilité</h3>
            <p>
              L'ADIIL s'efforce de maintenir le site accessible 24 heures sur 24 et 7 jours sur 7.
              Cependant, l'ADIIL se réserve le droit d'interrompre temporairement l'accès pour des
              raisons de maintenance, de mise à jour ou pour toute autre raison technique, sans
              préavis ni indemnité.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">2.3 Services réservés aux membres</h3>
            <p>
              Certains services (inscription aux événements, achats, gestion du solde) nécessitent
              la création d'un compte utilisateur. Ces services sont principalement destinés aux
              étudiants et membres de la communauté de l'IUT de Laval.
            </p>
          </div>
        </div>
      </section>

      {/* Article 3 - Création de compte */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">3. Création et gestion de compte</h2>
        <div className="text-gray-300 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">3.1 Inscription</h3>
            <p>
              Pour accéder aux services réservés, l'utilisateur doit créer un compte en fournissant
              des informations exactes et complètes (nom, prénom, adresse email, groupe/classe le cas échéant).
              L'utilisateur s'engage à maintenir ces informations à jour.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">3.2 Identifiants</h3>
            <p className="mb-2">
              Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion.
              Toute utilisation du compte est présumée effectuée par le titulaire du compte.
            </p>
            <p>
              En cas de perte, vol ou utilisation non autorisée de vos identifiants, vous devez
              en informer immédiatement l'ADIIL à{' '}
              <a href="mailto:association.adiil@gmail.com" className="text-accent-mint hover:underline">
                association.adiil@gmail.com
              </a>.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">3.3 Suppression de compte</h3>
            <p>
              L'utilisateur peut demander la suppression de son compte à tout moment. L'ADIIL se
              réserve le droit de supprimer ou suspendre un compte en cas de non-respect des présentes CGU.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">3.4 Utilisateurs mineurs</h3>
            <div className="space-y-3">
              <p>
                Le site et les services de l'ADIIL sont principalement destinés aux étudiants majeurs.
                Les mineurs de 16 ans et plus peuvent créer un compte sous réserve d'avoir obtenu
                l'autorisation préalable de leurs parents ou représentants légaux.
              </p>
              <p>
                En créant un compte pour un mineur ou en autorisant un mineur à utiliser le site,
                les parents ou représentants légaux acceptent les présentes CGU au nom du mineur et
                assument l'entière responsabilité de l'utilisation du site par celui-ci.
              </p>
              <p>
                Les mineurs de moins de 16 ans ne sont pas autorisés à créer un compte.
              </p>
              <div className="bg-dark-card p-4 rounded-lg border border-accent-mint/30 mt-3">
                <p className="text-accent-mint font-semibold mb-2">Note importante</p>
                <p className="text-sm">
                  Certains événements peuvent être soumis à des restrictions d'âge. Ces restrictions
                  sont indiquées sur la page de l'événement concerné. L'ADIIL décline toute responsabilité
                  en cas de participation d'un mineur à un événement inapproprié pour son âge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article 4 - Obligations de l'utilisateur */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">4. Obligations de l'utilisateur</h2>
        <div className="text-gray-300 space-y-4">
          <p>L'utilisateur s'engage à :</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Utiliser le site conformément à sa destination et aux présentes CGU</li>
            <li>Ne pas usurper l'identité d'un tiers</li>
            <li>Ne pas créer plusieurs comptes pour une même personne</li>
            <li>Ne pas tenter de perturber le fonctionnement du site (intrusion, saturation, etc.)</li>
            <li>Ne pas contourner les mesures de sécurité ou d'authentification</li>
            <li>Ne pas utiliser de moyens automatisés (bots, scripts) sans autorisation</li>
            <li>Respecter les droits de propriété intellectuelle de l'ADIIL et des tiers</li>
            <li>Ne pas diffuser de contenu illicite, diffamatoire, injurieux ou contraire à l'ordre public</li>
          </ul>
        </div>
      </section>

      {/* Article 5 - Utilisation des services */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">5. Utilisation des services</h2>
        <div className="text-gray-300 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">5.1 Événements</h3>
            <p>
              L'inscription aux événements est soumise aux conditions spécifiques de chaque événement
              (capacité, éligibilité, tarif). L'utilisateur s'engage à respecter le règlement des
              événements auxquels il participe.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">5.2 Boutique</h3>
            <p>
              Les achats sur la boutique en ligne sont soumis aux{' '}
              <Link to="/cgv" className="text-accent-mint hover:underline">
                Conditions Générales de Vente
              </Link>. L'utilisateur s'engage à récupérer ses commandes dans les délais communiqués.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">5.3 Solde ADIIL</h3>
            <p>
              L'utilisation du solde ADIIL est soumise aux conditions définies dans les{' '}
              <Link to="/cgv" className="text-accent-mint hover:underline">
                Conditions Générales de Vente
              </Link>, notamment en ce qui concerne la validité et les conditions de remboursement.
            </p>
          </div>
        </div>
      </section>

      {/* Article 6 - Propriété intellectuelle */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">6. Propriété intellectuelle</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            L'ensemble des éléments composant le site (textes, images, logos, graphismes, logiciels,
            bases de données) sont protégés par les lois relatives à la propriété intellectuelle.
          </p>
          <p>
            Toute reproduction ou représentation, totale ou partielle, du site ou de son contenu,
            par quelque procédé que ce soit, sans autorisation expresse de l'ADIIL, est interdite
            et constitue une contrefaçon.
          </p>
          <p>
            Pour plus de détails, consultez les{' '}
            <Link to="/legal" className="text-accent-mint hover:underline">
              Mentions Légales
            </Link>.
          </p>
        </div>
      </section>

      {/* Article 7 - Données personnelles */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">7. Données personnelles</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            La collecte et le traitement de vos données personnelles sont effectués conformément
            au Règlement Général sur la Protection des Données (RGPD).
          </p>
          <p>
            Pour connaître vos droits et les modalités de traitement de vos données, consultez notre{' '}
            <Link to="/confidentialite" className="text-accent-mint hover:underline">
              Politique de Confidentialité
            </Link>.
          </p>
        </div>
      </section>

      {/* Article 8 - Responsabilité */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">8. Limitation de responsabilité</h2>
        <div className="text-gray-300 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">8.1 Responsabilité de l'ADIIL</h3>
            <p>
              L'ADIIL ne saurait être tenue responsable des dommages directs ou indirects résultant
              de l'utilisation du site ou de l'impossibilité d'y accéder. L'ADIIL ne garantit pas
              l'exactitude, l'exhaustivité ou l'actualité des informations diffusées sur le site.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">8.2 Responsabilité de l'utilisateur</h3>
            <p>
              L'utilisateur est seul responsable de l'utilisation qu'il fait du site et des services.
              Il garantit l'ADIIL contre toute réclamation de tiers résultant de son utilisation du site.
            </p>
          </div>
        </div>
      </section>

      {/* Article 9 - Sanctions */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">9. Sanctions en cas de manquement</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            En cas de non-respect des présentes CGU, l'ADIIL se réserve le droit de :
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Suspendre ou supprimer le compte de l'utilisateur, temporairement ou définitivement</li>
            <li>Refuser l'accès à tout ou partie des services</li>
            <li>Annuler les commandes ou inscriptions en cours</li>
            <li>Engager des poursuites en cas d'infractions pénales</li>
          </ul>
          <p className="mt-4">
            Ces sanctions sont sans préjudice des dommages et intérêts qui pourraient être réclamés
            par l'ADIIL.
          </p>
        </div>
      </section>

      {/* Article 10 - Modification des CGU */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">10. Modification des CGU</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            L'ADIIL se réserve le droit de modifier les présentes CGU à tout moment. Les modifications
            entrent en vigueur dès leur publication sur le site. L'utilisateur est invité à consulter
            régulièrement les CGU.
          </p>
          <p>
            La poursuite de l'utilisation du site après modification des CGU vaut acceptation des
            nouvelles conditions.
          </p>
        </div>
      </section>

      {/* Article 11 - Droit applicable */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">11. Droit applicable et litiges</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            Les présentes CGU sont soumises au droit français. En cas de litige relatif à leur
            interprétation ou exécution, les parties s'efforceront de trouver une solution amiable.
          </p>
          <p>
            À défaut d'accord amiable, les tribunaux français seront seuls compétents pour connaître
            du litige.
          </p>
        </div>
      </section>

      {/* Documents associés */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">Documents associés</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/legal" className="px-4 py-2 bg-dark-card rounded-lg text-accent-mint hover:bg-gray-800 transition-colors">
            Mentions Légales
          </Link>
          <Link to="/cgv" className="px-4 py-2 bg-dark-card rounded-lg text-accent-mint hover:bg-gray-800 transition-colors">
            Conditions Générales de Vente
          </Link>
          <Link to="/confidentialite" className="px-4 py-2 bg-dark-card rounded-lg text-accent-mint hover:bg-gray-800 transition-colors">
            Politique de Confidentialité
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">Contact</h2>
        <div className="bg-dark-card p-4 rounded-lg text-gray-300">
          <p className="mb-2">Pour toute question concernant ces CGU :</p>
          <p className="mb-2"><strong>ADIIL</strong></p>
          <p className="mb-2">IUT de Laval, 52 Rue des Docteurs Calmette et Guérin, 53000 Laval</p>
          <p>
            Email :{' '}
            <a href="mailto:association.adiil@gmail.com" className="text-accent-mint hover:underline">
              association.adiil@gmail.com
            </a>
          </p>
        </div>
      </section>

      <div className="mt-8 pt-8 border-t border-gray-700 text-sm text-gray-400">
        <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
  );
};

export default CGUPage;
