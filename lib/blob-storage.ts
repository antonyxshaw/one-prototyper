// Mock implementation for development
import { nanoid } from 'nanoid';

// Use the provided Blob base URL for reference only
const BLOB_BASE_URL = "https://uvuhfcfii8wd6urt.public.blob.vercel-storage.com";

// For debugging
console.log("Using mock Blob storage implementation for development");

export type PreviewData = {
  id: string;
  prompt: string;
  generatedUI: string;
  createdAt: Date;
};

// In-memory storage for development
const previewStore: Record<string, PreviewData> = {};

export async function savePreview(prompt: string, generatedUI: string): Promise<string> {
  try {
    console.log("Saving preview, prompt length:", prompt.length, "UI length:", generatedUI.length);
    
    const id = nanoid(10);
    const previewData: PreviewData = {
      id,
      prompt,
      generatedUI,
      createdAt: new Date(),
    };
    
    // Store in memory for development
    previewStore[id] = previewData;
    
    console.log("Preview saved with ID:", id);
    return id;
  } catch (error) {
    console.error("Error in savePreview:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
}

export async function getPreview(id: string): Promise<PreviewData | null> {
  try {
    console.log("Fetching preview with ID:", id);
    
    // Get from memory store
    const data = previewStore[id];
    
    if (!data) {
      console.error("Preview not found with ID:", id);
      return null;
    }
    
    console.log("Preview fetched successfully");
    return data;
  } catch (error) {
    console.error("Error fetching preview:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    return null;
  }
}

export async function deletePreview(id: string): Promise<boolean> {
  try {
    console.log("Deleting preview with ID:", id);
    
    // Delete from memory store
    if (id in previewStore) {
      delete previewStore[id];
      console.log("Preview deleted successfully");
      return true;
    }
    
    console.error("Preview not found for deletion, ID:", id);
    return false;
  } catch (error) {
    console.error("Error deleting preview:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    return false;
  }
} 