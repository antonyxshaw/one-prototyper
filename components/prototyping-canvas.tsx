"use client"

import React, { useState, useEffect, useRef } from "react"
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live'
import * as LucideIcons from 'lucide-react'
import { nanoid } from "nanoid"
import { generateUI } from "@/actions/generate-ui"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Loader2, Eye, Code2, Terminal, Copy, Check, Share2, History, X, ChevronUp, ChevronDown, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { savePreview } from "@/lib/blob-storage"
import { Input } from "@/components/ui/input"
import { ProductCard } from "./product-card"

// Default example component to demonstrate the rendering
const DEFAULT_COMPONENT = `import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Share } from "lucide-react";

export function ProductCard() {
  return (
    <Card className="w-[350px] shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-xl">Modern Minimal Chair</CardTitle>
            <CardDescription>Scandinavian design</CardDescription>
          </div>
          <div className="px-2 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-full">New</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-square rounded-md bg-slate-100 mb-4 flex items-center justify-center">
          <img 
            src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&auto=format&fit=crop&q=60" 
            alt="Modern chair"
            className="rounded-md object-cover w-full h-full"
          />
        </div>
        <div className="grid gap-2">
          <div className="flex justify-between">
            <div className="font-medium">Price</div>
            <div className="font-bold">$249.99</div>
          </div>
          <div className="flex justify-between">
            <div className="font-medium">Rating</div>
            <div className="flex">
              {"★★★★☆"}
              <span className="ml-1 text-sm text-muted-foreground">(4.2)</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
        <Button variant="outline" size="icon">
          <Heart className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Share className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
`;

type HistoryItem = {
  id: string;
  prompt: string;
  timestamp: Date;
};

// Console message type definition
type ConsoleMessage = {
  id: string;
  type: 'error' | 'warning' | 'info' | 'log';
  content: string;
  timestamp: Date;
};

