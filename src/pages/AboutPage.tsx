import React from 'react';
import { Users, Mail, MapPin, Target, Code, Coffee, Gamepad2 } from 'lucide-react';
import SEO from '../components/SEO';

// TODO: Remplacer par les vraies données des membres
const teamMembers = [
  {
    name: "Lucas VAN-MESSEM",
    role: "Président",
    image: null, // TODO: Ajouter l'URL de la photo
    description: "Représente l'association et coordonne l'ensemble du bureau et des projets."
  },
  {
    name: "Ryad Bouk'hil",
    role: "Vice-Président",
    image: null, // TODO: Ajouter l'URL de la photo
    description: "Assiste le président et le remplace dans ses missions si besoin."
  },
  {
    name: "Maxence LISSONNET",
    role: "Trésorier",
    image: null,
    description: "Gère le budget, les comptes et les finances de l'association."
  },
  {
    name: "Matthias De Oliveira",
    role: "Vice-Trésorier",
    image: null,
    description: "Seconde le trésorier dans la gestion financière de l'association."
  },
  {
    name: "Alix CORBIN",
    role: "Responsable Communication",
    image: null,
    description: "Pilote la communication et l'image de l'association sur tous les canaux."
  },
  {
    name: "Sofiane Lachguer",
    role: "Vice-Responsable Communication",
    image: null,
    description: "Accompagne le responsable communication dans la création de contenus."
  },
  {
    name: "Mathéo Rousseau",
    role: "Vice-Secrétaire",
    image: null,
    description: "Aide à la rédaction des comptes-rendus et au suivi administratif."
  },
  {
    name: "Evan Hériault",
    role: "Membre Actif",
    image: null,
    description: "Participe activement aux projets et missions de l'association."
  },
  {
    name: "Macéo Morin",
    role: "Membre Actif",
    image: null,
    description: "Participe activement aux projets et missions de l'association."
  },
  {
    name: "Yannis Chevallier",
    role: "Membre Actif",
    image: null,
    description: "Participe activement aux projets et missions de l'association."
  },
  {
    name: "Antoine RIOUL",
    role: "Membre Actif",
    image: null,
    description: "Participe à la gestion de la boutique et au suivi des produits de l'association."
  },
  {
    name: "Dylan LEBOIS",
    role: "Membre Actif",
    image: null,
    description: "Participe à la gestion de la boutique et des stocks."
  },
  {
    name: "Tom GAUDIN",
    role: "Membre Actif",
    image: null,
    description: "Participe à l'organisation et à la coordination des évènements de l'association."
  },
  {
    name: "Marc FOUCHER",
    role: "Membre Actif",
    image: null,
    description: "Prépare les plats lors des évènements et contribue à la gestion de la boutique."
  }
];

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="A propos - L'equipe ADIIL"
        description="Decouvrez l'equipe de l'ADIIL, l'Association des Etudiants en Informatique de l'IUT de Laval. Bureau des Etudiants du Departement Informatique."
        keywords="equipe ADIIL, bureau BDE, IUT Laval, association etudiante, departement informatique, membres bureau"
        url="/about"
      />
      {/* Hero Section */}
      <section className="bg-darker-bg py-20 border-b border-gray-800 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 right-0 w-[500px] h-[500px] bg-accent-mint/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px]" />
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

        {/* Floating decorative code snippet */}
        <div className="absolute top-20 right-12 hidden xl:block opacity-15 font-mono text-xs text-accent-mint/60 animate-[float_8s_ease-in-out_infinite]">
          <div className="bg-darker-bg/80 backdrop-blur border border-accent-mint/20 rounded-lg p-3">
            <span className="text-purple-400">class</span> ADIIL {"{"}<br/>
            &nbsp;&nbsp;mission = <span className="text-amber-400">"fun"</span>;<br/>
            {"}"}
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-mint/10 border border-accent-mint/30 rounded-full mb-6">
              <Code size={14} className="text-accent-mint" />
              <span className="text-xs text-accent-mint font-medium">Bureau des Etudiants</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-koulen text-white mb-6">
              L'<span className="text-accent-mint">ADIIL</span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed font-montserrat">
              L'<span className="text-accent-mint font-bold">Association du Département Informatique de l'IUT de Laval</span> est
              le Bureau Des Étudiants (BDE) qui anime la vie étudiante du département informatique.
            </p>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }
        `}</style>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-dark-bg relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-accent-mint/3 rounded-full blur-[120px] -translate-y-1/2" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-darker-bg rounded-2xl p-8 border border-gray-800 hover:border-accent-mint/30 transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-accent-mint/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent-mint/20 transition-colors">
                <Target size={28} className="text-accent-mint" />
              </div>
              <h3 className="text-xl font-koulen text-white mb-3">NOTRE MISSION</h3>
              <p className="text-gray-400 font-montserrat">
                Dynamiser la vie étudiante, créer du lien entre les promotions et représenter les étudiants en informatique.
              </p>
            </div>

            <div className="bg-darker-bg rounded-2xl p-8 border border-gray-800 hover:border-accent-mint/30 transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-accent-mint/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent-mint/20 transition-colors">
                <Gamepad2 size={28} className="text-accent-mint" />
              </div>
              <h3 className="text-xl font-koulen text-white mb-3">NOS EVENTS</h3>
              <p className="text-gray-400 font-montserrat">
                Soirées d'intégration, tournois de jeux vidéo, sorties, repas... On organise des événements tout au long de l'année !
              </p>
            </div>

            <div className="bg-darker-bg rounded-2xl p-8 border border-gray-800 hover:border-accent-mint/30 transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-accent-mint/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent-mint/20 transition-colors">
                <Coffee size={28} className="text-accent-mint" />
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
            <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Bureau 2026-2027</span>
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
