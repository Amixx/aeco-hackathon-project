import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="p-8 space-y-8">
       <h1 className="text-4xl font-bold">Construction Project Manager</h1>
       <p className="text-lg text-muted-foreground">Welcome to the dashboard.</p>
    </div>
  );
}
