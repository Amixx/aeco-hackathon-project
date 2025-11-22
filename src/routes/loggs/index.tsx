import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/loggs/")({
  component: LogsPage,
});

function LogsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Logs</h1>
      <p>Logs Page showing a particular project </p>

	  <div className="border rounded-lg overflow-auto w-full h-full bg-white">
        <div className="min-w-[2000px] min-h-[1200px] bg-gray-50 relative">
        </div>
      </div>
    </div>
  );
}
