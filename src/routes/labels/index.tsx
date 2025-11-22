import { createFileRoute } from "@tanstack/react-router";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ExcelImport } from "@/components/ExcelImport";
import { db } from "@/database/api.ts";

export const Route = createFileRoute("/labels/")({
	component: LabelsComponent,
});

function LabelsComponent() {
	const labels = db.labels;

	return (
		<div className="p-8">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold tracking-tight">Labels</h1>
				<ExcelImport />
			</div>

			<div className="rounded-md border">
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
