'use client';

import Image from 'next/image';
import { urlFor } from '../../lib/sanity';

interface SanityImage {
  asset?: { url?: string };
  alt?: string;
}

interface FeatureProps {
  features: Array<{
    title: string;
    description: string;
    icon?: string;
    image?: SanityImage;
    benefits?: string[];
  }>;
}

export default function Features({ features }: FeatureProps) {
  if (!features || features.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-8"
            >
              {feature.image ? (
                <div className="mb-6">
                  <Image
                    src={urlFor(feature.image).width(400).height(200).url()}
                    alt={feature.title}
                    width={400}
                    height={200}
                    className="rounded-lg object-cover"
                  />
                </div>
              ) : (
                feature.icon && <div className="text-4xl mb-6">{feature.icon}</div>
              )}

              <h3 className="text-xl font-semibold mb-4 text-gray-900">{feature.title}</h3>

              <p className="text-gray-600 mb-6">{feature.description}</p>

              {feature.benefits && feature.benefits.length > 0 && (
                <ul className="space-y-2">
                  {feature.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mr-2 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        role="img"
                        aria-label="Check mark"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
