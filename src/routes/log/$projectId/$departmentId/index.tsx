import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import CheckedMilestones from "@/components/generic/CheckedMilestones.tsx";
import Timeline from "@/components/generic/Timeline.tsx";
import { api } from "@/database/api.ts";

export const Route = createFileRoute("/log/$projectId/$departmentId/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { projectId, departmentId } = Route.useParams();
	const [checkedList, setCheckedList] = useState<string[]>([]);

	const project = api.getProjectById(projectId);
	const milestonesFiltered =
		project?.milestones?.filter(
			(m) => m.definition.department_id === departmentId,
		) ?? [];
	return (
		<div className="log-container">
			{/* === TOP: PROJECT INFO + PHASE BARS === */}
			<div className="top-section">
				{/* RIGHT: PHASE BANDS */}
				<div className="phase-bands">
					<div className="phase phase1">Acquisition 1</div>
					<div className="phase phase2">Acquisition 2</div>
					<div className="phase phase3">Category</div>
				</div>
			</div>

			{/* TIMELINE + CHECKED LIST */}
			<div>
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
