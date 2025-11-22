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
import { Button } from "@/components/ui/button";
import { ExcelImport } from "@/components/ExcelImport";
import { api } from "@/database/api.ts";
import type { ProjectMilestone } from "@/database/dto/UtilDTO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle, AlertTriangle } from "lucide-react";

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

	// === KPI calculations ===

	// 1. Number of all projects (distinct by id)
	const totalProjects = new Set(projects.map((p) => p.id)).size;

	// 2. Number of completed projects (closed_at not null / "Null")
	const completedProjects = new Set(
		projects
			.filter((p) => p.closed_at && p.closed_at !== "Null")
			.map((p) => p.id),
	).size;

	// 3. Risk KPIs – leave counts empty for now
	const highRiskProjects: string | number = "";
	const mediumRiskProjects: string | number = "";
	const lowRiskProjects: string | number = "";

	return (
		<div className="p-8">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold tracking-tight">Projects</h1>
				<ExcelImport />
			</div>

			{/* Statistics Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
				{/* Number of Projects */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Number of Projects
						</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalProjects}</div>
						<p className="text-xs text-muted-foreground">
							Total projects in the portfolio
						</p>
					</CardContent>
				</Card>

				{/* Number of Completed Projects */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Number of Completed Projects
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{completedProjects}</div>
						<p className="text-xs text-muted-foreground">
							Projects with a closed status
						</p>
					</CardContent>
				</Card>

				{/* Risk Levels */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Projects by Risk Level
						</CardTitle>
						<AlertTriangle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-2 text-xs">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-red-500" />
									<span>Number of projects with high risk</span>
								</div>
								<span className="text-sm font-semibold">
									{highRiskProjects}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-orange-400" />
									<span>Number of projects with medium risk</span>
								</div>
								<span className="text-sm font-semibold">
									{mediumRiskProjects}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-green-500" />
									<span>Number of projects with low risk</span>
								</div>
								<span className="text-sm font-semibold">
									{lowRiskProjects}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Projects Table */}
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
							<TableHead className="text-right">Actions</TableHead>
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
							const lastCompletedPm =
								completedPms.reduce<ProjectMilestone | null>(
									(latest, current) => {
										if (!latest) return current;
										const latestDate = new Date(latest.completed_at!);
										const currentDate = new Date(current.completed_at!);
										return currentDate > latestDate ? current : latest;
									},
									null,
								);

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
											<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500 text-destructive-foreground hover:bg-destructive/80">
												Closed
											</span>
										) : (
											<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-500 text-white hover:bg-green-600">
												in Progress
											</span>
										)}
									</TableCell>
									<TableCell className="text-right">
										<Button asChild variant="outline" size="sm">
											<Link
												to="/projects/$projectId/edit"
												params={{ projectId: project.id }}
											>
												Edit
											</Link>
										</Button>
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
