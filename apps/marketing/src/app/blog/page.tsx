import { Metadata } from 'next';
// import { sanityClient, queries } from '../../lib/sanity'
import { BlogList } from '../../components';

export const metadata: Metadata = {
  title: 'Blog | Lord Commander',
  description:
    'Stay up to date with the latest news, tutorials, and insights from the Lord Commander team.',
};

async function getPosts() {
  // Mock function - replace with Sanity client when configured
  // const posts = await sanityClient.fetch(queries.allPosts)

  // Mock posts data
  return [
    {
      _id: '1',
      title: 'Getting Started with Lord Commander',
      slug: { current: 'getting-started' },
      excerpt:
        'Learn how to build your first CLI application with the Lord Commander framework. This comprehensive guide covers everything from setup to deployment.',
      publishedAt: new Date().toISOString(),
      author: { name: 'John Doe' },
    },
    {
      _id: '2',
      title: 'Advanced CLI Patterns',
      slug: { current: 'advanced-patterns' },
      excerpt:
        'Discover advanced patterns and best practices for building complex CLI applications. Learn about command composition, middleware, and more.',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      author: { name: 'Jane Smith' },
    },
    {
      _id: '3',
      title: 'Testing Your CLI Applications',
      slug: { current: 'testing-cli-apps' },
      excerpt:
        'Learn effective strategies for testing CLI applications. From unit tests to integration testing, ensure your tools work reliably.',
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      author: { name: 'Bob Wilson' },
    },
  ];
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main>
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Blog</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover insights, tutorials, and the latest updates from our team. Stay informed about
            best practices, new features, and industry trends.
          </p>
        </div>
      </div>

      <BlogList posts={posts} title="" />
    </main>
  );
}