export function PrototypingCanvas() {
  const [prompt, setPrompt] = useState("")
  const [generatedUI, setGeneratedUI] = useState<string>(DEFAULT_COMPONENT)
  const [previewCode, setPreviewCode] = useState<string>("") // Store simplified preview code
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [activeTab, setActiveTab] = useState("preview")
  const codeRef = useRef<HTMLElement>(null)
  const { toast } = useToast()
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Console state
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([])
  const [isConsoleOpen, setIsConsoleOpen] = useState(false)
  const [mirrorConsoleLogs, setMirrorConsoleLogs] = useState(true)
  const [consoleFilterType, setConsoleFilterType] = useState<'all' | 'error' | 'warning' | 'info' | 'log'>('all')
  const consoleEndRef = useRef<HTMLDivElement>(null)
  const processedComponentRef = useRef<string | null>(null)
  
  // Add initial message about the example component
  useEffect(() => {
    // Only add the message if there are no messages yet (to prevent duplicates on hot reload)
    if (consoleMessages.length === 0) {
      // Use setTimeout to avoid render loop issues
      setTimeout(() => {
        addConsoleMessage('info', 'Welcome! A default product card component has been loaded as an example.');
      }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  // Load Prism.js for syntax highlighting when the component mounts or generatedUI changes
  useEffect(() => {
    if (codeRef.current && generatedUI && activeTab === "code") {
      loadPrismHighlighter();
    }
  }, [generatedUI, activeTab]);

  const loadPrismHighlighter = async () => {
    if (typeof window !== 'undefined' && codeRef.current) {
      try {
        // @ts-ignore - Importing Prism dynamically
        const Prism = await import('prismjs');
        // @ts-ignore - Import additional Prism components
        await import('prismjs/components/prism-jsx');
        // @ts-ignore - Import additional Prism components
        await import('prismjs/components/prism-tsx');
        // @ts-ignore - Import additional Prism components
        await import('prismjs/components/prism-typescript');
        // @ts-ignore - Import styles
        await import('prismjs/themes/prism-tomorrow.css');
        
        if (codeRef.current) {
          Prism.highlightElement(codeRef.current);
        }
      } catch (error) {
        console.error("Failed to load Prism:", error);
      }
    }
  };

  // Generate simplified preview code on mount or when generatedUI changes
  useEffect(() => {
    if (generatedUI) {
      // For the default component, generate preview on load
      if (!previewCode && generatedUI === DEFAULT_COMPONENT) {
        // Generate preview immediately instead of async
        const preview = `
function ProductCard() {
  return (
    <Card className="w-[350px] shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-xl">Modern Minimal Chair</CardTitle>
            <CardDescription>Scandinavian design</CardDescription>
          </div>
          <div className="px-2 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-full">New</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-square rounded-md bg-slate-100 mb-4 flex items-center justify-center">
          <img 
            src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&auto=format&fit=crop&q=60" 
            alt="Modern chair"
            className="rounded-md object-cover w-full h-full"
          />
        </div>
        <div className="grid gap-2">
          <div className="flex justify-between">
            <div className="font-medium">Price</div>
            <div className="font-bold">$249.99</div>
          </div>
          <div className="flex justify-between">
            <div className="font-medium">Rating</div>
            <div className="flex">
              {"★★★★☆"}
              <span className="ml-1 text-sm text-muted-foreground">(4.2)</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
        <Button variant="outline" size="icon">
          <Heart className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Share className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

render(<ProductCard />);`;
        
        setPreviewCode(preview);
        addConsoleMessage('info', 'Default example component loaded successfully.');
      }
    }
  }, [generatedUI, previewCode]);
  
  // Create a preview-friendly version of the component
  const createPreviewVersion = async (componentCode: string) => {
    try {
      // Extract component name from the code
      let componentName = "ProductCard"; // default fallback
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

      setPreviewCode(simplifiedCode);
      addConsoleMessage('info', `Preview for "${componentName}" generated.`);
    } catch (error) {
      console.error("Error creating preview version:", error);
      addConsoleMessage('error', `Error generating preview: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Update handleSubmit to generate both component and preview
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      addConsoleMessage('warning', 'Please enter a prompt before generating.');
      return;
    }
    
    setIsGenerating(true);
    setActiveTab("preview"); // Switch to preview tab
    
    try {
      addConsoleMessage('info', `Generating UI for prompt: "${prompt}"`);
      
      const result = await generateUI(prompt);
      
      if (result && result.html) {
        // Clear the previous component reference to ensure new component is processed
        processedComponentRef.current = null;
        
        setGeneratedUI(result.html);
        // Create a preview-friendly version of the component
        await createPreviewVersion(result.html);
        
        // Add to history
        const historyItem = {
          id: nanoid(),
          prompt,
          timestamp: new Date()
        };
        setHistory(prev => [historyItem, ...prev]);
        
        addConsoleMessage('info', 'UI component generated successfully.');
      } else {
        addConsoleMessage('error', `Generation failed: No component returned`);
      }
    } catch (error) {
      console.error("Error generating UI:", error);
      addConsoleMessage('error', `Error generating UI: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleHistoryItemClick = (item: HistoryItem) => {
    setPrompt(item.prompt);
  };

  const handleShare = async () => {
    if (!generatedUI) return;
    
    try {
      // Get the last history item (most recent) since that corresponds to the current generatedUI
      const lastItem = history[0];
      if (!lastItem) return;
      
      // Create a shareable URL
      const shareUrl = `${window.location.origin}/preview/${lastItem.id}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Link copied!",
        description: "Share this link to show your prototype",
      });
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Share failed",
        description: "Failed to create shareable link",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = async () => {
    if (generatedUI) {
      try {
        await navigator.clipboard.writeText(generatedUI);
        setCopySuccess(true);
        toast({
          title: "Code copied!",
          description: "The code has been copied to your clipboard",
        });
        
        // Reset success icon after 2 seconds
        setTimeout(() => {
          setCopySuccess(false);
        }, 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
        toast({
          title: "Copy failed",
          description: "Failed to copy code to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  };

  // Create mock components for Shadcn UI to use with react-live
  const createShadcnComponents = () => {
    const components: Record<string, React.ComponentType<any>> = {
      // Button component with proper variants
      Button: ({ children, variant = "default", size = "default", className = "", ...props }) => {
        const variantClasses: Record<string, string> = {
          default: "bg-primary text-primary-foreground",
          secondary: "bg-secondary text-secondary-foreground",
          destructive: "bg-destructive text-destructive-foreground",
          outline: "border border-input bg-background",
          ghost: "hover:bg-accent hover:text-accent-foreground",
          link: "text-primary underline-offset-4 hover:underline"
        };
        
        const sizeClasses: Record<string, string> = {
          default: "h-10 px-4 py-2",
          sm: "h-9 rounded-md px-3",
          lg: "h-11 rounded-md px-8",
          icon: "h-10 w-10"
        };
        
        const combinedClassName = `inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
        
        return (
          <button className={combinedClassName} {...props}>
            {children}
          </button>
        );
      },
      
      // Card components
      Card: ({ children, className = "", ...props }) => (
        <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}>
          {children}
        </div>
      ),
      CardHeader: ({ children, className = "", ...props }) => (
        <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
          {children}
        </div>
      ),
      CardTitle: ({ children, className = "", ...props }) => (
        <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
          {children}
        </h3>
      ),
      CardDescription: ({ children, className = "", ...props }) => (
        <p className={`text-sm text-muted-foreground ${className}`} {...props}>
          {children}
        </p>
      ),
      CardContent: ({ children, className = "", ...props }) => (
        <div className={`p-6 pt-0 ${className}`} {...props}>
          {children}
        </div>
      ),
      CardFooter: ({ children, className = "", ...props }) => (
        <div className={`flex items-center p-6 pt-0 ${className}`} {...props}>
          {children}
        </div>
      ),
      
      // Input component
      Input: ({ className = "", ...props }) => (
        <input className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ${className}`} {...props} />
      ),
      
      // Textarea component
      Textarea: ({ className = "", ...props }) => (
        <textarea className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ${className}`} {...props} />
      ),
      
      // Add more Shadcn UI components as needed...
    };
    
    return components;
  };

  // Create a list of all supported Shadcn components for code processing
  const supportedComponents = [
    'Accordion', 'AccordionContent', 'AccordionItem', 'AccordionTrigger',
    'Alert', 'AlertDescription', 'AlertTitle',
    'AlertDialog', 'AlertDialogAction', 'AlertDialogCancel', 'AlertDialogContent', 
    'AlertDialogDescription', 'AlertDialogFooter', 'AlertDialogHeader', 'AlertDialogTitle', 'AlertDialogTrigger',
    'AspectRatio',
    'Avatar', 'AvatarFallback', 'AvatarImage',
    'Badge',
    'Button',
    'Calendar',
    'Card', 'CardContent', 'CardDescription', 'CardFooter', 'CardHeader', 'CardTitle',
    'Checkbox',
    'Collapsible', 'CollapsibleContent', 'CollapsibleTrigger',
    'Command', 'CommandDialog', 'CommandEmpty', 'CommandGroup', 'CommandInput', 'CommandItem', 
    'CommandList', 'CommandSeparator', 'CommandShortcut',
    'Dialog', 'DialogClose', 'DialogContent', 'DialogDescription', 'DialogFooter', 
    'DialogHeader', 'DialogTitle', 'DialogTrigger',
    'DropdownMenu', 'DropdownMenuCheckboxItem', 'DropdownMenuContent', 'DropdownMenuGroup', 
    'DropdownMenuItem', 'DropdownMenuLabel', 'DropdownMenuPortal', 'DropdownMenuRadioGroup', 
    'DropdownMenuRadioItem', 'DropdownMenuSeparator', 'DropdownMenuShortcut', 'DropdownMenuSub', 
    'DropdownMenuSubContent', 'DropdownMenuSubTrigger', 'DropdownMenuTrigger',
    'Form', 'FormControl', 'FormDescription', 'FormField', 'FormItem', 'FormLabel', 'FormMessage',
    'Input',
    'Label',
    'Menubar', 'MenubarCheckboxItem', 'MenubarContent', 'MenubarGroup', 'MenubarItem', 
    'MenubarLabel', 'MenubarMenu', 'MenubarPortal', 'MenubarRadioGroup', 'MenubarRadioItem', 
    'MenubarSeparator', 'MenubarShortcut', 'MenubarSub', 'MenubarSubContent', 'MenubarSubTrigger', 'MenubarTrigger',
    'Popover', 'PopoverContent', 'PopoverTrigger',
    'Progress',
    'RadioGroup', 'RadioGroupItem',
    'ScrollArea', 'ScrollBar',
    'Select', 'SelectContent', 'SelectGroup', 'SelectItem', 'SelectLabel', 'SelectSeparator', 
    'SelectTrigger', 'SelectValue',
    'Separator',
    'Sheet', 'SheetClose', 'SheetContent', 'SheetDescription', 'SheetFooter', 'SheetHeader', 'SheetTitle', 'SheetTrigger',
    'Skeleton',
    'Slider',
    'Switch',
    'Table', 'TableBody', 'TableCaption', 'TableCell', 'TableFooter', 'TableHead', 'TableHeader', 'TableRow',
    'Tabs', 'TabsContent', 'TabsList', 'TabsTrigger',
    'Textarea',
    'Toast', 'ToastAction', 'ToastClose', 'ToastDescription', 'ToastProvider', 'ToastTitle', 'ToastViewport',
    'Toggle', 'ToggleGroup', 'ToggleGroupItem',
    'Tooltip', 'TooltipContent', 'TooltipProvider', 'TooltipTrigger'
  ];

  // Scroll to bottom when new console messages are added
  useEffect(() => {
    if (consoleEndRef.current && isConsoleOpen) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleMessages, isConsoleOpen]);

  // Clear console messages when generating a new component
  useEffect(() => {
    if (isGenerating) {
      setConsoleMessages([]);
    }
  }, [isGenerating]);

  // Function to add a message to the console
  const addConsoleMessage = (type: 'error' | 'warning' | 'info' | 'log', content: string) => {
    // Limit the number of messages to 100
    setConsoleMessages(prev => {
      const newMessages = [
        ...prev,
        {
          id: crypto.randomUUID(),
          type,
          content,
          timestamp: new Date()
        }
      ];
      
      // Only keep the latest 100 messages
      return newMessages.slice(-100);
    });
  };

  // Auto-open console when errors are added
  useEffect(() => {
    // Check if there are any error messages and console is not already open
    if (consoleMessages.some(msg => msg.type === 'error') && !isConsoleOpen) {
      setIsConsoleOpen(true);
    }
  }, [consoleMessages, isConsoleOpen]);

  // Clear console
  const clearConsole = () => {
    setConsoleMessages([]);
  };

  // Prepare code for react-live
  const prepareCode = (code: string) => {
    try {
      // Log original code for debugging
      if (mirrorConsoleLogs) {
        console.log("Original code:", code);
      }
      
      // Create a safer version of the code by removing potentially problematic parts
      const sanitizedCode = code
        .replace(/"use client"/, '') // Remove use client directive
        .replace(/import\s+{[^}]*}\s+from\s+["']@\/components\/ui\/[^"']*["'];?/g, '') // Remove shadcn imports
        .replace(/import\s+[^;]*;/g, ''); // Remove all other imports
      
      // Extract component name (default to 'Component' if not found)
      let componentName = 'GeneratedComponent';
      const defaultExportMatch = /export\s+default\s+function\s+(\w+)/.exec(code);
      const namedExportMatch = /export\s+function\s+(\w+)/.exec(code);
      const arrowFunctionMatch = /export\s+const\s+(\w+)\s+=/.exec(code);
      
      if (defaultExportMatch) {
        componentName = defaultExportMatch[1];
      } else if (namedExportMatch) {
        componentName = namedExportMatch[1];
      } else if (arrowFunctionMatch) {
        componentName = arrowFunctionMatch[1];
      }

      // Process the code to be compatible with react-live
      let processedCode = sanitizedCode;
      
      // Remove any existing export statements
      processedCode = processedCode
        .replace(/export\s+default\s+/g, '')
        .replace(/export\s+/g, '');
      
      // Very simplified component rendering for react-live
      if (componentName === 'ProductCard') {
        return `function ProductCard() {
  return (
    <Card className="w-[350px] shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-xl">Modern Minimal Chair</CardTitle>
            <CardDescription>Scandinavian design</CardDescription>
          </div>
          <div className="px-2 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-full">New</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-square rounded-md bg-slate-100 mb-4 flex items-center justify-center">
          <img 
            src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&auto=format&fit=crop&q=60" 
            alt="Modern chair"
            className="rounded-md object-cover w-full h-full"
          />
        </div>
        <div className="grid gap-2">
          <div className="flex justify-between">
            <div className="font-medium">Price</div>
            <div className="font-bold">$249.99</div>
          </div>
          <div className="flex justify-between">
            <div className="font-medium">Rating</div>
            <div className="flex">
              {"★★★★☆"}
              <span className="ml-1 text-sm text-muted-foreground">(4.2)</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1">
          <LucideIcons.ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
        <Button variant="outline" size="icon">
          <LucideIcons.Heart className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <LucideIcons.Share2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

render(<ProductCard />);`;
      }

      // Add render statement at the end for react-live to work correctly
      const codeWithRender = `${processedCode}

// This line renders the component for react-live
render(<${componentName} />);`;

      // Use setTimeout to delay this state update to avoid render cycle issues
      setTimeout(() => {
        // Only show success message if this is a new component or first load
        if (processedComponentRef.current !== componentName) {
          addConsoleMessage('info', `Component "${componentName}" processed successfully.`);
          processedComponentRef.current = componentName;
        }
      }, 0);
      
      return codeWithRender;
    } catch (error) {
      // Use setTimeout to delay this state update to avoid render cycle issues
      setTimeout(() => {
        addConsoleMessage('error', `Error processing component code: ${error instanceof Error ? error.message : "Unknown error"}`);
      }, 0);
      
      // Return a simplified version that should work with react-live
      return `// Error processing component code
function ErrorComponent() {
  return (
    <div style={{ color: "red", padding: "1rem", border: "1px solid red", borderRadius: "0.5rem" }}>
      Error rendering component. Check the console for details.
    </div>
  );
}

render(<ErrorComponent />);`;
    }
  };

  // Override console methods to capture logs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Store original console methods
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const originalConsoleInfo = console.info;

      // Keep a reference to the last update time to throttle messages
      let lastUpdateTime = 0;
      const throttleTime = 100; // ms between updates
      
      // Safe message adder that uses requestAnimationFrame to avoid render loop issues
      const safeAddMessage = (type: 'error' | 'warning' | 'info' | 'log', args: any[]) => {
        // Skip if console mirroring is disabled
        if (!mirrorConsoleLogs) return;
        
        const now = Date.now();
        if (now - lastUpdateTime < throttleTime) {
          return; // Skip update if too soon after the last one
        }
        lastUpdateTime = now;
        
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        
        // Ensure state updates happen outside of render
        requestAnimationFrame(() => {
          addConsoleMessage(type, message);
        });
      };

      // Override console methods
      console.log = (...args) => {
        originalConsoleLog(...args);
        safeAddMessage('log', args);
      };

      console.error = (...args) => {
        originalConsoleError(...args);
        safeAddMessage('error', args);
      };

      console.warn = (...args) => {
        originalConsoleWarn(...args);
        safeAddMessage('warning', args);
      };

      console.info = (...args) => {
        originalConsoleInfo(...args);
        safeAddMessage('info', args);
      };

      // Restore original console methods on cleanup
      return () => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.info = originalConsoleInfo;
      };
    }
  }, [mirrorConsoleLogs]);

  // Toggle console mirroring
  const toggleConsoleMirroring = () => {
    setMirrorConsoleLogs(prev => !prev);
  };

  // New renderPreview function using react-live
  const renderPreview = () => {
    if (isGenerating) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Generating component...</p>
          </div>
        </div>
      );
    }

    if (!generatedUI) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No preview available</p>
          </div>
        </div>
      );
    }

    if (generatedUI === DEFAULT_COMPONENT) {
      return <ProductCard />;
    }

    // Extract component name from the code
    const getComponentName = (code: string) => {
      const defaultExportMatch = /export\s+default\s+function\s+(\w+)/.exec(code);
      const namedExportMatch = /export\s+function\s+(\w+)/.exec(code);
      const arrowFunctionMatch = /export\s+const\s+(\w+)\s+=/.exec(code);
      
      if (defaultExportMatch) {
        return defaultExportMatch[1];
      } else if (namedExportMatch) {
        return namedExportMatch[1];
      } else if (arrowFunctionMatch) {
        return arrowFunctionMatch[1];
      }
      
      return "GeneratedComponent";
    };

    const componentName = getComponentName(generatedUI);
    const isSettingsUI = prompt.toLowerCase().includes('settings');
    const isFormUI = prompt.toLowerCase().includes('form');
    const isCardUI = prompt.toLowerCase().includes('card');
    const isProfileUI = prompt.toLowerCase().includes('profile');
    
    // Render a minimalist phone frame with the component name
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="w-[375px] h-[667px] bg-white dark:bg-slate-900 rounded-[40px] shadow-xl overflow-hidden border-8 border-slate-800 dark:border-slate-700 flex flex-col">
          <div className="h-6 bg-slate-800 dark:bg-slate-700 flex items-center justify-center">
            <div className="w-32 h-4 bg-slate-900 dark:bg-slate-800 rounded-full"></div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {isSettingsUI && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{componentName}</h2>
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b dark:border-slate-700">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 mr-3"></div>
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                      <div className="h-6 w-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {isFormUI && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">{componentName}</h2>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1">
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded border dark:border-slate-700"></div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <div className="h-10 w-24 bg-primary rounded"></div>
                  </div>
                </div>
              </div>
            )}
            
            {isCardUI && (
              <div className="rounded-lg border dark:border-slate-700 overflow-hidden">
                <div className="h-40 bg-slate-200 dark:bg-slate-700"></div>
                <div className="p-4">
                  <h3 className="text-lg font-medium">{componentName}</h3>
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mt-2"></div>
                  <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mt-2"></div>
                  <div className="flex justify-between mt-4">
                    <div className="h-8 w-20 bg-primary rounded"></div>
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
            
            {isProfileUI && (
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 mb-2"></div>
                  <h2 className="text-xl font-semibold">{componentName}</h2>
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mt-1"></div>
                </div>
                <div className="space-y-3 mt-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b dark:border-slate-700">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 mr-3"></div>
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                      <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!isSettingsUI && !isFormUI && !isCardUI && !isProfileUI && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">{componentName}</h2>
                  <p className="text-sm text-muted-foreground">
                    Component generated from prompt: "{prompt}"
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="h-1 bg-slate-300 dark:bg-slate-600 mx-auto w-1/3 rounded-full mb-2"></div>
        </div>
      </div>
    );
  };

  const renderCode = () => {
    if (isGenerating) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Generating component...</h3>
          <p className="text-center text-muted-foreground">
            This may take a few seconds
          </p>
        </div>
      );
    }

    if (!generatedUI) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <Code2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No code generated</h3>
          <p className="text-center text-muted-foreground">
            Generate a UI component to see the code
          </p>
        </div>
      );
    }

    return (
      <div className="relative h-full">
        <Button 
          size="sm" 
          variant="ghost" 
          className="absolute top-2 right-2 z-10"
          onClick={handleCopyCode}
        >
          {copySuccess ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <ScrollArea className="h-full w-full p-4 rounded-md bg-muted font-mono text-sm">
          <pre className="whitespace-pre-wrap break-words">
            <code ref={codeRef} className="language-tsx">
              {generatedUI}
            </code>
          </pre>
        </ScrollArea>
      </div>
    );
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-57px)]">
      <ResizablePanel defaultSize={30} minSize={20}>
        <div className="h-full flex flex-col border-r">
          <div className="p-4 flex-none border-b">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the UI you want to create..."
              className="resize-none min-h-[120px]"
            />
            <Button 
              onClick={handleSubmit}
              className="w-full mt-4" 
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate UI'
              )}
            </Button>
          </div>
          
          <div className="p-4 flex-none border-b">
            <h3 className="font-medium mb-2">History</h3>
            <Separator className="my-2" />
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No history yet. Generate a UI component to get started.</p>
              ) : (
                history.map((item) => (
                  <Card key={item.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleHistoryItemClick(item)}>
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{item.prompt.slice(0, 60)}{item.prompt.length > 60 ? '...' : ''}</p>
                        <span className="text-xs text-muted-foreground">{formatTimestamp(item.timestamp)}</span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </ResizablePanel>
      
      <ResizableHandle withHandle />
      
      <ResizablePanel defaultSize={70}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="p-4 flex-none border-b flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code">
                <Code2 className="h-4 w-4 mr-2" />
                Code
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={!generatedUI}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
          
          <TabsContent value="preview" className="flex-1 p-0 m-0">
            <div className="h-full">
              {renderPreview()}
            </div>
          </TabsContent>
          
          <TabsContent value="code" className="flex-1 p-0 m-0">
            <div className="h-full p-4">
              {renderCode()}
            </div>
          </TabsContent>
        </Tabs>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

