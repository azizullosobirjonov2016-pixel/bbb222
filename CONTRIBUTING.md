# 🤝 Contributing to Birja-loyiha

Thank you for your interest in contributing to Birja-loyiha! This guide will help you get started.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Workflow](#workflow)
- [Code Standards](#code-standards)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

### Clone the Repository

```bash
git clone https://github.com/yourusername/Birja-loyiha.git
cd Birja-loyiha
```

### Initial Setup

```bash
# Install dependencies
npm install

# Setup git hooks
npm run prepare

# Verify everything works
npm run validate
```

---

## 🛠️ Development Setup

### Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
```

### Run Type Checking

```bash
npm run typecheck
```

### Run Linter

```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

### Format Code

```bash
npm run format
```

---

## 📝 Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write clean, readable code
- Follow TypeScript strict mode
- Use meaningful variable names
- Add comments for complex logic

### 3. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
```

**Pre-commit hook runs automatically:**
- ✅ ESLint checks and fixes staged files
- ✅ Prettier formats code
- ✅ Type checking on TypeScript files

### 4. Push Changes

```bash
git push origin feature/your-feature-name
```

**Pre-push hook runs automatically:**
- ✅ Full TypeScript type checking
- ✅ Full ESLint validation
- ✅ Builds successfully

### 5. Create Pull Request

- Go to GitHub and create a PR
- Fill in the PR template
- Wait for CI checks to pass
- Request review from maintainers

### 6. Address Review Comments

- Make requested changes
- Commit with `git commit -m "review: address comments"`
- Push and CI will re-run

### 7. Merge

Once approved:
- Squash commits if needed
- Merge to main branch
- Delete feature branch

---

## ✅ Code Standards

### TypeScript

- Use strict mode (enabled by default)
- Type all function parameters and returns
- Avoid using `any` type
- Use proper error handling

### Example:

```tsx
// ✅ Good
function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (error) {
    logger.error('Price formatting failed', error);
    return '—';
  }
}

// ❌ Bad
function formatPrice(amount: any, currency: any) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
```

### File Organization

```
src/
├── components/        # React components
│   ├── common/       # Shared components
│   ├── forms/        # Form components
│   ├── layout/       # Layout components
│   └── ui/           # Shadcn-ui components
├── pages/            # Page components
├── api/              # API calls
├── hooks/            # Custom React hooks
├── lib/              # Utilities & helpers
└── types/            # TypeScript types
```

### Naming Conventions

- Files: `kebab-case` (e.g., `user-form.tsx`)
- Components: `PascalCase` (e.g., `UserForm`)
- Functions: `camelCase` (e.g., `getUserById`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_URL`)
- Types: `PascalCase` (e.g., `User`, `FormData`)

### Comments

```tsx
// Use JSDoc for functions
/**
 * Formats a date to a user-friendly string
 * @param date - The date to format
 * @param format - Optional format pattern
 * @returns Formatted date string
 * @example
 * formatDate(new Date('2026-09-11'), 'dd/MM/yyyy') // '11/09/2026'
 */
function formatDate(date: Date, format: string = 'dd MMM yyyy'): string {
  // Implementation
}
```

---

## 🔒 Pre-commit Hooks

### What They Do

**Pre-commit hook** (runs on `git commit`):
- ✅ Runs ESLint on staged files
- ✅ Auto-fixes issues
- ✅ Formats with Prettier
- ✅ Blocks commit if errors

**Pre-push hook** (runs on `git push`):
- ✅ Type checking
- ✅ Full linting
- ✅ Blocks push if errors

### Bypass Hooks (Not Recommended)

```bash
# Skip pre-commit hook
git commit --no-verify

# Skip pre-push hook
git push --no-verify
```

### Troubleshoot Hooks

```bash
# Make hooks executable (if needed)
chmod +x .husky/pre-commit
chmod +x .husky/pre-push

# Reinstall hooks
npm run prepare

# Check Husky status
npx husky install
```

---

## 📌 Commit Messages

Use conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (formatting, etc)
- `refactor:` Refactoring code
- `perf:` Performance improvement
- `test:` Adding tests
- `chore:` Build, deps, etc

### Examples

```bash
git commit -m "feat(auth): add two-factor authentication"
git commit -m "fix(api): handle network timeouts"
git commit -m "docs: update README with API examples"
git commit -m "refactor: extract useFormHandler hook"
git commit -m "perf: optimize contract list rendering"
```

---

## 🔄 Pull Requests

### PR Title Format

```
[Type] Short description

# Examples:
[Feature] Add contract bulk operations
[Fix] Fix memory leak in useContracts hook
[Docs] Add deployment guide
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation

## Testing
- How did you test this?
- What scenarios did you cover?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review done
- [ ] Comments added for complex logic
- [ ] No new console errors
- [ ] Tests updated (if applicable)
```

---

## 🐛 Troubleshooting

### Issue: Commit rejected by pre-commit hook

**Solution:** Fix the errors:
```bash
npm run lint:fix
npm run format
git add .
git commit -m "your message"
```

### Issue: Push rejected by pre-push hook

**Solution:** Type checking or linting failed:
```bash
npm run typecheck   # See type errors
npm run lint        # See lint errors
# Fix issues
git push
```

### Issue: Hooks not running

**Solution:** Reinstall hooks:
```bash
npm run prepare
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### Issue: Node modules cache

**Solution:** Clear and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Resources

- [Project Architecture](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOY.md)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)

---

## 🎯 Code Review Checklist

When reviewing code, check for:

- ✅ Follows TypeScript strict mode
- ✅ Proper error handling
- ✅ No console errors
- ✅ Consistent with project style
- ✅ Tests updated (if applicable)
- ✅ Comments for complex logic
- ✅ No performance issues
- ✅ Accessibility considerations

---

## 🙏 Thank You

Thank you for contributing to Birja-loyiha! Your effort helps make this project better for everyone.

For questions, please:
1. Check existing issues
2. Create a new discussion
3. Ask in comments on related issues

Happy coding! 🚀
