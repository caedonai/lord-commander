'use client';

import Image from 'next/image';
import Link from 'next/link';

// import { PortableText } from '@portabletext/react'
// import { urlFor } from '../../lib/sanity'

interface PortableTextBlock {
  _key?: string;
  _type?: string;
  children?: Array<{ text?: string }>;
}

interface SanityImage {
  asset?: {
    _ref?: string;
    _type?: string;
    url?: string;
  };
  alt?: string;
}

// Temporary mock PortableText component
const PortableText = ({ value }: { value: PortableTextBlock[] | string }) => {
  if (!value) return null;
  return (
    <div className="prose">
      {Array.isArray(value) ? (
        value.map((block: PortableTextBlock, index: number) => (
          <p key={block._key || `block-${index}`} className="mb-4 leading-relaxed text-gray-700">
            {block.children?.[0]?.text || 'Content block'}
          </p>
        ))
      ) : (
        <p className="mb-4 leading-relaxed text-gray-700">Content</p>
      )}
    </div>
  );
};

// Mock urlFor function
const urlFor = (source: SanityImage) => ({
  width: (_w: number) => ({
    height: (_h: number) => ({ url: () => source?.asset?.url || '/placeholder.jpg' }),
  }),
});

interface BlogPostCardProps {
  post: {
    _id: string;
    title: string;
    slug: { current: string };
    excerpt?: string;
    mainImage?: SanityImage;
    publishedAt: string;
    author?: {
      name: string;
      image?: SanityImage;
    };
    categories?: Array<{
      title: string;
      slug: { current: string };
    }>;
    estimatedReadingTime?: number;
  };
}

interface BlogPostProps {
  post: {
    title: string;
    mainImage?: SanityImage;
    publishedAt: string;
    body?: PortableTextBlock[];
    author?: {
      name: string;
      image?: SanityImage;
      bio?: PortableTextBlock[];
    };
    categories?: Array<{
      title: string;
      slug: { current: string };
    }>;
    estimatedReadingTime?: number;
  };
}

interface BlogListProps {
  posts: Array<BlogPostCardProps['post']>;
  title?: string;
  showExcerpts?: boolean;
}

interface PortableTextImageValue {
  asset?: { url?: string };
  alt?: string;
  caption?: string;
}

interface PortableTextLinkValue {
  href?: string;
}

interface PortableTextProps {
  children: React.ReactNode;
}

// Portable Text components for rich text rendering
const _portableTextComponents = {
  types: {
    image: ({ value }: { value: PortableTextImageValue }) => (
      <div className="my-8">
        <img
          src={value.asset?.url || ''}
          alt={value.alt || 'Blog post image'}
          width={800}
          height={400}
          className="rounded-lg"
        />
        {value.caption && (
          <p className="text-sm text-gray-600 mt-2 text-center italic">{value.caption}</p>
        )}
      </div>
    ),
  },
  marks: {
    link: ({ children, value }: { children: React.ReactNode; value: PortableTextLinkValue }) => (
      <a
        href={value?.href || '#'}
        className="text-blue-600 hover:text-blue-800 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  },
  block: {
    h2: ({ children }: PortableTextProps) => (
      <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">{children}</h2>
    ),
    h3: ({ children }: PortableTextProps) => (
      <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-900">{children}</h3>
    ),
    normal: ({ children }: PortableTextProps) => (
      <p className="mb-4 leading-relaxed text-gray-700">{children}</p>
    ),
    blockquote: ({ children }: PortableTextProps) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 my-6 italic text-gray-600">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: PortableTextProps) => (
      <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">{children}</ul>
    ),
    number: ({ children }: PortableTextProps) => (
      <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700">{children}</ol>
    ),
  },
};

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {post.mainImage && (
        <Link href={`/blog/${post.slug.current}`}>
          <div className="relative h-48">
            <Image
              src={urlFor(post.mainImage).width(400).height(200).url()}
              alt={post.title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}

      <div className="p-6">
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.categories.slice(0, 2).map((category) => (
              <Link
                key={category.slug.current}
                href={`/blog/category/${category.slug.current}`}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
              >
                {category.title}
              </Link>
            ))}
          </div>
        )}

        <h3 className="text-xl font-semibold mb-3 text-gray-900">
          <Link
            href={`/blog/${post.slug.current}`}
            className="hover:text-blue-600 transition-colors"
          >
            {post.title}
          </Link>
        </h3>

        {post.excerpt && <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            {post.author?.image && (
              <Image
                src={urlFor(post.author.image).width(32).height(32).url()}
                alt={post.author.name}
                width={32}
                height={32}
                className="rounded-full mr-2"
              />
            )}
            <span>{post.author?.name}</span>
          </div>

          <div className="flex items-center space-x-4">
            {post.estimatedReadingTime && <span>{post.estimatedReadingTime} min read</span>}
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </div>
        </div>
      </div>
    </article>
  );
}

export function BlogPost({ post }: BlogPostProps) {
  return (
    <article className="max-w-4xl mx-auto px-6 py-12">
      <header className="mb-12">
        <div className="text-center">
          {post.categories && post.categories.length > 0 && (
            <div className="flex justify-center flex-wrap gap-2 mb-4">
              {post.categories.map((category) => (
                <Link
                  key={category.slug.current}
                  href={`/blog/category/${category.slug.current}`}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                >
                  {category.title}
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{post.title}</h1>

          <div className="flex items-center justify-center space-x-6 text-gray-600">
            {post.author && (
              <div className="flex items-center">
                {post.author.image && (
                  <Image
                    src={urlFor(post.author.image).width(40).height(40).url()}
                    alt={post.author.name}
                    width={40}
                    height={40}
                    className="rounded-full mr-3"
                  />
                )}
                <span className="font-medium">{post.author.name}</span>
              </div>
            )}

            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>

            {post.estimatedReadingTime && <span>{post.estimatedReadingTime} min read</span>}
          </div>
        </div>

        {post.mainImage && (
          <div className="mt-12 relative h-96 rounded-lg overflow-hidden">
            <Image
              src={urlFor(post.mainImage).width(1200).height(600).url()}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}
      </header>

      {post.body && (
        <div className="prose prose-lg max-w-none">
          <PortableText value={post.body} />
        </div>
      )}

      {post.author?.bio && (
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex items-start space-x-4">
            {post.author.image && (
              <Image
                src={urlFor(post.author.image).width(64).height(64).url()}
                alt={post.author.name}
                width={64}
                height={64}
                className="rounded-full"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About {post.author.name}</h3>
              {post.author.bio && (
                <div className="text-gray-600">
                  <PortableText value={post.author.bio} />
                </div>
              )}
            </div>
          </div>
        </footer>
      )}
    </article>
  );
}

export function BlogList({
  posts,
  title = 'Latest Posts',
  showExcerpts: _showExcerpts = true,
}: BlogListProps) {
  if (!posts || posts.length === 0) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">{title}</h2>
          <p className="text-gray-600">No blog posts available yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogPostCard key={post._id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
