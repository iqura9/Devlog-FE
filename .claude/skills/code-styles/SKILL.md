---
title: Code Styles for Components
impact: HIGH
impactDescription: consistent, optimized, and readable component code
tags: composition, typescript, components, style
---

## Code Styles for Components

Adopt a consistent code style for React components that prioritizes optimization, readability, and predictability.

---

## Props: Use Interface Over Type

Component props should always use `interface ComponentNameProps {}` instead of `type`. Interfaces are optimized by TypeScript and scale better with complex prop structures.

**Incorrect (using type):**

```tsx
type ButtonProps = {
  variant: 'primary' | 'secondary'
  size: 'sm' | 'md' | 'lg'
  onClick: () => void
  disabled?: boolean
}

function Button(props: ButtonProps) {
  return <button>{props.children}</button>
}
```

**Correct (using interface):**

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary'
  size: 'sm' | 'md' | 'lg'
  onClick: () => void
  disabled?: boolean
}

function Button(props: ButtonProps) {
  return <button>{props.children}</button>
}
```

**Why:** Interfaces are nominal types and TypeScript can optimize them better. They also scale well with extension and merging, which is common when composing components.

---

## Components: Prefer Function Components Over Arrow Functions

Use function declarations for React components. Arrow functions should only be used with `React.memo()` when memoization is needed.

**Incorrect (arrow function without need):**

```tsx
const Card = ({ title, children }: CardProps) => {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  )
}
```

**Correct (function declaration):**

```tsx
function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  )
}
```

**Arrow functions allowed (with React.memo):**

```tsx
const MemoizedCard = React.memo(({ title, children }: CardProps) => {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  )
})
```

**Why:** Function declarations are more readable, have better error messages, and explicit. Arrow functions add syntax overhead when not needed. Use them only when `React.memo()` requires an expression.

---

## Conditionals in Renders: Prefer Ternary Over Logical AND

Use ternary operators (`condition ? valueA : valueB`) instead of logical AND (`&&`) for conditional rendering. This prevents accidentally rendering falsy values and is more explicit.

**Incorrect (logical AND):**

```tsx
function UserCard({ user, isAdmin }: CardProps) {
  return (
    <div>
      <h2>{user.name}</h2>
      {isAdmin && <AdminPanel />}
      {user.premium && <PremiumBadge />}
    </div>
  )
}
```

**Correct (ternary operator):**

```tsx
function UserCard({ user, isAdmin }: CardProps) {
  return (
    <div>
      <h2>{user.name}</h2>
      {isAdmin ? <AdminPanel /> : null}
      {user.premium ? <PremiumBadge /> : null}
    </div>
  )
}
```

**Why:** The logical AND operator can render unwanted values (e.g., `0`, `false`, `""` show up in DOM). Ternary is explicit about the true and false cases, making intent clearer and preventing bugs.

---

## Routing: Always Use `Links` from `@/routes/paths`

Never hardcode route strings. Always import and use `Links` from `@/routes/paths` for any `href` prop or programmatic navigation.

**Incorrect (hardcoded string):**

```tsx
<Link href="/tasks">Back</Link>
router.push("/tasks/123")
```

**Correct (using Links):**

```tsx
import { Links } from "@/routes/paths"

<Link href={Links.tasks.index}>Back</Link>
router.push(Links.tasks.view(id))
```

**Why:** Hardcoded strings break silently when routes change. `Links` is the single source of truth derived from `Paths` in `routes/paths.ts`.

---

## Combined Example

Applying all rules together:

```tsx
interface HeaderProps {
  title: string
  subtitle?: string
  isLoggedIn: boolean
  onLogin: () => void
}

function Header({ title, subtitle, isLoggedIn, onLogin }: HeaderProps) {
  return (
    <header>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {isLoggedIn ? (
        <UserMenu />
      ) : (
        <button onClick={onLogin}>Sign In</button>
      )}
    </header>
  )
}

const MemoizedHeader = React.memo(Header)
```
