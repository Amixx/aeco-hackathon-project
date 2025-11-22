import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import "./style.css";

export const Route = createFileRoute("/log/")({
	component: LogPage,
});

function LogPage() {
	const [projectId, setProjectId] = useState("01");
	const [dept, setDept] = useState("KIG");
	const [user, setUser] = useState("DD");

	const [checkedList, setCheckedList] = useState<string[]>([]);

	return (

		<div className="log-container">
			{/* === TOP: PROJECT INFO + PHASE BARS === */}
			<div className="top-section">
				{/* LEFT: DROPDOWNS */}
				<div className="left-controls">
					{/* Project ID */}
					<div className="select-block">
						<label>Project ID</label>
						<select
							value={projectId}
							onChange={(e) => setProjectId(e.target.value)}
						>
							{/* <option value="00">--</option> */}
							<option value="01">01</option>
							<option value="02">02</option>
						</select>
					</div>

					{/* Dept */}
					<div className="select-block">
						<label>Dept.</label>
						<select value={dept} onChange={(e) => setDept(e.target.value)}>
							<option value="ARC">Architecture</option>
							<option value="ENG">Engineering</option>
							<option value="CON">Construction</option>
							<option value="FIN">Finance</option>
							<option value="LEG">Legal</option>
						</select>
					</div>

					{/* User */}
					<div className="select-block">
						<label>User</label>
						<select value={user} onChange={(e) => setUser(e.target.value)}>
							<option value="DD">DD</option>
							<option value="PM">PM</option>
						</select>
					</div>
				</div>

				{/* RIGHT: PHASE BANDS */}
				<div className="phase-bands">
					<div className="phase phase1">Acquisition 1</div>
					<div className="phase phase2">Acquisition 2</div>
					<div className="phase phase3">Category</div>
				</div>
			</div>

			{/* TIMELINE + CHECKED LIST */}
			<div>
			</div>
			<Timeline setCheckedList={setCheckedList} />
			<CheckedMilestones checkedList={checkedList} />
		</div>
	);
}

function CheckedMilestones({ checkedList }: { checkedList: string[] }) {
	return (
		<div className="checked-section">

			<div className="checked-title">List of checked Quality Gates & Milestones</div>

			<div className="checked-subtitle">
				{checkedList.length === 0 ? (
					<>No milestones checked</>
				) : (
					checkedList.join(", ")
				)}
			</div>

		</div>
	);
}

