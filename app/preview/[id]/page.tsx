import { getPreview } from "@/lib/blob-storage"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft, Eye, Code2 } from "lucide-react"

// Define the PreviewData type
interface PreviewData {
  prompt: string;
  html: string;
}

export default async function PreviewPage({ params }: { params: { id: string } }) {
  const previewData = await getPreview(params.id) as PreviewData | null

  if (!previewData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Preview not found</h1>
        <p className="text-muted-foreground mb-6">The preview you're looking for doesn't exist or has been removed.</p>
        <Link href="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Prototyper
          </Button>
        </Link>
      </div>
    )
  }

  // Create HTML content for the iframe
  const previewHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Component Preview</title>
      <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
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

        /* ShadCN component styles */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius);
          font-weight: 500;
          padding: 0.5rem 1rem;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .btn-primary {
          background: var(--primary);
          color: var(--primary-foreground);
        }
        .btn-secondary {
          background: var(--secondary);
          color: var(--secondary-foreground);
        }
        .btn-outline {
          border: 1px solid var(--border);
          background: transparent;
        }
        .card {
          border-radius: var(--radius);
          background: var(--card);
          border: 1px solid var(--border);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        .card-header {
          display: flex;
          flex-direction: column;
          padding: 1.5rem 1.5rem 0;
        }
        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .card-description {
          color: var(--muted-foreground);
          font-size: 0.875rem;
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
          border-radius: var(--radius);
          border: 1px solid var(--input);
          padding: 0.5rem;
          font-size: 0.875rem;
          width: 100%;
        }
        .textarea {
          border-radius: var(--radius);
          border: 1px solid var(--input);
          padding: 0.5rem;
          font-size: 0.875rem;
          width: 100%;
          min-height: 80px;
        }
        .avatar {
          border-radius: 9999px;
          overflow: hidden;
          width: 40px;
          height: 40px;
          background: var(--muted);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .separator {
          height: 1px;
          background: var(--border);
          margin: 1rem 0;
        }
        .toast {
          position: fixed;
          bottom: 1rem;
          right: 1rem;
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 50;
        }
        .toast-title {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .error-container {
          padding: 1rem;
          margin: 1rem 0;
          border-radius: var(--radius);
          background: hsl(0 100% 97%);
          border: 1px solid hsl(0 84.2% 90.2%);
          color: hsl(0 84.2% 60.2%);
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          padding: 1rem;
          background: var(--background);
          color: var(--foreground);
        }
        .preview-info {
          margin-bottom: 1rem;
          padding: 0.75rem;
          border-radius: var(--radius);
          background: var(--muted);
          font-size: 0.875rem;
          color: var(--muted-foreground);
        }
      </style>
    </head>
    <body>
      <div class="preview-info">
        <strong>Preview:</strong> ${previewData.prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </div>
      <div id="root"></div>
      <script type="text/babel">
        // Mock ShadCN UI components to make the code work
        const Button = ({children, variant, className, onClick, ...props}) => {
          const classes = \`btn \${variant === 'outline' ? 'btn-outline' : variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} \${className || ''}\`;
          return <button className={classes} onClick={onClick} {...props}>{children}</button>;
        };

        const Card = ({className, children, ...props}) => {
          return <div className={\`card \${className || ''}\`} {...props}>{children}</div>;
        };
        
        const CardHeader = ({className, children, ...props}) => {
          return <div className={\`card-header \${className || ''}\`} {...props}>{children}</div>;
        };
        
        const CardTitle = ({className, children, ...props}) => {
          return <h3 className={\`card-title \${className || ''}\`} {...props}>{children}</h3>;
        };
        
        const CardDescription = ({className, children, ...props}) => {
          return <p className={\`card-description \${className || ''}\`} {...props}>{children}</p>;
        };
        
        const CardContent = ({className, children, ...props}) => {
          return <div className={\`card-content \${className || ''}\`} {...props}>{children}</div>;
        };
        
        const CardFooter = ({className, children, ...props}) => {
          return <div className={\`card-footer \${className || ''}\`} {...props}>{children}</div>;
        };
        
        const Input = ({className, ...props}) => {
          return <input className={\`input \${className || ''}\`} {...props} />;
        };
        
        const Textarea = ({className, ...props}) => {
          return <textarea className={\`textarea \${className || ''}\`} {...props}></textarea>;
        };
        
        const Label = ({className, children, ...props}) => {
          return <label className={\`block text-sm font-medium mb-1 \${className || ''}\`} {...props}>{children}</label>;
        };
        
        const Switch = ({checked, onCheckedChange, ...props}) => {
          return (
            <div className="relative inline-block w-10 h-5 rounded-full bg-gray-200" onClick={() => onCheckedChange && onCheckedChange(!checked)} {...props}>
              <div className={\`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-all \${checked ? 'left-5.5' : 'left-0.5'}\`}></div>
            </div>
          );
        };
        
        const Separator = ({className, ...props}) => {
          return <div className={\`separator \${className || ''}\`} {...props}></div>;
        };
        
        const Avatar = ({className, children, ...props}) => {
          return <div className={\`avatar \${className || ''}\`} {...props}>{children}</div>;
        };
        
        const Toast = ({title, description, ...props}) => {
          return (
            <div className="toast" {...props}>
              {title && <div className="toast-title">{title}</div>}
              {description && <div>{description}</div>}
            </div>
          );
        };

        // Define components namespace
        const components = {
          ui: {
            button: Button,
            card: Card,
            cardHeader: CardHeader,
            cardTitle: CardTitle,
            cardDescription: CardDescription,
            cardContent: CardContent,
            cardFooter: CardFooter,
            input: Input,
            textarea: Textarea,
            label: Label,
            switch: Switch,
            separator: Separator,
            avatar: Avatar,
            toast: Toast
          }
        };

        // Error boundary to catch rendering errors
        class ErrorBoundary extends React.Component {
          constructor(props) {
            super(props);
            this.state = { hasError: false, error: null };
          }

          static getDerivedStateFromError(error) {
            return { hasError: true, error };
          }

          render() {
            if (this.state.hasError) {
              return (
                <div className="error-container">
                  <h3>Component Error</h3>
                  <p>{this.state.error?.message || 'An error occurred while rendering the component'}</p>
                </div>
              );
            }
            return this.props.children;
          }
        }

        // The actual component code
        try {
          ${previewData.html.replace(
            /import\s+{([^}]*)}\s+from\s+["']@\/components\/ui\/([^"']*)["']/g, 
            (_: string, imports: string, component: string) => {
              // This replaces ShadCN imports with our mock components
              return `// Mock import for ${component}`;
            }
          )}

          // Find the default export or the first export function
          const ComponentToRender = (() => {
            // Look for export default or export function statements
            const defaultExportMatch = /export\\s+default\\s+function\\s+(\\w+)/.exec(\`${previewData.html.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);
            const namedExportMatch = /export\\s+function\\s+(\\w+)/.exec(\`${previewData.html.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);
            
            if (defaultExportMatch) {
              return eval(defaultExportMatch[1]);
            } else if (namedExportMatch) {
              return eval(namedExportMatch[1]);
            } else {
              throw new Error("Could not find a component to render");
            }
          })();

          ReactDOM.render(
            <ErrorBoundary>
              <div className="preview-container">
                <ComponentToRender />
              </div>
            </ErrorBoundary>,
            document.getElementById('root')
          );
        } catch (e) {
          ReactDOM.render(
            <div className="error-container">
              <h3>Evaluation Error</h3>
              <p>{e.message}</p>
              <pre style={{ fontSize: '12px', marginTop: '10px', overflow: 'auto', maxHeight: '200px' }}>
                {e.stack}
              </pre>
            </div>,
            document.getElementById('root')
          );
        }
      </script>
    </body>
  </html>
  `;

  return (
    <div className="container max-w-6xl py-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="font-semibold">Preview: {previewData.prompt}</h1>
          </div>
        </div>
      </header>

      <Card className="p-1 min-h-[600px] overflow-hidden">
        <Tabs defaultValue="preview" className="w-full h-full">
          <div className="flex items-center justify-between border-b px-4">
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
          </div>
          
          <TabsContent value="preview" className="mt-0 h-[calc(100%-53px)]">
            <iframe 
              srcDoc={previewHtml}
              className="w-full h-full border-0"
              sandbox="allow-scripts"
              title="Component Preview"
            />
          </TabsContent>
          
          <TabsContent value="code" className="mt-0 h-[calc(100%-53px)] p-4 overflow-auto bg-muted">
            <pre className="text-sm">{previewData.html}</pre>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
} 