import departmentsData from "@/database/data/departments.json";
import labelsData from "@/database/data/labels.json";
import milestonesData from "@/database/data/milestones.json";
import projectMilestonesData from "@/database/data/project_milestones.json";
import projectQualityGatesData from "@/database/data/project_quality_gates.json";
import projectsData from "@/database/data/projects.json";
import qualityGateMilestonesData from "@/database/data/quality_gate_milestones.json";
import qualityGatesData from "@/database/data/quality_gates.json";
import usersData from "@/database/data/users.json";
import type { DepartmentDTO } from "@/database/dto/DepartmentDTO.ts";
import type { LabelDTO } from "@/database/dto/LabelDTO.ts";
import type { MilestoneDTO } from "@/database/dto/MilestoneDTO.ts";
import type { ProjectDTO } from "@/database/dto/ProjectDTO.ts";
import type { QualityGateDTO } from "@/database/dto/QualityGateDTO.ts";
import type { UserDTO } from "@/database/dto/UserDTO.ts";
import type {
	ProjectMilestone,
	ProjectQualityGate,
	QualityGateMilestone,
	QualityGateStatus,
} from "@/database/dto/UtilDTO.ts";

// --- Mock Database ---

export const db = {
	departments: departmentsData as DepartmentDTO[],
	labels: labelsData as LabelDTO[],
	users: usersData as UserDTO[],
	projects: projectsData as ProjectDTO[],
	milestones: milestonesData as MilestoneDTO[],
	projectMilestones: projectMilestonesData as ProjectMilestone[],
	projectQualityGates: projectQualityGatesData as ProjectQualityGate[],

	// Quality Gates
	qualityGates: qualityGatesData as QualityGateDTO[],
	qualityGateMilestones: qualityGateMilestonesData as QualityGateMilestone[],
};

import { saveDbToSession } from "./sessionPersistence";

