"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Loader2, Share2, Code2, Eye, Copy, CheckCircle2 } from "lucide-react"
import { generateUI } from "@/actions/generate-ui"
import { useToast } from "@/components/ui/use-toast"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type HistoryItem = {
  id: string;
  prompt: string;
  timestamp: Date;
};

export function PrototypingCanvas() {
  const [prompt, setPrompt] = useState("")
  const [generatedUI, setGeneratedUI] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [activeTab, setActiveTab] = useState("preview")
  const codeRef = useRef<HTMLElement>(null)
  const { toast } = useToast()

  // Create a sandbox iframe for safely rendering components
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [previewKey, setPreviewKey] = useState(0); // Used to force re-render the iframe

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

  const handleSubmit = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGeneratedUI("");

    try {
      const result = await generateUI(prompt);
      
      // Add to history
      const newId = crypto.randomUUID();
      const newHistoryItem = {
        id: newId,
        prompt,
        timestamp: new Date(),
      };
      
      setGeneratedUI(result.html);
      setHistory(prev => [newHistoryItem, ...prev]);
      setActiveTab("preview"); // Switch to preview after generation
      setPreviewKey(prev => prev + 1); // Force iframe refresh

      // Ensure preview is rendered after a short delay to allow state updates
      setTimeout(() => {
        if (iframeRef.current) {
          refreshPreview();
        }
      }, 500);
      
    } catch (error) {
      console.error("Error generating UI:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate UI component",
        variant: "destructive",
      });
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

  const refreshPreview = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Send a message to the iframe to refresh the component
      try {
        iframeRef.current.contentWindow.postMessage({
          type: 'REFRESH_COMPONENT',
          code: generatedUI
        }, '*');
      } catch (error) {
        console.error("Error sending message to iframe:", error);
      }
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

  // Update the renderPreview function to properly render React components in an iframe
  const renderPreview = () => {
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
          <Eye className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No preview available</h3>
          <p className="text-center text-muted-foreground">
            Generate a UI component to see the preview
          </p>
        </div>
      );
    }

    // The HTML content for the iframe
    const iframeContent = createPreviewContent(generatedUI);

    return (
      <div className="relative h-full w-full">
        <iframe
          key={previewKey}
          ref={iframeRef}
          srcDoc={iframeContent}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="Component Preview"
        />
      </div>
    );
  };

  // Create the HTML content for the preview iframe
  const createPreviewContent = (code: string) => {
    // Create a safer version of the code by removing potentially problematic parts
    const sanitizedCode = code
      .replace(/"use client"/, '') // Remove use client directive
      .replace(/import\s+{[^}]*}\s+from\s+["']@\/components\/ui\/[^"']*["'];?/g, ''); // Remove shadcn imports
    
    // List of all available Shadcn UI components we support
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

    // Include all necessary styles and scripts for ShadcnUI
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Component Preview</title>
          <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"></script>
          <script src="https://unpkg.com/prop-types@15.8.1/prop-types.js"></script>
          <script src="https://unpkg.com/classnames@2.3.2/index.js"></script>
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
          <style>
            /* ShadCN-like styles for the preview */
            :root {
              --background: hsl(0 0% 100%);
              --foreground: hsl(222.2 84% 4.9%);
              --card: hsl(0 0% 100%);
              --card-foreground: hsl(222.2 84% 4.9%);
              --popover: hsl(0 0% 100%);
              --popover-foreground: hsl(222.2 84% 4.9%);
              --primary: hsl(222.2 47.4% 11.2%);
              --primary-foreground: hsl(210 40% 98%);
              --secondary: hsl(210 40% 96.1%);
              --secondary-foreground: hsl(222.2 47.4% 11.2%);
              --muted: hsl(210 40% 96.1%);
              --muted-foreground: hsl(215.4 16.3% 46.9%);
              --accent: hsl(210 40% 96.1%);
              --accent-foreground: hsl(222.2 47.4% 11.2%);
              --destructive: hsl(0 84.2% 60.2%);
              --destructive-foreground: hsl(210 40% 98%);
              --border: hsl(214.3 31.8% 91.4%);
              --input: hsl(214.3 31.8% 91.4%);
              --ring: hsl(222.2 84% 4.9%);
              --radius: 0.5rem;
            }

            [data-theme='dark'] {
              --background: hsl(224 71% 4%);
              --foreground: hsl(213 31% 91%);
              --card: hsl(224 71% 4%);
              --card-foreground: hsl(213 31% 91%);
              --popover: hsl(224 71% 4%);
              --popover-foreground: hsl(213 31% 91%);
              --primary: hsl(210 40% 98%);
              --primary-foreground: hsl(222.2 47.4% 11.2%);
              --secondary: hsl(222.2 47.4% 11.2%);
              --secondary-foreground: hsl(210 40% 98%);
              --muted: hsl(223 47% 11%);
              --muted-foreground: hsl(215.4 16.3% 56.9%);
              --accent: hsl(216 34% 17%);
              --accent-foreground: hsl(210 40% 98%);
              --destructive: hsl(0 63% 31%);
              --destructive-foreground: hsl(210 40% 98%);
              --border: hsl(216 34% 17%);
              --input: hsl(216 34% 17%);
              --ring: hsl(213 31% 91%);
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: var(--background);
              color: var(--foreground);
              padding: 1rem;
            }

            /* Core component styles */
            .btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              white-space: nowrap;
              border-radius: var(--radius);
              font-size: 0.875rem;
              font-weight: 500;
              height: 2.5rem;
              padding-left: 1rem;
              padding-right: 1rem;
              transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
              cursor: pointer;
            }
            .btn-primary {
              background-color: var(--primary);
              color: var(--primary-foreground);
            }
            .btn-secondary {
              background-color: var(--secondary);
              color: var(--secondary-foreground);
            }
            .btn-destructive {
              background-color: var(--destructive);
              color: var(--destructive-foreground);
            }
            .btn-outline {
              border: 1px solid var(--border);
              background-color: transparent;
              color: var(--foreground);
            }
            .btn-ghost {
              background-color: transparent;
              color: var(--foreground);
            }
            .btn-link {
              background-color: transparent;
              color: var(--primary);
              text-decoration: underline;
              height: auto;
              padding: 0;
            }
            
            .card {
              border-radius: var(--radius);
              background-color: var(--card);
              border: 1px solid var(--border);
              box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
              position: relative;
              overflow: hidden;
            }
            .card-header {
              display: flex;
              flex-direction: column;
              padding: 1.5rem 1.5rem 0;
            }
            .card-title {
              font-size: 1.25rem;
              font-weight: 600;
              line-height: 1.2;
            }
            .card-description {
              color: var(--muted-foreground);
              font-size: 0.875rem;
              line-height: 1.4;
              margin-top: 0.25rem;
            }
            .card-content {
              padding: 1.5rem;
            }
            .card-footer {
              display: flex;
              padding: 0 1.5rem 1.5rem;
              gap: 0.5rem;
            }
            
            .input {
              height: 2.5rem;
              width: 100%;
              border-radius: var(--radius);
              border: 1px solid var(--input);
              background-color: transparent;
              padding: 0 0.75rem;
              font-size: 0.875rem;
              color: var(--foreground);
            }
            
            .textarea {
              width: 100%;
              min-height: 5rem;
              border-radius: var(--radius);
              border: 1px solid var(--input);
              background-color: transparent;
              padding: 0.5rem 0.75rem;
              font-size: 0.875rem;
              resize: vertical;
              color: var(--foreground);
            }
            
            .select {
              height: 2.5rem;
              width: 100%;
              border-radius: var(--radius);
              border: 1px solid var(--input);
              background-color: transparent;
              padding: 0 0.75rem;
              font-size: 0.875rem;
              color: var(--foreground);
            }
            
            .label {
              font-size: 0.875rem;
              font-weight: 500;
              line-height: 1.4;
              display: block;
              margin-bottom: 0.5rem;
            }
            
            .checkbox {
              height: 1rem;
              width: 1rem;
              border-radius: 0.25rem;
              border: 1px solid var(--input);
            }
            
            .separator {
              height: 1px;
              background-color: var(--border);
              margin: 1rem 0;
            }
            
            .badge {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 500;
              height: 1.25rem;
              padding-left: 0.5rem;
              padding-right: 0.5rem;
              white-space: nowrap;
            }
            
            .tabs {
              display: flex;
              flex-direction: column;
              width: 100%;
            }
            
            .tabs-list {
              display: flex;
              border-bottom: 1px solid var(--border);
            }
            
            .tabs-trigger {
              padding: 0.5rem 1rem;
              font-size: 0.875rem;
              font-weight: 500;
              border-bottom: 2px solid transparent;
              cursor: pointer;
            }
            
            .tabs-trigger[data-state="active"] {
              border-bottom-color: var(--primary);
            }
            
            .tabs-content {
              padding: 1rem 0;
            }
            
            .alert {
              border-radius: var(--radius);
              padding: 1rem;
              border: 1px solid var(--border);
              background-color: var(--background);
              display: flex;
              gap: 0.5rem;
            }
            
            .alert-destructive {
              border-color: var(--destructive);
              color: var(--destructive);
            }
            
            .avatar {
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              width: 2.5rem;
              height: 2.5rem;
              border-radius: 9999px;
              background-color: var(--muted);
            }

            .error-container {
              padding: 1rem;
              margin: 1rem 0;
              border-radius: var(--radius);
              background: hsl(0 100% 97%);
              border: 1px solid hsl(0 84.2% 90.2%);
              color: hsl(0 84.2% 60.2%);
            }
            
            .preview-container {
              display: flex;
              justify-content: center;
              padding: 2rem;
              min-height: 200px;
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div id="root" class="preview-container"></div>
          
          <script type="text/babel">
            // Create React component library to mimic ShadcnUI
            const shadcn = {};
            
            ${supportedComponents.map(component => `
              shadcn.${component} = ({ children, className = "", ...props }) => {
                const baseClass = "${component.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}";
                return React.createElement("div", { 
                  className: \`\${baseClass} \${className}\`, 
                  "data-component": "${component}",
                  ...props 
                }, children);
              };
            `).join('\n')}
            
            // Special handling for specific components
            shadcn.Button = ({ children, variant = "default", size = "default", className = "", ...props }) => {
              const variants = {
                default: "btn-primary",
                secondary: "btn-secondary",
                destructive: "btn-destructive",
                outline: "btn-outline",
                ghost: "btn-ghost",
                link: "btn-link"
              };
              
              const sizes = {
                default: "",
                sm: "text-xs h-8 px-3",
                lg: "text-base h-11 px-8"
              };
              
              return React.createElement("button", {
                className: \`btn \${variants[variant] || 'btn-primary'} \${sizes[size] || ''} \${className}\`,
                ...props
              }, children);
            };
            
            shadcn.Card = ({ children, className = "", ...props }) => {
              return React.createElement("div", { 
                className: \`card \${className}\`, 
                ...props 
              }, children);
            };
            
            shadcn.CardHeader = ({ children, className = "", ...props }) => {
              return React.createElement("div", { 
                className: \`card-header \${className}\`, 
                ...props 
              }, children);
            };
            
            shadcn.CardTitle = ({ children, className = "", ...props }) => {
              return React.createElement("h3", { 
                className: \`card-title \${className}\`, 
                ...props 
              }, children);
            };
            
            shadcn.CardDescription = ({ children, className = "", ...props }) => {
              return React.createElement("p", { 
                className: \`card-description \${className}\`, 
                ...props 
              }, children);
            };
            
            shadcn.CardContent = ({ children, className = "", ...props }) => {
              return React.createElement("div", { 
                className: \`card-content \${className}\`, 
                ...props 
              }, children);
            };
            
            shadcn.CardFooter = ({ children, className = "", ...props }) => {
              return React.createElement("div", { 
                className: \`card-footer \${className}\`, 
                ...props 
              }, children);
            };
            
            shadcn.Input = ({ className = "", ...props }) => {
              return React.createElement("input", { 
                className: \`input \${className}\`, 
                ...props 
              });
            };
            
            shadcn.Textarea = ({ className = "", ...props }) => {
              return React.createElement("textarea", { 
                className: \`textarea \${className}\`, 
                ...props 
              });
            };
            
            shadcn.Label = ({ children, className = "", ...props }) => {
              return React.createElement("label", { 
                className: \`label \${className}\`, 
                ...props 
              }, children);
            };
            
            shadcn.Separator = ({ className = "", ...props }) => {
              return React.createElement("div", { 
                className: \`separator \${className}\`, 
                ...props 
              });
            };
            
            shadcn.Tabs = ({ children, value, onValueChange, className = "", ...props }) => {
              const [activeTab, setActiveTab] = React.useState(value || "");
              
              const handleTabChange = (newValue) => {
                setActiveTab(newValue);
                if (onValueChange) onValueChange(newValue);
              };
              
              // Create context for tabs
              const TabsContext = React.createContext({ activeTab, handleTabChange });
              
              return React.createElement(TabsContext.Provider, { value: { activeTab, handleTabChange } },
                React.createElement("div", { 
                  className: \`tabs \${className}\`, 
                  ...props 
                }, 
                  React.Children.map(children, child => {
                    if (!child) return null;
                    
                    if (child.type === shadcn.TabsList || child.type === shadcn.TabsContent) {
                      return React.cloneElement(child, { TabsContext });
                    }
                    
                    return child;
                  })
                )
              );
            };
            
            shadcn.TabsList = ({ children, TabsContext, className = "", ...props }) => {
              return React.createElement("div", { 
                className: \`tabs-list \${className}\`, 
                role: "tablist",
                ...props 
              }, 
                React.Children.map(children, child => {
                  if (!child) return null;
                  
                  if (child.type === shadcn.TabsTrigger && TabsContext) {
                    return React.cloneElement(child, { TabsContext });
                  }
                  
                  return child;
                })
              );
            };
            
            shadcn.TabsTrigger = ({ children, value, TabsContext, className = "", ...props }) => {
              if (!TabsContext) {
                console.error("TabsTrigger must be used within Tabs component");
                return null;
              }
              
              const { activeTab, handleTabChange } = React.useContext(TabsContext);
              const isActive = activeTab === value;
              
              return React.createElement("button", { 
                className: \`tabs-trigger \${isActive ? 'active' : ''} \${className}\`, 
                onClick: () => handleTabChange(value),
                role: "tab",
                "aria-selected": isActive,
                "data-state": isActive ? "active" : "inactive",
                ...props 
              }, children);
            };
            
            shadcn.TabsContent = ({ children, value, TabsContext, className = "", ...props }) => {
              if (!TabsContext) {
                console.error("TabsContent must be used within Tabs component");
                return null;
              }
              
              const { activeTab } = React.useContext(TabsContext);
              const isActive = activeTab === value;
              
              if (!isActive) return null;
              
              return React.createElement("div", { 
                className: \`tabs-content \${className}\`, 
                role: "tabpanel",
                "data-state": isActive ? "active" : "inactive",
                ...props 
              }, children);
            };
            
            // Import all Lucide icons
            const Icons = window.lucide;
            
            // ErrorBoundary component
            class ErrorBoundary extends React.Component {
              constructor(props) {
                super(props);
                this.state = { hasError: false, error: null, errorInfo: null };
              }
              
              static getDerivedStateFromError(error) {
                return { hasError: true, error };
              }
              
              componentDidCatch(error, errorInfo) {
                this.setState({ errorInfo });
                console.error("Component error:", error);
                console.error("Error stack:", errorInfo.componentStack);
              }
              
              render() {
                if (this.state.hasError) {
                  return React.createElement("div", { className: "error-container" },
                    React.createElement("h3", null, "Component Error"),
                    React.createElement("p", null, this.state.error?.message || "An error occurred"),
                    React.createElement("pre", { style: { marginTop: "1rem", fontSize: "0.75rem" } },
                      this.state.errorInfo?.componentStack || ""
                    )
                  );
                }
                
                return this.props.children;
              }
            }
            
            // Parse and execute the user code
            try {
              // Prepare the code for execution
              const componentCode = \`
                ${sanitizedCode}
              \`;
              
              // Execute in a safer way
              const ComponentDefinition = new Function('React', 'shadcn', 'Icons', \`
                try {
                  // Mock imports
                  const { ${supportedComponents.join(', ')} } = shadcn;
                  
                  // Access to full Lucide icon set
                  const { \${Object.keys(window.lucide || {}).join(', ')} } = Icons;
                  
                  \${componentCode}
                  
                  // Return the component
                  return ${componentName};
                } catch (error) {
                  console.error("Error in component code:", error);
                  throw error;
                }
              \`);
              
              // Get the component
              const UserComponent = ComponentDefinition(React, shadcn, Icons);
              
              // Render with error boundary
              ReactDOM.render(
                React.createElement(ErrorBoundary, null,
                  React.createElement(UserComponent, null)
                ),
                document.getElementById('root')
              );
            } catch (error) {
              console.error("Failed to render component:", error);
              
              ReactDOM.render(
                React.createElement("div", { className: "error-container" },
                  React.createElement("h3", null, "Failed to Render Component"),
                  React.createElement("p", null, error.message),
                  React.createElement("pre", { style: { marginTop: "1rem", fontSize: "0.75rem" } }, error.stack)
                ),
                document.getElementById('root')
              );
            }
          </script>
        </body>
      </html>
    `;
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
            <CheckCircle2 className="h-4 w-4" />
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

