import type { MilestoneDTO } from "./MilestoneDTO";

import type { QualityGateDTO } from "./QualityGateDTO.ts";

export type ProjectDTO = {
	id: string;
	created_at: string;
	updated_at: string;
	name: string;
	description: string;
	milestone_count: number; // Count of total milestones (e.g., 20)
	closed_at: string | null; // timestamp, null = not closed
	milestones?: MilestoneDTO[]; // Related milestones for this project
	quality_gates?: QualityGateDTO[]; // Related quality gates for this project
};
