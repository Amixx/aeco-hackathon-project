import { createFileRoute } from "@tanstack/react-router";
import { Activity, CheckCircle, Clock, Layers } from "lucide-react";
import { MilestoneGraph } from "@/components/MilestoneGraph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

	// Calculate stats
	const totalMilestones = project.milestones.length;
	const completedMilestones = project.milestones.filter(
		(m) => m.completed_at,
	).length;
	const progress =
		totalMilestones > 0
			? Math.round((completedMilestones / totalMilestones) * 100)
			: 0;

	const totalGates = project.quality_gates.length;
	const passedGates = project.quality_gates.filter(
		(g) => g.status === "done",
	).length;

	const departments = new Set(
		project.milestones.map((m) => m?.department_id).filter(Boolean),
	).size;

	const lastActivity = project.milestones
		.filter((m) => m.completed_at)
		.sort(
			(a, b) =>
				new Date(b.completed_at ?? "").getTime() -
				new Date(a.completed_at ?? "").getTime(),
		)[0]?.completed_at;

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

			{/* Statistics Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Milestone Progress
						</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{progress}%</div>
						<p className="text-xs text-muted-foreground">
							{completedMilestones} of {totalMilestones} milestones completed
						</p>
						<div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
							<div
								className="h-full bg-primary transition-all duration-500 ease-in-out"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Quality Gates</CardTitle>
						<CheckCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{passedGates}/{totalGates}
						</div>
						<p className="text-xs text-muted-foreground">
							Passed Quality Gates
						</p>
						<div className="mt-4 flex flex-col gap-1 text-xs">
							<div className="flex items-center gap-1">
								<div className="h-2 w-2 rounded-full bg-green-500" />
								<span>Done</span>
							</div>
							<div className="flex items-center gap-1">
								<div className="h-2 w-2 rounded-full bg-blue-500" />
								<span>In Progress</span>
							</div>
							<div className="flex items-center gap-1">
								<div className="h-2 w-2 rounded-full bg-red-500" />
								<span>Pending</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Departments</CardTitle>
						<Layers className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{departments}</div>
						<p className="text-xs text-muted-foreground">
							Active departments involved
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Last Activity</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{lastActivity
								? new Date(lastActivity).toLocaleDateString()
								: "None"}
						</div>
						<p className="text-xs text-muted-foreground">
							Most recent milestone completion
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Milestone Graph */}
			<div className="space-y-2">
				<MilestoneGraph
					projectId={project.id}
					milestones={project.milestones}
					qualityGates={project.quality_gates}
				/>
			</div>
		</div>
	);
}
