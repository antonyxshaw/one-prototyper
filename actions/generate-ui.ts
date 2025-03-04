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
          text: `Generate a complete React component for a UI prototype based on this description: "${prompt}".`
        }]
      }]
    });

    const generatedHTML = await result.response.text(); // Get the generated text from response
    const previewId = await savePreview(prompt, generatedHTML);
    
    return { html: generatedHTML, previewId, preview: "Gemini Preview" };

  } catch (error) {
    console.error("Gemini API error:", error);
    const fallbackComponent = generateFallbackComponent(prompt, error.message);
    const previewId = await savePreview(prompt, fallbackComponent);
    return { html: fallbackComponent, previewId, preview: "Error Preview" };
  }
}

// Helper function to generate fallback component
function generateFallbackComponent(prompt: string, errorMessage?: string): string {
  const sanitizedPrompt = prompt.replace(/"/g, '\\"');
  const sanitizedError = errorMessage ? errorMessage.replace(/"/g, '\\"') : "";

  const lines = [
    '"use client"',
    '',
    'import { useState } from "react"',
    'import { Button } from "@/components/ui/button"',
    'import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"',
    'import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"',
    'import { InfoIcon, AlertTriangle } from "lucide-react"',
    '',
    'export default function GeneratedComponent() {',
    '  const [showDetails, setShowDetails] = useState(false);',
    '',
    '  return (',
    '    <div className="p-6 max-w-4xl mx-auto">',
    '      <Card className="shadow-lg">',
    '        <CardHeader>',
    '          <CardTitle className="text-2xl">UI Prototype: ' + sanitizedPrompt + '</CardTitle>',
    '          <CardDescription>',
    '            This is a fallback component generated when the AI service couldn\'t create the requested UI.',
    '          </CardDescription>',
    '        </CardHeader>',
    '        <CardContent className="space-y-4">',
    sanitizedError ? '          <Alert variant="destructive">' +
      '            <AlertTriangle className="h-4 w-4" />' +
      '            <AlertTitle>Generation Error</AlertTitle>' +
      '            <AlertDescription>' +
      '              ' + sanitizedError +
      '            </AlertDescription>' +
      '          </Alert>' : '',
    '          <div className="p-4 border rounded-md bg-muted">',
    '            <h3 className="text-lg font-medium mb-2">Prompt</h3>',
    '            <p className="text-sm">' + sanitizedPrompt + '</p>',
    '          </div>',
    '          {showDetails && (',
    '            <Alert>',
    '              <InfoIcon className="h-4 w-4" />',
    '              <AlertTitle>Troubleshooting</AlertTitle>',
    '              <AlertDescription>',
    '                <ul className="list-disc pl-5 text-sm space-y-1 mt-2">',
    '                  <li>Check if your API key is configured correctly</li>',
    '                  <li>Try a simpler or more specific prompt</li>',
    '                  <li>The service might be temporarily unavailable</li>',
    '                </ul>',
    '              </AlertDescription>',
    '            </Alert>',
    '          )}',
    '        </CardContent>',
    '        <CardFooter className="flex justify-between">',
    '          <Button variant="outline" onClick={() => setShowDetails(!showDetails)}>',
    '            {showDetails ? "Hide Details" : "Show Details"}',
    '          </Button>',
    '          <Button onClick={() => window.location.href = "/"}>Return to Home</Button>',
    '        </CardFooter>',
    '      </Card>',
    '    </div>',
    '  );',
    '}'
  ];

  return lines.join("\n");
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
    const simplifiedCode = 'Simplified Preview';

    return simplifiedCode;
  } catch (error) {
    console.error("Error creating preview version:", error);
    return "Error rendering preview";
  }
}

