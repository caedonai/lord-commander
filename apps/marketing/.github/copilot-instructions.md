# Copilot Instructions for Lord Commander Marketing

## Context

This is the marketing website for Lord Commander CLI SDK, built with Next.js 15 and integrated with Sanity CMS. When working on this app, focus on creating compelling marketing content and smooth user experience.

## Marketing-Specific Guidelines

### Content & Messaging

- **Audience**: Developers building CLI tools and applications
- **Tone**: Professional yet approachable, technical but accessible
- **Value Propositions**: Emphasize developer experience, type safety, modularity, and performance
- **Call-to-Actions**: Drive users to documentation, GitHub, or getting started guides

### Sanity CMS Integration

**Current State**: Mock data with Sanity infrastructure ready

**When Working with Sanity:**
- Use proper TypeScript interfaces for all Sanity schema types
- Implement graceful fallbacks for missing CMS content
- Follow the established schema patterns in `sanity/schemas/`
- Use `urlFor()` helper for image optimization
- Test both with and without Sanity Studio connection

**Key Components:**
- `Hero` - Main landing section with CTA
- `Features` - Product capabilities showcase  
- `Testimonials` - Social proof with ratings
- `FAQ` - Common questions with expandable answers
- `BlogComponents` - Article display and listing

### SEO & Performance

- Use Next.js `<Image>` component for all images (not `<img>`)
- Implement proper meta tags and OpenGraph data
- Ensure fast loading with proper code splitting
- Use semantic HTML for accessibility
- Test with Lighthouse for performance scores

### Component Patterns

**Reusable Components:**
- Keep components modular and composable
- Use proper TypeScript interfaces
- Include loading and error states
- Support both light/dark themes if applicable

**Layout Standards:**
- Mobile-first responsive design
- Consistent spacing using Tailwind utilities
- Accessible color contrast ratios
- Proper focus management for interactive elements

### Content Management

**Mock Data Location:** Currently using mock objects in page components
**Future CMS Content:** Will replace mock data with Sanity queries

**Content Types:**
- Hero sections with headlines and CTAs
- Feature lists with benefits and icons
- Testimonials with ratings and author info
- Blog posts with rich content and metadata
- FAQ sections with categories

### Testing Guidelines

**Marketing-Specific Tests:**
- Verify all CTAs render and have proper links
- Test responsive behavior across viewports
- Validate marketing copy appears correctly
- Ensure forms and interactive elements work
- Check SEO meta tags are properly generated

**Content Testing:**
- Mock Sanity data responses appropriately
- Test graceful degradation when CMS is unavailable
- Verify image optimization and alt text
- Check analytics tracking implementations

### Development Workflow

**Local Development:**
```bash
# Start marketing app
pnpx nx serve marketing

# Run tests
pnpx nx test marketing

# Build for production  
pnpx nx build marketing

# Lint and format
pnpx nx lint marketing
```

**Sanity Integration:**
- Check `SANITY_INTEGRATION.md` for setup details
- Use `.env.local.example` as template for environment variables
- Test with Sanity Studio at `/studio` route when configured

### Code Quality

- Follow the root workspace guidelines
- Use semantic class names with Tailwind
- Implement proper error boundaries
- Add meaningful comments for marketing logic
- Keep bundle size optimized for fast loading

## File Structure

```
apps/marketing/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # Reusable UI components
│   ├── lib/          # Sanity client and utilities
│   └── styles/       # Global styles and Tailwind
├── sanity/           # CMS schemas and configuration
├── public/           # Static assets
└── specs/            # Component and page tests
```

## Quality Checklist

- [ ] Marketing copy is compelling and error-free
- [ ] All images have proper alt text and optimization
- [ ] CTAs are prominently placed and functional
- [ ] Mobile experience is smooth and fast
- [ ] SEO meta tags are complete and accurate
- [ ] Analytics tracking is properly implemented
- [ ] Components are accessible and keyboard navigable