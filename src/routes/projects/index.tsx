import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, CheckCircle } from "lucide-react";
import * as React from "react";
import { ExcelExport } from "@/components/ExcelExport";
import { ExcelImport } from "@/components/ExcelImport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { ProjectMilestone } from "@/database/dto/UtilDTO";

export const Route = createFileRoute("/projects/")({
	component: ProjectsComponent,
});

function getDurationLabel(created_at: string, closed_at?: string | null) {
	const created = new Date(created_at);

	let end: Date;
	if (closed_at && closed_at !== "Null") {
		end = new Date(closed_at);
	} else {
		end = new Date();
	}

	const diffMs = end.getTime() - created.getTime();
	if (!Number.isFinite(diffMs) || diffMs <= 0) return "0 days";

	const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
	return `${days} days`;
}

type ProjectQualityGate = {
	project_id: string;
	quality_gate_id: string;
	completed_at: string | null;
};

function getQualityGateOrder(id: string) {
	// "qg-4" -> 4
	const parts = id.split("-");
	const n = Number(parts[1]);
	return Number.isNaN(n) ? 0 : n;
}


function ProjectsComponent() {
	const [selectedMilestoneId, setSelectedMilestoneId] =
		React.useState<string>("all");

	const projects = api.getAllProjects();
	const projectMilestones = api.getAllProjectMilestones();
	const milestones = api.getAllMilestones();

	// NEW: quality gate data
	const projectQualityGates = api.getAllProjectQualityGates();
	const qualityGates = api.getAllQualityGates();

	// ---- Build meta data per project (so we can reuse for KPIs + table) ----
	const projectsWithMeta = projects.map((project) => {
		// ---- Milestones ----
		const pmsForProject = projectMilestones.filter(
			(pm) => pm.project_id === project.id,
		);

		const distinctMilestoneIds = Array.from(
			new Set(pmsForProject.map((pm) => pm.milestone_id)),
		);
		const totalMilestones = distinctMilestoneIds.length;

		const completedPms = pmsForProject.filter(
			(pm) => pm.completed_at && pm.completed_at !== "",
		);
		const distinctCompletedIds = Array.from(
			new Set(completedPms.map((pm) => pm.milestone_id)),
		);
		const completedCount = distinctCompletedIds.length;

		const checkedMilestonesLabel =
			totalMilestones > 0 ? `${completedCount}/${totalMilestones}` : "-";

		const lastCompletedPm =
			completedPms.reduce<ProjectMilestone | null>((latest, current) => {
				if (!latest) return current;
				const latestDate = new Date(latest.completed_at!);
				const currentDate = new Date(current.completed_at!);
				return currentDate > latestDate ? current : latest;
			}, null) ?? null;

		const lastMilestone =
			lastCompletedPm &&
			milestones.find((m) => m.id === lastCompletedPm.milestone_id);

		const lastMilestoneLabel = lastMilestone
			? `${lastMilestone.execution_number}. ${lastMilestone.name}`
			: lastCompletedPm
				? lastCompletedPm.milestone_id
				: "-";

		// ---- Quality Gates ----
		const pqgsForProject = projectQualityGates.filter(
			(pqg: ProjectQualityGate) => pqg.project_id === project.id,
		);

		const completedQGs = pqgsForProject.filter(
			(pqg) => pqg.completed_at && pqg.completed_at !== "Null",
		);

		const checkedQualityGatesCount = new Set(
			completedQGs.map((pqg) => pqg.quality_gate_id),
		).size;

		const lastCompletedQG =
			completedQGs.reduce<ProjectQualityGate | null>((latest, current) => {
				if (!latest) return current;

				const latestDate = new Date(latest.completed_at!);
				const currentDate = new Date(current.completed_at!);

				if (currentDate > latestDate) return current;
				if (currentDate < latestDate) return latest;

				// dates are equal -> pick the gate with the higher order (qg-2 > qg-1)
				const latestOrder = getQualityGateOrder(latest.quality_gate_id);
				const currentOrder = getQualityGateOrder(current.quality_gate_id);
				return currentOrder > latestOrder ? current : latest;
			}, null) ?? null;


		const lastQualityGate =
			lastCompletedQG &&
			qualityGates.find((qg: any) => qg.id === lastCompletedQG.quality_gate_id);

		const lastQualityGateLabel = lastQualityGate
			? lastQualityGate.name
			: lastCompletedQG
				? lastCompletedQG.quality_gate_id
				: "-";

		const durationLabel = getDurationLabel(
			project.created_at,
			project.closed_at,
		);

		return {
			project,
			checkedMilestonesLabel,
			lastMilestoneLabel,
			durationLabel,
			checkedQualityGatesCount,
			lastQualityGateLabel,
		};
	});

	// ---- Apply filter: "projects end with milestone X" ----
	const filteredProjects = projectsWithMeta.filter((meta) => {
		if (selectedMilestoneId === "all") return true;
		// if no last milestone, can't match a specific one
		const lastCompletedPmForFilter = (() => {
			const pmsForProject = projectMilestones.filter(
				(pm) => pm.project_id === meta.project.id,
			);
			const completedPms = pmsForProject.filter(
				(pm) => pm.completed_at && pm.completed_at !== "",
			);
			return (
				completedPms.reduce<ProjectMilestone | null>((latest, current) => {
					if (!latest) return current;
					const latestDate = new Date(latest.completed_at!);
					const currentDate = new Date(current.completed_at!);
					return currentDate > latestDate ? current : latest;
				}, null) ?? null
			);
		})();

		if (!lastCompletedPmForFilter) return false;
		return lastCompletedPmForFilter.milestone_id === selectedMilestoneId;
	});

	// ---- KPI calculations based on FILTERED projects ----
	const totalProjects = filteredProjects.length;

	const completedProjects = filteredProjects.filter(
		({ project }) => project.closed_at && project.closed_at !== "Null",
	).length;

	// risk KPIs
	const highRiskProjects = filteredProjects.filter(
		({ project }) => project.risk === 3,
	).length;
	const mediumRiskProjects = filteredProjects.filter(
		({ project }) => project.risk === 2,
	).length;
	const lowRiskProjects = filteredProjects.filter(
		({ project }) => project.risk === 1,
	).length;

	const exportData = filteredProjects.map(
		({ project, checkedLabel, lastMilestoneLabel, durationLabel }) => ({
			Project: project.name,
			Description: project.description,
			Risk: project.risk === 3 ? "High" : project.risk === 2 ? "Medium" : "Low",
			Duration: durationLabel,
			"Checked Milestones": checkedLabel,
			"Last Checked Milestone": lastMilestoneLabel,
			Status: project.closed_at ? "Closed" : "In Progress",
		}),
	);

	return (
		<div className="p-8">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold tracking-tight">Projects</h1>
				<div className="flex gap-2">
					<ExcelImport />
					<ExcelExport data={exportData} filename="projects" />
				</div>
			</div>

			{/* Filter */}
			<div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<label className="block text-sm font-medium mb-1">
						Filter projects by last completed milestone
					</label>
					<select
						className="mt-1 block w-full md:w-80 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
						value={selectedMilestoneId}
						onChange={(e) => setSelectedMilestoneId(e.target.value)}
					>
						<option value="all">All milestones</option>
						{milestones.map((ms) => (
							<option key={ms.id} value={ms.id}>
								{ms.execution_number}. {ms.name}
							</option>
						))}
					</select>
				</div>
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
							Total projects in the current view
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
							Closed projects in the current view
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
								<span className="text-sm font-semibold">{lowRiskProjects}</span>
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
							<TableHead>Project Size</TableHead>
							<TableHead>Risk</TableHead>
							<TableHead>Duration</TableHead>
							<TableHead>Checked Quality Gates</TableHead>
							<TableHead>Last Checked Quality Gate</TableHead>
							<TableHead>Checked Milestones</TableHead>
							<TableHead>Last Checked Milestone</TableHead>
							<TableHead className="text-right">Status</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredProjects.map(
							({
								project,
								durationLabel,
								checkedQualityGatesCount,
								lastQualityGateLabel,
								checkedMilestonesLabel,
								lastMilestoneLabel,
							}) => {
								const sizeValue = (project as any)["project_size_Mio€"];
								const projectSizeLabel =
									sizeValue !== undefined && sizeValue !== null
										? `${sizeValue}M€`
										: "-";

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
										<TableCell>{projectSizeLabel}</TableCell>
										<TableCell>
											{project.risk === 3 ? (
												<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-500 text-white">
													High
												</span>
											) : project.risk === 2 ? (
												<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-400 text-white">
													Medium
												</span>
											) : (
												<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-500 text-white">
													Low
												</span>
											)}
										</TableCell>
										<TableCell>{durationLabel}</TableCell>
										<TableCell>{checkedQualityGatesCount}</TableCell>
										<TableCell>{lastQualityGateLabel}</TableCell>
										<TableCell>{checkedMilestonesLabel}</TableCell>
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
							},
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
