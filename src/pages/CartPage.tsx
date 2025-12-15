import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { MinusCircle, PlusCircle, Trash2, ShoppingBag, CreditCard, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createOrder, type OrderItem as ApiOrderItem } from '../api/orders';
import { getMyBalance, purchaseWithBalance } from '../api/balance';

// PayPal Logo SVG Component
const PayPalLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 0 1-.794.679H7.72a.483.483 0 0 1-.477-.558L9.28 7.13a.946.946 0 0 1 .933-.8h4.42c1.828 0 3.143.375 3.91 1.117.383.37.646.812.785 1.316z"/>
    <path d="M6.062 21.71a.668.668 0 0 1-.66-.758l2.157-13.687a.786.786 0 0 1 .774-.665h4.42c1.857 0 3.297.39 4.28 1.16.477.374.817.835 1.013 1.374l.01.027c.15.427.23.902.245 1.417-1.073 4.62-4.268 6.222-7.937 6.222h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.03.17a.804.804 0 0 1-.795.679H6.062z" opacity=".7"/>
  </svg>
);

// Cash Logo SVG Component (Bill)
const CashLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="10" rx="2"/>
    <circle cx="12" cy="12" r="2.5"/>
    <path d="M18.5 12c0 1.5.8 2.5 1.5 2.5M5.5 12c0 1.5-.8 2.5-1.5 2.5M18.5 12c0-1.5.8-2.5 1.5-2.5M5.5 12c0-1.5-.8-2.5-1.5-2.5"/>
  </svg>
);

