import { useEffect, useRef } from 'react';

const CONFIRM_MESSAGE = 'Des champs ont été remplis. Voulez-vous vraiment quitter sans enregistrer ?';

/**
 * Intercepte la navigation interne (clics sur <Link>/<a>) et le bouton
 * précédent/suivant du navigateur quand `isDirty` est vrai, et demande
 * confirmation via window.confirm() (cohérent avec le comportement déjà
 * géré par <Modal> pour la fermeture/rechargement d'onglet et le bouton X).
 *
 * Ne gère PAS beforeunload : c'est déjà fait dans Modal.tsx.
 *
 * @param isDirty - true si des données non sauvegardées doivent bloquer la navigation
 */
export function useConfirmNavigation(isDirty: boolean) {
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Clics sur les liens internes (Header, Footer, sidebar admin, etc.)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isDirtyRef.current) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      const isExternal =
        anchor.target === '_blank' ||
        (/^https?:\/\//i.test(href) && !href.startsWith(window.location.origin));
      const isAnchorLink = href.startsWith('#');
      const isSpecialProtocol = /^(mailto:|tel:)/i.test(href);
      const isModifiedClick = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

      if (isExternal || isAnchorLink || isSpecialProtocol || isModifiedClick) return;

      if (!window.confirm(CONFIRM_MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Confirmé : on laisse passer mais on évite que la modal se redéclenche
      isDirtyRef.current = false;
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  // Bouton précédent / suivant du navigateur
  useEffect(() => {
    const handlePopState = () => {
      if (!isDirtyRef.current) return;

      // On republie l'état courant pour "annuler" le retour le temps de demander confirmation
      window.history.pushState(null, '', window.location.href);

      if (window.confirm(CONFIRM_MESSAGE)) {
        isDirtyRef.current = false;
        window.history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
}