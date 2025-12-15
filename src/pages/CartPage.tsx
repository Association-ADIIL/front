import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, Heart, ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createOrder, type OrderItem as ApiOrderItem } from '../api/orders';
import { getMyBalance, purchaseWithBalance } from '../api/balance';

const PayPalLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 0 1-.794.679H7.72a.483.483 0 0 1-.477-.558L9.28 7.13a.946.946 0 0 1 .933-.8h4.42c1.828 0 3.143.375 3.91 1.117.383.37.646.812.785 1.316z"/>
    <path d="M6.062 21.71a.668.668 0 0 1-.66-.758l2.157-13.687a.786.786 0 0 1 .774-.665h4.42c1.857 0 3.297.39 4.28 1.16.477.374.817.835 1.013 1.374l.01.027c.15.427.23.902.245 1.417-1.073 4.62-4.268 6.222-7.937 6.222h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.03.17a.804.804 0 0 1-.795.679H6.062z" opacity=".7"/>
  </svg>
);

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

      if (orderData.payment?.approvalUrl) {
        sessionStorage.setItem('paypal_order_id', orderData.order.id.toString());
        window.location.href = orderData.payment.approvalUrl;
      } else if (orderData.payment?.redirectUrl) {
        sessionStorage.setItem('helloasso_order_id', orderData.order.id.toString());
        window.location.href = orderData.payment.redirectUrl;
      } else {
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
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-darker-bg py-16 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <Link to="/shop" className="inline-flex items-center gap-2 text-gray-400 hover:text-accent-mint transition-colors mb-6">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Retour à la boutique</span>
          </Link>
          <div>
            <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Panier</span>
            <h1 className="text-5xl md:text-6xl font-koulen text-white mt-2">VOTRE COMMANDE</h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-dark-bg">
        <div className="container mx-auto px-4">
          {items.length === 0 ? (
            <div className="text-center py-20 bg-darker-bg rounded-2xl border border-gray-800 max-w-lg mx-auto">
              <ShoppingBag size={56} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-400 text-lg mb-6 font-montserrat">Votre panier est vide</p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-white transition-colors"
              >
                <ShoppingBag size={18} />
                Découvrir la boutique
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((cartItem) => {
                  const variant = cartItem.product.variants?.find(v => v.id === cartItem.variantId);
                  const itemPrice = cartItem.product.price + (variant?.priceModifier || 0);
                  const cartItemKey = `${cartItem.product.id}-${cartItem.variantId || 'no-variant'}`;

                  return (
                    <div
                      key={cartItemKey}
                      className="bg-darker-bg rounded-2xl border border-gray-800 p-4 flex items-center gap-4"
                    >
                      {/* Image */}
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-800 rounded-xl overflow-hidden">
                        <img
                          src={cartItem.product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cartItem.product.name)}&background=1E1E1E&color=fff&size=200`}
                          alt={cartItem.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate">
                          {cartItem.product.name}
                        </h3>
                        {variant && (
                          <span className="text-accent-mint text-sm">{variant.name}</span>
                        )}
                        <p className="text-accent-mint font-koulen text-lg mt-1">
                          {itemPrice.toFixed(2)}€
                        </p>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center bg-dark-bg rounded-lg border border-gray-700">
                        <button
                          onClick={() => handleUpdateQuantity(cartItem.product.id, cartItem.quantity - 1, cartItem.variantId)}
                          disabled={cartItem.quantity <= 1}
                          className="w-10 h-10 flex items-center justify-center text-accent-mint hover:bg-accent-mint/10 rounded-l-lg disabled:text-gray-600 transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center text-white font-bold">{cartItem.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(cartItem.product.id, cartItem.quantity + 1, cartItem.variantId)}
                          className="w-10 h-10 flex items-center justify-center text-accent-mint hover:bg-accent-mint/10 rounded-r-lg transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {/* Total & Remove */}
                      <div className="text-right">
                        <p className="font-bold text-white text-lg">{(itemPrice * cartItem.quantity).toFixed(2)}€</p>
                        <button
                          onClick={() => handleRemoveItem(cartItem.product.id, cartItem.variantId)}
                          className="text-red-400 hover:text-red-300 transition-colors mt-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order summary */}
              <div className="lg:col-span-1">
                <div className="bg-darker-bg rounded-2xl border border-gray-800 p-6 sticky top-24">
                  <h2 className="text-xl font-koulen text-white mb-6">RECAPITULATIF</h2>

                  {/* Items summary */}
                  <div className="space-y-3 mb-6">
                    {items.map((item) => {
                      const variant = item.product.variants?.find(v => v.id === item.variantId);
                      const price = item.product.price + (variant?.priceModifier || 0);
                      return (
                        <div key={`${item.product.id}-${item.variantId}`} className="flex justify-between text-sm">
                          <span className="text-gray-400 truncate max-w-[60%]">
                            {item.quantity}x {item.product.name}
                          </span>
                          <span className="text-white font-medium">{(price * item.quantity).toFixed(2)}€</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-gray-800 pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total</span>
                      <span className="text-3xl font-koulen text-accent-mint">{totalPrice.toFixed(2)}€</span>
                    </div>
                  </div>

                  {/* Payment methods */}
                  <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Paiement</h3>
                  <div className="space-y-2 mb-6">
                    {user && (
                      <>
                        {balance > 0 && balance < totalPrice ? (
                          /* Balance too low - grayed out with recharge invite */
                          <div className="p-3 rounded-xl border border-gray-700 bg-dark-bg">
                            <div className="flex items-center opacity-50">
                              <CreditCard size={18} className="text-gray-500" />
                              <div className="ml-3 flex-1">
                                <span className="text-gray-400 text-sm font-medium">Carte ADIIL</span>
                                <span className="text-xs ml-2 text-red-400">
                                  ({balance.toFixed(2)}EUR)
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between bg-accent-mint/10 rounded-lg p-2">
                              <p className="text-xs text-gray-400">
                                Solde insuffisant
                              </p>
                              <button
                                onClick={() => navigate('/balance')}
                                className="text-xs bg-accent-mint text-darker-bg font-bold py-1.5 px-3 rounded-lg hover:bg-white transition-colors"
                              >
                                Recharger
                              </button>
                            </div>
                          </div>
                        ) : balance >= totalPrice ? (
                          /* Balance sufficient - clickable */
                          <label className={`flex items-center cursor-pointer p-3 rounded-xl border transition-all ${
                            selectedPaymentMethod === 'BALANCE'
                              ? 'bg-accent-mint/10 border-accent-mint'
                              : 'bg-dark-bg border-gray-700 hover:border-gray-600'
                          }`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="BALANCE"
                              checked={selectedPaymentMethod === 'BALANCE'}
                              onChange={() => setSelectedPaymentMethod('BALANCE')}
                              className="sr-only"
                            />
                            <CreditCard size={18} className={selectedPaymentMethod === 'BALANCE' ? 'text-accent-mint' : 'text-gray-500'} />
                            <div className="ml-3 flex-1">
                              <span className="text-white text-sm font-medium">Carte ADIIL</span>
                              <span className="text-xs ml-2 text-green-400">
                                ({balance.toFixed(2)}EUR)
                              </span>
                            </div>
                            {selectedPaymentMethod === 'BALANCE' && (
                              <div className="w-2 h-2 bg-accent-mint rounded-full"></div>
                            )}
                          </label>
                        ) : null}
                      </>
                    )}

                    <label className={`flex items-center cursor-pointer p-3 rounded-xl border transition-all ${
                      totalPrice < 0.50 ? 'opacity-50 cursor-not-allowed' :
                      selectedPaymentMethod === 'HELLOASSO'
                        ? 'bg-blue-500/10 border-blue-500'
                        : 'bg-dark-bg border-gray-700 hover:border-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="HELLOASSO"
                        checked={selectedPaymentMethod === 'HELLOASSO'}
                        onChange={() => setSelectedPaymentMethod('HELLOASSO')}
                        disabled={totalPrice < 0.50}
                        className="sr-only"
                      />
                      <Heart size={18} className={selectedPaymentMethod === 'HELLOASSO' ? 'text-blue-400' : 'text-gray-500'} />
                      <span className="ml-3 text-white text-sm font-medium flex-1">HelloAsso</span>
                      {totalPrice < 0.50 ? (
                        <span className="text-xs text-orange-400">Min 0.50EUR</span>
                      ) : (
                        <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">Recommandé</span>
                      )}
                      {selectedPaymentMethod === 'HELLOASSO' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                      )}
                    </label>

                    <label className={`flex items-center cursor-pointer p-3 rounded-xl border transition-all ${
                      selectedPaymentMethod === 'PAYPAL'
                        ? 'bg-indigo-500/10 border-indigo-500'
                        : 'bg-dark-bg border-gray-700 hover:border-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="PAYPAL"
                        checked={selectedPaymentMethod === 'PAYPAL'}
                        onChange={() => setSelectedPaymentMethod('PAYPAL')}
                        className="sr-only"
                      />
                      <PayPalLogo className={`w-5 h-5 ${selectedPaymentMethod === 'PAYPAL' ? 'text-indigo-400' : 'text-gray-500'}`} />
                      <span className="ml-3 text-white text-sm font-medium flex-1">PayPal</span>
                      {selectedPaymentMethod === 'PAYPAL' && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      )}
                    </label>

                    <label className={`flex items-center cursor-pointer p-3 rounded-xl border transition-all ${
                      selectedPaymentMethod === 'CASH_CB'
                        ? 'bg-green-500/10 border-green-500'
                        : 'bg-dark-bg border-gray-700 hover:border-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CASH_CB"
                        checked={selectedPaymentMethod === 'CASH_CB'}
                        onChange={() => setSelectedPaymentMethod('CASH_CB')}
                        className="sr-only"
                      />
                      <CashLogo className={`w-5 h-5 ${selectedPaymentMethod === 'CASH_CB' ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className="ml-3 text-white text-sm font-medium flex-1">Sur place</span>
                      {selectedPaymentMethod === 'CASH_CB' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </label>
                  </div>

                  {/* Checkout button */}
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessingOrder || items.length === 0 || !selectedPaymentMethod}
                    className="w-full py-4 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent-mint flex items-center justify-center gap-2 group"
                  >
                    {isProcessingOrder ? (
                      <div className="w-5 h-5 border-2 border-darker-bg border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Payer {totalPrice.toFixed(2)}€
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  {!user && (
                    <p className="text-xs text-center mt-4 text-gray-500 font-montserrat">
                      <Link to="/login" className="text-accent-mint hover:underline">Connectez-vous</Link> pour passer commande
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CartPage;
