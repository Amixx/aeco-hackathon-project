import GeminiTest from "./GeminiTest";
import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="p-8 space-y-8">
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Shadcn Button Test</h2>
        <div className="flex gap-4">
          <Button>Default Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>
      
      <section>
         <h2 className="text-2xl font-bold mb-4">Gemini Test</h2>
         <GeminiTest />
      </section>
    </div>
  );
}

export default App;
