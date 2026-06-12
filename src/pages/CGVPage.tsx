import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const CGVPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SEO
        title="Conditions Generales de Vente"
        description="CGV de l'ADIIL - Conditions Generales de Vente pour les evenements, la boutique et le solde. Association du Departement Informatique IUT Laval."
        url="/cgv"
      />
      <h1 className="text-4xl font-bold text-accent-mint mb-8">Conditions Générales de Vente</h1>

      {/* Article 1 - Objet */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">1. Objet</h2>
        <p className="text-gray-300">
          Les présentes Conditions Générales de Vente (CGV) régissent les transactions effectuées sur le
          site internet de l'ADIIL par tout utilisateur (ci-après « l'Étudiant »).
        </p>
      </section>

      {/* Article 2 - Services et Réservations */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">2. Services et Réservations</h2>
        <div className="text-gray-300 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">2.1. Événements</h3>
            <p className="mb-2">
              L'inscription à un événement n'est ferme et définitive qu'après confirmation du paiement intégral.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Pour les paiements en ligne, la place est réservée dès validation de la transaction.</li>
              <li>Pour les paiements « sur place », la place n'est réservée qu'au moment où le paiement est physiquement effectué et validé manuellement par un membre du bureau de l'ADIIL.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">2.2. Boutique (Click & Collect)</h3>
            <p>
              Le paiement en ligne constitue une pré-commande. L'ADIIL s'engage à honorer la commande dans la
              limite des stocks disponibles. En cas d'indisponibilité constatée au moment du retrait, l'Étudiant
              sera remboursé sur le ou les articles manquants, ou pourra demander l'annulation et le remboursement
              intégral de sa commande, ou choisir un article de remplacement à prix équivalent.
            </p>
          </div>
        </div>
      </section>

      {/* Article 3 - Modalités de Paiement */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">3. Modalités de Paiement</h2>
        <p className="text-gray-300">
          Le règlement s'effectue par : Solde ADIIL, HelloAsso, PayPal ou sur place (espèces/CB).
        </p>
      </section>

      {/* Article 4 - Gestion du Solde */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">4. Gestion du Solde</h2>
        <div className="text-gray-300 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">4.1. Nature du solde</h3>
            <p>
              Le solde chargé sur le compte utilisateur constitue une avance de consommation interne, utilisable
              exclusivement pour les produits et services proposés par l'ADIIL.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">4.2. Validité</h3>
            <p>
              Le solde est valable pour une durée de trois (3) ans à compter de la dernière opération (crédit ou
              débit) enregistrée sur le compte. Passé ce délai, le solde restant est définitivement perdu.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">4.3. Remboursement anticipé</h3>
            <p className="mb-2">
              L'Étudiant peut demander le remboursement de son solde sous réserve des conditions cumulatives suivantes :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>La demande doit être effectuée par courrier recommandé avec accusé de réception (LRAR) adressé au siège de l'association.</li>
              <li>Le solde disponible doit être supérieur ou égal à quinze euros (15 EUR).</li>
              <li>Des frais de gestion et d'expédition d'un montant forfaitaire de huit euros (8 EUR) seront déduits du montant remboursé. Ces frais couvrent notamment l'envoi du chèque par lettre recommandée avec accusé de réception (LRAR).</li>
            </ul>
            <p className="mt-2">
              Le remboursement sera effectué par chèque libellé au nom du titulaire du compte, envoyé par lettre
              recommandée avec accusé de réception (LRAR) à l'adresse postale indiquée dans la demande, dans un
              délai de trente (30) jours ouvrés suivant la réception de la demande.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">4.4. Exceptions</h3>
            <p>
              En cas de décès du titulaire ou de fermeture définitive de l'ADIIL, le solde remboursable (calculé
              selon l'article 5.4) sera versé intégralement aux ayants droit ou au titulaire, sans application
              des frais mentionnés à l'article 4.3.
            </p>
          </div>
        </div>
      </section>

      {/* Article 5 - Offres Promotionnelles */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">5. Offres Promotionnelles</h2>
        <div className="text-gray-300 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">5.1. Bonus de rechargement</h3>
            <p>
              L'ADIIL peut proposer des bonus sur les rechargements de solde, sous forme de pourcentage additionnel
              crédité sur le compte. Les conditions d'éligibilité (montant minimum, premier rechargement, nombre de
              rechargements par compte, nombre total de rechargements disponibles) sont indiquées lors du rechargement.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">5.2. Réductions</h3>
            <p>
              L'ADIIL peut proposer des réductions sur les produits et services, sous forme de pourcentage ou de
              montant fixe. Les conditions d'éligibilité sont indiquées lors de l'achat.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">5.3. Conditions générales des offres</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Les offres sont valables dans la limite des conditions affichées et peuvent être modifiées ou supprimées à tout moment par l'ADIIL.</li>
              <li>Les offres ne sont pas rétroactives : seules les conditions affichées au moment de la transaction s'appliquent.</li>
              <li>Les offres ne sont pas cumulables entre elles, sauf mention contraire explicite.</li>
              <li>L'ADIIL se réserve le droit de limiter ou annuler une offre en cas d'abus manifeste ou d'erreur technique.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">5.4. Bonus et remboursement</h3>
            <p className="mb-2">
              Les bonus de rechargement constituent un avantage commercial non remboursable en toute circonstance,
              y compris en cas de décès du titulaire ou de fermeture de l'ADIIL.
            </p>
            <p className="mb-2">
              En cas de remboursement du solde (articles 4.3 et 4.4), le montant remboursable est calculé au prorata
              de la part des versements réels dans l'historique total des crédits du compte. Le calcul s'effectue ainsi :
            </p>
            <div className="bg-dark-card p-4 rounded-lg my-4">
              <p className="font-mono text-accent-mint">
                Montant remboursable = Solde actuel × (Total des versements ÷ Total des crédits)
              </p>
            </div>
            <p className="text-sm text-gray-400 italic">
              Exemple : Un compte a reçu 100 EUR de versements et 15 EUR de bonus (total crédits : 115 EUR).
              Il reste 40 EUR de solde. Le montant remboursable est de 40 × (100 ÷ 115) = 34,78 EUR.
            </p>
          </div>
        </div>
      </section>

      {/* Article 6 - Récupération des Commandes */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">6. Récupération des Commandes (Click & Collect)</h2>
        <div className="text-gray-300 space-y-4">
          <p>
            L'ADIIL ne disposant pas d'horaires d'ouverture fixes et permanents, la récupération des produits
            s'effectue selon les modalités suivantes :
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>L'Étudiant doit se présenter au local de l'ADIIL lorsque celui-ci est ouvert (généralement durant les pauses ou la période du déjeuner).</li>
            <li>L'Étudiant peut solliciter un membre de l'ADIIL pour demander une ouverture ponctuelle du local.</li>
            <li>
              <strong>Justificatif :</strong> La présentation du QR Code de commande est obligatoire pour retirer
              tout produit ou valider une inscription. En cas d'impossibilité de présenter le QR Code, la transaction
              pourra être vérifiée sur présentation d'une pièce d'identité.
            </li>
          </ul>
        </div>
      </section>

      {/* Article 7 - Annulation et Remboursements */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">7. Annulation et Remboursements</h2>
        <div className="text-gray-300 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">7.1. Principe</h3>
            <p>Les billets d'événements sont non remboursables, sauf annulation par l'ADIIL.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">7.2. Modalités techniques</h3>
            <p>Les remboursements sont effectués prioritairement sur le mode de paiement d'origine.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">7.3. Cas particuliers</h3>
            <p className="mb-2">
              Si le remboursement sur le mode d'origine est techniquement impossible, il sera effectué,
              au choix de l'ADIIL :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Par crédit du solde interne de l'Étudiant.</li>
              <li>Par l'échange contre un produit ou service équivalent à un prix similaire.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Article 8 - Droit de rétractation */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">8. Droit de rétractation</h2>
        <div className="text-gray-300 space-y-4">
          <div className="bg-dark-card p-4 rounded-lg border border-accent-mint/30">
            <p className="text-accent-mint font-semibold mb-2">Information importante</p>
            <p>
              Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation
              ne peut être exercé pour les contrats suivants :
            </p>
          </div>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Événements à date déterminée :</strong> Les inscriptions aux événements
              (soirées, sorties, activités) constituent des prestations de services de loisirs
              devant être fournis à une date déterminée. Le droit de rétractation est donc exclu
              (article L221-28, 12°).
            </li>
            <li>
              <strong>Click & Collect :</strong> Les commandes passées en Click & Collect portent
              sur des biens susceptibles de se détériorer ou de se périmer rapidement, ou qui ont
              été descellés après la livraison et ne peuvent être renvoyés pour des raisons d'hygiène
              ou de protection de la santé. Le droit de rétractation est donc exclu (article L221-28, 2° et 5°).
            </li>
          </ul>
          <p>
            En passant commande ou en s'inscrivant à un événement, l'Étudiant reconnaît avoir été
            informé de l'absence de droit de rétractation et y consent expressément.
          </p>
        </div>
      </section>

      {/* Article 9 - Utilisateurs mineurs */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">9. Utilisateurs mineurs</h2>
        <div className="text-gray-300 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">9.1. Conditions d'inscription</h3>
            <p>
              Le site et les services de l'ADIIL sont principalement destinés aux étudiants majeurs.
              Toutefois, les mineurs de 16 ans et plus peuvent créer un compte et utiliser les services
              sous réserve d'avoir obtenu l'autorisation préalable de leurs parents ou représentants légaux.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">9.2. Responsabilité parentale</h3>
            <p className="mb-2">
              Les parents ou représentants légaux d'un utilisateur mineur sont responsables :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>De l'utilisation du site et des services par le mineur</li>
              <li>Du respect des présentes CGV par le mineur</li>
              <li>Des transactions effectuées depuis le compte du mineur</li>
              <li>De l'adéquation des événements auxquels le mineur s'inscrit</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">9.3. Événements avec restriction d'âge</h3>
            <p>
              Certains événements peuvent être soumis à des restrictions d'âge (notamment ceux impliquant
              la vente ou la mise à disposition d'alcool). Ces restrictions sont clairement indiquées sur
              la page de l'événement. L'ADIIL se réserve le droit de refuser l'accès à un événement à
              toute personne ne respectant pas les conditions d'âge requises, sans remboursement.
            </p>
          </div>
        </div>
      </section>

      {/* Article 10 - Modification des CGV */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">10. Modification des CGV</h2>
        <p className="text-gray-300">
          L'ADIIL se réserve le droit de modifier les présentes CGV à tout moment. Les utilisateurs seront
          informés des modifications par affichage sur le site. Les CGV applicables sont celles en vigueur
          au moment de la transaction.
        </p>
      </section>

      {/* Informations complémentaires */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-accent-mint mb-4">Informations complémentaires</h2>
        <div className="text-gray-300 space-y-4">
          <div className="bg-dark-card p-4 rounded-lg">
            <p className="mb-2"><strong>Association :</strong> ADIIL (Association du Département Informatique de l'IUT de Laval)</p>
            <p className="mb-2"><strong>Adresse :</strong> IUT de Laval, 52 Rue des Docteurs Calmette et Guérin, 53000 Laval</p>
            <p className="mb-2"><strong>Email :</strong> <a href="mailto:association.adiil@gmail.com" className="text-accent-mint hover:underline">association.adiil@gmail.com</a></p>
            <p><strong>Statut :</strong> Association loi 1901</p>
          </div>
          <p>
            Pour plus d'informations sur la protection de vos données personnelles, consultez notre{' '}
            <Link to="/confidentialite" className="text-accent-mint hover:underline">Politique de Confidentialité</Link>.
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
          <Link to="/cgu" className="px-4 py-2 bg-dark-card rounded-lg text-accent-mint hover:bg-gray-800 transition-colors">
            Conditions Générales d'Utilisation
          </Link>
          <Link to="/confidentialite" className="px-4 py-2 bg-dark-card rounded-lg text-accent-mint hover:bg-gray-800 transition-colors">
            Politique de Confidentialité
          </Link>
        </div>
      </section>

      <div className="mt-8 pt-8 border-t border-gray-700 text-sm text-gray-400">
        <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
  );
};

export default CGVPage;
