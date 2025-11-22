import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { api } from "@/database/api.ts";
import type { MilestoneDTO } from "@/database/dto/MilestoneDTO.ts";
import type { ProjectMilestone } from "@/database/dto/UtilDTO.ts";
import type { UserDTO } from "@/database/dto/UserDTO.ts";

export type EnrichedProjectMilestone = ProjectMilestone & {
	definition: MilestoneDTO;
	responsible_person?: UserDTO;
};

export default function Timeline({
	setCheckedList,
	milestones,
	departmentId,
	projectId,
}: {
	setCheckedList: (items: string[]) => void;
	milestones?: EnrichedProjectMilestone[];
	departmentId: string;
	projectId: string;
}) {
	const qgRequirements: Record<number, number> = {
		0: 0, // QG1 requires nothing
		1: 5, // QG2 requires M1–M5
		2: 11, // QG3 requires M1–M11
		3: 16, // QG4 requires M1–M16
		4: 20, // QG5 requires M1–M20
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
		console.log("Saving milestones...");
		const checkedList = milestonesChecked
			.filter((value) => value.checked)
			.map((value) => value.id);

		if (!projectId) return;
		api.setProjectDepartmentMilestonesCompletion(
			projectId,
			departmentId,
			checkedList,
		);
	};

	// QG boxes 1–3 checked, 4–5 unchecked
	const [qgBoxesChecked, setQGBoxesChecked] = useState<boolean[]>([
		true,
		true,
		true,
		false,
		false,
	]);

	const toggleMilestone = (milestoneId: string) => {
		const index = milestones?.findIndex((m) => m.milestone_id === milestoneId);
		if (index === undefined || index === -1) return;
		const newMilestones = [...(milestonesChecked ?? [])];
		newMilestones[index].checked = !newMilestones[index].checked;
		setMilestonesChecked(newMilestones);
	};

	const toggleQG = (index: number) => {
		const requiredMilestones = qgRequirements[index];

		// Check if all required milestones are done
		const allPreviousChecked = milestonesChecked
			?.slice(0, requiredMilestones)
			.every((x) => x.checked);

		if (!allPreviousChecked) {
			console.log("Cannot check QG yet — earlier milestones missing");
			return; // block checking
		}

		// Otherwise toggle QG
		const newQGs = [...qgBoxesChecked];
		newQGs[index] = !newQGs[index];

		setQGBoxesChecked(newQGs);
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

	return (
		<div className="timeline-wrapper">
			<div className="timeline-inner">
				{/* Horizontal line */}
				<div className="timeline-line" />

				{/* === QG TRIANGLES + VERTICAL LINES === */}
				{/* QG1 */}
				<div className="qg-triangle qg-triangle-1" />
				<div className="qg-label qg-label-1">QG 1</div>
				<div className="qg-line qg-line-1" />

				{/* QG2 */}
				<div className="qg-triangle qg-triangle-2" />
				<div className="qg-label qg-label-2">QG 2</div>
				<div className="qg-line qg-line-2" />

				{/* QG3 */}
				<div className="qg-triangle qg-triangle-3" />
				<div className="qg-label qg-label-3">QG 3</div>
				<div className="qg-line qg-line-3" />

				{/* QG4 */}
				<div className="qg-triangle qg-triangle-4" />
				<div className="qg-label qg-label-4">QG 4</div>
				<div className="qg-line qg-line-4" />

				{/* QG5 */}
				<div className="qg-triangle qg-triangle-5" />
				<div className="qg-label qg-label-5">QG 5</div>
				<div className="qg-line qg-line-5" />

				{/* === QG BOXES ABOVE HORIZONTAL LINE (CLICKABLE) === */}
				{/* QG1 box */}
				<div className="qg-box qg-box-1" onClick={() => toggleQG(0)}>
					<div
						className={
							"milestone square " + (qgBoxesChecked[0] ? "checked" : "")
						}
					>
						{qgBoxesChecked[0] ? "✔" : ""}
					</div>
				</div>

				{/* QG2 box */}
				<div className="qg-box qg-box-2" onClick={() => toggleQG(1)}>
					<div
						className={
							"milestone square " + (qgBoxesChecked[1] ? "checked" : "")
						}
					>
						{qgBoxesChecked[1] ? "✔" : ""}
					</div>
				</div>

				{/* QG3 box */}
				<div className="qg-box qg-box-3" onClick={() => toggleQG(2)}>
					<div
						className={
							"milestone square " + (qgBoxesChecked[2] ? "checked" : "")
						}
					>
						{qgBoxesChecked[2] ? "✔" : ""}
					</div>
				</div>

				{/* QG4 box */}
				<div className="qg-box qg-box-4" onClick={() => toggleQG(3)}>
					<div
						className={
							"milestone square " + (qgBoxesChecked[3] ? "checked" : "")
						}
					>
						{qgBoxesChecked[3] ? "✔" : ""}
					</div>
				</div>

				{/* QG5 box */}
				<div className="qg-box qg-box-5" onClick={() => toggleQG(4)}>
					<div
						className={
							"milestone square " + (qgBoxesChecked[4] ? "checked" : "")
						}
					>
						{qgBoxesChecked[4] ? "✔" : ""}
					</div>
				</div>

				{/* === 20 MILESTONES IN SEQUENCE === */}
				{/* M1 */}
				{milestones?.map((m, i) => {
					const checked = milestonesChecked?.find(
						(x) => x.id === m.milestone_id,
					)?.checked;

					return (
						<div
							key={m.milestone_id}
							className={`milestone-wrapper m-pos-${i + 1}`}
							onClick={() => toggleMilestone(m.milestone_id)}
						>
							<div className={"milestone circle " + (checked ? "checked" : "")}>
								{checked ? "✔" : m.milestone_id}
							</div>
						</div>
					);
				})}
			</div>
			<Button className="max-w-20" onClick={saveMilestones}>
				Save
			</Button>
		</div>
	);
}
