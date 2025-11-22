import { createFileRoute } from "@tanstack/react-router";
import Timeline from "@/components/generic/Timeline.tsx";

export const Route = createFileRoute("/log/$projectId/$departmentId/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { projectId, departmentId } = Route.useParams();

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
				<Timeline />
				<div className="checked-wrapper">
					<div className="checked-section">
						<div className="checked-title">List of checked milestones</div>
						<div className="checked-subtitle">
							Milestones will be filtered when you select a department
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
