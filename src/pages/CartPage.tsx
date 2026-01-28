import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, Heart, ArrowLeft, ChevronRight, Gift, Tag, Wallet, CheckCircle2, Banknote, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createOrder, type OrderItem as ApiOrderItem } from '../api/orders';
import { getMyBalance, purchaseWithBalance } from '../api/balance';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { checkBalanceRechargeBonus, checkCartDiscount, getActiveProductPromotions, type CartDiscountCheck, type ProductPromotionsMap } from '../api/promotions';
import LegalAcceptance from '../components/LegalAcceptance';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../types/errors';

const CartPage: React.FC = () => {
  useDocumentTitle('Panier');
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'PAYPAL' | 'HELLOASSO' | 'CASH_CB' | 'BALANCE' | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [maxBonusPercent, setMaxBonusPercent] = useState<number | null>(null);
  const [discountInfo, setDiscountInfo] = useState<CartDiscountCheck | null>(null);
  const [productPromotions, setProductPromotions] = useState<ProductPromotionsMap>({});
  const [legalAccepted, setLegalAccepted] = useState(false);

  // Calculate total with product promotions
  const totalWithProductPromotions = items.reduce((sum, item) => {
    let basePrice = item.product.price;
    // New format: selectedOptions
    if (item.selectedOptions && item.selectedOptions.length > 0) {
      const totalModifier = item.selectedOptions.reduce((acc, opt) => acc + (opt.priceModifier || 0), 0);
      basePrice += totalModifier;
    }
    // Legacy format: variantId
    else if (item.variantId && item.product.variants) {
      const variant = item.product.variants.find(v => v.id === item.variantId);
      if (variant) {
        basePrice += variant.priceModifier || 0;
      }
    }
    const promotion = productPromotions[parseInt(item.product.id)];
    const discountedPrice = promotion
      ? Math.round(basePrice * (1 - promotion.discountPercent / 100) * 100) / 100
      : basePrice;
    return sum + discountedPrice * item.quantity;
  }, 0);

  // Total savings from product promotions
  const productPromotionsSavings = totalPrice - totalWithProductPromotions;

  // Calculate final price with discount (cart discount applies on top of product promotions)
  const finalPrice = discountInfo?.eligible ? discountInfo.finalAmount : totalWithProductPromotions;

  // Compare balance with rounded values to avoid floating point precision issues
  const hasEnoughBalance = Math.round(balance * 100) >= Math.round(finalPrice * 100);

  // Auto-deselect HelloAsso if below minimum
  useEffect(() => {
    if (selectedPaymentMethod === 'HELLOASSO' && finalPrice < 0.50) {
      setSelectedPaymentMethod(null);
    }
  }, [finalPrice, selectedPaymentMethod]);

  // Fetch product promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const promotions = await getActiveProductPromotions();
        setProductPromotions(promotions || {});
      } catch (error) {
        logger.error('Error fetching product promotions', error);
        setProductPromotions({});
      }
    };
    fetchPromotions();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const [balanceData, bonusData] = await Promise.all([
            getMyBalance(),
            checkBalanceRechargeBonus(10) // Check for max bonus with reasonable amount
          ]);
          setBalance(balanceData.balance);
          if (bonusData.eligible) {
            // Get max bonus percent from tiers if available, otherwise use the direct value
            let bonusPercent = bonusData.bonusPercent;
            if (bonusData.tiers && bonusData.tiers.length > 0) {
              const maxFromTiers = Math.max(...bonusData.tiers.map(tier => tier.bonusPercent));
              bonusPercent = Math.max(bonusPercent || 0, maxFromTiers);
            }
            if (bonusPercent && bonusPercent > 0) {
              setMaxBonusPercent(bonusPercent);
            }
          }
        } catch (error) {
          logger.error('Error fetching balance data', error);
        }
      };
      fetchData();
    }
  }, [user]);

  // Check for cart discounts when total changes (use total after product promotions)
  useEffect(() => {
    if (user && totalWithProductPromotions > 0) {
      const checkDiscount = async () => {
        try {
          const discount = await checkCartDiscount(totalWithProductPromotions);
          setDiscountInfo(discount);
        } catch (error) {
          logger.error('Error checking discount', error);
          setDiscountInfo(null);
        }
      };
      checkDiscount();
    } else {
      setDiscountInfo(null);
    }
  }, [user, totalWithProductPromotions]);

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

    // Free order - use BALANCE if selected, otherwise FREE payment method
    if (totalPrice === 0) {
      // If user selected BALANCE, use balance method (will debit 0€)
      if (selectedPaymentMethod === 'BALANCE') {
        setIsProcessingOrder(true);
        try {
          await purchaseWithBalance({
            items: items.map(item => ({
              productId: parseInt(item.product.id),
              quantity: item.quantity,
              variantId: item.variantId,
              selectedOptions: item.selectedOptions,
            })),
            promotionId: discountInfo?.eligible ? discountInfo.promotionId : undefined,
          });

          addNotification('success', 'Commande confirmee via Solde ADIIL !');
          clearCart();
          navigate('/my-account');
        } catch (error) {
          addNotification('error', getErrorMessage(error));
        } finally {
          setIsProcessingOrder(false);
        }
        return;
      }

      // Otherwise use FREE payment method
      setIsProcessingOrder(true);
      try {
        const orderItems: ApiOrderItem[] = items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          variantId: item.variantId,
          selectedOptions: item.selectedOptions,
        }));

        const returnUrl = `${window.location.origin}/payment/callback`;
        const cancelUrl = `${window.location.origin}/cart`;

        await createOrder({
          items: orderItems,
          paymentMethod: 'FREE',
          returnUrl,
          cancelUrl,
          promotionId: discountInfo?.eligible ? discountInfo.promotionId : undefined,
        });

        addNotification('success', 'Commande confirmee !');
        clearCart();
        navigate('/my-account');
      } catch (error) {
        logger.error('Erreur lors de la commande', error);
        addNotification('error', getErrorMessage(error));
      } finally {
        setIsProcessingOrder(false);
      }
      return;
    }

    if (!selectedPaymentMethod) {
      addNotification('error', 'Veuillez sélectionner une méthode de paiement.');
      return;
    }

    if (selectedPaymentMethod === 'BALANCE') {
      // Use finalPrice (after discount) for balance check
      if (!hasEnoughBalance) {
        addNotification('error', 'Solde insuffisant. Rechargez votre solde ADIIL.');
        navigate('/balance');
        return;
      }

      setIsProcessingOrder(true);
      try {
        await purchaseWithBalance({
          items: items.map(item => ({
            productId: parseInt(item.product.id),
            quantity: item.quantity,
            variantId: item.variantId,
            selectedOptions: item.selectedOptions,
          })),
          promotionId: discountInfo?.eligible ? discountInfo.promotionId : undefined,
        });

        addNotification('success', 'Achat effectué avec succès ! Votre solde a été débité.');
        clearCart();
        navigate('/my-account');
      } catch (error) {
        addNotification('error', getErrorMessage(error));
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
        variantId: item.variantId,
        selectedOptions: item.selectedOptions,
      }));

      const returnUrl = `${window.location.origin}/payment/callback`;
      const cancelUrl = `${window.location.origin}/cart`;

      const orderData = await createOrder({
        items: orderItems,
        paymentMethod: selectedPaymentMethod,
        returnUrl,
        cancelUrl,
        promotionId: discountInfo?.eligible ? discountInfo.promotionId : undefined,
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

    } catch (error) {
      logger.error('Erreur lors de la commande', error);
      addNotification('error', getErrorMessage(error));
    } finally {
      setIsProcessingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header Section */}
      <section className="bg-darker-bg py-12 border-b border-gray-800 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-[300px] h-[300px] bg-accent-mint/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[200px] h-[200px] bg-blue-500/5 rounded-full blur-[80px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgba(119,241,190,0.5) 40px,
            rgba(119,241,190,0.5) 41px
          )`
        }} />

        <div className="container mx-auto px-4 relative z-10">
          <Link to="/shop" className="inline-flex items-center gap-2 text-gray-400 hover:text-accent-mint transition-colors mb-6 group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Retour a la boutique</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-1 h-12 bg-accent-mint rounded-full hidden sm:block" />
            <div>
              <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Panier</span>
              <h1 className="text-5xl md:text-6xl font-koulen text-white mt-1">VOTRE COMMANDE</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {items.length === 0 ? (
            <div className="text-center py-16 bg-darker-bg rounded-2xl border border-gray-800 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={28} className="text-gray-600" />
              </div>
              <p className="text-gray-400 text-lg mb-6">Votre panier est vide</p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-white transition-colors shadow-lg shadow-accent-mint/20"
              >
                Decouvrir la boutique
                <ChevronRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Cart items */}
                <div className="lg:col-span-3 space-y-3">
                  {items.map((cartItem) => {
                    // Calculate price based on variant type
                    let basePrice = cartItem.product.price;
                    let variantDisplay: string | null = null;

                    // New format: selectedOptions
                    if (cartItem.selectedOptions && cartItem.selectedOptions.length > 0) {
                      const totalModifier = cartItem.selectedOptions.reduce((acc, opt) => acc + (opt.priceModifier || 0), 0);
                      basePrice += totalModifier;
                      // Build display: "Taille: M, Couleur: Rouge"
                      variantDisplay = cartItem.selectedOptions.map(o => `${o.categoryName}: ${o.optionName}`).join(', ');
                    }
                    // Legacy format: variantId
                    else if (cartItem.variantId && cartItem.product.variants) {
                      const variant = cartItem.product.variants.find(v => v.id === cartItem.variantId);
                      if (variant) {
                        basePrice += variant.priceModifier || 0;
                        variantDisplay = variant.name;
                      }
                    }
                    const promotion = productPromotions[parseInt(cartItem.product.id)];
                    const discountedPrice = promotion
                      ? Math.round(basePrice * (1 - promotion.discountPercent / 100) * 100) / 100
                      : basePrice;
                    const hasPromotion = !!promotion;
                    // Generate unique key that accounts for selectedOptions
                    let cartItemKey = cartItem.product.id;
                    if (cartItem.selectedOptions && cartItem.selectedOptions.length > 0) {
                      cartItemKey += '-' + cartItem.selectedOptions.map(o => `${o.categoryId}:${o.optionId}`).join('-');
                    } else if (cartItem.variantId) {
                      cartItemKey += '-' + cartItem.variantId;
                    } else {
                      cartItemKey += '-no-variant';
                    }

                    return (
                      <div
                        key={cartItemKey}
                        className={`bg-darker-bg rounded-2xl border p-4 ${
                          hasPromotion ? 'border-red-500/30' : 'border-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Image */}
                          <div className="w-20 h-20 flex-shrink-0 bg-gray-800 rounded-xl overflow-hidden relative">
                            <img
                              src={cartItem.product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cartItem.product.name)}&background=1E1E1E&color=fff&size=200`}
                              alt={cartItem.product.name}
                              className="w-full h-full object-cover"
                            />
                            {hasPromotion && (
                              <div className="absolute top-1 left-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                                <Tag size={8} />
                                -{promotion.discountPercent}%
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-sm truncate">{cartItem.product.name}</h3>
                            {variantDisplay && (
                              <span className="text-accent-mint text-xs">{variantDisplay}</span>
                            )}
                            {hasPromotion ? (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-gray-500 line-through text-xs">{basePrice.toFixed(2)}€</span>
                                <span className="text-red-400 font-bold">{discountedPrice.toFixed(2)}€</span>
                              </div>
                            ) : (
                              <p className="text-accent-mint font-bold mt-1">{basePrice.toFixed(2)}€</p>
                            )}
                          </div>

                          {/* Quantity */}
                          <div className="flex items-center bg-dark-bg rounded-xl border border-gray-800">
                            <button
                              onClick={() => updateQuantity(cartItem.product.id, cartItem.quantity - 1, cartItem.variantId, cartItem.selectedOptions)}
                              disabled={cartItem.quantity <= 1}
                              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-accent-mint disabled:text-gray-700 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-white font-bold text-sm">{cartItem.quantity}</span>
                            <button
                              onClick={() => updateQuantity(cartItem.product.id, cartItem.quantity + 1, cartItem.variantId, cartItem.selectedOptions)}
                              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-accent-mint transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          {/* Total & Remove */}
                          <div className="text-right flex flex-col items-end gap-1">
                            {hasPromotion ? (
                              <>
                                <p className="text-gray-500 line-through text-xs">{(basePrice * cartItem.quantity).toFixed(2)}€</p>
                                <p className="font-bold text-red-400">{(discountedPrice * cartItem.quantity).toFixed(2)}€</p>
                              </>
                            ) : (
                              <p className="font-bold text-white">{(basePrice * cartItem.quantity).toFixed(2)}€</p>
                            )}
                            <button
                              onClick={() => removeFromCart(cartItem.product.id, cartItem.variantId, cartItem.selectedOptions)}
                              className="text-gray-500 hover:text-red-400 transition-colors p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order summary */}
                <div className="lg:col-span-2">
                  <div className="bg-darker-bg rounded-2xl border border-gray-800 overflow-hidden sticky top-24">
                    {/* Header */}
                    <div className="p-5 border-b border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-mint/10 rounded-xl flex items-center justify-center">
                          <Package size={18} className="text-accent-mint" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Recapitulatif</h2>
                      </div>
                    </div>

                    <div className="p-5">
                      {/* Items summary */}
                      <div className="space-y-2 mb-5">
                        {items.map((item) => {
                          // Calculate base price
                          let basePrice = item.product.price;
                          if (item.selectedOptions && item.selectedOptions.length > 0) {
                            const totalModifier = item.selectedOptions.reduce((acc, opt) => acc + (opt.priceModifier || 0), 0);
                            basePrice += totalModifier;
                          } else if (item.variantId && item.product.variants) {
                            const variant = item.product.variants.find(v => v.id === item.variantId);
                            if (variant) {
                              basePrice += variant.priceModifier || 0;
                            }
                          }
                          const promotion = productPromotions[parseInt(item.product.id)];
                          const discountedPrice = promotion
                            ? Math.round(basePrice * (1 - promotion.discountPercent / 100) * 100) / 100
                            : basePrice;
                          const hasPromotion = !!promotion;
                          // Generate unique key
                          let itemKey = item.product.id;
                          if (item.selectedOptions && item.selectedOptions.length > 0) {
                            itemKey += '-' + item.selectedOptions.map(o => `${o.categoryId}:${o.optionId}`).join('-');
                          } else if (item.variantId) {
                            itemKey += '-' + item.variantId;
                          }
                          return (
                            <div key={itemKey} className="flex justify-between text-sm">
                              <span className="text-gray-400 truncate max-w-[55%]">
                                {item.quantity}x {item.product.name}
                              </span>
                              {hasPromotion ? (
                                <span className="text-red-400 font-medium">{(discountedPrice * item.quantity).toFixed(2)}€</span>
                              ) : (
                                <span className="text-white font-medium">{(basePrice * item.quantity).toFixed(2)}€</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Discounts */}
                      {(productPromotionsSavings > 0 || discountInfo?.eligible) && (
                        <div className="space-y-2 mb-5 pt-4 border-t border-gray-800">
                          {productPromotionsSavings > 0 && (
                            <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                              <div className="flex items-center gap-2">
                                <Tag size={14} className="text-red-400" />
                                <span className="text-sm text-red-400">Promos produits</span>
                              </div>
                              <span className="text-red-400 font-bold">-{productPromotionsSavings.toFixed(2)}€</span>
                            </div>
                          )}
                          {discountInfo?.eligible && (
                            <div className="flex items-center justify-between p-3 bg-accent-mint/10 border border-accent-mint/20 rounded-xl">
                              <div className="flex items-center gap-2">
                                <Gift size={14} className="text-accent-mint" />
                                <span className="text-sm text-accent-mint">{discountInfo.promotionName}</span>
                              </div>
                              <span className="text-accent-mint font-bold">-{discountInfo.discountAmount.toFixed(2)}€</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Total */}
                      <div className="flex justify-between items-center py-4 border-t border-gray-800">
                        <span className="text-gray-400 font-medium">Total</span>
                        <span className="text-2xl font-koulen text-accent-mint">{finalPrice.toFixed(2)}€</span>
                      </div>

                      {/* Free order notice */}
                      {finalPrice === 0 && (
                        <div className="mb-5 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                          <p className="text-green-400 text-sm font-medium">Commande gratuite</p>
                        </div>
                      )}

                      {/* Payment methods */}
                      {finalPrice > 0 && (
                        <>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Mode de paiement</label>
                          <div className="grid grid-cols-2 gap-2 mb-5">
                            {/* Solde ADIIL */}
                            {user && (
                              <button
                                onClick={() => hasEnoughBalance && setSelectedPaymentMethod('BALANCE')}
                                disabled={!hasEnoughBalance}
                                className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                                  !hasEnoughBalance
                                    ? 'opacity-40 cursor-not-allowed border-gray-800 bg-dark-bg'
                                    : selectedPaymentMethod === 'BALANCE'
                                      ? 'border-accent-mint bg-accent-mint/10'
                                      : 'border-gray-800 bg-dark-bg hover:border-gray-700'
                                }`}
                              >
                                {selectedPaymentMethod === 'BALANCE' && hasEnoughBalance && (
                                  <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-accent-mint rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={10} className="text-darker-bg" />
                                  </div>
                                )}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                                  selectedPaymentMethod === 'BALANCE' && hasEnoughBalance ? 'bg-accent-mint' : 'bg-gray-800'
                                }`}>
                                  <Wallet size={14} className={selectedPaymentMethod === 'BALANCE' && hasEnoughBalance ? 'text-darker-bg' : 'text-gray-400'} />
                                </div>
                                <p className="font-bold text-white text-xs">Solde ADIIL</p>
                                <p className={`text-[10px] ${hasEnoughBalance ? 'text-green-400' : 'text-red-400'}`}>
                                  {balance.toFixed(2)}€
                                </p>
                              </button>
                            )}

                            {/* HelloAsso */}
                            <button
                              onClick={() => finalPrice >= 0.50 && setSelectedPaymentMethod('HELLOASSO')}
                              disabled={finalPrice < 0.50}
                              className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                                finalPrice < 0.50
                                  ? 'opacity-40 cursor-not-allowed border-gray-800 bg-dark-bg'
                                  : selectedPaymentMethod === 'HELLOASSO'
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-gray-800 bg-dark-bg hover:border-gray-700'
                              }`}
                            >
                              {selectedPaymentMethod === 'HELLOASSO' && finalPrice >= 0.50 && (
                                <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <CheckCircle2 size={10} className="text-white" />
                                </div>
                              )}
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                                selectedPaymentMethod === 'HELLOASSO' && finalPrice >= 0.50 ? 'bg-blue-500' : 'bg-gray-800'
                              }`}>
                                <Heart size={14} className={selectedPaymentMethod === 'HELLOASSO' && finalPrice >= 0.50 ? 'text-white' : 'text-gray-400'} />
                              </div>
                              <p className="font-bold text-white text-xs">HelloAsso</p>
                              <p className="text-[10px] text-blue-400">Recommande</p>
                            </button>

                            {/* PayPal */}
                            <button
                              onClick={() => setSelectedPaymentMethod('PAYPAL')}
                              className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                                selectedPaymentMethod === 'PAYPAL'
                                  ? 'border-indigo-500 bg-indigo-500/10'
                                  : 'border-gray-800 bg-dark-bg hover:border-gray-700'
                              }`}
                            >
                              {selectedPaymentMethod === 'PAYPAL' && (
                                <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                                  <CheckCircle2 size={10} className="text-white" />
                                </div>
                              )}
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                                selectedPaymentMethod === 'PAYPAL' ? 'bg-indigo-500' : 'bg-gray-800'
                              }`}>
                                <CreditCard size={14} className={selectedPaymentMethod === 'PAYPAL' ? 'text-white' : 'text-gray-400'} />
                              </div>
                              <p className="font-bold text-white text-xs">PayPal</p>
                              <p className="text-[10px] text-gray-500">Carte ou compte</p>
                            </button>

                            {/* Sur place */}
                            <button
                              onClick={() => setSelectedPaymentMethod('CASH_CB')}
                              className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                                selectedPaymentMethod === 'CASH_CB'
                                  ? 'border-green-500 bg-green-500/10'
                                  : 'border-gray-800 bg-dark-bg hover:border-gray-700'
                              }`}
                            >
                              {selectedPaymentMethod === 'CASH_CB' && (
                                <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                  <CheckCircle2 size={10} className="text-white" />
                                </div>
                              )}
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                                selectedPaymentMethod === 'CASH_CB' ? 'bg-green-500' : 'bg-gray-800'
                              }`}>
                                <Banknote size={14} className={selectedPaymentMethod === 'CASH_CB' ? 'text-white' : 'text-gray-400'} />
                              </div>
                              <p className="font-bold text-white text-xs">Sur place</p>
                              <p className="text-[10px] text-gray-500">Especes / CB</p>
                            </button>
                          </div>

                          {/* Recharge invite if balance too low */}
                          {user && !hasEnoughBalance && (
                            <div className="mb-5 p-3 bg-accent-mint/5 border border-accent-mint/20 rounded-xl">
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-400">Solde insuffisant</p>
                                <button
                                  onClick={() => navigate('/balance')}
                                  className="text-xs text-darker-bg font-bold py-1.5 px-3 rounded-lg transition-all flex items-center gap-1 bg-accent-mint hover:bg-white"
                                >
                                  Recharger
                                  {maxBonusPercent && (
                                    <>
                                      <span className="opacity-50">|</span>
                                      <Gift size={10} />
                                      +{maxBonusPercent}%
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Legal acceptance */}
                      <LegalAcceptance
                        accepted={legalAccepted}
                        onChange={setLegalAccepted}
                        className="mb-4"
                      />

                      {/* Checkout button */}
                      <button
                        onClick={handleCheckout}
                        disabled={isProcessingOrder || items.length === 0 || (finalPrice > 0 && !selectedPaymentMethod) || !legalAccepted}
                        className="w-full py-4 bg-accent-mint text-darker-bg font-bold rounded-xl hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-lg shadow-accent-mint/20 disabled:shadow-none"
                      >
                        {isProcessingOrder ? (
                          <div className="w-5 h-5 border-2 border-darker-bg border-t-transparent rounded-full animate-spin"></div>
                        ) : finalPrice === 0 ? (
                          <>
                            Confirmer la commande
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        ) : (
                          <>
                            Payer {finalPrice.toFixed(2)}€
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>

                      {!user && (
                        <p className="text-xs text-center mt-4 text-gray-500">
                          <Link to="/login" className="text-accent-mint hover:underline">Connectez-vous</Link> pour passer commande
                        </p>
                      )}
                    </div>
                  </div>
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
