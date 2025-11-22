# Project Guidelines

This document outlines patterns, conventions, and APIs used in this project to help future development remain consistent and predictable.

## Data Model Overview

- DTOs represent plain data structures exchanged across the app.
- Relations between domain objects are represented via explicit link collections:
  - Projects ↔ Milestones via project-milestones links.
  - QualityGates ↔ Milestones via quality-gate-milestones links.
- Timestamps are ISO 8601 strings (e.g., 2025-01-01T12:34:56.000Z).
- IDs are stable strings and must be unique across their respective collections.

## Linking Pattern

- Do not embed arrays of related records directly into persisted collections.
- Instead, persist base records and manage many-to-many or one-to-many relations via link collections.
- When reading, compose enriched objects by joining:
  - For projects: (project-milestones) → milestone definitions (+ optional responsible user).
  - For quality gates: (quality-gate-milestones) → milestone definitions.

## API Surface

Prefer these methods when working with the in-memory API:

- Projects:
  - getAllProjects(): returns all projects with their MilestoneDTO[] sorted by execution_number.
  - getProjectById(id): returns a single project with MilestoneDTO[] or null.
  - addProject(projectDto): inserts/overwrites by id, creates link records from provided milestones, returns enriched project.
  - editProject(projectDto): updates fields; if milestones provided, replaces links; returns enriched project or null if not found.
  - deleteProject(id): removes the project and its links; returns boolean.
  - getProjects(): backward-compatible alias for getAllProjects().

- Quality Gates:
  - getAllQualityGates(): returns all quality gates with MilestoneDTO[] and computed status.
  - getQualityGateById(id): returns a single quality gate with MilestoneDTO[] and computed status or null.
  - addQualityGate(gateDto): inserts/overwrites by id, creates link records, returns enriched gate with computed status.
  - editQualityGate(gateDto): updates fields; if milestones provided, replaces links; returns enriched gate or null if not found.
  - deleteQualityGate(id): removes the gate and its links; returns boolean.
  - setQualityGateMilestoneCompletion(qualityGateId, milestoneId, completed): toggles completion for a milestone link and returns updated gate.

Status logic for QualityGates:
- pending: no milestones completed (or no milestones linked).
- in_progress: at least one milestone completed but not all.
- done: all linked milestones completed.

## Conventions

- TypeScript first: keep DTOs narrow, explicit, and serializable.
- Sorting: when presenting milestones, sort by execution_number ascending.
- Immutability at boundaries: treat API returns as read-only in consumers; use API methods to mutate.
- Idempotency: add methods overwrite existing records with the same id to keep local state predictable.
- Cleanup: delete methods must remove any related link records.

## Adding a New Domain or Relation

1. Define DTO(s) for the domain and link types.
2. Provide corresponding data collections for base and link records.
3. Extend the db with the new collections.
4. Add API methods to read/write and compose enriched objects from base+links.
5. Compute any derived fields (e.g., status) based on link state at read time.
6. Update UI call sites to use the new API; avoid composing in components unless necessary.

## Milestones Best Practices

- Always resolve milestone definitions via the link collections to ensure consistent sorting and metadata.
- When adding or editing a parent entity (project or quality gate), if milestones are included:
  - Replace existing links instead of mutating them in place.
  - Recompute counts or derived fields from the links when returning.

## Dates and IDs

- Use ISO strings for timestamps.
- Generate readable, collision-resistant ids for link records (e.g., prefixed with a domain-specific tag).

## Deprecations

- Prefer getAllProjects() over legacy getProjects(). The latter remains as a thin alias for compatibility.

## Testing and Validation

- Validate existence of referenced IDs when creating links (ignore invalid references).
- After mutations, re-fetch via the API and rely on the enriched shape for rendering.

## Coding Style

- Keep API methods small and pure relative to the in-memory store.
- Avoid directly mutating return values outside API implementations.
- Prefer explicit types in function signatures and returns.
