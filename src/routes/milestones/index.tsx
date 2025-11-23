import { createFileRoute } from "@tanstack/react-router";
import { ExcelExport } from "@/components/ExcelExport";
import { ExcelImport } from "@/components/ExcelImport";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { db } from "@/database/api.ts";

export const Route = createFileRoute("/milestones/")({
	component: MilestonesComponent,
});

function MilestonesComponent() {
	const milestones = db.milestones.sort(
		(a, b) => a.execution_number - b.execution_number,
	);

	const exportData = milestones.map((milestone) => {
		const label = db.labels.find((l) => l.id === milestone.label_id);
		const dept = db.departments.find((d) => d.id === milestone.department_id);
		return {
			"#": milestone.execution_number,
			Label: label?.name || "-",
			Name: milestone.name,
			Description: milestone.description,
			Recurring: milestone.recurring ? "Yes" : "No",
			Department: dept?.name || "-",
		};
	});

	return (
		<div className="p-8 w-full min-w-0">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold tracking-tight">
					Milestone Definitions
				</h1>
				<div className="flex gap-2">
					<ExcelImport />
					<ExcelExport data={exportData} filename="milestones" />
				</div>
			</div>

			<div className="rounded-md border grid grid-cols-1">
				<Table>
					<TableCaption>Standard project milestones definitions.</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[50px]">#</TableHead>
							<TableHead>Label</TableHead>
							<TableHead>Name</TableHead>
							<TableHead className="w-[300px]">Description</TableHead>
							<TableHead>Recurring</TableHead>
							<TableHead>Department</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{milestones.map((milestone) => {
							// find label by label_id
							const label = db.labels.find((l) => l.id === milestone.label_id);
							const dept = db.departments.find(
								(d) => d.id === milestone.department_id,
							);

							return (
								<TableRow key={milestone.id}>
									<TableCell className="font-medium">
										{milestone.execution_number}
									</TableCell>
									{/* show label name, fallback to id if something is missing */}
									<TableCell>{label?.name || "-"}</TableCell>
									<TableCell>{milestone.name}</TableCell>
									<TableCell>
										<div>{milestone.description}</div>
										{milestone.hyperlink && (
											<div className="mt-1">
												<a
													href={milestone.hyperlink}
													target="_blank"
													rel="noopener noreferrer"
													className="underline text-blue-600"
												>
													Documentation
												</a>
											</div>
										)}
									</TableCell>
									<TableCell>
										{milestone.previous_quality_gate > 0
											? milestone.previous_quality_gate
											: "-"}
									</TableCell>
									<TableCell>{milestone.recurring ? "Yes" : "No"}</TableCell>
									<TableCell>{dept?.name || "-"}</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
