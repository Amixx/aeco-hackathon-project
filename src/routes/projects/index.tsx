import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/database/api.ts";

export const Route = createFileRoute("/projects/")({
	component: ProjectsComponent,
});

function getDurationLabel(created_at: string, closed_at?: string | null) {
	const created = new Date(created_at);

	// if project is closed, use closed_at as end date
	// otherwise use "now"
	let end: Date;
	if (closed_at && closed_at !== "Null") {
		end = new Date(closed_at);
	} else {
		end = new Date(); // current time
	}

	const diffMs = end.getTime() - created.getTime();
	if (!Number.isFinite(diffMs) || diffMs <= 0) return "0 days";

	const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
	return `${days} days`;
}

function ProjectsComponent() {
	const projects = api.getAllProjects();
	const projectMilestones = api.getAllProjectMilestones();
	const milestones = api.getAllMilestones();

	return (
		<div className="p-8">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold tracking-tight">Projects</h1>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableCaption>A list of your recent projects.</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>Project</TableHead>
							<TableHead className="w-[300px]">Description</TableHead>
							<TableHead>Duration</TableHead>
							<TableHead>Checked Milestones</TableHead>
							<TableHead>Last Checked Milestone</TableHead>
							<TableHead className="text-right">Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{projects.map((project) => {
							// all rows in project_milestones.json for this project
							const pmsForProject = projectMilestones.filter(
								(pm) => pm.project_id === project.id,
							);

							// DISTINCT milestone_ids for total milestones
							const distinctMilestoneIds = Array.from(
								new Set(pmsForProject.map((pm) => pm.milestone_id)),
							);
							const totalMilestones = distinctMilestoneIds.length;

							// completed rows = completed_at not null/empty
							const completedPms = pmsForProject.filter(
								(pm) => pm.completed_at && pm.completed_at !== "",
							);
							const distinctCompletedIds = Array.from(
								new Set(completedPms.map((pm) => pm.milestone_id)),
							);
							const completedCount = distinctCompletedIds.length;

							const checkedLabel =
								totalMilestones > 0
									? `${completedCount}/${totalMilestones}`
									: "-";

							// latest completed_at row for this project
							const lastCompletedPm = completedPms.reduce<
								(typeof completedPms)[number] | null
							>((latest, current) => {
								if (!latest) return current;
								const latestDate = new Date(latest.completed_at!);
								const currentDate = new Date(current.completed_at!);
								return currentDate > latestDate ? current : latest;
							}, null);

							// find milestone details by milestone_id
							const lastMilestone =
								lastCompletedPm &&
								milestones.find((m) => m.id === lastCompletedPm.milestone_id);

							const lastMilestoneLabel = lastMilestone
								? `${lastMilestone.execution_number}. ${lastMilestone.name}`
								: lastCompletedPm
									? lastCompletedPm.milestone_id
									: "-";

							const durationLabel = getDurationLabel(
								project.created_at,
								project.closed_at,
							);

							return (
								<TableRow key={project.id}>
									<TableCell className="font-medium">
										<Link
											to="/projects/$projectId"
											params={{ projectId: project.id }}
											className="hover:underline text-blue-600"
										>
											{project.name}
										</Link>
									</TableCell>
									<TableCell>{project.description}</TableCell>
									<TableCell>{durationLabel}</TableCell>
									<TableCell>{checkedLabel}</TableCell>
									<TableCell>{lastMilestoneLabel}</TableCell>
									<TableCell className="text-right">
										{project.closed_at ? (
											<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80">
												Closed
											</span>
										) : (
											<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500 text-white hover:bg-green-600">
												Active
											</span>
										)}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
