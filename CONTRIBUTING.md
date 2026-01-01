# Contributing to GigDash

Thank you for your interest in contributing to GigDash! This document provides guidelines and instructions for contributing to the project.

## 🌟 Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please be respectful and constructive in all interactions.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 15+ (or Docker)
- Git
- A code editor (VS Code recommended)

### Initial Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/GigDash-1.git
   cd GigDash-1
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/AndySDisIT/GigDash-1.git
   ```

4. **Run the automated setup**
   
   **Windows:**
   ```powershell
   .\setup-godtier.ps1
   ```
   
   **macOS/Linux:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

5. **Verify your setup**
   ```bash
   npm run dev
   ```

## 📋 Development Workflow

### 1. Create a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `style/` - Code style changes

Examples:
- `feature/add-map-view`
- `fix/payment-calculation`
- `docs/update-readme`

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run all tests
.\test-runner.ps1

# Or use npm scripts
npm run test              # All tests
npm run lint              # Linting
npm run build             # Build check
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <description>

git commit -m "feat(dashboard): add animated stat cards"
git commit -m "fix(auth): resolve JWT expiration issue"
git commit -m "docs(readme): update installation instructions"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create PR on GitHub
```

## 📝 Pull Request Guidelines

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Linting passes with no errors
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] No console errors or warnings
- [ ] Branch is up to date with main

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #issue_number
```

### Review Process

1. Automated checks must pass (linting, tests)
2. At least one maintainer review required
3. All review comments must be addressed
4. No merge conflicts with main branch

## 🎨 Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Use functional components with hooks (React)
- Prefer `const` over `let`
- Use arrow functions
- Use template literals for strings
- Add type annotations
- Avoid `any` type

**Good:**
```typescript
const fetchUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/users');
  return response.data;
};
```

**Avoid:**
```typescript
function fetchUsers() {
  return api.get('/users').then((res: any) => res.data);
}
```

### React Components

```typescript
import React from 'react';

interface MyComponentProps {
  title: string;
  count?: number;
}

export const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  count = 0 
}) => {
  return (
    <div className="my-component">
      <h1>{title}</h1>
      <p>Count: {count}</p>
    </div>
  );
};
```

### CSS/Styling

- Use Tailwind CSS utilities first
- Use design system classes from `design-system.css`
- Create custom components for reusable patterns
- Follow mobile-first approach

```tsx
// Good - Tailwind + design system
<div className="glass-card p-6 animate-fade-in">
  <h2 className="text-2xl font-bold text-gradient">Title</h2>
</div>

// Avoid - inline styles
<div style={{ background: 'rgba(255,255,255,0.1)', padding: '24px' }}>
  <h2 style={{ fontSize: '24px' }}>Title</h2>
</div>
```

### File Organization

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── layout/       # Layout components
│   └── features/     # Feature-specific components
├── pages/            # Page components
├── api/              # API client functions
├── hooks/            # Custom hooks
├── types/            # TypeScript types
├── utils/            # Utility functions
└── styles/           # Global styles
```

### Naming Conventions

- **Components:** PascalCase (`UserProfile.tsx`)
- **Hooks:** camelCase with `use` prefix (`useAuth.ts`)
- **Utilities:** camelCase (`formatDate.ts`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Types/Interfaces:** PascalCase (`User`, `ApiResponse`)

## 🧪 Testing Guidelines

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('should render title and value', () => {
    render(<StatCard title="Revenue" value={1000} />);
    
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('should show trend indicator', () => {
    render(<StatCard title="Revenue" value={1000} trend="up" change={10} />);
    
    expect(screen.getByText('+10%')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/gigs', (req, res, ctx) => {
    return res(ctx.json([
      { id: '1', title: 'Test Gig' }
    ]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('loads and displays gigs', async () => {
  // Test implementation
});
```

### Test Coverage

- Aim for > 80% coverage
- Focus on critical paths
- Test error handling
- Test edge cases

## 📚 Documentation Guidelines

### Code Comments

```typescript
/**
 * Calculates the total earnings for a user
 * 
 * @param userId - The user's unique identifier
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @returns Total earnings in dollars
 * @throws {NotFoundError} If user doesn't exist
 */
export const calculateEarnings = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> => {
  // Implementation
};
```

### Updating Documentation

When adding features:
- Update relevant `.md` files
- Add code examples
- Update API documentation
- Add troubleshooting tips if needed

## 🐛 Bug Reports

### Before Submitting

1. Check existing issues
2. Try to reproduce on latest version
3. Gather relevant information

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 120]
- Node version: [e.g. 18.17.0]
- GigDash version: [e.g. 1.0.0]

**Additional context**
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of the desired feature

**Describe alternatives you've considered**
Other approaches you've thought about

**Additional context**
Any other relevant information, mockups, examples
```

## 🔧 Development Tools

### Recommended VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- GitLens
- Error Lens

### Useful Commands

```bash
# Development
npm run dev              # Start dev servers
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only

# Building
npm run build            # Build both
npm run build:frontend   # Build frontend
npm run build:backend    # Build backend

# Testing
npm test                 # Run all tests
npm run lint             # Lint code
npm run format           # Format code

# Database
npm run prisma:studio    # Database GUI
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database

# PowerShell Scripts
.\setup-godtier.ps1      # Initial setup
.\health-check.ps1       # Check system health
.\test-runner.ps1        # Run tests
.\backup-db.ps1          # Backup database
.\reset-dev.ps1          # Reset environment
```

## 🎯 Areas to Contribute

### High Priority

- [ ] Unit tests for components
- [ ] Integration tests for API
- [ ] Accessibility improvements
- [ ] Performance optimizations
- [ ] Documentation improvements

### Feature Ideas

- [ ] Advanced map view with clustering
- [ ] Drag-and-drop route planning
- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Export features (PDF, CSV)
- [ ] Dark mode toggle

### Good First Issues

Look for issues labeled `good first issue` - these are great starting points for new contributors!

## 📞 Getting Help

- **Questions:** Open a GitHub Discussion
- **Bugs:** Open a GitHub Issue
- **Chat:** Join our Discord (link in README)
- **Email:** support@gigdash.example

## 🎉 Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes
- `CONTRIBUTORS.md` file

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to GigDash! Your efforts help make this project better for everyone. 🚀

**Happy Coding!** 💻✨
