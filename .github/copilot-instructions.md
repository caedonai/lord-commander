# Copilot Instructions

## Purpose

Maintain clean, consistent, and test-driven code across all contributions.  
Follow the principles of **clarity, simplicity, and reliability**.

---

## 1. General Coding Guidelines

- Follow the language's official style guide (e.g., TypeScript, JavaScript, Python, etc.).
- Prefer **readability over brevity**; avoid clever one-liners.
- Use **descriptive variable and function names**.
- Avoid premature optimization—prioritize correctness and maintainability.
- Ensure all functions and modules have **clear input/output contracts**.
- Keep code **DRY** (Don't Repeat Yourself) and **SOLID**.
- Add **inline JSDoc or docstrings** for non-obvious logic.
- Include error handling and edge-case checks where appropriate.
- Always ensure **type safety** if using a typed language (e.g., TypeScript).

---

## 2. Test-Driven Development (TDD) Workflow

Follow this sequence for each feature or bug fix:

1. **Write a failing test** that defines expected behavior.
2. **Implement the minimal code** to make the test pass.
3. **Refactor** the code for clarity and efficiency.
4. **Re-run tests** to confirm no regressions.

**Testing Standards**

- Use `vitest` (or relevant test framework).
- Organize tests by feature
- Ensure coverage for:
  - Success cases
  - Edge cases
  - Error handling
  - Security issues/vulnerabilities
- Write **unit tests first**, then integration tests.
- All new code must be committed with passing tests.

---

## 3. Code Review Expectations

- Prefer small, atomic commits with clear messages.
- Each PR should include:
  - Code changes
  - Relevant tests
  - Updated documentation (if applicable)
- Code should be linted and formatted automatically (Biome/ESLint/Prettier).
- Avoid unnecessary abstractions or dependencies.

---

## 4. Comments and Documentation

- Document all public functions, classes, and modules.
- Use comments only for **why**, not **what** (code should explain itself).
- For complex logic, summarize reasoning at the top of the function or block.

---

## 5. AI/Copilot Behavior

When generating or refactoring code:

- Write **tests before implementation**.
- Suggest meaningful test names and assertions.
- Propose **refactors only if they simplify logic or improve performance**.
- Never skip type checks, error handling, or lint rules.
- Maintain consistency with existing patterns and naming conventions.

---

## 6. Example Workflow

```bash
# 1. Write failing test
npm run test

# 2. Implement minimal code
# 3. Refactor for clarity and performance
# 4. Run all tests again
npm run test -- --coverage
```
