import type { DepartmentDTO } from "./DepartmentDTO";

export type LabelDTO = {
	id: string;
	name: string;
	description?: string;
	department_id: string;
	department?: DepartmentDTO;
	color: string;
};