// Helper to simulate joins or queries
export const api = {
	getAllProjects() {
		// returns all projectsDTOS
		const projects = db.projects.map((project) => {
			const milestones = db.projectMilestones
				.filter((pm) => pm.project_id === project.id)
				.map((pm) => {
					const m = db.milestones.find((m) => m.id === pm.milestone_id);
					if (!m) return null;
					return {
						...m,
						label: db.labels.find((l) => l.id === m.label_id),
					};
				})
				.filter((m) => Boolean(m))
				.sort((a, b) => a!.execution_number - b!.execution_number);

			let risk = 1;
			const risks = db.projectQualityGates
				.filter((pqg) => pqg.project_id === project.id)
				.map((pqg) => pqg.risklevel ?? 1);

			if (risks.some((r) => r === 3)) risk = 3;
			else if (risks.some((r) => r === 2)) risk = 2;

			return { ...project, milestones, risk };
		});

		return projects;
	},
	getProjectById(projectId: string) {
		const project = db.projects.find((p) => p.id === projectId);
		if (!project) return null;

		const milestones = db.projectMilestones
			.filter((pm) => pm.project_id === projectId)
			.map((pm) => {
				const milestoneDef = db.milestones.find(
					(m) => m.id === pm.milestone_id,
				);
				const responsibleUser = db.users.find(
					(u) => u.id === pm.responsible_person_id,
				);
				if (!milestoneDef) return null;

				const enrichedMilestone = {
					...milestoneDef,
					label: db.labels.find((l) => l.id === milestoneDef.label_id),
				};

				return {
					...pm,
					definition: enrichedMilestone,
					responsible_person: responsibleUser,
				};
			})
			.filter((m) => m !== null)
			.sort(
				(a, b) =>
					(a.definition?.execution_number || 0) -
					(b.definition?.execution_number || 0),
			);

		// Find relevant quality gates
		const milestoneIds = new Set(milestones.map((m) => m.milestone_id));
		const relevantQGM = db.qualityGateMilestones.filter((qgm) =>
			milestoneIds.has(qgm.milestone_id),
		);
		const gateIds = new Set(relevantQGM.map((qgm) => qgm.quality_gate_id));

		const quality_gates = Array.from(gateIds)
			.map((gateId) => {
				const definition = this.getQualityGateById(gateId);
				if (!definition) return null;

				const projectGate = db.projectQualityGates.find(
					(pqg) =>
						pqg.project_id === projectId && pqg.quality_gate_id === gateId,
				);

				const gateMilestoneIds = definition.milestones.map((m) => m.id);
				const completedCount = milestones.filter(
					(pm) => gateMilestoneIds.includes(pm.milestone_id) && pm.completed_at,
				).length;

				let status: QualityGateStatus = "pending";
				if (projectGate?.completed_at) {
					status = "done";
				} else if (completedCount > 0) {
					status = "in_progress";
				}

				return {
					...definition,
					status,
					risklevel: projectGate?.risklevel ?? null,
				};
			})
			.filter((g) => g !== null);

		return { ...project, milestones, quality_gates };
	},
	addProject(project: ProjectDTO) {
		// receives Project DTO and adds it to db.projects
		const now = new Date().toISOString();

		// Ensure id uniqueness (idempotent add for same id)
		db.projects = db.projects.filter((p) => p.id !== project.id);

		const { milestones, ...rest } = project as ProjectDTO & {
			milestones?: MilestoneDTO[];
		};

		const newProject: ProjectDTO = {
			...rest,
			milestone_count: milestones?.length
				? milestones.length
				: rest.milestone_count,
			updated_at: now,
		};

		// Persist base project (without embedded milestones array)
		db.projects.push({ ...newProject, milestones: undefined });

		// Create project-milestone links if provided
		if (milestones?.length) {
			// Remove any stale links for this id (safety)
			db.projectMilestones = db.projectMilestones.filter(
				(pm) => pm.project_id !== newProject.id,
			);

			const responsibleFallback = db.users[0]?.id ?? "";
			const validMilestones = milestones
				.map((m) => db.milestones.find((mm) => mm.id === m.id))
				.filter((m): m is MilestoneDTO => Boolean(m));

			const links = validMilestones.map((m) => ({
				id: `pm_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
				created_at: now,
				updated_at: now,
				project_id: newProject.id,
				milestone_id: m.id,
				completed_at: null,
				responsible_person_id: responsibleFallback,
				risklevel: null,
			}));
			db.projectMilestones.push(...links);
		}

		const attachedMilestones = db.projectMilestones
			.filter((pm) => pm.project_id === newProject.id)
			.map((pm) => db.milestones.find((m) => m.id === pm.milestone_id))
			.filter((m): m is MilestoneDTO => Boolean(m))
			.sort((a, b) => a.execution_number - b.execution_number);

		saveDbToSession(db);
		return { ...newProject, milestones: attachedMilestones };
	},
	editProject(project: ProjectDTO) {
		// receives Project DTO and edits the corresponding entry on hand of id in db.projects
		const idx = db.projects.findIndex((p) => p.id === project.id);
		if (idx === -1) return null;

		const now = new Date().toISOString();
		const { milestones, ...rest } = project as ProjectDTO & {
			milestones?: MilestoneDTO[];
		};

		const updated: ProjectDTO = {
			...db.projects[idx],
			...rest,
			updated_at: now,
		};

		if (milestones) {
			updated.milestone_count = milestones.length;
		}

		// Persist base record (without embedded milestones array)
		db.projects[idx] = { ...updated, milestones: undefined };

		const attachedMilestones = db.projectMilestones
			.filter((pm) => pm.project_id === updated.id)
			.map((pm) => db.milestones.find((m) => m.id === pm.milestone_id))
			.filter((m): m is MilestoneDTO => Boolean(m))
			.sort((a, b) => a.execution_number - b.execution_number);

		saveDbToSession(db);
		return { ...updated, milestones: attachedMilestones };
	},
	deleteProject(projectId: string) {
		// receives Project id and deletes the corresponding entry from db.projects
		const before = db.projects.length;
		db.projects = db.projects.filter((p) => p.id !== projectId);
		const removed = db.projects.length !== before;

		if (removed) {
			// Also clean up project-milestone links
			db.projectMilestones = db.projectMilestones.filter(
				(pm) => pm.project_id !== projectId,
			);
		}

		saveDbToSession(db);
		return removed;
	},

	// --------------------
	// Quality Gate Methods
	// --------------------
	getAllQualityGates() {
		const withRelations = db.qualityGates.map((gate) => {
			const links = db.qualityGateMilestones.filter(
				(qgm) => qgm.quality_gate_id === gate.id,
			);
			const milestones = links
				.map((qgm) => db.milestones.find((m) => m.id === qgm.milestone_id))
				.filter((m): m is MilestoneDTO => Boolean(m))
				.sort((a, b) => a.execution_number - b.execution_number);

			const status: QualityGateStatus = "pending";

			return { ...gate, status, milestones };
		});

		return withRelations;
	},
	getQualityGateById(qualityGateId: string) {
		const gate = db.qualityGates.find((g) => g.id === qualityGateId);
		if (!gate) return null;

		const links = db.qualityGateMilestones.filter(
			(qgm) => qgm.quality_gate_id === qualityGateId,
		);
		const milestones = links
			.map((qgm) => db.milestones.find((m) => m.id === qgm.milestone_id))
			.filter((m): m is MilestoneDTO => Boolean(m))
			.sort((a, b) => a.execution_number - b.execution_number);

		const status: QualityGateStatus = "pending";

		return { ...gate, status, milestones };
	},
	addQualityGate(gate: QualityGateDTO) {
		const now = new Date().toISOString();

		// Prevent duplicates by id (idempotent add)
		db.qualityGates = db.qualityGates.filter((g) => g.id !== gate.id);

		const {
			milestones,
			status: _status,
			...rest
		} = gate as QualityGateDTO & {
			milestones?: MilestoneDTO[];
		};

		const newGate: QualityGateDTO = {
			...rest,
			created_at: rest.created_at ?? now,
			updated_at: now,
			status: "pending",
			milestones: undefined,
		};

		db.qualityGates.push(newGate);

		if (milestones?.length) {
			// Clean any existing links first
			db.qualityGateMilestones = db.qualityGateMilestones.filter(
				(qgm) => qgm.quality_gate_id !== newGate.id,
			);

			const validMilestones = milestones
				.map((m) => db.milestones.find((mm) => mm.id === m.id))
				.filter((m): m is MilestoneDTO => Boolean(m));

			const links = validMilestones.map((m) => ({
				id: `qgm_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
				created_at: now,
				updated_at: now,
				quality_gate_id: newGate.id,
				milestone_id: m.id,
				// completed_at removed
				is_disabled: false,
			}));
			db.qualityGateMilestones.push(...links);
		}

		// Compose from relations
		const qgmLinks = db.qualityGateMilestones.filter(
			(qgm) => qgm.quality_gate_id === newGate.id,
		);
		const milestonesFull = qgmLinks
			.map((l) => db.milestones.find((mm) => mm.id === l.milestone_id))
			.filter((m): m is MilestoneDTO => Boolean(m))
			.sort((a, b) => a.execution_number - b.execution_number);

		const status = "pending";

		saveDbToSession(db);
		return { ...newGate, milestones: milestonesFull, status };
	},
	editQualityGate(gate: QualityGateDTO) {
		const idx = db.qualityGates.findIndex((g) => g.id === gate.id);
		if (idx === -1) return null;

		const now = new Date().toISOString();
		const {
			milestones,
			status: _status,
			...rest
		} = gate as QualityGateDTO & {
			milestones?: MilestoneDTO[];
		};

		const updated: QualityGateDTO = {
			...db.qualityGates[idx],
			...rest,
			updated_at: now,
			// status will be recalculated from links when returning
		};

		db.qualityGates[idx] = { ...updated, milestones: undefined };

		if (milestones) {
			// Replace links
			db.qualityGateMilestones = db.qualityGateMilestones.filter(
				(qgm) => qgm.quality_gate_id !== updated.id,
			);

			const validMilestones = milestones
				.map((m) => db.milestones.find((mm) => mm.id === m.id))
				.filter((m): m is MilestoneDTO => Boolean(m));

			const newLinks = validMilestones.map((m) => ({
				id: `qgm_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
				created_at: now,
				updated_at: now,
				quality_gate_id: updated.id,
				milestone_id: m.id,
				// completed_at removed
				is_disabled: false,
			}));
			db.qualityGateMilestones.push(...newLinks);
		}

		// Compose from relations
		const qgmLinks = db.qualityGateMilestones.filter(
			(qgm) => qgm.quality_gate_id === updated.id,
		);
		const milestonesFull = qgmLinks
			.map((l) => db.milestones.find((mm) => mm.id === l.milestone_id))
			.filter((m): m is MilestoneDTO => Boolean(m))
			.sort((a, b) => a.execution_number - b.execution_number);

		const status = "pending";

		saveDbToSession(db);
		return { ...updated, milestones: milestonesFull, status };
	},
	deleteQualityGate(qualityGateId: string) {
		const before = db.qualityGates.length;
		db.qualityGates = db.qualityGates.filter((g) => g.id !== qualityGateId);
		const removed = db.qualityGates.length !== before;

		if (removed) {
			db.qualityGateMilestones = db.qualityGateMilestones.filter(
				(qgm) => qgm.quality_gate_id !== qualityGateId,
			);
		}

		saveDbToSession(db);
		return removed;
	},
	setProjectQualityGateCompletion(
		projectId: string,
		qualityGateId: string,
		completed: boolean,
	) {
		let link = db.projectQualityGates.find(
			(pqg) =>
				pqg.project_id === projectId && pqg.quality_gate_id === qualityGateId,
		);

		const now = new Date().toISOString();

		if (!link) {
			if (!completed) return; // Nothing to uncheck if it doesn't exist

			// Create new link
			link = {
				id: `pqg_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
				created_at: now,
				updated_at: now,
				project_id: projectId,
				quality_gate_id: qualityGateId,
				completed_at: null,
				risklevel: null,
			};
			db.projectQualityGates.push(link);
		}

		link.completed_at = completed ? now : null;
		if (completed) {
			link.risklevel = null;
		}
		link.updated_at = now;

		// We return the quality gate info, but context might need project info.
		// The caller likely needs to refresh the project view.
		return link;
	},
	getAllMilestones() {
		return db.milestones;
	},

	getAllProjectMilestones() {
		return db.projectMilestones;
	},
	getAllProjectQualityGates() {
		return db.projectQualityGates;
	},
};
