import { Metadata } from 'next';
import { notFound } from 'next/navigation';
// import { sanityClient, queries } from '../../../lib/sanity'
import { BlogPost } from '../../../components';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

interface SanityImage {
  asset?: {
    url?: string;
  };
  alt?: string;
}

interface BlogPostData {
  title: string;
  excerpt?: string;
  publishedAt: string;
  author?: { name: string };
  mainImage?: SanityImage;
  body?: Array<{
    _type: string;
    children: Array<{ text: string }>;
  }>;
}

async function getPost(slug: string): Promise<BlogPostData | null> {
  // Mock function - replace with Sanity client when configured
  // const post = await sanityClient.fetch(queries.postBySlug, { slug })

  // Mock post data
  if (slug === 'getting-started') {
    return {
      title: 'Getting Started with Lord Commander',
      excerpt: 'Learn how to build your first CLI application with Lord Commander framework',
      publishedAt: new Date().toISOString(),
      author: { name: 'John Doe' },
      body: [
        {
          _type: 'block',
          children: [{ text: 'Welcome to Lord Commander! This guide will help you get started.' }],
        },
      ],
    };
  }

  return null;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.excerpt || `Read ${post.title} on our blog`,
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read ${post.title} on our blog`,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author?.name ? [post.author.name] : undefined,
      images: post.mainImage
        ? [
            {
              url: post.mainImage.asset?.url || '',
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || `Read ${post.title} on our blog`,
      images: post.mainImage?.asset?.url ? [post.mainImage.asset.url] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  return <BlogPost post={post} />;
}
