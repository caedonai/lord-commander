'use client';

import { useState } from 'react';

interface FAQProps {
  faqs: Array<{
    question: string;
    answer: string;
    category?: string;
  }>;
}

export default function FAQ({ faqs }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Group FAQs by category if available
  const groupedFAQs = faqs.reduce(
    (acc, faq, index) => {
      const category = faq.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({ ...faq, originalIndex: index });
      return acc;
    },
    {} as Record<string, Array<(typeof faqs)[0] & { originalIndex: number }>>
  );

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Find answers to common questions about our product and services.
          </p>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
            <div key={category}>
              {Object.keys(groupedFAQs).length > 1 && (
                <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
                  {category}
                </h3>
              )}

              <div className="space-y-4">
                {categoryFAQs.map((faq) => (
                  <div
                    key={faq.originalIndex}
                    className="bg-white rounded-lg shadow-sm border border-gray-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFAQ(faq.originalIndex)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                      <svg
                        className={`w-5 h-5 text-gray-500 transform transition-transform ${
                          openIndex === faq.originalIndex ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        role="img"
                        aria-label="Expand/collapse icon"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {openIndex === faq.originalIndex && (
                      <div className="px-6 pb-4">
                        <div className="text-gray-700 leading-relaxed">
                          {faq.answer.split('\n').map((paragraph, pIndex) => (
                            <p
                              key={`paragraph-${faq.originalIndex}-${pIndex}`}
                              className={pIndex > 0 ? 'mt-4' : ''}
                            >
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
