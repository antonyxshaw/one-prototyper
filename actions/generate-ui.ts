"use server"

import { GoogleGenerativeAI } from "@google/generative-ai";
import { savePreview } from "@/lib/blob-storage";

// Initialize the Google Generative AI with API key from Vercel variables
const genAI = new GoogleGenerativeAI(process.env.google_ai || "");

export async function generateUI(prompt: string): Promise<{ html: string; previewId: string; preview?: string }> {
  try {
    console.log("Starting UI generation with prompt:", prompt);
    console.log("API key exists:", !!process.env.google_ai);
    
    if (!process.env.google_ai) {
      console.log("No API key found, using fallback component");
      const fallbackComponent = generateFallbackComponent(prompt);
      const previewId = await savePreview(prompt, fallbackComponent);
      return { html: fallbackComponent, previewId };
    }
    
    // Get the generative model (using gemini-2.0-flash as per latest docs)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Generate content with the prompt specifically requesting ShadCN-styled React components
    const result = await model.generateContent({
      contents: [{ 
        role: "user",
        parts: [{
          text: `Generate a complete React component for a UI prototype based on this description: "${prompt}".

The component should adhere to ONLY these requirements:

1. COMPONENT LIBRARIES - STRICT RULES:
   - ONLY use Shadcn UI components from this exact list:
     * Button, Card (CardContent, CardHeader, CardTitle, etc.)
     * Input, Textarea, Label, Select
     * Tabs (TabsList, TabsTrigger, TabsContent)
     * Dialog, AlertDialog
     * Form components
     * Avatar, Badge, Calendar, Checkbox, Separator
     * Alert, Toast
   - DO NOT use any components not listed above
   - DO NOT attempt to import or use 3rd party libraries except Framer Motion

2. WORLD-CLASS UI DESIGN PRINCIPLES:
   - Create Airbnb-quality UI with clean, modern aesthetics
   - Use ONLY Tailwind CSS classes for styling
   - Follow these specific design guidelines:
     * Border radius: 16px for cards and containers (rounded-2xl)
     * Buttons: Fully rounded (rounded-full) with proper padding
     * Typography: Clean hierarchy with clear heading/body contrast
     * Spacing: Generous whitespace (p-6, gap-6, my-8, etc.)
     * Colors: Use Tailwind's slate for neutrals, primary for accents
   - Implement subtle, meaningful animations with Framer Motion
   - Use standard Tailwind responsive classes (sm:, md:, lg:)

3. DYNAMIC CONTENT PATTERNS:
   - For card-based UIs: Generate 3-5 cards with varied realistic content
   - For lists: Create 4-8 items with diverse, realistic data
   - For dashboards: Include varied metrics, charts placeholders
   - For forms: Add realistic field labels and placeholder text
   - Include realistic user data (names, locations, prices, dates)
   - Use realistic image placeholders with proper aspect ratios

4. CODE STRUCTURE:
   - Start with "use client" directive at the top
   - Include proper TypeScript types for props and state
   - Use React hooks (useState, useEffect) where needed
   - Keep the code structure simple and maintainable
   - Add helpful comments for complex logic

5. IMPORTS EXACTLY LIKE THIS:
   import { Button } from "@/components/ui/button"
   import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
   import { motion } from "framer-motion"

6. ICONS:
   - Use only Lucide icons (must be imported from lucide-react)
   - Example: import { User, Mail, Heart, Share } from "lucide-react"
   - Use icons purposefully to enhance usability and aesthetics

7. RETURN FORMAT:
   - Return ONLY the complete React TSX code
   - Do not include \`\`\`tsx or \`\`\` markers
   - The code must be ready to copy/paste

8. COMPONENT STRUCTURE:
   - All components MUST export a default function or named function
   - Example: export function MyComponent() or export default function MyComponent()
   - DO NOT use arrow function components
   - Create small sub-components for repeated UI patterns

9. UX BEST PRACTICES:
   - Ensure proper focus states for accessibility
   - Include hover/active states for interactive elements
   - Use appropriate loading states where needed
   - Implement error handling for user inputs
   - Maintain consistent spacing and alignment
   - Add subtle micro-interactions for delight

10. ANIMATION GUIDELINES:
    - Use the following Framer Motion pattern for animations:
      * Define variants objects for animation states
      * Use animate, initial, and whileHover props
      * Implement staggerChildren for list animations
      * Keep animations subtle and purposeful (under 300ms)
    - Add hover animations on cards, buttons, and interactive elements
    - Use subtle fade-ins for initial component mounting

11. SPECIFIC UI PATTERNS:
    - Cards: Subtle shadows (shadow-md), 16px radius, with hover effects
    - Buttons: Fully rounded with proper icon spacing
    - Forms: Clean labels, subtle input styling, helpful validation
    - Navigation: Clear, minimal, with active state indicators
    - Lists: Proper spacing between items, subtle dividers
    - Headers: Clean with balanced element spacing

12. ERROR PREVENTION:
    - Ensure all opening tags have corresponding closing tags
    - Ensure all required props are provided
    - For Tabs, TabsContent MUST be inside Tabs component
    - Check all component nesting requirements

Here's the start of a properly structured world-class UI component with Framer Motion:

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Share, Star, MapPin } from "lucide-react"
import { motion } from "framer-motion"

export function AirbnbStyleListings() {
  const [favorites, setFavorites] = useState<string[]>([])
  
  const listings = [
    {
      id: "1",
      title: "Modern Loft in Downtown",
      location: "San Francisco, California",
      distance: "2 miles away",
      dates: "Nov 12-18",
      price: 149,
      rating: 4.92,
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
    },
    {
      id: "2",
      title: "Beachfront Villa with Ocean View",
      location: "Malibu, California",
      distance: "45 miles away",
      dates: "Dec 3-9",
      price: 325,
      rating: 4.97,
      image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
    },
    {
      id: "3",
      title: "Cozy Mountain Cabin",
      location: "Lake Tahoe, Nevada",
      distance: "3 hour drive",
      dates: "Jan 5-12",
      price: 195,
      rating: 4.89,
      image: "https://images.unsplash.com/photo-1542718610-a1d656d1884c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
    }
  ]
  
  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  }
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.2 } }
  }
  
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <motion.h1 
        className="text-3xl font-bold mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Places to stay near you
      </motion.h1>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {listings.map(listing => (
          <motion.div 
            key={listing.id}
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <Card className="overflow-hidden rounded-2xl h-full">
              <div className="relative aspect-[4/3]">
                <img 
                  src={listing.image} 
                  alt={listing.title}
                  className="object-cover w-full h-full"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white/90"
                  onClick={() => toggleFavorite(listing.id)}
                >
                  <Heart 
                    className={favorites.includes(listing.id) ? "fill-red-500 text-red-500" : "text-slate-700"} 
                    size={18} 
                  />
                </Button>
              </div>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{listing.title}</h3>
                    <div className="flex items-center text-sm text-slate-500 mt-1">
                      <MapPin size={14} className="mr-1" />
                      {listing.location}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{listing.distance}</p>
                    <p className="text-sm text-slate-500">{listing.dates}</p>
                  </div>
                  <div className="flex items-center">
                    <Star size={16} className="text-slate-700 mr-1" />
                    <span className="font-medium">{listing.rating}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-0">
                <p className="font-semibold">${listing.price} <span className="text-slate-500 font-normal">night</span></p>
                <Button variant="outline" size="sm" className="rounded-full">
                  <Share size={14} className="mr-1" />
                  Share
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// Helper function to clean up the generated code
function cleanGeneratedCode(text: string): string {
  // Remove markdown code blocks if present
  let cleanedText = text.replace(/```(tsx|jsx|ts|js)?([\s\S]*?)```/g, '$2');
  
  // If no code blocks were found, return the original text
  if (cleanedText === text) {
    return text.trim();
  }
  
  // Trim whitespace
  cleanedText = cleanedText.trim();
  
  // Ensure the code has the "use client" directive
  if (!cleanedText.startsWith('"use client"') && !cleanedText.startsWith("'use client'")) {
    cleanedText = '"use client"\n\n' + cleanedText;
  }
  
  return cleanedText;
}

// Generate a fallback component when the API fails
function generateFallbackComponent(prompt: string, errorMessage?: string): string {
  return `"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, AlertTriangle } from "lucide-react"

export default function GeneratedComponent() {
  const [showDetails, setShowDetails] = useState(false)
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">UI Prototype: ${prompt.replace(/"/g, '\\"')}</CardTitle>
          <CardDescription>
            This is a fallback component generated when the AI service couldn't create the requested UI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          ${errorMessage ? `
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Generation Error</AlertTitle>
            <AlertDescription>
              ${errorMessage.replace(/"/g, '\\"')}
            </AlertDescription>
          </Alert>
          ` : ''}
          
          <div className="p-4 border rounded-md bg-muted">
            <h3 className="text-lg font-medium mb-2">Prompt</h3>
            <p className="text-sm">${prompt.replace(/"/g, '\\"')}</p>
          </div>
          
          {showDetails && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Troubleshooting</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                  <li>Check if your API key is configured correctly</li>
                  <li>Try a simpler or more specific prompt</li>
                  <li>The service might be temporarily unavailable</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>
          <Button onClick={() => window.location.href = "/"}>Return to Home</Button>
        </CardFooter>
      </Card>
    </div>
  )
}`
}

// Helper function to create a preview-friendly version of the component
function createPreviewVersion(componentCode: string): string {
  try {
    // Extract component name from the code
    let componentName = "GeneratedComponent"; // default fallback
    const defaultExportMatch = /export\s+default\s+function\s+(\w+)/.exec(componentCode);
    const namedExportMatch = /export\s+function\s+(\w+)/.exec(componentCode);
    const arrowFunctionMatch = /export\s+const\s+(\w+)\s+=/.exec(componentCode);
    
    if (defaultExportMatch) {
      componentName = defaultExportMatch[1];
    } else if (namedExportMatch) {
      componentName = namedExportMatch[1];
    } else if (arrowFunctionMatch) {
      componentName = arrowFunctionMatch[1];
    }
    
    // Create simplified preview code
    const simplifiedCode = `
function ${componentName}() {
  ${componentCode
    .replace(/"use client"/, '')
    .replace(/import\s+{[^}]*}\s+from\s+["']@\/components\/ui\/[^"']*["'];?/g, '')
    .replace(/import\s+[^;]*;/g, '')
    .replace(/export\s+default\s+/g, '')
    .replace(/export\s+/g, '')
    .replace(/function\s+${componentName}\s*\(/g, 'return (')}
}

render(<${componentName} />);`;

    return simplifiedCode;
  } catch (error) {
    console.error("Error creating preview version:", error);
    return `
function ErrorComponent() {
  return (
    <div style={{ color: "red", padding: "1rem", border: "1px solid red", borderRadius: "0.5rem" }}>
      Error rendering component. Check the console for details.
    </div>
  );
}

render(<ErrorComponent />);`;
  }
}

