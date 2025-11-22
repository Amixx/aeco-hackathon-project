import type { DepartmentDTO } from "./DepartmentDTO";

export type LabelDTO = {
	id: string;
	name: string;
	department_id: string;
	department?: DepartmentDTO;
};
