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
import type { api } from "@/database";

type ProjectMilestoneWithDetails = NonNullable<
	ReturnType<typeof api.getProjectWithMilestones>
>["milestones"][0];

interface MilestoneGraphProps {
	milestones: ProjectMilestoneWithDetails[];
}

const DEPARTMENTS = [
	"Architecture",
	"Structural",
	"MEP",
	"Interior Design",
	"Landscape",
];

const DEPARTMENT_HEIGHT = 150;
const MILESTONE_WIDTH = 250;

export function MilestoneGraph({ milestones }: MilestoneGraphProps) {
	// Memoize the graph data generation to avoid re-randomizing on every render
	const { initialNodes, initialEdges } = useMemo(() => {
		const nodes: Node[] = [];
		const edges: Edge[] = [];

		// Create department labels (swimlanes)
		DEPARTMENTS.forEach((dept, index) => {
			nodes.push({
				id: `dept-${index}`,
				type: "group",
				position: { x: 0, y: index * DEPARTMENT_HEIGHT },
				style: {
					width: milestones.length * MILESTONE_WIDTH + 100,
					height: DEPARTMENT_HEIGHT,
					backgroundColor:
						index % 2 === 0
							? "rgba(240, 240, 240, 0.2)"
							: "rgba(255, 255, 255, 0.2)",
					border: "none",
					zIndex: -1,
				},
				data: { label: dept },
				selectable: false,
				draggable: false,
			});

			// Add text label for the department
			nodes.push({
				id: `dept-label-${index}`,
				type: "input", // Using input type just for simple text node mostly
				position: { x: 10, y: index * DEPARTMENT_HEIGHT + 10 },
				data: { label: dept },
				style: {
					border: "none",
					background: "transparent",
					fontWeight: "bold",
					width: 150,
					pointerEvents: "none",
				},
				parentId: `dept-${index}`,
				extent: "parent",
				draggable: false,
			});
		});

		// Process milestones
		milestones.forEach((milestone, index) => {
			// Randomly assign to a department (0-4)
			// Use a deterministic random based on ID so it doesn't jump around on refresh if possible,
			// but user said "random", so Math.random is okay.
			// However, to keep it stable during this session, simple hash or just random is fine.
			// Let's use a pseudo-random based on ID char codes to be stable.
			const charCodeSum = milestone.id
				.split("")
				.reduce((acc, char) => acc + char.charCodeAt(0), 0);
			const deptIndex = charCodeSum % DEPARTMENTS.length;

			const isCompleted = !!milestone.completed_at;

			const node: Node = {
				id: milestone.id,
				position: {
					x: 200 + index * MILESTONE_WIDTH,
					y: deptIndex * DEPARTMENT_HEIGHT + 50, // vertically centered in swimlane
				},
				data: {
					label: (
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="flex items-center justify-center w-full h-full text-sm font-bold cursor-help">
									{milestone.definition?.execution_number}
								</div>
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">
								<div className="font-bold text-sm mb-1">
									{milestone.definition?.name}
								</div>
								<div className="text-xs text-muted-foreground mb-2">
									{milestone.definition?.description}
								</div>
								{isCompleted ? (
									<div className="text-xs text-green-500 font-medium">
										Completed:{" "}
										{new Date(milestone.completed_at!).toLocaleDateString()}
									</div>
								) : (
									<div className="text-xs text-yellow-500 font-medium">
										Pending
									</div>
								)}
								<div className="text-xs text-gray-400 mt-1">
									Resp: {milestone.responsible_person?.name || "Unassigned"}
								</div>
							</TooltipContent>
						</Tooltip>
					),
				},
				style: {
					background: isCompleted ? "#dcfce7" : "#fff",
					border: isCompleted ? "2px solid #22c55e" : "1px solid #777",
					width: 40,
					height: 40,
					borderRadius: "50%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: 0,
				},
				sourcePosition: Position.Right,
				targetPosition: Position.Left,
				draggable: false,
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
			>
				<Background />
				<Controls />
			</ReactFlow>
		</div>
	);
}
