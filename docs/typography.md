# Typography System Reference

Complete guide to the typography system in this project. All text styling uses composable typography components from `frontend/components/ui/typography.tsx`.

## Component API Reference

### Import Statement

```typescript
import {
  H1, H2, H3, H4, P, Lead, Large, Small, Muted, Code, Blockquote, List, ListItem,
  Display, PriceDisplay, StatDisplay, Medium, Emoji
} from '@/components/ui/typography'
```

## Component Usage Guide

### Headings & Structure

**H1** - Main page heading
- Styles: `scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl`
- Use for: Top-level page titles
- Example: `<H1>SecondSens Product Catalog</H1>`

**H2** - Section heading with border
- Styles: `text-3xl font-semibold tracking-tight` (includes bottom border by default)
- Use for: Major page sections
- Example: `<H2>Product Recommendations</H2>`

**H3** - Subsection heading
- Styles: `text-2xl font-semibold tracking-tight`
- Use for: Subsections within H2 sections
- Example: `<H3>Gaming Mice</H3>`

**H4** - Minor heading
- Styles: `text-xl font-semibold tracking-tight`
- Use for: Small headings, card titles outside cards
- Example: `<H4>Filter Options</H4>`

**Display** - Large display heading
- Styles: `text-3xl font-bold tracking-tight`
- Use for: Prominent content titles, hero sections
- Example: `<Display>Welcome to SecondSens</Display>`

### Body Text

**P** - Paragraph text
- Styles: `leading-7` (adds top margin to consecutive paragraphs)
- Use for: All paragraph text
- Example: `<P>Find the best deals on used gaming peripherals.</P>`

**Lead** - Introductory text
- Styles: `text-xl text-muted-foreground`
- Use for: Lead paragraphs, subtitles
- Example: `<Lead>Quality pre-owned gear at unbeatable prices</Lead>`

**Large** - Emphasized text block
- Styles: `text-lg font-semibold`
- Use for: Callouts, emphasized statements
- Example: `<Large>Free shipping on orders over S$100</Large>`

**Small** - Small text
- Styles: `text-sm font-medium leading-none`
- Use for: Labels, captions, metadata
- Example: `<Small>Posted 2 hours ago</Small>`

**Muted** - Subtle secondary text
- Styles: `text-sm text-muted-foreground`
- Use for: Supporting info, secondary descriptions
- Example: `<Muted>Condition: Like New</Muted>`

**Medium** - Medium weight text
- Styles: `font-medium`
- Use for: Emphasis without size change
- Example: `<Medium>Important:</Medium> Check compatibility before purchase`

### Special Purpose

**PriceDisplay** - Large bold primary-colored text
- Styles: `text-2xl font-bold text-primary`
- Use for: Prices and monetary values
- Example: `<PriceDisplay>S$99.99</PriceDisplay>`

**StatDisplay** - Medium bold primary-colored text
- Styles: `text-lg font-bold text-primary`
- Use for: Statistics and metrics
- Example: `<StatDisplay>4.8★ (127 reviews)</StatDisplay>`

**Emoji** - Emoji sizing
- Styles: `text-2xl`
- Use for: Consistent emoji display
- Note: **DO NOT USE** - Use Lucide icons instead per project guidelines (`lucide-react`)

**Code** - Inline code styling
- Styles: Monospace with background
- Use for: Inline code snippets
- Example: `<Code>npm install</Code>`

**Blockquote** - Quote styling
- Styles: Border-left with italic
- Use for: Quotations
- Example: `<Blockquote>Best deal I've found!</Blockquote>`

**List** - Unordered list
- Styles: Disc bullets with proper spacing
- Use for: Bullet lists
- Example: `<List><ListItem>Item 1</ListItem></List>`

## Typography Component Selection Guide

### When to use shadcn/ui component typography

**CardTitle** - Only inside `<Card>` components
- Already semantically correct
- Integrated with Card layout
- Example: `<Card><CardHeader><CardTitle>Product Name</CardTitle></CardHeader></Card>`

**DialogTitle** - Only inside `<Dialog>` components
- Required for accessibility (ARIA)
- Integrated with Dialog layout

**CardDescription** - Only inside `<Card>` components
- Muted text for card subtitles
- Proper spacing within Card

### When to use custom typography components

