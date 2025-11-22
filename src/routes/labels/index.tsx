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

export const Route = createFileRoute("/labels/")({
	component: LabelsComponent,
});

function LabelsComponent() {
	const labels = db.labels;

	const exportData = labels.map((label) => ({
		Name: label.name,
		"Department ID": label.department_id,
		ID: label.id,
	}));

	return (
		<div className="p-8 w-full min-w-0">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold tracking-tight">Labels</h1>
				<div className="flex gap-2">
					<ExcelImport />
					<ExcelExport data={exportData} filename="labels" />
				</div>
			</div>

			<div className="rounded-md border grid grid-cols-1">
				<Table>
					<TableCaption>List of labels.</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Department ID</TableHead>
							<TableHead>ID</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{labels.map((label) => (
							<TableRow key={label.id}>
								<TableCell className="font-medium">{label.name}</TableCell>
								<TableCell>{label.department_id}</TableCell>
								<TableCell className="text-muted-foreground text-xs">
									{label.id}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
