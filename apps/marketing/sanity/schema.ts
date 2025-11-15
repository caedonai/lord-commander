import { type SchemaTypeDefinition } from 'sanity'

import { post } from './schemas/post'
import { author } from './schemas/author'
import { category } from './schemas/category'
import { page } from './schemas/page'
import { hero } from './schemas/hero'
import { feature } from './schemas/feature'
import { testimonial } from './schemas/testimonial'
import { faq } from './schemas/faq'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    post,
    author,
    category,
    page,
    hero,
    feature,
    testimonial,
    faq,
  ],
}