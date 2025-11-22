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
import { db } from "@/database";

export const Route = createFileRoute("/departments/")({
	component: DepartmentsComponent,
});

function DepartmentsComponent() {
	const departments = db.departments;

	return (
		<div className="p-8">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold tracking-tight">Departments</h1>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableCaption>List of organization departments.</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead className="w-[400px]">Description</TableHead>
							<TableHead>ID</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{departments.map((dept) => (
							<TableRow key={dept.id}>
								<TableCell className="font-medium">{dept.name}</TableCell>
								<TableCell>{dept.description}</TableCell>
								<TableCell className="text-muted-foreground text-xs">
									{dept.id}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
