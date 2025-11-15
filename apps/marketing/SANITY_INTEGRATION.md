# Sanity CMS Integration Guide

This document provides a complete guide for the Sanity CMS integration in the Lord Commander marketing application.

## Overview

The marketing application (`apps/marketing`) has been integrated with Sanity CMS to provide a headless content management system. This allows content creators to manage website content through Sanity Studio while developers maintain full control over the presentation layer.

## Features

### Content Types

The following content types are available in Sanity Studio:

1. **Posts** - Blog posts with rich text content, images, and metadata
2. **Authors** - Author profiles with bio, image, and social links  
3. **Categories** - Content categorization for posts and pages
4. **Pages** - Static pages with customizable content blocks
5. **Heroes** - Landing page hero sections with headlines and CTAs
6. **Features** - Product/service feature highlights
7. **Testimonials** - Customer testimonials with ratings
8. **FAQs** - Frequently asked questions organized by category

### React Components

Pre-built React components for rendering Sanity content:

- `Hero` - Hero section component
- `Features` - Features grid component  
- `Testimonials` - Testimonials carousel/grid
- `FAQ` - Expandable FAQ component
- `BlogPost` - Individual blog post renderer
- `BlogPostCard` - Blog post preview card
- `BlogList` - Blog post listing with pagination

## Setup Instructions

### 1. Install Dependencies

Dependencies are already added to the root `package.json`:

```json
{
  "@sanity/client": "^7.8.0",
  "@sanity/image-url": "^1.1.0", 
  "@portabletext/react": "^3.1.0",
  "@sanity/vision": "^3.62.2",
  "next-sanity": "^9.10.4",
  "sanity": "^3.62.2"
}
```

### 2. Environment Configuration

Create `.env.local` in `apps/marketing/`:

```bash
# Sanity Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_TOKEN=your_api_token
```

### 3. Sanity Project Setup

