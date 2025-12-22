# Component Examples & Patterns

Real-world code examples and common patterns for building UI in this project.

## Form Implementation Examples

### Basic Contact Form

```typescript
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ContactForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="your@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="Your message" rows={4} />
          </div>
          <Button type="submit" className="w-full">Send Message</Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### Product Filter Form

```typescript
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { H4, Small } from "@/components/ui/typography"

export function ProductFilters() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <H4>Category</H4>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mice">Gaming Mice</SelectItem>
            <SelectItem value="keyboards">Keyboards</SelectItem>
            <SelectItem value="headsets">Headsets</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <H4>Price Range</H4>
        <Slider defaultValue={[0, 100]} max={200} step={5} />
        <div className="flex justify-between">
          <Small>S$0</Small>
          <Small>S$200</Small>
        </div>
      </div>

      <div className="space-y-2">
        <H4>Condition</H4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox id="new" />
            <Label htmlFor="new">Like New</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="excellent" />
            <Label htmlFor="excellent">Excellent</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="good" />
            <Label htmlFor="good">Good</Label>
          </div>
        </div>
      </div>

      <Button className="w-full">Apply Filters</Button>
    </div>
  )
}
```

## Layout Patterns

### Product Grid Layout

```typescript
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { H2, PriceDisplay, Muted } from "@/components/ui/typography"

export function ProductGrid({ products }) {
  return (
    <div className="space-y-6">
      <H2>Featured Products</H2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>{product.name}</CardTitle>
                <Badge variant={product.condition === 'new' ? 'default' : 'secondary'}>
                  {product.condition}
                </Badge>
              </div>
              <CardDescription>{product.brand}</CardDescription>
            </CardHeader>
            <CardContent>
              <Muted>{product.description}</Muted>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <PriceDisplay>{product.price}</PriceDisplay>
              <Button>Add to Cart</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### Sidebar Layout

```typescript
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Categories</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/mice">Gaming Mice</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/keyboards">Keyboards</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/headsets">Headsets</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
```

## Data Display Patterns

### Product Table

```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { H2 } from "@/components/ui/typography"

export function ProductTable({ products }) {
  return (
    <div className="space-y-4">
      <H2>Product Inventory</H2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.brand}</TableCell>
              <TableCell>
                <Badge variant="secondary">{product.condition}</Badge>
              </TableCell>
              <TableCell>{product.price}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">View</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

### Statistics Dashboard

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatDisplay, Small } from "@/components/ui/typography"

export function StatsDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Products</CardTitle>
        </CardHeader>
        <CardContent>
          <StatDisplay>1,234</StatDisplay>
          <Small className="text-muted-foreground">+12% from last month</Small>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <StatDisplay>856</StatDisplay>
          <Small className="text-muted-foreground">+8% from last month</Small>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <StatDisplay>S$12,456</StatDisplay>
          <Small className="text-muted-foreground">+23% from last month</Small>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Navigation Patterns

### Tabs Navigation

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ProductTabs() {
  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="specs">Specifications</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
      </TabsList>

      <TabsContent value="details">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Detailed product information...</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="specs">
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Technical specifications...</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reviews">
        <Card>
          <CardHeader>
            <CardTitle>Customer Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Product reviews...</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
```

### Accordion FAQ

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { H2 } from "@/components/ui/typography"

export function FAQ() {
  return (
    <div className="space-y-4">
      <H2>Frequently Asked Questions</H2>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>What is your return policy?</AccordionTrigger>
          <AccordionContent>
            We offer a 14-day return policy on all items in original condition.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>How do you verify product condition?</AccordionTrigger>
          <AccordionContent>
            Each item undergoes a thorough inspection before listing.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Do you offer warranty?</AccordionTrigger>
          <AccordionContent>
            All products come with a 30-day warranty from SecondSense.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
```

## Error Handling UI

### Error Alert

```typescript
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function ErrorAlert({ message }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
```

### Form Error State

```typescript
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Small } from "@/components/ui/typography"

export function FormFieldWithError() {
  const [error, setError] = useState("")

  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        className={error ? "border-destructive" : ""}
      />
      {error && <Small className="text-destructive">{error}</Small>}
    </div>
  )
}
```

## Loading States

### Skeleton Loader

```typescript
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function ProductCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-8 w-1/3" />
      </CardContent>
    </Card>
  )
}
```

### Loading Spinner

```typescript
import { Spinner } from "@/components/ui/spinner"
import { P } from "@/components/ui/typography"

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <Spinner size="lg" />
      <P>Loading products...</P>
    </div>
  )
}
```

## Responsive Design Patterns

### Responsive Grid

```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* Cards */}
</div>
```

### Responsive Typography

```typescript
<Display className="text-2xl md:text-3xl lg:text-4xl">
  Responsive Heading
</Display>
```

### Mobile-First Navigation

```typescript
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <nav className="flex flex-col gap-4">
          <a href="/mice">Gaming Mice</a>
          <a href="/keyboards">Keyboards</a>
          <a href="/headsets">Headsets</a>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

## Reference

- Typography components: [typography.md](typography.md)
- shadcn/ui workflow: [shadcn-workflow.md](shadcn-workflow.md)
- Official shadcn/ui examples: https://ui.shadcn.com/examples
