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

export const Route = createFileRoute("/users/")({
	component: UsersComponent,
});

function UsersComponent() {
	const users = db.users;

	const exportData = users.map((user) => {
		const dept = db.departments.find((d) => d.id === user.department_id);
		return {
			Name: user.name,
			Email: user.email,
			Role: user.role.replace("_", " "),
			Department: dept?.name || user.department_id,
		};
	});

	return (
		<div className="p-8 w-full min-w-0">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-3xl font-bold tracking-tight">Users</h1>
				<div className="flex gap-2">
					<ExcelImport />
					<ExcelExport data={exportData} filename="users" />
				</div>
			</div>

			<div className="rounded-md border grid grid-cols-1">
				<Table>
					<TableCaption>List of registered users.</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Department</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.map((user) => {
							const dept = db.departments.find(
								(d) => d.id === user.department_id,
							);
							return (
								<TableRow key={user.id}>
									<TableCell className="font-medium">{user.name}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell className="capitalize">
										{user.role.replace("_", " ")}
									</TableCell>
									<TableCell>{dept?.name || user.department_id}</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
