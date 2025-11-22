import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import CheckedMilestones from "@/components/generic/CheckedMilestones.tsx";
import Timeline from "@/components/generic/Timeline.tsx";
import { api, db } from "@/database/api.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";

export const Route = createFileRoute("/log/$projectId/$departmentId/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { projectId, departmentId } = Route.useParams();
	const [checkedList, setCheckedList] = useState<string[]>([]);

	const project = api.getProjectById(projectId);
	const department = db.departments.find((d) => d.id === departmentId);
	const milestonesFiltered =
		project?.milestones?.filter(
			(m) => m.definition.department_id === departmentId,
		) ?? [];
	return (
		<div className="p-8 max-w-7xl mx-auto">
			{/* === HEADER === */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Log view</h1>
				<p className="text-lg text-muted-foreground">
					{project?.name}, Dept: {department?.name}
				</p>
			</div>

			{/* === TOP: PROJECT INFO + PHASE BARS === */}
			<div className="mb-10 space-y-4">
				{/* PHASE BANDS */}
				<div className="flex flex-col gap-2">
					<div className="bg-red-900 text-white px-4 py-2 font-semibold">
						Acquisition 1
					</div>
					<div className="bg-red-700 text-white px-4 py-2 font-semibold">
						Acquisition 2
					</div>
					<div className="bg-sky-600 text-white px-4 py-2 font-semibold">
						Category
					</div>
				</div>
			</div>

			{/* TIMELINE + CHECKED LIST */}
			<div className="space-y-6">
				<Timeline
					setCheckedList={setCheckedList}
					milestones={milestonesFiltered}
					departmentId={departmentId}
					projectId={projectId}
				/>
				<CheckedMilestones checkedList={checkedList} />
			</div>
		</div>
	);
}
