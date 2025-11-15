import { defineType, defineField } from 'sanity'

export const faq = defineType({
  name: 'faq',
  type: 'object',
  title: 'FAQ Section',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Section Title',
      initialValue: 'Frequently Asked Questions'
    }),
    defineField({
      name: 'faqs',
      type: 'array',
      title: 'FAQs',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'question', type: 'string', title: 'Question' },
            { name: 'answer', type: 'text', title: 'Answer' }
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