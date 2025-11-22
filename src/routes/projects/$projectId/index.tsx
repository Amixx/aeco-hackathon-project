import { createFileRoute } from "@tanstack/react-router";
import { MilestoneGraph } from "@/components/MilestoneGraph";
import { api } from "@/database/api.ts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId/")({
	component: ProjectDetailComponent,
});

function ProjectDetailComponent() {
	const { projectId } = Route.useParams();

	const project = api.getProjectById(projectId);
	if (!project) {
		return <div className="p-8">Project not found</div>;
	}

	return (
		<div className="p-8 space-y-8">
			{/* Project Header */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
					<div className="flex items-center space-x-2">
						<span
							className={cn(
								"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
								project.closed_at
									? "border-transparent bg-destructive text-destructive-foreground"
									: "border-transparent bg-green-500 text-white",
							)}
						>
							{project.closed_at ? "Closed" : "Active"}
						</span>
					</div>
				</div>
				<p className="text-muted-foreground max-w-2xl">{project.description}</p>
			</div>

			{/* Milestone Graph */}
			<div className="space-y-2">
				<h2 className="text-xl font-semibold">Milestone Flow</h2>
				<MilestoneGraph
					milestones={project.milestones}
					qualityGates={project.quality_gates}
				/>
			</div>
		</div>
	);
}
