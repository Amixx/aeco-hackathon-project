export type Role = "admin" | "project_manager" | "executive";

export type ProjectMilestone = {
	id: string;
	created_at: string;
	updated_at: string;
	project_id: string;
	milestone_id: string;
	completed_at: string | null; // timestamp, null = not completed
	responsible_person_id: string;
};

export type QualityGateStatus = "pending" | "in_progress" | "done";

export type QualityGateMilestone = {
	id: string;
	created_at: string;
	updated_at: string;
	quality_gate_id: string;
	milestone_id: string;
	completed_at: string | null; // timestamp, null = not completed
};
