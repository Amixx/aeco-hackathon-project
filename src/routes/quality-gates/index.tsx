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
import { api } from "@/database/api.ts";

export const Route = createFileRoute("/quality-gates/")({
	component: QualityGatesComponent,
});

function QualityGatesComponent() {
	const qualityGates = api.getAllQualityGates();

	const exportData = qualityGates.map((gate) => ({
		Name: gate.name,
		Description: gate.description,
	}));

	return (
		<div className="p-8 w-full min-w-0">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold tracking-tight">Quality Gates</h1>
				<div className="flex gap-2">
					<ExcelImport />
					<ExcelExport data={exportData} filename="quality-gates" />
				</div>
			</div>

			<div className="rounded-md border grid grid-cols-1">
				<Table>
					<TableCaption>List of quality gates.</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{qualityGates.map((gate) => (
							<TableRow key={gate.id}>
								<TableCell className="font-medium">{gate.name}</TableCell>
								<TableCell>{gate.description}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
