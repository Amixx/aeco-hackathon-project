import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { api } from "@/database/api.ts";
import type { MilestoneDTO } from "@/database/dto/MilestoneDTO.ts";
import type { UserDTO } from "@/database/dto/UserDTO.ts";
import type { ProjectMilestone } from "@/database/dto/UtilDTO.ts";

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
		0: 1, // QG0 requires M1
		1: 0, // QG1 requires nothing
		2: 5, // QG2 requires M1–M5
		3: 11, // QG3 requires M1–M11
		4: 16, // QG4 requires M1–M16
		5: 20, // QG5 requires M1–M20
		6: 20, // QG6 requires M1–M20
		7: 20, // QG7 requires M1–M20
		8: 20, // QG8 requires M1–M20
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

	// QG boxes: QG0 unchecked, QG1–3 checked, QG4–8 unchecked
	const [qgBoxesChecked, setQGBoxesChecked] = useState<boolean[]>([
		false,
		true,
		true,
		true,
		false,
		false,
		false,
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
		const isCurrentlyChecked = qgBoxesChecked[index];

		// If trying to check (not uncheck), verify all required milestones are done
		if (!isCurrentlyChecked) {
			const allPreviousChecked = milestonesChecked
				?.slice(0, requiredMilestones)
				.every((x) => x.checked);

			if (!allPreviousChecked) {
				console.log("Cannot check QG yet — earlier milestones missing");
				return; // block checking
			}
		}

		// Toggle QG (allows unchecking regardless)
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
				{/* QG0 */}
				<div className="qg-triangle qg-triangle-0" />
				<div className="qg-label qg-label-0">QG 0</div>
				<div className="qg-line qg-line-0" />

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

				{/* QG6 */}
				<div className="qg-triangle qg-triangle-6" />
				<div className="qg-label qg-label-6">QG 6</div>
				<div className="qg-line qg-line-6" />

				{/* QG7 */}
				<div className="qg-triangle qg-triangle-7" />
				<div className="qg-label qg-label-7">QG 7</div>
				<div className="qg-line qg-line-7" />

				{/* QG8 */}
				<div className="qg-triangle qg-triangle-8" />
				<div className="qg-label qg-label-8">QG 8</div>
				<div className="qg-line qg-line-8" />

				{/* === QG BOXES ABOVE HORIZONTAL LINE (CLICKABLE) === */}
				{/* QG0 box */}
				<div className="qg-box qg-box-0" onClick={() => toggleQG(0)}>
					<div
						className={
							"milestone square " + (qgBoxesChecked[0] ? "checked" : "")
						}
					>
						{qgBoxesChecked[0] ? "✔" : ""}
					</div>
				</div>

				{/* QG1 box */}
				<div className="qg-box qg-box-1" onClick={() => toggleQG(1)}>
					<div
						className={
							"milestone square " + (qgBoxesChecked[1] ? "checked" : "")
						}
					>
						{qgBoxesChecked[1] ? "✔" : ""}
					</div>
				</div>

				{/* QG2 box */}
				<div className="qg-box qg-box-2" onClick={() => toggleQG(2)}>
					<div
						className={
							"milestone square " + (qgBoxesChecked[2] ? "checked" : "")
						}
					>
						{qgBoxesChecked[2] ? "✔" : ""}
					</div>
				</div>

				{/* QG3 box */}
				<div className="qg-box qg-box-3" onClick={() => toggleQG(3)}>
					<div
						className={
							"milestone square " + (qgBoxesChecked[3] ? "checked" : "")
						}
					>
						{qgBoxesChecked[3] ? "✔" : ""}
					</div>
				</div>

				{/* QG4 box */}
				<div className="qg-box qg-box-4" onClick={() => toggleQG(4)}>
					<div
						className={
							"milestone square " + (qgBoxesChecked[4] ? "checked" : "")
						}
					>
						{qgBoxesChecked[4] ? "✔" : ""}
					</div>
				</div>

				{/* QG5 box */}
				<div className="qg-box qg-box-5" onClick={() => toggleQG(5)}>
					<div
						className={
							"milestone square " + (qgBoxesChecked[5] ? "checked" : "")
						}
					>
						{qgBoxesChecked[5] ? "✔" : ""}
					</div>
				</div>

				{/* QG6 box */}
				<div className="qg-box qg-box-6" onClick={() => toggleQG(6)}>
					<div
						className={
							"milestone square " + (qgBoxesChecked[6] ? "checked" : "")
						}
					>
						{qgBoxesChecked[6] ? "✔" : ""}
					</div>
				</div>

				{/* QG7 box */}
				<div className="qg-box qg-box-7" onClick={() => toggleQG(7)}>
					<div
						className={
							"milestone square " + (qgBoxesChecked[7] ? "checked" : "")
						}
					>
						{qgBoxesChecked[7] ? "✔" : ""}
					</div>
				</div>

				{/* QG8 box */}
				<div className="qg-box qg-box-8" onClick={() => toggleQG(8)}>
					<div
						className={
							"milestone square " + (qgBoxesChecked[8] ? "checked" : "")
						}
					>
						{qgBoxesChecked[8] ? "✔" : ""}
					</div>
				</div>

				{/* === 20 MILESTONES IN SEQUENCE === */}
				{/* M1 */}
				{milestones?.map((m) => {
					const milestoneNum = m.milestone_id.split("-")[1];
					const labelColor = m.definition.label?.color || "#ccc";
					const checked = milestonesChecked?.find(
						(x) => x.id === m.milestone_id,
					)?.checked;

					return (
						<div
							key={m.milestone_id}
							className={`milestone-wrapper m-pos-${milestoneNum}`}
							onClick={() => toggleMilestone(m.milestone_id)}
						>
							<div className={`milestone circle ${checked ? "checked" : ""}`}>
								{checked ? "✔" : m.milestone_id.split("-")[1]}
								style ={{
									borderColor: labelColor,
									borderWidth: "3px",
									borderStyle: "solid",
								}}
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
