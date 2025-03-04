import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Share2 } from "lucide-react";

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
          <Share2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
} 