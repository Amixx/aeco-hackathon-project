import type { MilestoneDTO } from "./MilestoneDTO";
import type { QualityGateStatus } from "./UtilDTO";

export type QualityGateDTO = {
	id: string;
	created_at: string;
	updated_at: string;
	name?: string;
	description?: string;
	execution_number?: number;
	label_id?: string;
	status: QualityGateStatus;
	milestones?: MilestoneDTO[]; // Related milestones for this quality gate
};
