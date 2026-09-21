import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { type Filiere } from '../api/auth';
import { Mail, Lock, User, Users, UserPlus, ArrowRight, GraduationCap } from 'lucide-react';
import SEO from '../components/SEO';

const ACCOUNT_TYPES = [
  { value: 'STUDENT', label: 'Etudiant', icon: GraduationCap },
  { value: 'PROFESSOR', label: 'Professeur', icon: User },
  { value: 'EXTERNAL', label: 'Externe', icon: Users },
];

const FILIERE_OPTIONS: { value: Filiere; label: string }[] = [
  { value: 'INFO', label: 'INFO' },
  { value: 'MMI', label: 'MMI' },
  { value: 'TC', label: 'TC' },
  { value: 'BIO', label: 'BIO' },
  { value: 'AUTRES', label: 'Autre' },
];

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    type: 'STUDENT'
  });
  const [filiere, setFiliere] = useState<Filiere | ''>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (formData.firstName.trim().toLowerCase() === formData.lastName.trim().toLowerCase()) {
      setError("Le prénom et le nom ne peuvent pas être identiques.");
      return;
    }

    if (!filiere) {
      setError("Merci de sélectionner votre filière.");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        type: formData.type,
        filiere,
      });
    } catch (err: any) {
      if (err.code === 'EMAIL_EXISTS' || err.message?.includes('existe déjà')) {
        setError('EMAIL_EXISTS');
      } else {
        setError(err.message || 'Echec de l\'inscription.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 py-12">
      <SEO
        title="Inscription"
        description="Creez votre compte ADIIL pour acceder aux evenements, a la boutique et rejoindre la communaute etudiante de l'IUT de Laval."
        url="/register"
      />
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-4xl font-koulen text-accent-mint">ADIIL</span>
          </Link>
          <h1 className="text-2xl font-koulen text-white mt-4">INSCRIPTION</h1>
          <p className="text-gray-500 mt-2 font-montserrat text-sm">
            Creez votre compte pour rejoindre la communaute
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-darker-bg rounded-2xl border border-gray-800 p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                  Nom
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-dark-bg border border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-accent-mint transition-colors"
                    placeholder="Nom"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                  Prenom
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full bg-dark-bg border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-accent-mint transition-colors"
                  placeholder="Prenom"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-dark-bg border border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-accent-mint transition-colors"
                  placeholder="votre.email@etu.univ-lemans.fr"
                  required
                />
              </div>
            </div>

            {/* Password fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-dark-bg border border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-accent-mint transition-colors"
                    placeholder="********"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                  Confirmer
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-dark-bg border border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-accent-mint transition-colors"
                    placeholder="********"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Account type */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                Type de compte
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ACCOUNT_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: value }))}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                      formData.type === value
                        ? 'bg-accent-mint/10 border-accent-mint text-accent-mint'
                        : 'bg-dark-bg border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filière */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                Filière
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FILIERE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFiliere(value)}
                    className={`p-3 rounded-xl border transition-all text-sm font-semibold ${
                      filiere === value
                        ? 'bg-accent-mint/10 border-accent-mint text-accent-mint'
                        : 'bg-dark-bg border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Legal notice */}
            <p className="text-xs text-gray-500 text-center mt-4">
              En vous inscrivant, vous acceptez les{' '}
              <Link to="/cgu" target="_blank" className="text-accent-mint hover:underline">
                CGU
              </Link>,{' '}
              les{' '}
              <Link to="/cgv" target="_blank" className="text-accent-mint hover:underline">
                CGV
              </Link>{' '}
              et la{' '}
              <Link to="/confidentialite" target="_blank" className="text-accent-mint hover:underline">
                Politique de Confidentialité
              </Link>.
            </p>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                {error === 'EMAIL_EXISTS' ? (
                  <p className="text-red-400 text-sm text-center font-montserrat">
                    Un compte existe déjà avec cette adresse email.{' '}
                    <Link to="/login" className="text-accent-mint font-bold hover:underline">
                      Se connecter
                    </Link>
                    {' '}ou{' '}
                    <Link to="/forgot-password" className="text-accent-mint font-bold hover:underline">
                      mot de passe oublié ?
                    </Link>
                  </p>
                ) : (
                  <p className="text-red-400 text-sm text-center font-montserrat">{error}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent-mint text-darker-bg font-bold py-4 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-darker-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={20} />
                  S'inscrire
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-center text-gray-500 font-montserrat">
              Deja un compte ?{' '}
              <Link to="/login" className="text-accent-mint font-bold hover:text-white transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-600 hover:text-gray-400 transition-colors text-sm font-montserrat">
            Retour a l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;