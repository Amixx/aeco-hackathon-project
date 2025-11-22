import {
	Background,
	Controls,
	type Edge,
	type Node,
	Position,
	ReactFlow,
	type ReactFlowInstance,
	type ReactFlowInstance,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState, useState } from "react";
import { Button, Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { type api, db } from "@/database/api";
import { cn } from "@/lib/utils";

type ProjectMilestoneWithDetails = NonNullable<
	ReturnType<typeof api.getProjectById>
>["milestones"][0];

type ProjectQualityGateWithDetails = NonNullable<
	ReturnType<typeof api.getProjectById>
>["quality_gates"][0];

interface MilestoneGraphProps {
	projectId: string;
	milestones: ProjectMilestoneWithDetails[];
	qualityGates?: ProjectQualityGateWithDetails[];
}

const DEPARTMENT_HEIGHT = 150;
const MILESTONE_WIDTH = 200;

const SimpleNode = ({ data }: { data: { label: React.ReactNode } }) => {
	return (
		<div className="w-full h-full pointer-events-none select-none">
			{data.label}
		</div>
	);
};

const nodeTypes = {
	simple: SimpleNode,
};

export function MilestoneGraph({
	projectId,
	milestones,
	qualityGates = [],
}: MilestoneGraphProps) {
	const [selectedDepartmentId, setSelectedDepartmentId] = useState<
		string | null
	>(null);
	const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

	// At the top of your component, create a color map from your labels
	const labelColorMap = useMemo(() => {
		const map = new Map<string, string>();
		db.labels.forEach((label) => {
			map.set(label.id, label.color);
		});
		return map;
	}, []);

	const [selectedDepartmentId, setSelectedDepartmentId] = useState<
		string | null
	>(null);
	const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

	// Memoize the graph data generation to avoid re-randomizing on every render
	const { initialNodes, initialEdges } = useMemo(() => {
		const nodes: Node[] = [];
		const edges: Edge[] = [];
		const allDepartments = db.departments;

		// Filter departments based on selection
		const visibleDepartments = selectedDepartmentId
			? allDepartments.filter((d) => d.id === selectedDepartmentId)
			: allDepartments;

		// Map used for looking up department index in the VISIBLE list
		const deptIndexMap = new Map<string, number>();
		visibleDepartments.forEach((dept, index) => {
			deptIndexMap.set(dept.id, index);
		});

		// Create department labels (swimlanes)
		visibleDepartments.forEach((dept, index) => {
			nodes.push({
				id: `dept-${dept.id}`,
				type: "group",
				position: { x: 0, y: index * DEPARTMENT_HEIGHT },
				style: {
					width: milestones.length * MILESTONE_WIDTH + 400, // Extra space for stubs
					height: DEPARTMENT_HEIGHT,
					backgroundColor:
						index % 2 === 0
							? "rgba(240, 240, 240, 0.2)"
							: "rgba(255, 255, 255, 0.2)",
					border: "none",
					zIndex: -1,
				},
				data: { label: dept.name },
				selectable: false,
				draggable: false,
			});

			// Add text label for the department
			nodes.push({
				id: `dept-label-${dept.id}`,
				type: "simple", // Use custom simple node
				position: {
					x: 10,
					y: DEPARTMENT_HEIGHT / 2 - 25, // Relative to parent group
				},
				data: {
					label: (
						<Link
							to="/log/$projectId/$departmentId"
							params={{ projectId, departmentId: dept.id }}
							className="hover:underline cursor-pointer pointer-events-auto"
						>
							{dept.name}
						</Link>
					),
				},
				style: {
					border: "none",
					background: "transparent",
					fontWeight: "bold",
					width: 150,
					height: 50,
					pointerEvents: "all",
					display: "flex",
					alignItems: "center",
					fontSize: "16px",
				},
				parentId: `dept-${dept.id}`,
				extent: "parent",
				draggable: false,
				selectable: false,
			});
		});

		// 1. Analyze labels and departments to determine tracks
		const labelsByDept = new Map<string, Set<string>>();
		const labelInfo = new Map<string, { name: string; deptId: string }>();
		let maxExecutionNumber = 0;

		milestones.forEach((m) => {
			const exec = m.definition?.execution_number || 0;
			if (exec > maxExecutionNumber) maxExecutionNumber = exec;

			const l = m.definition?.label;
			const dId = m.definition?.department_id;
			if (l && dId) {
				if (!labelsByDept.has(dId)) {
					labelsByDept.set(dId, new Set());
				}
				labelsByDept.get(dId)?.add(l.id);
				labelInfo.set(l.id, { name: l.name, deptId: dId });
			}
		});

		// Calculate Y-offsets for each label within its department
		const labelYOffsets = new Map<string, number>();

		visibleDepartments.forEach((dept) => {
			const labelIds = Array.from(labelsByDept.get(dept.id) || []);
			// Sort labels for deterministic layout
			labelIds.sort();

			const count = labelIds.length;
			if (count > 0) {
				// Distribute lines evenly within the 150px height
				const step = DEPARTMENT_HEIGHT / (count + 1);
				labelIds.forEach((lId, idx) => {
					labelYOffsets.set(lId, (idx + 1) * step);
				});
			}
		});

		// // 2. Create Label Lines (Full Width)
		// // Width covers from slightly before first milestone to slightly after last
		const startX = 150;
		const endX = 200 + (maxExecutionNumber + 1) * MILESTONE_WIDTH;
		const lineWidth = endX - startX;

		// labelInfo.forEach((info, labelId) => {
		// 	// Only create line if department is visible
		// 	if (!deptIndexMap.has(info.deptId)) return;

		// 	const deptIndex = deptIndexMap.get(info.deptId) ?? 0;
		// 	const yOffset = labelYOffsets.get(labelId) || DEPARTMENT_HEIGHT / 2;
		// 	const absoluteY = deptIndex * DEPARTMENT_HEIGHT + yOffset;

		// 	nodes.push({
		// 		id: `label-line-${labelId}`,
		// 		type: "simple", // Use custom simple node
		// 		position: {
		// 			x: startX,
		// 			y: absoluteY - 30,
		// 		},
		// 		style: {
		// 			width: lineWidth,
		// 			height: 30,
		// 			backgroundColor: "transparent",
		// 			borderBottom: "2px solid #9ca3af",
		// 			borderRadius: 0,
		// 			zIndex: 0,
		// 			display: "flex",
		// 			alignItems: "flex-end",
		// 			paddingBottom: "4px",
		// 			paddingLeft: "10px", // Label at start of line
		// 			color: "#6b7280",
		// 			fontSize: "11px",
		// 			fontWeight: "bold",
		// 			textTransform: "uppercase",
		// 			borderTop: "none",
		// 			borderLeft: "none",
		// 			borderRight: "none",
		// 		},
		// 		data: {
		// 			label: (
		// 				<div className="w-full h-full flex items-end">
		// 					<span className="mb-1 ml-2 bg-white/50 px-1 rounded">
		// 						{info.name}
		// 					</span>
		// 				</div>
		// 			),
		// 		},
		// 		draggable: false,
		// 		selectable: false,
		// 	});
		// });
		// 2. Create Label Lines (Full Width)
		labelInfo.forEach((info, labelId) => {
			// Only create line if allDepartment is visible
			if (!deptIndexMap.has(info.deptId)) return;

			const deptIndex = deptIndexMap.get(info.deptId) ?? 0;
			const yOffset = labelYOffsets.get(labelId) || DEPARTMENT_HEIGHT / 2;
			const absoluteY = deptIndex * DEPARTMENT_HEIGHT + yOffset;

			// Get the color for this label
			const labelColor = labelColorMap.get(labelId) || "#9ca3af";

			nodes.push({
				id: `label-line-${labelId}`,
				type: "simple",
				position: {
					x: startX,
					y: absoluteY - 30,
				},
				style: {
					width: lineWidth,
					height: 30,
					backgroundColor: "transparent",
					borderBottom: `2px solid ${labelColor}`, // Use label color here
					borderRadius: 0,
					zIndex: 0,
					display: "flex",
					alignItems: "flex-end",
					paddingBottom: "4px",
					paddingLeft: "10px",
					color: labelColor, // Also update text color to match
					fontSize: "11px",
					fontWeight: "bold",
					textTransform: "uppercase",
					borderTop: "none",
					borderLeft: "none",
					borderRight: "none",
				},
				data: {
					label: (
						<div className="w-full h-full flex items-end">
							<span
								className="mb-1 ml-2 px-1 rounded"
								style={{
									backgroundColor: `${labelColor}20`, // 20 = ~12% opacity
									color: labelColor,
								}}
							>
								{info.name}
							</span>
						</div>
					),
				},
				draggable: false,
				selectable: false,
			});
		});

		// 3. Process milestones
		// We iterate ALL milestones to maintain the chain logic
		milestones.forEach((milestone, index) => {
			const deptId = milestone.definition?.department_id;
			const isVisible = deptId ? deptIndexMap.has(deptId) : false;
			const deptIndex = deptId ? (deptIndexMap.get(deptId) ?? 0) : 0;

			const isCompleted = !!milestone.completed_at;
			const isDisabled = !!milestone.is_disabled;
			const label = milestone.definition?.label?.name || "N/A";
			const labelId = milestone.definition?.label_id;

			const xPos =
				200 +
				(milestone.definition?.execution_number || index) * MILESTONE_WIDTH;

			// Determine Y based on label track or fallback to center
			const yOffset =
				(labelId ? labelYOffsets.get(labelId) : null) || DEPARTMENT_HEIGHT / 2;
			const yPos = deptIndex * DEPARTMENT_HEIGHT + yOffset;

			if (isVisible) {
				const node: Node = {
					id: milestone.id,
					position: {
						x: xPos - 20, // Center on the line (width is 40)
						y: yPos - 20, // Center vertically (height is 40)
					},
					data: {
						label: (
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										className={cn(
											"flex items-center justify-center w-full h-full text-sm font-bold cursor-help",
											isDisabled && "text-muted-foreground",
										)}
									>
										{milestone.definition?.execution_number}
									</div>
								</TooltipTrigger>
								<TooltipContent className="max-w-xs">
									<div className="font-bold text-sm mb-1">
										{milestone.definition?.name}
										{isDisabled && (
											<span className="ml-2 text-xs font-normal text-muted-foreground">
												(Disabled)
											</span>
										)}
									</div>
									<div className="text-xs text-muted-foreground mb-2">
										{milestone.definition?.description}
									</div>
									{isDisabled ? (
										<div className="text-xs text-muted-foreground font-medium">
											Disabled
										</div>
									) : isCompleted ? (
										<div className="text-xs text-green-500 font-medium">
											Completed:{" "}
											{new Date(
												milestone.completed_at ?? "",
											).toLocaleDateString()}
										</div>
									) : (
										<div className="text-xs text-yellow-500 font-medium">
											Pending
										</div>
									)}
									<div className="text-xs text-gray-400 mt-1">
										Resp: {milestone.responsible_person?.name || "Unassigned"}
									</div>
									<div className="text-xs text-gray-400 mt-1">
										Label: {label}
									</div>
								</TooltipContent>
							</Tooltip>
						),
					},
					style: {
						background: isDisabled
							? "#f3f4f6" // gray-100
							: isCompleted
								? "#dcfce7"
								: "#fff",
						border: isDisabled
							? "1px solid #e5e7eb" // gray-200
							: isCompleted
								? "2px solid #22c55e"
								: "1px solid #777",
						width: 40,
						height: 40,
						borderRadius: "50%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						padding: 0,
						opacity: isDisabled ? 0.8 : 1,
						zIndex: 10,
					},
					sourcePosition: Position.Right,
					targetPosition: Position.Left,
					draggable: false,
					connectable: false,
				};

				nodes.push(node);
			}

			// Connect to previous milestone
			if (index > 0) {
				const prevMilestone = milestones[index - 1];
				const prevDeptId = prevMilestone.definition?.department_id;
				const isPrevVisible = prevDeptId ? deptIndexMap.has(prevDeptId) : false;

				// Case 1: Both visible
				if (isVisible && isPrevVisible) {
					edges.push({
						id: `e-${prevMilestone.id}-${milestone.id}`,
						source: prevMilestone.id,
						target: milestone.id,
						animated: !isCompleted,
						style: { stroke: isCompleted ? "#22c55e" : "#b1b1b7" },
					});
				}
			}
		});

		// 4. Process Quality Gates
		// If we are filtering, we still show QGs but they span only the visible swimlanes.
		qualityGates.forEach((gate, i) => {
			const linkedMilestones = gate.milestones || [];
			let maxGateExec = 0;

			linkedMilestones.forEach((m) => {
				if (m.execution_number > maxGateExec) maxGateExec = m.execution_number;
			});

			if (maxGateExec === 0) return;

			// Position gate after the last milestone
			const xPos = 200 + (maxGateExec + 0.5) * MILESTONE_WIDTH;
			const totalHeight = visibleDepartments.length * DEPARTMENT_HEIGHT;

			const status = gate.status;
			const isDone = status === "done";

			const gateColor = isDone ? "#22c55e" : "#ef4444";

			nodes.push({
				id: `gate-${gate.id}`,
				type: "simple",
				position: {
					x: xPos,
					y: 0,
				},
				style: {
					width: 40, // wider to house the vertical bar
					height: totalHeight,
					zIndex: 5,
					display: "flex",
					justifyContent: "center",
					pointerEvents: "all",
				},
				data: {
					label: (
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="w-full h-full flex justify-center group cursor-help relative">
									{/* The visible vertical line */}
									<div
										style={{
											width: "4px",
											height: "100%",
											backgroundColor: gateColor,
											borderRadius: "4px",
										}}
									/>
									{/* Optional: Gate Label / Icon at top */}
									<div
										className="absolute top-2 px-2 py-1 rounded text-xs font-bold text-white shadow-sm"
										style={{ backgroundColor: gateColor }}
									>
										QG{i}
									</div>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<div className="font-bold text-sm mb-1">
									Quality Gate: {gate.id}
								</div>
								<div className="text-xs mb-2">
									Status:{" "}
									<span
										className={cn(
											"font-bold uppercase",
											isDone ? "text-green-500" : "text-red-500",
										)}
									>
										{status.replace("_", " ")}
									</span>
								</div>
								<div className="text-xs text-muted-foreground">
									Linked Milestones: {linkedMilestones.length}
								</div>
								{!isDone && (
									<div className="text-xs text-red-500 mt-2 font-medium">
										Complete all {linkedMilestones.length} linked milestones to
										unlock.
									</div>
								)}
							</TooltipContent>
						</Tooltip>
					),
				},
				draggable: false,
				selectable: false,
			});
		});

		return { initialNodes: nodes, initialEdges: edges };
	}, [
		milestones,
		qualityGates,
		projectId,
		selectedDepartmentId,
		selectedDepartmentId,
		labelColorMap.get,
	]);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const allDepartments = db.departments;
	// Calculate initial centeredY based on full or filtered height
	const visibleDepartments = selectedDepartmentId
		? allDepartments.filter((d) => d.id === selectedDepartmentId)
		: allDepartments;

	// Update nodes when selection or data changes
	useEffect(() => {
		setNodes(initialNodes);
		setEdges(initialEdges);

		// Reset viewport to initial left-aligned state when department changes
		if (rfInstance) {
			const totalHeight = visibleDepartments.length * DEPARTMENT_HEIGHT;
			const newCenteredY = totalHeight < 600 ? (600 - totalHeight) / 2 : 0;
			window.requestAnimationFrame(() => {
				rfInstance.setViewport(
					{ x: 50, y: newCenteredY, zoom: 0.75 },
					{ duration: 800 },
				);
			});
		}
	}, [
		initialNodes,
		initialEdges,
		setNodes,
		setEdges,
		rfInstance,
		visibleDepartments.length,
	]);

	const totalHeight = visibleDepartments.length * DEPARTMENT_HEIGHT;
	const centeredY = totalHeight < 600 ? (600 - totalHeight) / 2 : 0;

	return (
		<div className="flex flex-col gap-4 pb-40">
			<div className="flex items-center justify-between">
				<div className="text-lg font-bold">Milestone Graph</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline">
							{selectedDepartmentId
								? allDepartments.find((d) => d.id === selectedDepartmentId)
									?.name || "Unknown Department"
								: "All Departments"}
							<ChevronDown className="ml-2 h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => setSelectedDepartmentId(null)}>
							All Departments
						</DropdownMenuItem>
						{allDepartments.map((dept) => (
							<DropdownMenuItem
								key={dept.id}
								onClick={() => setSelectedDepartmentId(dept.id)}
							>
								{dept.name}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div
				style={{
					height: 600,
					border: "1px solid #eee",
					borderRadius: 8,
					resize: "vertical",
					overflow: "hidden",
					minHeight: 300,
				}}
			>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onInit={setRfInstance}
					defaultViewport={{ x: 50, y: centeredY, zoom: 0.75 }}
					nodesConnectable={false}
					nodesDraggable={false}
					nodeTypes={nodeTypes}
				>
					<Background />
					<Controls />
				</ReactFlow>
			</div>
		</div>
	);
}
