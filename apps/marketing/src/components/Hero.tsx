'use client';

import Image from 'next/image';
import { urlFor } from '../../lib/sanity';

interface SanityImage {
  asset?: { url?: string };
  alt?: string;
}

interface HeroProps {
  hero: {
    headline: string;
    subheadline?: string;
    backgroundImage?: SanityImage;
    ctaButton?: {
      text: string;
      url: string;
    };
    features?: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
  };
}

export default function Hero({ hero }: HeroProps) {
  if (!hero) return null;

  return (
    <section className="relative bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      {hero.backgroundImage && (
        <div className="absolute inset-0 opacity-20">
          <Image
            src={urlFor(hero.backgroundImage).width(1920).height(1080).url()}
            alt="Hero background"
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="relative container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">{hero.headline}</h1>

          {hero.subheadline && (
            <p className="text-xl md:text-2xl mb-8 text-blue-100">{hero.subheadline}</p>
          )}

          {hero.ctaButton && (
            <a
              href={hero.ctaButton.url}
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
            >
              {hero.ctaButton.text}
            </a>
          )}

          {hero.features && hero.features.length > 0 && (
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              {hero.features.map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-blue-100">{feature.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
