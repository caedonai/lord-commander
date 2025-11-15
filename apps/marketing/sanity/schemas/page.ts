import { defineType, defineField } from 'sanity'

export const page = defineType({
  name: 'page',
  type: 'document',
  title: 'Page',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule: any) => Rule.required()
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: (Rule: any) => Rule.required()
    }),
    defineField({
      name: 'seo',
      type: 'object',
      title: 'SEO',
      fields: [
        {
          name: 'description',
          type: 'text',
          title: 'Meta Description',
          rows: 3
        },
        {
          name: 'keywords',
          type: 'array',
          title: 'Keywords',
          of: [{ type: 'string' }]
        },
        {
          name: 'ogImage',
          type: 'image',
          title: 'Open Graph Image'
        }
      ]
    }),
    defineField({
      name: 'hero',
      type: 'hero',
      title: 'Hero Section'
    }),
    defineField({
      name: 'sections',
      type: 'array',
      title: 'Page Sections',
      of: [
        { type: 'feature' },
        { type: 'testimonial' },
        { type: 'faq' }
      ]
    })
  ],
  preview: {
    select: {
      title: 'title'
    }
  }
})