const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'PAYPAL' | 'HELLOASSO' | 'CASH_CB' | 'BALANCE' | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [balance, setBalance] = useState<number>(0);

  // Auto-deselect HelloAsso if total is below 0.50
  useEffect(() => {
    if (selectedPaymentMethod === 'HELLOASSO' && totalPrice < 0.50) {
      setSelectedPaymentMethod(null);
    }
  }, [totalPrice, selectedPaymentMethod]);

  useEffect(() => {
    if (user) {
      const fetchBalance = async () => {
        try {
          const data = await getMyBalance();
          setBalance(data.balance);
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      };
      fetchBalance();
    }
  }, [user]);

  const handleUpdateQuantity = (productId: string, newQuantity: number, variantId?: number) => {
    updateQuantity(productId, newQuantity, variantId);
  };

  const handleRemoveItem = (productId: string, variantId?: number) => {
    removeFromCart(productId, variantId);
    addNotification('info', 'Produit retiré du panier.');
  };

  const handleCheckout = async () => {
    if (!user) {
      addNotification('error', 'Vous devez être connecté pour passer commande.');
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      addNotification('error', 'Votre panier est vide.');
      return;
    }

    if (!selectedPaymentMethod) {
      addNotification('error', 'Veuillez sélectionner une méthode de paiement.');
      return;
    }

    // Handle balance payment
    if (selectedPaymentMethod === 'BALANCE') {
      if (balance < totalPrice) {
        addNotification('error', 'Solde insuffisant. Rechargez votre carte.');
        navigate('/balance');
        return;
      }

      setIsProcessingOrder(true);
      try {
        await purchaseWithBalance({
          items: items.map(item => ({
            productId: parseInt(item.product.id),
            quantity: item.quantity,
          })),
        });

        addNotification('success', 'Achat effectué avec succès ! Votre solde a été débité.');
        clearCart();
        navigate('/my-account');
      } catch (error: any) {
        addNotification('error', error.message || 'Erreur lors de l\'achat');
      } finally {
        setIsProcessingOrder(false);
      }
      return;
    }

    // Handle other payment methods
    setIsProcessingOrder(true);
    try {
      const orderItems: ApiOrderItem[] = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const returnUrl = `${window.location.origin}/payment/callback`;
      const cancelUrl = `${window.location.origin}/cart`;

      const orderData = await createOrder({
        items: orderItems,
        paymentMethod: selectedPaymentMethod,
        returnUrl,
        cancelUrl,
      });

      if (orderData.payment?.approvalUrl) { // PayPal
        sessionStorage.setItem('paypal_order_id', orderData.order.id.toString());
        window.location.href = orderData.payment.approvalUrl;
      } else if (orderData.payment?.redirectUrl) { // HelloAsso
        sessionStorage.setItem('helloasso_order_id', orderData.order.id.toString());
        window.location.href = orderData.payment.redirectUrl;
      } else {
        // Cash or Free order
        addNotification('success', orderData.message || 'Commande passée avec succès !');
        clearCart();
        navigate('/my-account');
      }

    } catch (error: any) {
      console.error('Erreur lors de la commande:', error);
      addNotification('error', error.message || 'Échec de la commande.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-accent-mint mb-6 font-koulen">Votre Panier</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-darker-bg rounded-2xl border border-gray-800">
          <ShoppingBag size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">Votre panier est vide pour le moment.</p>
          <button
            onClick={() => navigate('/shop')}
            className="mt-6 bg-accent-mint text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors"
          >
            Retour à la boutique
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-grow">
            <div className="card p-6">
              {items.map((cartItem) => {
                const variant = cartItem.product.variants?.find(v => v.id === cartItem.variantId);
                const itemPrice = cartItem.product.price + (variant?.priceModifier || 0);
                const cartItemKey = `${cartItem.product.id}-${cartItem.variantId || 'no-variant'}`;

                return (
                  <div key={cartItemKey} className="flex items-center justify-between border-b border-gray-700 pb-4 mb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center flex-grow">
                      <img
                        src={cartItem.product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cartItem.product.name)}&background=1E1E1E&color=fff&size=200`}
                        alt={cartItem.product.name}
                        className="w-20 h-20 object-cover rounded-md mr-4"
                      />
                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-white">
                          {cartItem.product.name}
                          {variant && <span className="text-accent-mint ml-2">({variant.name})</span>}
                        </h3>
                        <p className="text-gray-400 text-sm">{cartItem.product.description?.substring(0, 50)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center border border-gray-600 rounded-md">
                        <button
                          onClick={() => handleUpdateQuantity(cartItem.product.id, cartItem.quantity - 1, cartItem.variantId)}
                          className="p-2 text-accent-mint hover:text-white disabled:text-gray-600"
                          disabled={cartItem.quantity <= 1}
                        >
                          <MinusCircle size={20} />
                        </button>
                        <span className="px-3 text-lg font-bold">{cartItem.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(cartItem.product.id, cartItem.quantity + 1, cartItem.variantId)}
                          className="p-2 text-accent-mint hover:text-white"
                        >
                          <PlusCircle size={20} />
                        </button>
                      </div>
                      <p className="text-lg font-bold w-24 text-right">{(itemPrice * cartItem.quantity).toFixed(2)} €</p>
                      <button
                        onClick={() => handleRemoveItem(cartItem.product.id, cartItem.variantId)}
                        className="text-red-500 hover:text-red-700 ml-4"
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="card p-6 sticky top-28">
              <h2 className="text-2xl font-bold mb-4 text-white">Résumé de la commande</h2>
              <div className="flex justify-between items-center mb-4">
                <p className="text-gray-300">Sous-total:</p>
                <p className="text-xl font-bold">{totalPrice.toFixed(2)} €</p>
              </div>
              <div className="border-t border-gray-700 my-4"></div>
              <div className="flex justify-between items-center mb-6">
                <p className="text-xl font-bold text-accent-mint">Total:</p>
                <p className="text-3xl font-bold text-accent-mint">{totalPrice.toFixed(2)} €</p>
              </div>

              <h3 className="text-xl font-bold mb-3 text-white">Méthode de paiement</h3>
              <div className="space-y-3 mb-6">
                {user && (
                  <div>
                    <label className={`flex items-center cursor-pointer p-3 rounded-md border transition-all ${
                      selectedPaymentMethod === 'BALANCE'
                        ? 'bg-accent-mint/20 border-accent-mint'
                        : 'bg-darker-bg border-gray-700 hover:border-accent-mint/50'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="BALANCE"
                        checked={selectedPaymentMethod === 'BALANCE'}
                        onChange={() => setSelectedPaymentMethod('BALANCE')}
                        className="form-radio text-accent-mint h-5 w-5"
                      />
                      <div className="ml-3 flex-grow">
                        <div className="flex items-center gap-2">
                          <CreditCard size={18} className="text-accent-mint" />
                          <span className="text-white font-medium">Carte prépayée ADIIL</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">
                            Solde: <span className={balance >= totalPrice ? 'text-green-400' : 'text-red-400'}>{balance.toFixed(2)} €</span>
                          </span>
                        </div>
                      </div>
                    </label>
                    {selectedPaymentMethod === 'BALANCE' && balance < totalPrice && (
                      <div className="mt-2 p-3 bg-red-900/20 border border-red-500/50 rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-400">Solde insuffisant</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Il vous manque {(totalPrice - balance).toFixed(2)} € pour finaliser cet achat
                            </p>
                          </div>
                          <button
                            onClick={() => navigate('/balance')}
                            className="bg-accent-mint text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors text-sm whitespace-nowrap ml-3"
                          >
                            Recharger
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <label className={`flex items-center cursor-pointer p-3 rounded-md border transition-all ${
                  totalPrice < 0.50 ? 'opacity-50 cursor-not-allowed' :
                  selectedPaymentMethod === 'HELLOASSO'
                    ? 'bg-accent-mint/20 border-accent-mint'
                    : 'bg-darker-bg border-gray-700 hover:border-accent-mint/50'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="HELLOASSO"
                    checked={selectedPaymentMethod === 'HELLOASSO'}
                    onChange={() => setSelectedPaymentMethod('HELLOASSO')}
                    disabled={totalPrice < 0.50}
                    className="form-radio text-accent-mint h-5 w-5 disabled:opacity-50"
                  />
                  <div className="ml-3 flex-grow flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Heart size={18} className="text-accent-mint" />
                        <span className="text-white font-medium">HelloAsso</span>
                      </div>
                      {totalPrice < 0.50 && (
                        <span className="text-xs text-orange-400">Minimum 0.50€</span>
                      )}
                    </div>
                    {totalPrice >= 0.50 && (
                      <span className="bg-accent-mint text-darker-bg text-xs font-bold px-2 py-1 rounded">Recommandé</span>
                    )}
                  </div>
                </label>
                <label className={`flex items-center cursor-pointer p-3 rounded-md border transition-all ${
                  selectedPaymentMethod === 'PAYPAL'
                    ? 'bg-accent-mint/20 border-accent-mint'
                    : 'bg-darker-bg border-gray-700 hover:border-accent-mint/50'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="PAYPAL"
                    checked={selectedPaymentMethod === 'PAYPAL'}
                    onChange={() => setSelectedPaymentMethod('PAYPAL')}
                    className="form-radio text-accent-mint h-5 w-5"
                  />
                  <div className="ml-3 flex items-center gap-2">
                    <PayPalLogo className="w-5 h-5 text-accent-mint" />
                    <span className="text-white font-medium">PayPal</span>
                  </div>
                </label>
                <label className={`flex items-center cursor-pointer p-3 rounded-md border transition-all ${
                  selectedPaymentMethod === 'CASH_CB'
                    ? 'bg-accent-mint/20 border-accent-mint'
                    : 'bg-darker-bg border-gray-700 hover:border-accent-mint/50'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH_CB"
                    checked={selectedPaymentMethod === 'CASH_CB'}
                    onChange={() => setSelectedPaymentMethod('CASH_CB')}
                    className="form-radio text-accent-mint h-5 w-5"
                  />
                  <div className="ml-3 flex items-center gap-2">
                    <CashLogo className="w-5 h-5 text-accent-mint" />
                    <span className="text-white font-medium">Espèces/CB (sur place)</span>
                  </div>
                </label>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-accent-mint text-darker-bg font-bold py-3 px-6 rounded hover:bg-white transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent-mint"
                disabled={isProcessingOrder || items.length === 0 || !selectedPaymentMethod}
              >
                {isProcessingOrder ? 'Traitement...' : !selectedPaymentMethod ? 'Selectionnez un mode de paiement' : 'Passer la commande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
