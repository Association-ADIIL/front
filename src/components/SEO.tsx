import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  url?: string;
  type?: string;
}

const BASE_TITLE = 'ADIIL - Association Etudiante | IUT de Laval';
const BASE_DESCRIPTION = "ADIIL, l'Association Des Etudiants en Informatique de l'IUT de Laval. Evenements, boutique et vie etudiante du Departement Informatique.";
const BASE_KEYWORDS = 'ADIIL, IUT de Laval, Association Etudiante, Departement Informatique, Bureau des Etudiants, BDE Laval, IUT Informatique Laval';
const BASE_URL = 'https://adiil.fr';

export default function SEO({
  title,
  description = BASE_DESCRIPTION,
  keywords = BASE_KEYWORDS,
  url = '',
  type = 'website'
}: SEOProps) {
  const fullTitle = title ? `${title} | ADIIL` : BASE_TITLE;
  const fullUrl = `${BASE_URL}${url}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
