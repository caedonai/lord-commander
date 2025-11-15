import { defineType, defineField } from 'sanity'

export const hero = defineType({
  name: 'hero',
  type: 'object',
  title: 'Hero Section',
  fields: [
    defineField({
      name: 'headline',
      type: 'string',
      title: 'Headline',
      validation: (Rule: any) => Rule.required()
    }),
    defineField({
      name: 'subheadline',
      type: 'text',
      title: 'Subheadline',
      rows: 3
    }),
    defineField({
      name: 'backgroundImage',
      type: 'image',
      title: 'Background Image',
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: 'ctaButton',
      type: 'object',
      title: 'CTA Button',
      fields: [
        {
          name: 'text',
          type: 'string',
          title: 'Button Text'
        },
        {
          name: 'url',
          type: 'url',
          title: 'Button URL'
        }
      ]
    }),
    defineField({
      name: 'features',
      type: 'array',
      title: 'Key Features',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Feature Title' },
            { name: 'description', type: 'text', title: 'Feature Description' },
            { name: 'icon', type: 'string', title: 'Icon Name' }
          ]
        }
      ]
    })
  ],
  preview: {
    select: {
      title: 'headline'
    }
  }
})