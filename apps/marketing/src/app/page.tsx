// import { Hero, Features, Testimonials, FAQ, BlogList } from '../components'
// import { sanityClient, queries } from '../lib/sanity'

// Temporary mock data until Sanity client is properly configured
const mockHero = {
  headline: 'Welcome to Lord Commander',
  subheadline: 'The modern CLI SDK framework for building powerful command-line tools',
  ctaButton: {
    text: 'Get Started',
    url: '/docs',
  },
  features: [
    {
      title: 'Type-Safe',
      description: 'Built with TypeScript for better developer experience',
      icon: '🛡️',
    },
    {
      title: 'Modular',
      description: 'Composable architecture for maximum flexibility',
      icon: '🧩',
    },
    {
      title: 'Fast',
      description: 'Optimized for performance and developer productivity',
      icon: '⚡',
    },
  ],
};

const mockFeatures = [
  {
    title: 'Command Composition',
    description: 'Build complex CLI tools with simple, reusable commands',
    icon: '⚙️',
    benefits: ['Modular design', 'Easy testing', 'Reusable components'],
  },
  {
    title: 'Auto-completion',
    description: 'Built-in shell completion for better user experience',
    icon: '✨',
    benefits: ['Bash support', 'Zsh support', 'Fish support'],
  },
  {
    title: 'Rich Output',
    description: 'Beautiful terminal output with colors, spinners, and progress bars',
    icon: '🎨',
    benefits: ['Colored output', 'Progress indicators', 'Interactive prompts'],
  },
];

const mockTestimonials = [
  {
    quote:
      'Lord Commander has transformed how we build CLI tools. The type safety and modular architecture are game changers.',
    author: 'Jane Developer',
    company: 'Tech Corp',
    position: 'Senior Engineer',
    rating: 5,
  },
  {
    quote:
      "Finally, a CLI framework that doesn't get in the way. The auto-completion feature alone saves us hours.",
    author: 'John Smith',
    company: 'DevTools Inc',
    position: 'Team Lead',
    rating: 5,
  },
  {
    quote:
      'The documentation and examples are excellent. We were up and running in minutes, not hours.',
    author: 'Sarah Wilson',
    company: 'StartupXYZ',
    position: 'CTO',
    rating: 5,
  },
];

// async function getHomePageData() {
//   try {
//     const [hero, features, testimonials, faqs, recentPosts] = await Promise.all([
//       sanityClient.fetch(queries.heroContent),
//       sanityClient.fetch(queries.allFeatures),
//       sanityClient.fetch(queries.allTestimonials),
//       sanityClient.fetch(queries.allFAQs),
//       sanityClient.fetch(queries.recentPosts)
//     ])
//
//     return { hero, features, testimonials, faqs, recentPosts }
//   } catch (error) {
//     console.error('Error fetching home page data:', error)
//     return null
//   }
// }

export default function HomePage() {
  // Uncomment when Sanity is fully configured:
  // const data = await getHomePageData()
  //
  // if (!data) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <p>Error loading content. Please try again later.</p>
  //     </div>
  //   )
  // }

  return (
    <>
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <div className="container mx-auto px-6 py-20">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">{mockHero.headline}</h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">{mockHero.subheadline}</p>
              <a
                href={mockHero.ctaButton.url}
                className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
              >
                {mockHero.ctaButton.text}
              </a>

              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                {mockHero.features.map((feature) => (
                  <div key={feature.title} className="text-center">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-blue-100">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Powerful Features
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to build professional command-line applications
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mockFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-8"
                >
                  <div className="text-4xl mb-6">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 mb-6">{feature.description}</p>
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
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Developers Say
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Trusted by developers and teams worldwide
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mockTestimonials.map((testimonial) => (
                <div key={testimonial.author} className="bg-gray-50 rounded-lg p-8 relative">
                  <div className="text-blue-500 mb-4">
                    <svg
                      width="24"
                      height="24"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      role="img"
                      aria-label="Quote icon"
                    >
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>

                  <blockquote className="text-gray-700 mb-6 italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>

                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={`star-${testimonial.author}-${i}`}
                        className={`w-5 h-5 ${
                          i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        role="img"
                        aria-label={`${i < testimonial.rating ? 'Filled' : 'Empty'} star`}
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">
                      {testimonial.position} at {testimonial.company}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Build Amazing CLI Tools?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Join thousands of developers who are already building the next generation of
              command-line applications
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/docs"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Get Started
              </a>
              <a
                href="/blog"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Read the Blog
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Sanity CMS Integration Note */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              role="img"
              aria-label="Warning icon"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Sanity CMS Integration Ready:</strong> This page is currently using mock data.
              Once you configure your Sanity project credentials in <code>.env.local</code>,
              uncomment the Sanity client code to use dynamic content from your CMS. Visit{' '}
              <code>/studio</code> to access the Sanity Studio for content management.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
