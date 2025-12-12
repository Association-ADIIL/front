import React from 'react';

const CartPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-accent-mint mb-6">Votre Panier</h1>
      <div className="card p-8">
        {/* Placeholder for Cart Items */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between border-b border-gray-700 pb-4">
            <div className="flex items-center">
              <img src="https://via.placeholder.com/80?text=Product+1" alt="Product 1" className="w-16 h-16 object-cover rounded-md mr-4" />
              <div>
                <h3 className="text-xl font-bold">Produit 1</h3>
                <p className="text-gray-400">Quantité: 1</p>
              </div>
            </div>
            <p className="text-lg font-bold">25.00 €</p>
          </div>
          <div className="flex items-center justify-between border-b border-gray-700 pb-4">
            <div className="flex items-center">
              <img src="https://via.placeholder.com/80?text=Product+2" alt="Product 2" className="w-16 h-16 object-cover rounded-md mr-4" />
              <div>
                <h3 className="text-xl font-bold">Produit 2</h3>
                <p className="text-gray-400">Quantité: 2</p>
              </div>
            </div>
            <p className="text-lg font-bold">30.00 €</p>
          </div>
        </div>

        <div className="flex justify-end items-center mb-8">
          <p className="text-2xl font-bold mr-4">Total: 55.00 €</p>
          <button className="bg-accent-mint text-darker-bg font-bold py-3 px-6 rounded hover-scale-sm">Passer la commande</button>
        </div>

        <p className="text-center text-gray-500">Votre panier est vide pour l'instant.</p>
      </div>
    </div>
  );
};

export default CartPage;