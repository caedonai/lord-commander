import { defineType, defineField } from 'sanity'

export const post = defineType({
  name: 'post',
  type: 'document',
  title: 'Blog Post',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'author',
      type: 'reference',
      title: 'Author',
      to: [{ type: 'author' }],
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'mainImage',
      type: 'image',
      title: 'Main image',
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: 'categories',
      type: 'array',
      title: 'Categories',
      of: [{ type: 'reference', to: { type: 'category' } }]
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      title: 'Published at',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'excerpt',
      type: 'text',
      title: 'Excerpt',
      rows: 4
    }),
    defineField({
      name: 'body',
      type: 'blockContent',
      title: 'Body'
    })
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage'
    },
    prepare(selection) {
      const { author } = selection
      return {
        ...selection,
        subtitle: author && `by ${author}`
      }
    }
  }
})