/* === TIMELINE COMPONENT === */
function Timeline({ setCheckedList }: { setCheckedList: (items: string[]) => void }) {
	const qgRequirements: Record<number, number> = {
		0: 0,   // QG1 requires nothing
		1: 5,   // QG2 requires M1–M5
		2: 11,  // QG3 requires M1–M11
		3: 16,  // QG4 requires M1–M16
		4: 20,  // QG5 requires M1–M20
	};

	const [milestonesChecked, setMilestonesChecked] = useState<boolean[]>([
		true,
		true,
		true,
		true,
		true, // M1–M5
		true,
		true,
		true,
		true,
		true,
		true,
		true, // M6–M11
		true,
		true,
		true, // M12–M14–M15
		false,
		false,
		false,
		false,
		false, // M16–M20
	]);

	// QG boxes 1–3 checked, 4–5 unchecked
	const [qgBoxesChecked, setQGBoxesChecked] = useState<boolean[]>([
		true,
		true,
		true,
		false,
		false,
	]);

	const toggleMilestone = (index: number) => {
		// First milestone can always be toggled
		if (index > 0 && !milestonesChecked[index - 1]) {
			console.log("Cannot check this milestone — previous milestone not completed");
			return;
		}

		const updated = [...milestonesChecked];
		updated[index] = !updated[index];
		setMilestonesChecked(updated);
	};

	const toggleQG = (index: number) => {
		const requiredMilestones = qgRequirements[index];

		// Check if all required milestones are done
		const allPreviousChecked = milestonesChecked
			.slice(0, requiredMilestones)
			.every(x => x === true);

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
		milestonesChecked.forEach((checked, i) => {
			if (checked) items.push(`M${i + 1}`);
		});

		setCheckedList(items);
	}, [milestonesChecked, qgBoxesChecked]
	);

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
				<div
					className="milestone-wrapper m-pos-1"
					onClick={() => toggleMilestone(0)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[0] ? "checked" : "")
						}
					>
						{milestonesChecked[0] ? "✔" : "1"}
					</div>
				</div>

				{/* M2 */}
				<div
					className="milestone-wrapper m-pos-2"
					onClick={() => toggleMilestone(1)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[1] ? "checked" : "")
						}
					>
						{milestonesChecked[1] ? "✔" : "2"}
					</div>
				</div>

				{/* M3 */}
				<div
					className="milestone-wrapper m-pos-3"
					onClick={() => toggleMilestone(2)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[2] ? "checked" : "")
						}
					>
						{milestonesChecked[2] ? "✔" : "3"}
					</div>
				</div>

				{/* M4 */}
				<div
					className="milestone-wrapper m-pos-4"
					onClick={() => toggleMilestone(3)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[3] ? "checked" : "")
						}
					>
						{milestonesChecked[3] ? "✔" : "4"}
					</div>
				</div>

				{/* M5 */}
				<div
					className="milestone-wrapper m-pos-5"
					onClick={() => toggleMilestone(4)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[4] ? "checked" : "")
						}
					>
						{milestonesChecked[4] ? "✔" : "5"}
					</div>
				</div>

				{/* M6 */}
				<div
					className="milestone-wrapper m-pos-6"
					onClick={() => toggleMilestone(5)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[5] ? "checked" : "")
						}
					>
						{milestonesChecked[5] ? "✔" : "6"}
					</div>
				</div>

				{/* M7 */}
				<div
					className="milestone-wrapper m-pos-7"
					onClick={() => toggleMilestone(6)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[6] ? "checked" : "")
						}
					>
						{milestonesChecked[6] ? "✔" : "7"}
					</div>
				</div>

				{/* M8 */}
				<div
					className="milestone-wrapper m-pos-8"
					onClick={() => toggleMilestone(7)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[7] ? "checked" : "")
						}
					>
						{milestonesChecked[7] ? "✔" : "8"}
					</div>
				</div>

				{/* M9 */}
				<div
					className="milestone-wrapper m-pos-9"
					onClick={() => toggleMilestone(8)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[8] ? "checked" : "")
						}
					>
						{milestonesChecked[8] ? "✔" : "9"}
					</div>
				</div>

				{/* M10 */}
				<div
					className="milestone-wrapper m-pos-10"
					onClick={() => toggleMilestone(9)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[9] ? "checked" : "")
						}
					>
						{milestonesChecked[9] ? "✔" : "10"}
					</div>
				</div>

				{/* M11 */}
				<div
					className="milestone-wrapper m-pos-11"
					onClick={() => toggleMilestone(10)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[10] ? "checked" : "")
						}
					>
						{milestonesChecked[10] ? "✔" : "11"}
					</div>
				</div>

				{/* M12 */}
				<div
					className="milestone-wrapper m-pos-12"
					onClick={() => toggleMilestone(11)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[11] ? "checked" : "")
						}
					>
						{milestonesChecked[11] ? "✔" : "12"}
					</div>
				</div>

				{/* M13 */}
				<div
					className="milestone-wrapper m-pos-13"
					onClick={() => toggleMilestone(12)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[12] ? "checked" : "")
						}
					>
						{milestonesChecked[12] ? "✔" : "13"}
					</div>
				</div>

				{/* M14 */}
				<div
					className="milestone-wrapper m-pos-14"
					onClick={() => toggleMilestone(13)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[13] ? "checked" : "")
						}
					>
						{milestonesChecked[13] ? "✔" : "14"}
					</div>
				</div>

				{/* M15 */}
				<div
					className="milestone-wrapper m-pos-15"
					onClick={() => toggleMilestone(14)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[14] ? "checked" : "")
						}
					>
						{milestonesChecked[14] ? "✔" : "15"}
					</div>
				</div>

				{/* M16 */}
				<div
					className="milestone-wrapper m-pos-16"
					onClick={() => toggleMilestone(15)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[15] ? "checked" : "")
						}
					>
						{milestonesChecked[15] ? "✔" : "16"}
					</div>
				</div>

				{/* M17 */}
				<div
					className="milestone-wrapper m-pos-17"
					onClick={() => toggleMilestone(16)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[16] ? "checked" : "")
						}
					>
						{milestonesChecked[16] ? "✔" : "17"}
					</div>
				</div>

				{/* M18 */}
				<div
					className="milestone-wrapper m-pos-18"
					onClick={() => toggleMilestone(17)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[17] ? "checked" : "")
						}
					>
						{milestonesChecked[17] ? "✔" : "18"}
					</div>
				</div>

				{/* M19 */}
				<div
					className="milestone-wrapper m-pos-19"
					onClick={() => toggleMilestone(18)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[18] ? "checked" : "")
						}
					>
						{milestonesChecked[18] ? "✔" : "19"}
					</div>
				</div>

				{/* M20 */}
				<div
					className="milestone-wrapper m-pos-20"
					onClick={() => toggleMilestone(19)}
				>
					<div
						className={
							"milestone circle " + (milestonesChecked[19] ? "checked" : "")
						}
					>
						{milestonesChecked[19] ? "✔" : "20"}
					</div>
				</div>
			</div>
		</div>
	);
}
