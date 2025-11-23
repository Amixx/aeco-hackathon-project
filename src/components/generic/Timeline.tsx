import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { api } from "@/database/api.ts";
import type { MilestoneDTO } from "@/database/dto/MilestoneDTO.ts";
import type { UserDTO } from "@/database/dto/UserDTO.ts";
import type { ProjectMilestone } from "@/database/dto/UtilDTO.ts";

import type { QualityGateDTO } from "@/database/dto/QualityGateDTO.ts";
import type { QualityGateStatus } from "@/database/dto/UtilDTO.ts";

export type EnrichedProjectMilestone = ProjectMilestone & {
	definition: MilestoneDTO;
	responsible_person?: UserDTO;
};

export type ProjectQualityGateWithStatus = QualityGateDTO & {
	status: QualityGateStatus;
};

export default function Timeline({
	setCheckedList,
	milestones,
	qualityGates,
	departmentId,
	projectId,
}: {
	setCheckedList: (items: string[]) => void;
	milestones?: EnrichedProjectMilestone[];
	qualityGates?: ProjectQualityGateWithStatus[];
	departmentId: string;
	projectId: string;
}) {
	const qgRequirements: Record<number, number> = {
		0: 8,
		1: 17,
		2: 25,
		3: 32,
		4: 40,
		5: 48,
		6: 56,
		7: 64,
		8: 72,
		9: 79,
		10: 81,
	};

	const checkedStuff = milestones?.map((x) => {
		return {
			id: x.definition.id,
			checked:
				Boolean(x.completed_at) && x.definition.department_id === departmentId,
		};
	});
	const [milestonesChecked, setMilestonesChecked] = useState<
		{ id: string; checked: boolean }[]
	>(checkedStuff ?? []);

	// Track the last seen updated_at timestamp for each milestone to avoid resetting local state
	// when parent re-renders but data hasn't actually changed in the DB.
	const lastUpdatedRef = useRef<Record<string, string>>({});

	useEffect(() => {
		const nextUpdatedMap: Record<string, string> = {};
		let needsUpdate = false;

		const nextState =
			milestones?.map((x) => {
				nextUpdatedMap[x.milestone_id] = x.updated_at;

				// Check if we saw this version before
				if (lastUpdatedRef.current[x.milestone_id] !== x.updated_at) {
					needsUpdate = true;
				}

				return {
					id: x.milestone_id,
					checked:
						Boolean(x.completed_at) &&
						x.definition.department_id === departmentId,
				};
			}) ?? [];

		// Also check if count changed (e.g. first load)
		if (
			milestones?.length !== Object.keys(lastUpdatedRef.current).length ||
			// Handle case where milestones is undefined/empty but ref has data
			(milestones === undefined &&
				Object.keys(lastUpdatedRef.current).length > 0)
		) {
			needsUpdate = true;
		}

		if (needsUpdate) {
			setMilestonesChecked(nextState);
			lastUpdatedRef.current = nextUpdatedMap;
		}
	}, [milestones, departmentId]);

	const saveMilestones = () => {
		console.log("Saving milestones & QGs...");

		if (!projectId) return;

		// Save Milestones
		const checkedList = milestonesChecked
			.filter((value) => value.checked)
			.map((value) => value.id);

		api.setProjectDepartmentMilestonesCompletion(
			projectId,
			departmentId,
			checkedList,
		);

		// Save QGs
		qgBoxesChecked.forEach((checked, index) => {
			api.setProjectQualityGateCompletion(
				projectId,
				`qg-${index}`,
				checked
			);
		});
	};

	// QG boxes
	const [qgBoxesChecked, setQGBoxesChecked] = useState<boolean[]>(
		Array(11).fill(false)
	);

	// Track if we have initialized state for this project to prevent overwriting local state
	// on parent re-renders (which happen when setCheckedList is called).
	const loadedProjectIdRef = useRef<string | null>(null);

	useEffect(() => {
		if (qualityGates && projectId !== loadedProjectIdRef.current) {
			const newQGState = Array(11).fill(false);
			// Map loaded QGs to their index (assuming QG IDs are "qg-0", "qg-1", etc.)
			qualityGates.forEach((qg) => {
				const index = parseInt(qg.id.replace("qg-", ""), 10);
				if (!isNaN(index) && index >= 0 && index < 11) {
					newQGState[index] = qg.status === "done";
				}
			});
			setQGBoxesChecked(newQGState);
			loadedProjectIdRef.current = projectId;
		}
	}, [qualityGates, projectId]);

	const toggleMilestone = (milestoneId: string) => {
		const index = milestones?.findIndex((m) => m.milestone_id === milestoneId);
		if (index === undefined || index === -1) return;

		const currentChecked = milestonesChecked[index].checked;
		const desiredState = !currentChecked;

		if (!canToggle("milestone", milestoneId, desiredState)) {
			console.log("Toggle blocked by continuity rule");
			return;
		}

		const newMilestones = [...(milestonesChecked ?? [])];
		newMilestones[index].checked = desiredState;
		setMilestonesChecked(newMilestones);
	};

	const toggleQG = (index: number) => {
		const currentChecked = qgBoxesChecked[index];
		const desiredState = !currentChecked;

		if (!canToggle("qg", index, desiredState)) {
			console.log("Toggle blocked by continuity rule");
			return;
		}

		const newQGs = [...qgBoxesChecked];
		newQGs[index] = desiredState;
		setQGBoxesChecked(newQGs);
	};

	// --- Continuity Logic ---

	// Helper type for the ordered list
	type OrderedItem =
		| { type: "milestone"; id: string; checked: boolean }
		| { type: "qg"; index: number; checked: boolean };

	const canToggle = (
		type: "milestone" | "qg",
		idOrIndex: string | number,
		desiredState: boolean
	): boolean => {
		const items: OrderedItem[] = [];
		const msStatusMap = new Map(milestonesChecked.map((m) => [m.id, m.checked]));

		// Build ordered list of VISIBLE items
		let msCursor = 0;
		const sortedMilestones = milestones || []; // Assuming already sorted by execution_number

		for (let qgIdx = 0; qgIdx <= 10; qgIdx++) {
			const limit = qgRequirements[qgIdx];

			// 1. Add milestones belonging to this QG interval (before the QG)
			while (
				msCursor < sortedMilestones.length &&
				sortedMilestones[msCursor].definition.execution_number <= limit
			) {
				const m = sortedMilestones[msCursor];
				items.push({
					type: "milestone",
					id: m.milestone_id,
					checked: msStatusMap.get(m.milestone_id) ?? false,
				});
				msCursor++;
			}

			// 2. Add the QG itself
			items.push({
				type: "qg",
				index: qgIdx,
				checked: qgBoxesChecked[qgIdx],
			});
		}

		// Find the target item in the list
		const targetIdx = items.findIndex((item) => {
			if (type === "qg") {
				return item.type === "qg" && item.index === idOrIndex;
			}
			return item.type === "milestone" && item.id === idOrIndex;
		});

		if (targetIdx === -1) return true; // Should not happen

		if (desiredState === true) {
			// Checking: Previous item must be checked
			if (targetIdx > 0) {
				const prev = items[targetIdx - 1];
				if (!prev.checked) return false;
			}
		} else {
			// Unchecking: Next item must be unchecked
			if (targetIdx < items.length - 1) {
				const next = items[targetIdx + 1];
				if (next.checked) return false;
			}
		}

		return true;
	};

	useEffect(() => {
		const items: string[] = [];

		// QGs
		qgBoxesChecked.forEach((checked, i) => {
			if (checked) items.push(`QG${i + 1}`);
		});

		// Milestones
		milestonesChecked?.forEach((checked, i) => {
			if (checked.checked) items.push(`M${i + 1}`);
		});

		setCheckedList(items);
	}, [milestonesChecked, qgBoxesChecked, setCheckedList]);

	// Constants for dynamic rendering
	const QG_COUNT = 11;
	const QG_SPACING = 320;
	const QG_START_X = 160;

	// Helper to calculate QG position
	const getQGX = (index: number) => QG_START_X + index * QG_SPACING;

	// Helper to calculate Milestone position with uniform distribution between QGs
	const getMilestoneX = (mNum: number) => {
		// Find which QG interval this milestone belongs to
		let targetQGIndex = -1;
		for (let i = 0; i < QG_COUNT; i++) {
			if (mNum <= qgRequirements[i]) {
				targetQGIndex = i;
				break;
			}
		}
		// Fallback if out of bounds (shouldn't happen with M1-M80)
		if (targetQGIndex === -1) return 0;

		// Determine range of milestones in this interval
		const mLow = targetQGIndex === 0 ? 1 : qgRequirements[targetQGIndex - 1] + 1;
		const mHigh = qgRequirements[targetQGIndex];
		const count = mHigh - mLow + 1;

		// Determine X boundaries
		const xLeft = targetQGIndex === 0 ? 0 : getQGX(targetQGIndex - 1);
		const xRight = getQGX(targetQGIndex);

		// Calculate position
		const width = xRight - xLeft;
		// Distribute evenly: divide space into (count + 1) slots
		const slotWidth = width / (count + 1);
		const indexInGroup = mNum - mLow;

		return xLeft + slotWidth * (indexInGroup + 1);
	};

	const totalWidth = getQGX(QG_COUNT) - 150;

	return (
		<div className="flex flex-col gap-4">
			<div className="timeline-wrapper">
				<div className="timeline-inner" style={{ width: `${totalWidth}px` }}>
					{/* Horizontal line */}
					<div className="timeline-line" style={{ width: "100%" }} />

					{/* === CATEGORY BOXES === */}
					{Array.from({ length: QG_COUNT - 1 }).map((_, i) => {
						const leftPos = getQGX(i);
						const labels = [
							"Decision on the tender",
							"Validation for the tender",
							"Decision on submitting a bid",
							"Final approval of the contract",
							"Prepare for the start of construction",
							"Start of construction",
							"Construction",
							"Construction completion",
							"Warranty / Enforcement",
							"Project completion",
						];
						const label = labels[i] || "";

						return (
							<div
								key={`cat-box-${i}`}
								className="absolute top-0 h-[50px] flex items-center justify-center rounded-lg border bg-card text-card-foreground shadow-sm p-2 text-xs font-semibold text-center"
								style={{
									left: `${leftPos}px`,
									width: `${QG_SPACING - 16}px`,
								}}
							>
								{label}
							</div>
						);
					})}

					{/* === QG TRIANGLES + VERTICAL LINES + BOXES === */}
					{Array.from({ length: QG_COUNT }).map((_, i) => {
						const leftPos = getQGX(i);
						return (
							<div key={`qg-group-${i}`}>
								{/* Triangle */}
								<div
									className={`qg-triangle`}
									style={{
										left: `${leftPos}px`,
										borderBottomColor: qgBoxesChecked[i] ? "#22c55e" : "#ef4444",
									}}
								/>
								{/* Label */}
								<div
									className={`qg-label`}
									style={{
										left: `${leftPos}px`,
										color: qgBoxesChecked[i] ? "#22c55e" : "#ef4444",
									}}
								>
									QG {i}
								</div>
								{/* Line */}
								<div
									className={`qg-line`}
									style={{
										left: `${leftPos}px`,
										borderLeftColor: qgBoxesChecked[i] ? "#22c55e" : "#ef4444",
									}}
								/>

								{/* Box (Clickable) */}
								<div
									className={`qg-box`}
									style={{ left: `${leftPos}px` }}
									onClick={() => toggleQG(i)}
								>
									<div
										className={
											"milestone square " + (qgBoxesChecked[i] ? "checked" : "")
										}
									>
										{qgBoxesChecked[i] ? "✔" : ""}
									</div>
								</div>
							</div>
						);
					})}

					{/* === MILESTONES === */}
					{milestones?.map((m, i) => {
						// Use execution number for position
						const milestoneNum = m.definition.execution_number;

						const labelColor = m.definition.label?.color || "#ccc";
						const checked = milestonesChecked?.find(
							(x) => x.id === m.milestone_id,
						)?.checked;

						// Use milestoneNum for position to ensure they align with QGs
						const leftPos = getMilestoneX(milestoneNum);

						return (
							<div
								key={m.milestone_id}
								className={`milestone-wrapper`}
								style={{ left: `${leftPos}px` }}
								onClick={() => toggleMilestone(m.milestone_id)}
							>
								<div
									className={`milestone circle ${checked ? "checked" : ""}`}
									style={{
										borderColor: labelColor,
										borderWidth: "3px",
										borderStyle: "solid",
									}}
								>
									{checked ? "✔" : milestoneNum}
								</div>
							</div>
						);
					})}
				</div>
			</div>
			<Button className="max-w-20 self-end mr-4" onClick={saveMilestones}>
				Save
			</Button>
		</div>
	);
}
