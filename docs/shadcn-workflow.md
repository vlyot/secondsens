# shadcn/ui Component Workflow

Complete guide to using shadcn/ui components in this project. This workflow ensures consistent, accessible, and maintainable UI development.

## Mandatory 3-Step Process

**CRITICAL: ALWAYS follow this workflow when implementing ANY frontend UI element.**

### Step 1: Identify What UI Element is Needed

Before writing any code, clearly identify what UI component you need:

- Do I need a button? A form input? A dialog/modal?
- Do I need navigation (tabs, accordion, breadcrumb, sidebar)?
- Do I need feedback elements (toast, alert, progress bar, spinner)?
- Do I need display components (card, table, badge, avatar)?
- Do I need overlays (popover, tooltip, dropdown menu)?

### Step 2: Search shadcn/ui Documentation Recursively

**NEVER skip this step.** Always search for the appropriate shadcn component:

1. **First**, check `@/llms.txt` in this repository for available components:
   - Form & Input (16 components): Button, Input, Textarea, Checkbox, Select, Slider, etc.
   - Layout & Navigation (8 components): Accordion, Tabs, Sidebar, Separator, etc.
   - Overlays & Dialogs (11 components): Dialog, Popover, Tooltip, Dropdown Menu, etc.
   - Feedback & Status (7 components): Alert, Toast, Progress, Spinner, Badge, etc.
   - Display & Media (10 components): Card, Table, Avatar, Chart, etc.
   - Misc (3 components): Collapsible, Toggle, Pagination, etc.

2. **Second**, if you need more details, recursively explore the documentation:
   - Read the component description from `@/llms.txt`
   - If the component exists, it will have a link to full documentation
   - Check variants, props, and usage examples
   - Review accessibility features and built-in behavior

3. **Third**, verify if the component is already installed:
   - Check if `src/components/ui/<component-name>.tsx` exists
   - If not, you'll need to install it via CLI

### Step 3: Implement the Component Elegantly

Once you've identified the correct shadcn component:

