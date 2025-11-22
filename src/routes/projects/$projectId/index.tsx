import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { api } from "@/database/api.ts";
import { cn } from "@/lib/utils";

import { MilestoneGraph } from "@/components/MilestoneGraph";

export const Route = createFileRoute("/projects/$projectId/")({
	component: ProjectDetailComponent,
});

function ProjectDetailComponent() {
	const { projectId } = Route.useParams();
	const project = api.getProjectWithMilestones(projectId);
	const [showCompletedOnly, setShowCompletedOnly] = useState(false);

	if (!project) {
		return <div className="p-8">Project not found</div>;
	}

	const filteredMilestones = showCompletedOnly
		? project.milestones.filter((m) => m.completed_at)
		: project.milestones;

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
				<MilestoneGraph milestones={project.milestones} />
			</div>

			{/* Filter */}
			<div className="flex items-center space-x-2">
				<input
					type="checkbox"
					id="showCompleted"
					checked={showCompletedOnly}
					onChange={(e) => setShowCompletedOnly(e.target.checked)}
					className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
				/>
				<label
					htmlFor="showCompleted"
					className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Show Completed Milestones Only
				</label>
			</div>

			{/* Milestones Visualization */}
			<div className="relative overflow-x-auto pb-12">
				<div className="flex items-start space-x-4 min-w-max px-4">
					{filteredMilestones.map((milestone, index) => {
						const isCompleted = !!milestone.completed_at;
						const isLast = index === filteredMilestones.length - 1;

						return (
							<div key={milestone.id} className="flex items-start">
								<div className="flex flex-col items-center space-y-2 w-64">
									{/* Connector Line (visual only, handled by flex layout but we can add explicit lines if needed) */}

									{/* Milestone Node */}
									<div
										className={cn(
											"flex h-12 w-12 items-center justify-center rounded-full border-2 z-10 bg-white",
											isCompleted
												? "border-green-500 text-green-500"
												: "border-gray-300 text-gray-300",
										)}
									>
										{isCompleted ? (
											<CheckCircle2 className="h-6 w-6" />
										) : (
											<Circle className="h-6 w-6" />
										)}
									</div>

									{/* Milestone Info */}
									<div className="text-center space-y-1">
										<div className="font-semibold text-sm">
											{milestone.definition?.execution_number}.{" "}
											{milestone.definition?.name}
										</div>
										<div
											className="text-xs text-muted-foreground line-clamp-2"
											title={milestone.definition?.description}
										>
											{milestone.definition?.description}
										</div>
										{milestone.completed_at && (
											<div className="text-xs text-green-600 font-medium">
												Completed:{" "}
												{new Date(milestone.completed_at).toLocaleDateString()}
											</div>
										)}
										<div className="text-xs text-gray-500">
											{milestone.responsible_person?.name || "Unassigned"}
										</div>
									</div>
								</div>

								{/* Connector to next */}
								{!isLast && (
									<div className="flex items-center h-12 px-2">
										<div
											className={cn(
												"h-[2px] w-8",
												isCompleted &&
													filteredMilestones[index + 1]?.completed_at
													? "bg-green-500"
													: "bg-gray-300",
											)}
										/>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
