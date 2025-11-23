import type { DepartmentDTO } from "./DepartmentDTO";
import type { LabelDTO } from "./LabelDTO";
import type { ProjectDTO } from "./ProjectDTO";

export type MilestoneDTO = {
	id: string;
	created_at: string;
	updated_at: string;
	completed_at: string | null;
	execution_number: number; // 1 to X
	label_id: string;
	name: string;
	description: string;
	department_id: string;
	previous_quality_gate: number; // 0 to 10
	recurring: boolean;
	department?: DepartmentDTO; // Owning department
	label?: LabelDTO;
	projects?: ProjectDTO[]; // Projects containing this milestone
	hyperlink?: string | null;
};
