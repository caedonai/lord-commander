# Copilot Instructions for Lord Commander Documentation

## Context

This is the documentation application for Lord Commander CLI SDK, built with Mintlify. When working on this app, focus on creating high-quality technical documentation.

## Documentation Standards

### Content Structure

- Use MDX format with proper frontmatter
- Follow Mintlify component patterns
- Include practical, runnable code examples
- Maintain consistent cross-referencing

### Mintlify Components

Always use appropriate Mintlify components:

- `<Card>` and `<CardGroup>` for feature showcases
- `<Accordion>` and `<AccordionGroup>` for FAQ content
- `<Tabs>` for multi-option examples
- `<CodeGroup>` for language-specific samples
- `<Note>`, `<Tip>`, `<Warning>` for callouts

### File Organization

```
apps/docs/
├── core/           # Fundamental concepts
├── guides/         # Step-by-step tutorials
├── commands/       # Command reference
├── examples/       # Real-world usage
├── api-reference/  # Complete API docs
└── docs.json       # Navigation configuration
```

### Code Examples

- Use realistic Lord Commander SDK examples
- Include proper imports and context
- Show complete, working code snippets
- Add explanatory comments for complex logic

### Navigation Updates

When creating new pages:

1. Add MDX file in appropriate directory
2. Update `docs.json` navigation structure
3. Ensure file paths match navigation references
4. Test with `pnpx nx run docs:dev`

### Quality Checks

- Run `pnpx nx run docs:lint` to check links and accessibility
- Ensure all navigation references have corresponding files
- Verify code examples are accurate and complete
- Maintain consistent tone and style

## Writing Guidelines

- **Audience**: Developers building CLI tools
- **Tone**: Professional, practical, developer-focused
- **Examples**: Always include working code samples
- **Links**: Cross-reference related sections appropriately
