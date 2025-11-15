import { NextRequest, NextResponse } from 'next/server';
// import { sanityClient } from '../../../lib/sanity'

// Mock API endpoint - replace with Sanity client when configured
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    // Mock data for demonstration
    const mockPosts = [
      {
        _id: '1',
        title: 'Getting Started with Lord Commander',
        slug: { current: 'getting-started' },
        excerpt: 'Learn how to build your first CLI application',
        publishedAt: new Date().toISOString(),
        author: { name: 'John Doe' },
      },
      {
        _id: '2',
        title: 'Advanced CLI Patterns',
        slug: { current: 'advanced-patterns' },
        excerpt: 'Explore advanced patterns for complex CLI tools',
        publishedAt: new Date().toISOString(),
        author: { name: 'Jane Smith' },
      },
    ];

    const mockPages = [
      {
        _id: '1',
        title: 'About Us',
        slug: { current: 'about' },
      },
      {
        _id: '2',
        title: 'Contact',
        slug: { current: 'contact' },
      },
    ];

    let data:
      | typeof mockPosts
      | typeof mockPages
      | { posts: typeof mockPosts; pages: typeof mockPages };
    switch (type) {
      case 'posts':
        data = mockPosts;
        break;
      case 'pages':
        data = mockPages;
        break;
      default:
        data = { posts: mockPosts, pages: mockPages };
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}
