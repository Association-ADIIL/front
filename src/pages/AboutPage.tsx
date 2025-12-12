import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-accent-mint mb-6">À Propos de l'ADIIL</h1>
      <p className="text-lg mb-4">
        L'Association des Informaticiens de l'IUT de Laval (ADIIL) est le Bureau Des Étudiants (BDE) du département informatique.
        Notre mission est de dynamiser la vie étudiante, d'organiser des événements mémorables et de créer une communauté soudée parmi les étudiants en informatique.
      </p>
      <h2 className="text-3xl font-bold text-accent-mint mb-4 mt-8">Nos Membres</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for a member */}
        <div className="card p-6 text-center">
          <img src="https://via.placeholder.com/150?text=Membre+1" alt="Membre 1" className="rounded-full w-32 h-32 object-cover mx-auto mb-4" />
          <h3 className="text-xl font-bold">Nom du Membre 1</h3>
          <p className="text-gray-400">Rôle (Président, Trésorier, etc.)</p>
        </div>
        <div className="card p-6 text-center">
          <img src="https://via.placeholder.com/150?text=Membre+2" alt="Membre 2" className="rounded-full w-32 h-32 object-cover mx-auto mb-4" />
          <h3 className="text-xl font-bold">Nom du Membre 2</h3>
          <p className="text-gray-400">Rôle</p>
        </div>
        <div className="card p-6 text-center">
          <img src="https://via.placeholder.com/150?text=Membre+3" alt="Membre 3" className="rounded-full w-32 h-32 object-cover mx-auto mb-4" />
          <h3 className="text-xl font-bold">Nom du Membre 3</h3>
          <p className="text-gray-400">Rôle</p>
        </div>
      </div>
      <h2 className="text-3xl font-bold text-accent-mint mb-4 mt-8">Contact</h2>
      <p className="text-lg">
        Vous pouvez nous contacter à l'adresse email suivante : <a href="mailto:contact@adiil.fr" className="text-accent-mint hover:underline">contact@adiil.fr</a>
      </p>
    </div>
  );
};

export default AboutPage;