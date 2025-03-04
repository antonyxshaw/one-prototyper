import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  try {
    // Log environment variables (without exposing sensitive values)
    console.log("Environment variables check:");
    console.log("google_ai exists:", !!process.env.google_ai);
    console.log("google_ai length:", process.env.google_ai ? process.env.google_ai.length : 0);
    
    // Initialize the Google Generative AI with API key
    const genAI = new GoogleGenerativeAI(process.env.google_ai || "");
    
    // Simple test prompt using gemini-2.0-flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Hello, can you respond with a simple 'Hello World!' message?");
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({ 
      success: true, 
      message: "API is working correctly", 
      response: text 
    });
  } catch (error) {
    console.error("API Test Error:", error);
    
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json({ 
      success: false, 
      message: "API test failed", 
      error: errorMessage 
    }, { status: 500 });
  }
} 