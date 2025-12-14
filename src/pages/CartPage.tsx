import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { MinusCircle, PlusCircle, Trash2, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createOrder, type OrderItem as ApiOrderItem } from '../api/orders';

const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'PAYPAL' | 'HELLOASSO' | 'CASH_CB' | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
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

    setIsProcessingOrder(true);
    try {
      const orderItems: ApiOrderItem[] = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const returnUrl = `${window.location.origin}/payment/callback`; // Generic callback
      const cancelUrl = `${window.location.origin}/cart`;

      const orderData = await createOrder({
        items: orderItems,
        paymentMethod: selectedPaymentMethod,
        returnUrl,
        cancelUrl,
      });

      if (orderData.payment?.approvalUrl) { // PayPal
        sessionStorage.setItem('paypal_order_id', orderData.order.id.toString()); // Our DB order ID
        window.location.href = orderData.payment.approvalUrl;
      } else if (orderData.payment?.redirectUrl) { // HelloAsso
        sessionStorage.setItem('helloasso_order_id', orderData.order.id.toString());
        window.location.href = orderData.payment.redirectUrl;
      } else {
        // Cash or Free order, or payment already processed (totalPrice 0)
        addNotification('success', orderData.message || 'Commande passée avec succès !');
        clearCart();
        navigate('/my-account'); // Redirect to user's orders
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
              {items.map((cartItem) => (
                <div key={cartItem.product.id} className="flex items-center justify-between border-b border-gray-700 pb-4 mb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center flex-grow">
                    <img
                      src={cartItem.product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cartItem.product.name)}&background=1E1E1E&color=fff&size=200`}
                      alt={cartItem.product.name}
                      className="w-20 h-20 object-cover rounded-md mr-4"
                    />
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold text-white">{cartItem.product.name}</h3>
                      <p className="text-gray-400 text-sm">{cartItem.product.description?.substring(0, 50)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border border-gray-600 rounded-md">
                      <button
                        onClick={() => handleUpdateQuantity(cartItem.product.id, cartItem.quantity - 1)}
                        className="p-2 text-accent-mint hover:text-white disabled:text-gray-600"
                        disabled={cartItem.quantity <= 1}
                      >
                        <MinusCircle size={20} />
                      </button>
                      <span className="px-3 text-lg font-bold">{cartItem.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(cartItem.product.id, cartItem.quantity + 1)}
                        className="p-2 text-accent-mint hover:text-white"
                      >
                        <PlusCircle size={20} />
                      </button>
                    </div>
                    <p className="text-lg font-bold w-24 text-right">{(cartItem.product.price * cartItem.quantity).toFixed(2)} €</p>
                    <button
                      onClick={() => handleRemoveItem(cartItem.product.id)}
                      className="text-red-500 hover:text-red-700 ml-4"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
              ))}
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
                <label className="flex items-center cursor-pointer bg-darker-bg p-3 rounded-md border border-gray-700 hover:border-accent-mint/50 transition-all">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="HELLOASSO"
                    checked={selectedPaymentMethod === 'HELLOASSO'}
                    onChange={() => setSelectedPaymentMethod('HELLOASSO')}
                    className="form-radio text-accent-mint h-5 w-5"
                  />
                  <div className="ml-3 flex-grow flex justify-between items-center">
                      <span className="text-white font-medium">HelloAsso</span>
                      <span className="bg-accent-mint text-darker-bg text-xs font-bold px-2 py-1 rounded">Recommandé</span>
                  </div>
                </label>
                <label className="flex items-center cursor-pointer bg-darker-bg p-3 rounded-md border border-gray-700 hover:border-accent-mint/50 transition-all">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="PAYPAL"
                    checked={selectedPaymentMethod === 'PAYPAL'}
                    onChange={() => setSelectedPaymentMethod('PAYPAL')}
                    className="form-radio text-accent-mint h-5 w-5"
                  />
                  <span className="ml-3 text-white font-medium">PayPal</span>
                </label>
                <label className="flex items-center cursor-pointer bg-darker-bg p-3 rounded-md border border-gray-700 hover:border-accent-mint/50 transition-all">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH_CB"
                    checked={selectedPaymentMethod === 'CASH_CB'}
                    onChange={() => setSelectedPaymentMethod('CASH_CB')}
                    className="form-radio text-accent-mint h-5 w-5"
                  />
                  <span className="ml-3 text-white font-medium">Espèces/CB (sur place)</span>
                </label>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-accent-mint text-darker-bg font-bold py-3 px-6 rounded hover:bg-white transition-colors text-lg"
                disabled={isProcessingOrder || items.length === 0 || !selectedPaymentMethod}
              >
                {isProcessingOrder ? 'Traitement...' : 'Passer la commande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
