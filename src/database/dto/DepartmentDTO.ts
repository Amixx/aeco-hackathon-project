import type { UserDTO } from "./UserDTO";

export type DepartmentDTO = {
	id: string;
	created_at: string;
	updated_at: string;
	name: string;
	description: string;
	users?: UserDTO[]; // Users in this department
};
