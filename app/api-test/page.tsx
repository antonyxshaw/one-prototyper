"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function ApiTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    response?: string;
    error?: string;
  } | null>(null);

  async function testApi() {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/test-api");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to fetch API",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Google Gemini API Test</CardTitle>
          <CardDescription>
            Test if your Google Gemini API key is working correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              </div>
              <AlertDescription className="mt-2">
                {result.message}
                {result.error && (
                  <div className="mt-2 p-2 bg-muted rounded-md text-sm font-mono overflow-auto">
                    {result.error}
                  </div>
                )}
                {result.response && (
                  <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                    <strong>API Response:</strong>
                    <div className="mt-1">{result.response}</div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={testApi} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing API...
              </>
            ) : (
              "Test API Connection"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 