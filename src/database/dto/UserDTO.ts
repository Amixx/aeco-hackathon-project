import type { DepartmentDTO } from "./DepartmentDTO";

export type UserDTO = {
	id: string;
	created_at: string;
	updated_at: string;
	name: string;
	email: string;
	role: Role;
	department_id: string;
	department?: DepartmentDTO; // Related department
};

export type Role = "admin" | "project_manager" | "executive";
