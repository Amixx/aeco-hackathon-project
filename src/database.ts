import projectsData from "./data/projects.json";
import milestonesData from "./data/milestones.json";
import usersData from "./data/users.json";
import departmentsData from "./data/departments.json";
import projectMilestonesData from "./data/project_milestones.json";

export type Role = "admin" | "project_manager" | "executive";

export type Department = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
};

export type User = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  role: Role;
  department_id: string;
};

export type Project = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  milestone_count: number; // Count of total milestones (e.g., 20)
  closed_at: string | null; // timestamp, null = not closed
};

export type Milestone = {
  id: string;
  created_at: string;
  updated_at: string;
  execution_number: number; // 1 to X
  label: string;
  name: string;
  description: string;
  department_id: string;
  previous_quality_gate: number; // 0 to 10
  recurring: boolean;
};

export type ProjectMilestone = {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  milestone_id: string;
  completed_at: string | null; // timestamp, null = not completed
  responsible_person_id: string;
};

// --- Mock Database ---

export const db = {
  departments: departmentsData as Department[],
  users: usersData as User[],
  projects: projectsData as Project[],
  milestones: milestonesData as Milestone[],
  projectMilestones: projectMilestonesData as ProjectMilestone[],
};

// Helper to simulate joins or queries
export const api = {
  getProjectWithMilestones: (projectId: string) => {
    const project = db.projects.find((p) => p.id === projectId);
    if (!project) return null;

    const pMilestones = db.projectMilestones
      .filter((pm) => pm.project_id === projectId)
      .map((pm) => {
        const milestoneDef = db.milestones.find(
          (m) => m.id === pm.milestone_id
        );
        const responsibleUser = db.users.find(
          (u) => u.id === pm.responsible_person_id
        );
        return {
          ...pm,
          definition: milestoneDef,
          responsible_person: responsibleUser,
        };
      })
      .sort(
        (a, b) =>
          (a.definition?.execution_number || 0) -
          (b.definition?.execution_number || 0)
      );

    return {
      ...project,
      milestones: pMilestones,
    };
  },

  getProjects: () => {
    return db.projects.map((project) => {
      // Find the current milestone (first uncompleted one)
      const pMilestones = db.projectMilestones
        .filter((pm) => pm.project_id === project.id)
        .map((pm) => ({
          ...pm,
          definition: db.milestones.find((m) => m.id === pm.milestone_id),
        }))
        .sort(
          (a, b) =>
            (a.definition?.execution_number || 0) -
            (b.definition?.execution_number || 0)
        );

      const currentMilestone = pMilestones.find((pm) => !pm.completed_at);

      return {
        ...project,
        current_milestone:
          currentMilestone ? currentMilestone.definition : null,
      };
    });
  },
};
