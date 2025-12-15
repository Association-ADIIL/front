import React from 'react';
import { Users, Mail, MapPin, Heart, Target, Sparkles } from 'lucide-react';

// TODO: Remplacer par les vraies données des membres
const teamMembers = [
  {
    name: "Sami HAJADI",
    role: "Président",
    image: null, // TODO: Ajouter l'URL de la photo
    description: "Description courte du rôle"
  },
  {
    name: "Arthur PAILLEREAU",
    role: "Trésorier",
    image: null,
    description: "Description courte du rôle"
  },
  {
    name: "Alix CORBIN",
    role: "Trésorier",
    image: null,
    description: "Description courte du rôle"
  },
  {
    name: "Lucas VAN-MESSEM",
    role: "Secrétaire",
    image: null,
    description: "Description courte du rôle"
  },
  {
    name: "Maxence LISSONNET",
    role: "Boutique",
    image: null,
    description: "Description courte du rôle"
  },
  {
    name: "Barnabé HAVARD",
    role: "Resp. Boutique",
    image: null,
    description: "Description courte du rôle"
  },
  {
    name: "Julien DAUVERGNE",
    role: "Boutique & Finances",
    image: null,
    description: "Description courte du rôle"
  },
  {
    name: "Mathis LE-NÔTRE",
    role: "Cuisinier",
    image: null,
    description: "Description courte du rôle"
  },
  {
    name: "Antoine RIOUL",
    role: "Boutique",
    image: null,
    description: "Description courte du rôle"
  },
  {
    name: "Dylan LEBOIS",
    role: "Boutique",
    image: null,
    description: "Description courte du rôle"
  },
  {
    name: "Tom GAUDIN",
    role: "Évènements",
    image: null,
    description: "Description courte du rôle"
  },
  {
    name: "Marc FOUCHER",
    role: "Cuisinier & Boutique",
    image: null,
    description: "Description courte du rôle"
  }
];

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-darker-bg py-20 border-b border-gray-800 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-accent-mint/5 to-transparent"></div>
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-accent-mint/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Qui sommes-nous ?</span>
            <h1 className="text-5xl md:text-7xl font-koulen text-white mt-2 mb-6">L'ADIIL</h1>
            <p className="text-xl text-gray-300 leading-relaxed font-montserrat">
              L'<span className="text-accent-mint font-bold">Association du Département Informatique de l'IUT de Laval</span> est
              le Bureau Des Étudiants (BDE) qui anime la vie étudiante du département informatique.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-dark-bg">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-darker-bg rounded-2xl p-8 border border-gray-800 hover:border-accent-mint/30 transition-colors">
              <div className="w-14 h-14 bg-accent-mint/10 rounded-xl flex items-center justify-center mb-6">
                <Target size={28} className="text-accent-mint" />
              </div>
              <h3 className="text-xl font-koulen text-white mb-3">NOTRE MISSION</h3>
              <p className="text-gray-400 font-montserrat">
                Dynamiser la vie étudiante, créer du lien entre les promotions et représenter les étudiants en informatique.
              </p>
            </div>

            <div className="bg-darker-bg rounded-2xl p-8 border border-gray-800 hover:border-accent-mint/30 transition-colors">
              <div className="w-14 h-14 bg-accent-mint/10 rounded-xl flex items-center justify-center mb-6">
                <Sparkles size={28} className="text-accent-mint" />
              </div>
              <h3 className="text-xl font-koulen text-white mb-3">NOS EVENTS</h3>
              <p className="text-gray-400 font-montserrat">
                Soirées d'intégration, tournois de jeux vidéo, sorties, repas... On organise des événements tout au long de l'année !
              </p>
            </div>

            <div className="bg-darker-bg rounded-2xl p-8 border border-gray-800 hover:border-accent-mint/30 transition-colors">
              <div className="w-14 h-14 bg-accent-mint/10 rounded-xl flex items-center justify-center mb-6">
                <Heart size={28} className="text-accent-mint" />
              </div>
              <h3 className="text-xl font-koulen text-white mb-3">POUR VOUS</h3>
              <p className="text-gray-400 font-montserrat">
                Snacks, boissons, goodies... La boutique est là pour vous faciliter la vie entre deux cours !
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-darker-bg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Bureau 2025-2026</span>
            <h2 className="text-4xl md:text-5xl font-koulen text-white mt-2">L'EQUIPE</h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto font-montserrat">
              Les membres du bureau qui font vivre l'association au quotidien.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-dark-bg rounded-2xl border border-gray-800 overflow-hidden hover:border-accent-mint/30 transition-all duration-300 group"
              >
                {/* Photo */}
                <div className="aspect-square bg-gray-800 relative overflow-hidden">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users size={64} className="text-gray-700" />
                    </div>
                  )}
                  {/* Role badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className="px-3 py-1 bg-accent-mint text-darker-bg text-xs font-bold rounded-full">
                      {member.role}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-white text-lg">{member.name}</h3>
                  <p className="text-gray-500 text-sm font-montserrat">{member.description}</p>
                </div>
              </div>
            ))}
          </div>

        {/*  /!* TODO notice *!/*/}
        {/*  <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl max-w-2xl mx-auto">*/}
        {/*    <p className="text-orange-400 text-sm text-center font-montserrat">*/}
        {/*      <strong>Note :</strong> Les informations des membres sont à compléter dans le fichier AboutPage.tsx*/}
        {/*    </p>*/}
        {/*  </div>*/}

        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-dark-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Contact</span>
            <h2 className="text-4xl md:text-5xl font-koulen text-white mt-2 mb-8">NOUS CONTACTER</h2>

            <div className="space-y-4">
              <a
                href="mailto:association.adiil@gmail.com"
                className="flex items-center justify-center gap-3 p-4 bg-darker-bg rounded-xl border border-gray-800 hover:border-accent-mint/50 transition-colors group"
              >
                <Mail size={24} className="text-accent-mint" />
                <span className="text-white font-medium group-hover:text-accent-mint transition-colors font-montserrat">
                  association.adiil@gmail.com
                </span>
              </a>

              <div className="flex items-center justify-center gap-3 p-4 bg-darker-bg rounded-xl border border-gray-800">
                <MapPin size={24} className="text-accent-mint" />
                <span className="text-gray-400 font-montserrat">
                  IUT de Laval - Département Informatique
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