1. **Install if needed** (if component doesn't exist in `src/components/ui/`):
   ```bash
   npx shadcn-ui@latest add <component-name>
   ```

2. **Import the component**:
   ```typescript
   import { Button } from "@/components/ui/button"
   import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
   ```

3. **Use the component with its API**:
   ```typescript
   <Button variant="default" size="lg" onClick={handleClick}>
     Click me
   </Button>
   ```

4. **Customize with Tailwind classes** (if needed):
   ```typescript
   <Button className="w-full mt-4">Full Width Button</Button>
   ```

5. **Leverage built-in variants** instead of custom styling:
   ```typescript
   // ✅ Good: Use built-in variants
   <Button variant="destructive">Delete</Button>
   <Alert variant="destructive">Error message</Alert>

   // ❌ Bad: Custom Tailwind when variant exists
   <Button className="bg-red-500 text-white">Delete</Button>
   ```

## Understanding shadcn/ui Philosophy

**shadcn/ui is NOT a traditional component library.** It's a code generation and distribution system.

### Key Principles

1. **Open Code**: You own the full source code of every component
2. **Radix UI Primitives**: Accessibility and keyboard navigation built-in
3. **Tailwind CSS**: All styling via utility classes + CSS variables
4. **No Black Box**: Every line of code is in your project and modifiable
5. **Composition**: Components share a consistent, predictable API

### What You Get

When you run `npx shadcn@latest add button`, you get:
- Full TypeScript source code in `src/components/ui/button.tsx`
- Radix UI primitives for accessibility
- CVA (class-variance-authority) for variant management
- Tailwind classes for styling
- Complete ownership—modify however you want

## When to Use shadcn/ui vs. Custom Tailwind

| Use shadcn/ui when: | Use Custom Tailwind when: |
|---------------------|---------------------------|
| Building interactive UI (buttons, forms, dialogs) | Creating layout containers (divs, sections) |
| Accessibility is required (ARIA, keyboard nav) | Styling project-specific branding |
| Multiple states needed (hover, focus, disabled) | One-off utility components |
| Dark mode support required | Simple static content wrappers |
| Responsive behavior needed | No interactivity or accessibility needs |

### Examples

**Use shadcn/ui:**
- Button, Input, Dialog, Card, Tabs
- Form controls (Checkbox, Select, Slider)
- Navigation (Tabs, Accordion, Dropdown Menu)
- Feedback (Alert, Toast, Progress)

**Use Custom Tailwind:**
- Simple `<div>` wrapper
- Custom logo component
- Hero section layout
- Static content containers

## Component Priority Order

**ALWAYS follow this priority:**

1. **shadcn/ui component** (check `@/llms.txt` first)
2. **Radix UI primitive** (if shadcn doesn't have it)
3. **Custom Tailwind component** (only if no alternative exists)

## Available Components by Category

### Form & Input (16 components)
- **Button** - Interactive buttons with variants
- **Input** - Text input fields
- **Textarea** - Multi-line text input
- **Checkbox** - Checkbox controls
- **Radio Group** - Radio button groups
- **Select** - Dropdown selection
- **Slider** - Range slider
- **Switch** - Toggle switch
- **Form** - Form wrapper with validation
- **Label** - Accessible form labels
- **Calendar** - Date picker calendar
- **Date Picker** - Date selection input
- **Command** - Command palette
- **Combobox** - Searchable select
- **Multi-select** - Multiple selection
- **File Upload** - File upload input

### Layout & Navigation (8 components)
- **Accordion** - Collapsible content sections
- **Tabs** - Tab navigation
- **Sidebar** - Application sidebar
- **Separator** - Visual divider
- **Scroll Area** - Custom scrollable region
- **Resizable** - Resizable panels
- **Breadcrumb** - Navigation breadcrumbs
- **Navigation Menu** - Complex navigation

### Overlays & Dialogs (11 components)
- **Dialog** - Modal dialogs
- **Popover** - Floating popover
- **Tooltip** - Hover tooltips
- **Dropdown Menu** - Dropdown menus
- **Sheet** - Slide-out panel
- **Context Menu** - Right-click menu
- **Hover Card** - Hover preview card
- **Menubar** - Application menu bar
- **Command** - Command palette overlay
- **Drawer** - Bottom drawer (mobile)
- **Alert Dialog** - Confirmation dialogs

### Feedback & Status (7 components)
- **Alert** - Alert messages
- **Toast** - Notification toasts
- **Progress** - Progress bars
- **Spinner** - Loading spinners
- **Skeleton** - Loading skeletons
- **Badge** - Status badges
- **Banner** - Info banners

### Display & Media (10 components)
- **Card** - Content cards
- **Table** - Data tables
- **Avatar** - User avatars
- **Chart** - Data visualization
- **Carousel** - Image carousel
- **Image** - Optimized images
- **Aspect Ratio** - Aspect ratio container
- **Video** - Video player
- **Audio** - Audio player
- **Timeline** - Event timeline

### Misc (3 components)
- **Collapsible** - Collapsible content
- **Toggle** - Toggle button
- **Pagination** - Page navigation

## Installation Commands

```bash
# Add a single component
npx shadcn-ui@latest add button

# Add multiple components
npx shadcn-ui@latest add button input card dialog

# View component before installing
npx shadcn-ui@latest view button

# Search for components
npx shadcn-ui@latest search form
```

## Common Patterns

### Button Variants

```typescript
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>
```

### Card Composition

```typescript
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Dialog Pattern

```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      {/* Dialog content */}
    </div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form Pattern

```typescript
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
    <FormField
      control={form.control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <Input placeholder="Enter username" {...field} />
          </FormControl>
          <FormDescription>Your unique username</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

## Common Pitfalls

### ❌ Don't reinvent existing components

```typescript
// ❌ Bad
const CustomButton = ({ children, onClick }) => (
  <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={onClick}>
    {children}
  </button>
)

// ✅ Good
import { Button } from "@/components/ui/button"
<Button onClick={onClick}>{children}</Button>
```

### ❌ Don't skip variant props

```typescript
// ❌ Bad
<Button className="bg-red-500 text-white">Delete</Button>

// ✅ Good
<Button variant="destructive">Delete</Button>
```

### ❌ Don't use raw HTML when shadcn exists

```typescript
// ❌ Bad
<div className="border rounded-lg p-6">
  <h3 className="text-lg font-semibold">Title</h3>
  <p className="text-sm text-gray-500">Description</p>
</div>

// ✅ Good
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
</Card>
```

## Reference

- shadcn/ui documentation: https://ui.shadcn.com
- Component examples: [component-examples.md](component-examples.md)
- Typography system: [typography.md](typography.md)
