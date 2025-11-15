import { defineType, defineField } from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  type: 'object',
  title: 'Testimonial Section',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Section Title'
    }),
    defineField({
      name: 'testimonials',
      type: 'array',
      title: 'Testimonials',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', type: 'string', title: 'Name' },
            { name: 'company', type: 'string', title: 'Company' },
            { name: 'role', type: 'string', title: 'Role' },
            { name: 'content', type: 'text', title: 'Testimonial Content' },
            { name: 'avatar', type: 'image', title: 'Avatar' },
            { name: 'rating', type: 'number', title: 'Rating (1-5)', validation: (Rule: any) => Rule.min(1).max(5) }
          ]
        }
      ]
    })
  ],
  preview: {
    select: {
      title: 'title'
    }
  }
})