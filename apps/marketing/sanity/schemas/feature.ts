import { defineType, defineField } from 'sanity'

export const feature = defineType({
  name: 'feature',
  type: 'object',
  title: 'Feature Section',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Section Title',
      validation: (Rule: any) => Rule.required()
    }),
    defineField({
      name: 'subtitle',
      type: 'text',
      title: 'Section Subtitle'
    }),
    defineField({
      name: 'layout',
      type: 'string',
      title: 'Layout',
      options: {
        list: [
          { title: 'Grid 2x2', value: 'grid-2x2' },
          { title: 'Grid 3x1', value: 'grid-3x1' },
          { title: 'List', value: 'list' },
          { title: 'Centered', value: 'centered' }
        ]
      },
      initialValue: 'grid-2x2'
    }),
    defineField({
      name: 'features',
      type: 'array',
      title: 'Features',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Feature Title' },
            { name: 'description', type: 'text', title: 'Feature Description' },
            { name: 'icon', type: 'string', title: 'Icon Name' },
            { name: 'image', type: 'image', title: 'Feature Image' }
          ]
        }
      ]
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'layout'
    },
    prepare(selection: any) {
      return {
        title: selection.title,
        subtitle: `Layout: ${selection.subtitle}`
      }
    }
  }
})