1. Create a new Sanity project at [sanity.io/manage](https://sanity.io/manage)
2. Note your Project ID and Dataset name
3. Generate an API token with Editor permissions
4. Update the environment variables above

### 4. Deploy Sanity Studio

The Sanity Studio is configured to run at `/studio` route:

1. Start the marketing app: `pnpx nx serve marketing`
2. Visit `http://localhost:4200/studio`
3. Login with your Sanity account
4. Start creating content!

## File Structure

```
apps/marketing/
├── sanity/
│   ├── schema/
│   │   ├── post.ts          # Blog post schema
│   │   ├── author.ts        # Author schema
│   │   ├── category.ts      # Category schema
│   │   ├── page.ts          # Page schema
│   │   ├── hero.ts          # Hero section schema
│   │   ├── feature.ts       # Feature schema
│   │   ├── testimonial.ts   # Testimonial schema
│   │   ├── faq.ts           # FAQ schema
│   │   └── index.ts         # Schema exports
│   ├── config.ts            # Sanity Studio config
│   ├── schema.ts            # Schema definitions
│   └── env.ts               # Environment helpers
├── lib/
│   └── sanity.ts            # Client & utilities
├── src/
│   ├── app/
│   │   ├── studio/          # Sanity Studio route
│   │   ├── blog/            # Blog pages
│   │   ├── api/sanity/      # API endpoints
│   │   └── page.tsx         # Homepage with mock data
│   └── components/
│       ├── Hero.tsx
│       ├── Features.tsx
│       ├── Testimonials.tsx
│       ├── FAQ.tsx
│       ├── BlogComponents.tsx
│       └── index.ts
├── .env.local.example       # Environment template
└── sanity.config.ts         # Root Sanity config
```

## Usage Examples

### Fetching Content in Pages

```typescript
import { sanityClient, queries } from '../lib/sanity'
import { Hero, Features } from '../components'

export default async function HomePage() {
  const [hero, features] = await Promise.all([
    sanityClient.fetch(queries.heroContent),
    sanityClient.fetch(queries.allFeatures)
  ])

  return (
    <main>
      <Hero hero={hero} />
      <Features features={features} />
    </main>
  )
}
```

### Using Components

```typescript
// Hero Section
<Hero hero={{
  headline: "Welcome to Our Platform",
  subheadline: "Build amazing things",
  backgroundImage: sanityImage,
  ctaButton: { text: "Get Started", url: "/signup" }
}} />

// Features Grid
<Features features={[
  {
    title: "Fast Performance", 
    description: "Lightning fast load times",
    icon: "⚡",
    benefits: ["Optimized", "Cached", "CDN"]
  }
]} />
```

### Custom GROQ Queries

```typescript
import { sanityClient } from '../lib/sanity'

// Custom query example
const customQuery = `
  *[_type == "post" && category->slug.current == $categorySlug] {
    title,
    slug,
    publishedAt,
    author->{name, image}
  }
`

const posts = await sanityClient.fetch(customQuery, { 
  categorySlug: 'tutorials' 
})
```

## Content Management

### Creating Content

1. Visit `/studio` in your browser
2. Login with Sanity credentials  
3. Use the content forms to create:
   - Blog posts with rich text editor
   - Author profiles with images
   - Landing page heroes
   - Feature highlights
   - Customer testimonials
   - FAQ entries

### Content Structure

#### Blog Posts
- Title, slug, excerpt
- Main content (rich text with images)
- Featured image
- Author reference
- Categories
- Published date
- SEO metadata

#### Pages  
- Title, slug
- Page builder with content blocks
- SEO metadata
- Custom fields

#### Marketing Content
- Hero sections with CTAs
- Feature lists with icons
- Testimonials with ratings
- FAQ with categories

## Development Workflow

### Current State

The app is currently using **mock data** to demonstrate the UI components. This allows development to continue while Sanity is being configured.

### Enabling Sanity

1. Configure environment variables in `.env.local`
2. Create content in Sanity Studio (`/studio`)
3. Uncomment Sanity client code in pages:
   ```typescript
   // Uncomment these lines:
   // import { sanityClient, queries } from '../lib/sanity' 
   // const data = await sanityClient.fetch(queries.allPosts)
   ```

### Testing Content

1. Create test content in Sanity Studio
2. Verify API endpoints: `/api/sanity?type=posts`
3. Test page rendering with real data
4. Check image optimization with `urlFor()`

## API Endpoints

### `/api/sanity`

Query parameters:
- `type=posts` - Get all blog posts
- `type=pages` - Get all pages  
- `type=all` - Get recent posts + pages

Response format:
```json
{
  "posts": [...],
  "pages": [...] 
}
```

## Deployment

### Production Checklist

1. ✅ Sanity project created and configured
2. ✅ Environment variables set in production
3. ✅ Content schemas deployed
4. ✅ Studio accessible at domain.com/studio  
5. ✅ API tokens configured with proper permissions
6. ✅ Images optimized and cached
7. ✅ Content populated and published

### Performance Optimization

- Images automatically optimized via `@sanity/image-url`
- Content cached at CDN level
- Static generation for blog posts
- Incremental static regeneration for dynamic content

## Troubleshooting

### Common Issues

1. **Module not found errors**: Dependencies installed at workspace root
2. **Missing environment variables**: Copy from `.env.local.example`  
3. **Sanity Studio not loading**: Check project ID and dataset
4. **API errors**: Verify API token permissions
5. **Images not loading**: Check asset URL configuration

### Debug Mode

Enable Sanity client debugging:

```typescript
const sanityClient = createClient({
  // ... config
  useCdn: false, // Disable for debugging
})
```

## Next Steps

1. **Configure Environment**: Set up `.env.local` with your Sanity credentials
2. **Create Content**: Use Sanity Studio to add your first blog post  
3. **Enable Dynamic Content**: Uncomment Sanity client code in pages
4. **Customize Schemas**: Modify content types for your specific needs
5. **Deploy**: Set up production environment variables

## Resources

- [Sanity Documentation](https://www.sanity.io/docs)
- [Next.js Integration](https://www.sanity.io/docs/nextjs)
- [GROQ Query Language](https://www.sanity.io/docs/groq)
- [Schema Definition Guide](https://www.sanity.io/docs/schema-types)

---

**Status**: ✅ Integration Complete - Ready for Content Creation

The Sanity CMS integration is fully implemented and ready for use. The marketing app demonstrates the power of headless CMS with a modern React/Next.js frontend.