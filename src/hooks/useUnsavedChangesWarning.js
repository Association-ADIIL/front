import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook pour avertir l'utilisateur avant de quitter une page
 * (fermeture/rechargement d'onglet OU navigation interne) s'il y a des
 * modifications non enregistrées.
 *
 * @param {boolean} isDirty - true si le formulaire contient des données non sauvegardées
 * @returns {{
 *   showConfirmModal: boolean,
 *   confirmLeave: () => void,
 *   cancelLeave: () => void,
 * }}
 *
 * Usage:
 *   const { showConfirmModal, confirmLeave, cancelLeave } = useUnsavedChangesWarning(isDirty);
 *
 *   <ConfirmLeaveModal
 *     isOpen={showConfirmModal}
 *     onConfirm={confirmLeave}
 *     onCancel={cancelLeave}
 *   />
 */
export function useUnsavedChangesWarning(isDirty) {
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // On garde une ref à jour pour éviter de re-attacher les listeners à chaque render
  const isDirtyRef = useRef(isDirty);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // On stocke l'URL/action en attente de confirmation
  const pendingNavigationRef = useRef(null);

  // --- 1. Fermeture / rechargement de l'onglet ---
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      // Nécessaire pour certains navigateurs (Chrome notamment)
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // --- 2. Navigation interne (clics sur <Link> / <a href="/...">) ---
  useEffect(() => {
    const handleClick = (e) => {
      if (!isDirtyRef.current) return;

      // On cherche le <a> le plus proche du clic (gère aussi les clics sur une icône à l'intérieur d'un Link)
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // On ignore : liens externes, ancres, mailto/tel, nouvel onglet, modifier keys, target="_blank"
      const isExternal = anchor.target === '_blank' || /^https?:\/\//i.test(href) && !href.startsWith(window.location.origin);
      const isAnchorLink = href.startsWith('#');
      const isSpecialProtocol = /^(mailto:|tel:)/i.test(href);
      const isModifiedClick = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

      if (isExternal || isAnchorLink || isSpecialProtocol || isModifiedClick) return;

      // C'est une navigation interne -> on l'intercepte
      e.preventDefault();
      e.stopPropagation();
      pendingNavigationRef.current = href;
      setShowConfirmModal(true);
    };

    // capture: true pour intercepter le clic avant que React Router ne le traite
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  // --- 3. Bouton "précédent" / "suivant" du navigateur ---
  useEffect(() => {
    const handlePopState = (e) => {
      if (!isDirtyRef.current) return;
      // On ne peut pas "annuler" un popstate proprement sans astuce :
      // on republie un état pour rester sur place, puis on demande confirmation
      window.history.pushState(null, '', window.location.href);
      pendingNavigationRef.current = 'back';
      setShowConfirmModal(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const confirmLeave = useCallback(() => {
    const target = pendingNavigationRef.current;
    setShowConfirmModal(false);
    isDirtyRef.current = false; // évite de re-déclencher la modal pendant la navigation elle-même

    if (target === 'back') {
      window.history.back();
    } else if (target) {
      navigate(target);
    }
    pendingNavigationRef.current = null;
  }, [navigate]);

  const cancelLeave = useCallback(() => {
    pendingNavigationRef.current = null;
    setShowConfirmModal(false);
  }, []);

  return { showConfirmModal, confirmLeave, cancelLeave };
}