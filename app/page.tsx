import { PrototypingCanvas } from "@/components/prototyping-canvas"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-xl font-bold">UI Prototyper</h1>
          <div className="ml-auto flex items-center space-x-4">
            <Link 
              href="/api-test" 
              className="text-sm px-3 py-1 rounded-md bg-blue-100 hover:bg-blue-200 transition-colors"
            >
              API Test
            </Link>
          </div>
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <PrototypingCanvas />
      </div>
      <Toaster />
    </main>
  )
}