**Display, H1-H4** - Page/section headings outside cards/dialogs
**P, Lead, Muted** - Body text, descriptions, captions
**PriceDisplay, StatDisplay** - Numeric data presentation
**Large, Small, Medium** - Text emphasis and sizing
**Code, Blockquote, List** - Content formatting

### Rule of Thumb

- **shadcn components** = Contextual typography (inside specific UI containers)
- **Custom typography** = Global typography (anywhere else)

## Implementation Examples

### Good Examples

```typescript
// Page layout with proper typography
<div className="space-y-6">
  <Display>Welcome to SecondSens</Display>
  <P>Find the best deals on used gaming peripherals</P>

  <H2>Featured Products</H2>
  <div className="space-y-2">
    <H3>Razer DeathAdder V2</H3>
    <Muted>Excellent condition</Muted>
    <PriceDisplay>S$45.00</PriceDisplay>
  </div>
</div>

// Using CardTitle inside Card
<Card>
  <CardHeader>
    <CardTitle>Product Name</CardTitle>
    <CardDescription>Brief description</CardDescription>
  </CardHeader>
  <CardContent>
    <P>Detailed product information here.</P>
  </CardContent>
</Card>
```

### Bad Examples

```typescript
// ❌ Using inline Tailwind instead of typography components
<div>
  <h2 className="text-3xl font-bold">Welcome</h2>
  <span className="text-2xl font-bold text-primary">S$99.99</span>
</div>

// ❌ Using Display inside a Card (use CardTitle)
<Card>
  <CardHeader>
    <Display>Product Name</Display> {/* Wrong! */}
  </CardHeader>
</Card>

// ❌ Using raw HTML without semantic components
<div>
  <h1>Page Title</h1>
  <p className="text-gray-500">Description</p>
</div>
```

## Customization Patterns

All typography components accept a `className` prop to extend their styles:

```typescript
// Override or extend default styles
<H3 className="text-amber-600 mb-4">Custom Heading</H3>
<Muted className="italic">Styled muted text</Muted>
<P className="mt-2">Paragraph with custom margin</P>

// Combining utilities with semantic typography
<Large className="text-primary">Important message</Large>
<P className="border-l-4 border-primary pl-4">Highlighted paragraph</P>
<Muted className="bg-secondary/50 p-3 rounded">Secondary context</Muted>
```

## Typography with Tailwind Integration

Typography components integrate seamlessly with Tailwind utilities:

```typescript
// Responsive text
<Display className="lg:text-5xl">Responsive Heading</Display>

// Color variants
<P className="text-destructive">Error message</P>
<P className="text-primary">Primary message</P>

// Layout utilities
<div className="space-y-4">
  <H2>Section Title</H2>
  <P>First paragraph</P>
  <P>Second paragraph</P>
</div>
```

## Key Principles

1. **Always use typography components** instead of raw HTML tags with inline Tailwind classes
2. **Maintain semantic HTML** - H1-H4 render as proper heading elements, P as paragraph, etc.
3. **Consistent spacing** - Typography components handle margin top automatically for consecutive paragraphs
4. **Customizable** - Extend with className prop for special cases, but prefer existing variants
5. **Context-aware** - Use shadcn CardTitle/DialogTitle inside their containers, custom components elsewhere

## Common Patterns

### Product Card Typography

```typescript
<Card>
  <CardHeader>
    <CardTitle>Logitech G502 HERO</CardTitle>
    <CardDescription>High-performance gaming mouse</CardDescription>
  </CardHeader>
  <CardContent className="space-y-2">
    <Muted>Condition: Like New</Muted>
    <PriceDisplay>S$65.00</PriceDisplay>
    <Small>Original price: S$129.00</Small>
  </CardContent>
</Card>
```

### Page Header Typography

```typescript
<div className="space-y-4">
  <Display>Gaming Mice</Display>
  <Lead>Precision, speed, and reliability for competitive gaming</Lead>
  <P>Browse our curated selection of pre-owned gaming mice from top brands.</P>
</div>
```

### Stat Display Typography

```typescript
<div className="flex items-center gap-4">
  <StatDisplay>4.8/5.0</StatDisplay>
  <Small>Based on 127 reviews</Small>
</div>
```

## Reference

For more typography patterns, see:
- shadcn/ui Typography: https://ui.shadcn.com/docs/components/typography
- Project-specific examples: [component-examples.md](component-examples.md)
