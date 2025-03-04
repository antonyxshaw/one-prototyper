"use server"

import { GoogleGenerativeAI } from "@google/generative-ai";
import { savePreview } from "@/lib/blob-storage";

// Initialize the Google Generative AI with API key from Vercel variables
const genAI = new GoogleGenerativeAI(process.env.google_ai || "");

export async function generateUI(prompt: string): Promise<{ html: string; previewId: string }> {
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
   - DO NOT attempt to import or use 3rd party libraries

2. STYLING:
   - Use ONLY Tailwind CSS classes for styling
   - Follow a clean, minimalist design aesthetic
   - Use standard Tailwind responsive classes (sm:, md:, lg:)

3. CODE STRUCTURE:
   - Start with "use client" directive at the top
   - Include proper TypeScript types for props and state
   - Use React hooks (useState, useEffect) where needed
   - Keep the code structure simple and maintainable

4. SHADCN IMPORTS EXACTLY LIKE THIS:
   import { Button } from "@/components/ui/button"
   import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

5. ICONS:
   - Use only Lucide icons (must be imported from lucide-react)
   - Example: import { User, Mail } from "lucide-react"

6. RETURN FORMAT:
   - Return ONLY the complete React TSX code
   - Do not include \`\`\`tsx or \`\`\` markers
   - The code must be ready to copy/paste

7. COMPONENT STRUCTURE:
   - All components MUST export a default function or named function
   - Example: export function MyComponent() or export default function MyComponent()
   - DO NOT use arrow function components

8. ERROR PREVENTION:
   - Ensure all opening tags have corresponding closing tags
   - Ensure all required props are provided
   - For Tabs, TabsContent MUST be inside Tabs component
   - Check all component nesting requirements

Here's the start of a properly structured ShadCN UI component:

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"

export function ExampleComponent() {
  const [count, setCount] = useState(0)
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Example Component</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setCount(count + 1)}>
          <User className="mr-2 h-4 w-4" />
          Count: {count}
        </Button>
      </CardContent>
    </Card>
  )
}`
        }]
      }],
      // Set a reasonable timeout and max output tokens
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.7,
      }
    });
    
    const response = await result.response;
    const text = response.text();
    
    console.log("Successfully generated UI content");
    
    // Clean up the response to extract just the React code
    const cleanedCode = cleanGeneratedCode(text);
    
    // Save the preview to Vercel Blob storage
    const previewId = await savePreview(prompt, cleanedCode);
    
    return { html: cleanedCode, previewId };
  } catch (error) {
    console.error("Error in generateUI:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Generate a fallback component with the error message
    console.log("Generating fallback component due to error");
    const fallbackComponent = generateFallbackComponent(prompt, error instanceof Error ? error.message : 'Unknown error');
    const previewId = await savePreview(prompt, fallbackComponent);
    
    return { html: fallbackComponent, previewId };
  }
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

