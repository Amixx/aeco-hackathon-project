import {
	Background,
	Controls,
	type Edge,
	type Node,
	Position,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useMemo } from "react";
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

interface MilestoneGraphProps {
	milestones: ProjectMilestoneWithDetails[];
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

export function MilestoneGraph({ milestones }: MilestoneGraphProps) {
	// Memoize the graph data generation to avoid re-randomizing on every render
	const { initialNodes, initialEdges } = useMemo(() => {
		const nodes: Node[] = [];
		const edges: Edge[] = [];
		const departments = db.departments;

		// Create department labels (swimlanes)
		departments.forEach((dept, index) => {
			nodes.push({
				id: `dept-${dept.id}`,
				type: "group",
				position: { x: 0, y: index * DEPARTMENT_HEIGHT },
				style: {
					width: milestones.length * MILESTONE_WIDTH + 200,
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
				data: { label: dept.name },
				style: {
					border: "none",
					background: "transparent",
					fontWeight: "bold",
					width: 150,
					height: 50,
					pointerEvents: "none",
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

		departments.forEach((dept) => {
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

		// 2. Create Label Lines (Full Width)
		// Width covers from slightly before first milestone to slightly after last
		const startX = 150;
		const endX = 200 + (maxExecutionNumber + 1) * MILESTONE_WIDTH;
		const lineWidth = endX - startX;

		labelInfo.forEach((info, labelId) => {
			const deptIndex = departments.findIndex((d) => d.id === info.deptId);
			if (deptIndex === -1) return;

			const yOffset = labelYOffsets.get(labelId) || DEPARTMENT_HEIGHT / 2;
			const absoluteY = deptIndex * DEPARTMENT_HEIGHT + yOffset;

			nodes.push({
				id: `label-line-${labelId}`,
				type: "simple", // Use custom simple node
				position: {
					x: startX,
					y: absoluteY - 30,
				},
				style: {
					width: lineWidth,
					height: 30,
					backgroundColor: "transparent",
					borderBottom: "2px solid #9ca3af",
					borderRadius: 0,
					zIndex: 0,
					display: "flex",
					alignItems: "flex-end",
					paddingBottom: "4px",
					paddingLeft: "10px", // Label at start of line
					color: "#6b7280",
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
							<span className="mb-1 ml-2 bg-white/50 px-1 rounded">
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
		milestones.forEach((milestone, index) => {
			const deptId = milestone.definition?.department_id;
			const deptIndex = departments.findIndex((d) => d.id === deptId);
			const safeDeptIndex = deptIndex === -1 ? 0 : deptIndex;

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
			const yPos = safeDeptIndex * DEPARTMENT_HEIGHT + yOffset;

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
								<div className="text-xs text-gray-400 mt-1">Label: {label}</div>
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

			// Connect to previous milestone
			if (index > 0) {
				edges.push({
					id: `e-${milestones[index - 1].id}-${milestone.id}`,
					source: milestones[index - 1].id,
					target: milestone.id,
					animated: !isCompleted,
					style: { stroke: isCompleted ? "#22c55e" : "#b1b1b7" },
				});
			}
		});

		return { initialNodes: nodes, initialEdges: edges };
	}, [milestones]);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	// Reset nodes if milestones change (e.g. loading)
	useEffect(() => {
		setNodes(initialNodes);
		setEdges(initialEdges);
	}, [initialNodes, initialEdges, setNodes, setEdges]);

	return (
		<div style={{ height: 600, border: "1px solid #eee", borderRadius: 8 }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				fitView
				nodesConnectable={false}
				nodesDraggable={false}
				nodeTypes={nodeTypes}
			>
				<Background />
				<Controls />
			</ReactFlow>
		</div>
	);
}
