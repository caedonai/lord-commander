import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemas } from './schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  name: 'lord-commander-marketing',
  title: 'Lord Commander Marketing',
  projectId,
  dataset,
  plugins: [
    structureTool(),
    visionTool({
      defaultApiVersion: '2024-01-01'
    })
  ],
  schema: {
    types: schemas
  },
  basePath: '/studio'
})