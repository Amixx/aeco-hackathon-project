import {
	Background,
	Controls,
	type Edge,
	type Node,
	Position,
	ReactFlow,
	type ReactFlowInstance,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
	useViewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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

	// NEW: optional click callbacks
	onMilestoneClick?: (milestone: ProjectMilestoneWithDetails) => void;
	onQualityGateClick?: (gate: ProjectQualityGateWithDetails) => void;
}


const DEPARTMENT_WIDTH = 250;
const MILESTONE_HEIGHT = 60;

const SimpleNode = ({ data }: { data: { label: React.ReactNode } }) => {
	return (
		<div className="w-full h-full pointer-events-none select-none">
			{data.label}
		</div>
	);
};

const nodeTypes = {
	simple: SimpleNode,
	trackLine: () => {
		return (
			<div
				className="w-full h-full pointer-events-auto relative group"
			>
			</div>
		);
	},
};

interface StickyHeaderProps {
	projectId: string;
	departments: typeof db.departments;
	labelsByDept: Map<string, Set<string>>;
	labelInfo: Map<string, { name: string; deptId: string; color: string }>;
	labelXOffsets: Map<string, number>;
}

function StickyHeader({
	projectId,
	departments,
	labelsByDept,
	labelInfo,
	labelXOffsets,
}: StickyHeaderProps) {
	const { x, zoom } = useViewport();

	return (
		<div
			className="absolute top-0 left-0 z-20 pointer-events-none w-full"
			style={{
				height: "200px", // Increased height
				background:
					"linear-gradient(to bottom, rgba(255,255,255,0.95) 70%, rgba(255,255,255,0) 100%)", // Adjusted gradient stop
			}}
		>
			<div
				className="relative h-full"
				style={{
					transform: `translateX(${x}px) scale(${zoom})`,
					transformOrigin: "0 0",
					width: "100%",
				}}
			>
				{departments.map((dept, index) => {
					const deptLabels = Array.from(labelsByDept.get(dept.id) || []);
					deptLabels.sort();

					return (
						<div
							key={dept.id}
							className="absolute flex flex-col"
							style={{
								left: index * DEPARTMENT_WIDTH,
								width: DEPARTMENT_WIDTH,
								top: 0,
								height: "100%",
							}}
						>
							{/* Department Title */}
							<div className="w-full flex justify-center pt-2 pointer-events-auto">
								<Link
									to="/log/$projectId/$departmentId"
									params={{ projectId, departmentId: dept.id }}
									className="font-bold text-lg hover:underline cursor-pointer truncate px-2"
									title={dept.name}
								>
									{dept.name}
								</Link>
							</div>

							{/* Track Labels */}
							<div className="relative w-full flex-1 mt-1">
								{deptLabels.map((labelId) => {
									const info = labelInfo.get(labelId);
									const xOffset =
										labelXOffsets.get(labelId) || DEPARTMENT_WIDTH / 2;
									if (!info) return null;

									return (
										<div
											key={labelId}
											className="absolute flex flex-col items-center"
											style={{
												left: xOffset - 15, // Centered on the track (30px wide area)
												width: 30,
												top: 10,
											}}
										>
											<div
												className="text-xs font-bold uppercase text-center"
												style={{
													color: info.color,
													backgroundColor: `${info.color}20`,
													padding: "4px 2px",
													borderRadius: "4px",
													position: "absolute",
													left: "20px", // Offset to the right of the line (center is 15px)
													writingMode: "vertical-rl",
													textOrientation: "mixed",
													maxHeight: "200px",
													height: "max-content",
													width: "max-content",
													whiteSpace: "nowrap",
													textOverflow: "ellipsis",
													overflow: "hidden",
												}}
												title={info.name}
											>
												{info.name}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function GraphLegend() {
	const departments = db.departments;
	const labels = db.labels;
	const qualityGates = db.qualityGates;
	const qualityGateMilestones = db.qualityGateMilestones;

	return (
		<div className="flex flex-col gap-10 p-6 border-t bg-background mt-8">
			{/* Departments & Labels Section */}
			<div className="space-y-6">
				<h3 className="font-bold text-lg border-b pb-2">
					Departments & Tracks
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{departments.map((dept) => {
						const deptLabels = labels.filter(
							(l) => l.department_id === dept.id,
						);
						return (
							<div key={dept.id} className="space-y-3 break-inside-avoid">
								<div>
									<div className="font-bold text-base">{dept.name}</div>
									<div className="text-sm text-muted-foreground">
										{dept.description}
									</div>
								</div>

								{deptLabels.length > 0 && (
									<div className="pl-4 border-l-2 border-muted space-y-2">
										{deptLabels.map((label) => (
											<div key={label.id} className="flex items-start gap-2">
												<div
													className="w-3 h-3 rounded-full mt-1 shrink-0"
													style={{ backgroundColor: label.color }}
												/>
												<div>
													<div className="text-sm font-medium leading-none">
														{label.name}
													</div>
													{label.description && (
														<div className="text-xs text-muted-foreground mt-0.5">
															{label.description}
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Quality Gates Section */}
			<div className="space-y-6">
				<h3 className="font-bold text-lg border-b pb-2">Quality Gates</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{qualityGates.map((gate) => {
						const milestoneCount = qualityGateMilestones.filter(
							(qgm) => qgm.quality_gate_id === gate.id,
						).length;

						return (
							<div key={gate.id} className="border rounded-lg p-4 shadow-sm flex flex-col justify-between">
								<div>
									<div className="font-bold text-sm">{gate.name}</div>
									{gate.description && (
										<div className="text-xs text-muted-foreground mt-1 mb-2">
											{gate.description}
										</div>
									)}
								</div>
								<div className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded w-fit">
									{milestoneCount} Milestones
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
function MilestoneGraphContent({
	projectId,
	milestones,
	qualityGates = [],
	onMilestoneClick,
	onQualityGateClick,
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

	const allDepartments = db.departments;
	// Filter departments based on selection
	const visibleDepartments = useMemo(
		() =>
			selectedDepartmentId
				? allDepartments.filter((d) => d.id === selectedDepartmentId)
				: allDepartments,
		[selectedDepartmentId, allDepartments],
	);

	// Pre-calculate label info for the StickyHeader
	const { labelsByDept, labelInfo, labelXOffsets } = useMemo(() => {
		const labelsByDept = new Map<string, Set<string>>();
		const labelInfo = new Map<
			string,
			{ name: string; deptId: string; color: string }
		>();

		milestones.forEach((m) => {
			const l = m.definition?.label;
			const dId = m.definition?.department_id;
			if (l && dId) {
				if (!labelsByDept.has(dId)) {
					labelsByDept.set(dId, new Set());
				}
				labelsByDept.get(dId)?.add(l.id);
				labelInfo.set(l.id, {
					name: l.name,
					deptId: dId,
					color: labelColorMap.get(l.id) || "#9ca3af",
				});
			}
		});

		const labelXOffsets = new Map<string, number>();
		visibleDepartments.forEach((dept) => {
			const labelIds = Array.from(labelsByDept.get(dept.id) || []);
			labelIds.sort();
			const count = labelIds.length;
			if (count > 0) {
				const step = DEPARTMENT_WIDTH / (count + 1);
				labelIds.forEach((lId, idx) => {
					labelXOffsets.set(lId, (idx + 1) * step);
				});
			}
		});

		return { labelsByDept, labelInfo, labelXOffsets };
	}, [milestones, visibleDepartments, labelColorMap]);

	// Memoize the graph data generation to avoid re-randomizing on every render
	const { initialNodes, initialEdges } = useMemo(() => {
		const nodes: Node[] = [];
		const edges: Edge[] = [];

		// Map used for looking up department index in the VISIBLE list
		const deptIndexMap = new Map<string, number>();
		visibleDepartments.forEach((dept, index) => {
			deptIndexMap.set(dept.id, index);
		});

		// Determine max execution number for height calculation
		let maxExecutionNumber = 0;
		milestones.forEach((m) => {
			const exec = m.definition?.execution_number || 0;
			if (exec > maxExecutionNumber) maxExecutionNumber = exec;
		});

		// Create department backgrounds (swimlanes)
		visibleDepartments.forEach((dept, index) => {
			nodes.push({
				id: `dept-${dept.id}`,
				type: "group",
				position: { x: index * DEPARTMENT_WIDTH, y: 0 },
				style: {
					height: maxExecutionNumber * MILESTONE_HEIGHT + 400, // Extra space for stubs
					width: DEPARTMENT_WIDTH,
					backgroundColor:
						index % 2 === 0
							? "rgba(240, 240, 240, 0.2)"
							: "rgba(255, 255, 255, 0.2)",
					border: "none",
					zIndex: -1,
				},
				data: { label: "" }, // No label in the graph node anymore
				selectable: false,
				draggable: false,
			});
		});

		// 2. Create Label Lines (Vertical) - VISUAL ONLY
		const startY = 80; // Start below the header area
		const endY = 200 + (maxExecutionNumber + 1) * MILESTONE_HEIGHT;
		const lineHeight = endY - startY;

		labelInfo.forEach((info, labelId) => {
			// Only create line if allDepartment is visible
			if (!deptIndexMap.has(info.deptId)) return;

			const deptIndex = deptIndexMap.get(info.deptId) ?? 0;
			const xOffset = labelXOffsets.get(labelId) || DEPARTMENT_WIDTH / 2;
			const absoluteX = deptIndex * DEPARTMENT_WIDTH + xOffset;

			nodes.push({
				id: `label-line-${labelId}`,
				type: "trackLine",
				position: {
					x: absoluteX - 30, // Move 30px left so the right border is at absoluteX
					y: startY,
				},
				style: {
					height: lineHeight,
					width: 30,
					backgroundColor: "transparent",
					borderRight: `2px solid ${info.color}`, // Vertical line
					borderRadius: 0,
					zIndex: 0,
					// Removed text styles
					borderTop: "none",
					borderLeft: "none",
					borderBottom: "none",
				},
				data: {
					label: info.name,
					color: info.color,
				},
				draggable: false,
				selectable: false,
			});
		});

		// 3. Process milestones
		milestones.forEach((milestone, index) => {
			const deptId = milestone.definition?.department_id;
			const isVisible = deptId ? deptIndexMap.has(deptId) : false;
			const deptIndex = deptId ? (deptIndexMap.get(deptId) ?? 0) : 0;

			const isCompleted = !!milestone.completed_at;
			const isDisabled = !!milestone.is_disabled;
			const label = milestone.definition?.label?.name || "N/A";
			const labelId = milestone.definition?.label_id;

			const yPos =
				150 +
				(milestone.definition?.execution_number || index) * MILESTONE_HEIGHT;

			const xOffset =
				(labelId ? labelXOffsets.get(labelId) : null) || DEPARTMENT_WIDTH / 2;
			const xPos = deptIndex * DEPARTMENT_WIDTH + xOffset;

			if (isVisible) {
				const node: Node = {
					id: milestone.id,
					position: {
						x: xPos - 20, // Center horizontally
						y: yPos - 20, // Center vertically
					},
					data: {
						label: (
							<Tooltip>
								<TooltipTrigger asChild>
									<div
										className={cn(
											"flex items-center justify-center w-full h-full text-sm font-bold cursor-pointer",
											isDisabled && "text-muted-foreground",
										)}
										onClick={() => onMilestoneClick?.(milestone)}
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
									{milestone.definition?.hyperlink && (
										<div className="text-xs mt-1">
											<a
												href={milestone.definition.hyperlink}
												target="_blank"
												rel="noopener noreferrer"
												className="underline"
											>
												Documentation
											</a>
										</div>
									)}
								</TooltipContent>

							</Tooltip>
						),
					},
					style: {
						background: isDisabled
							? "#f3f4f6"
							: isCompleted
								? "#dcfce7"
								: "#fff",
						border: isDisabled
							? "1px solid #e5e7eb"
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
					sourcePosition: Position.Bottom,
					targetPosition: Position.Top,
					draggable: false,
					connectable: false,
				};

				nodes.push(node);
			}

			if (index > 0) {
				const prevMilestone = milestones[index - 1];
				const prevDeptId = prevMilestone.definition?.department_id;
				const isPrevVisible = prevDeptId ? deptIndexMap.has(prevDeptId) : false;

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

		qualityGates.forEach((gate) => {
			const linkedMilestones = gate.milestones || [];
			let maxGateExec = 0;

			linkedMilestones.forEach((m) => {
				if (m.execution_number > maxGateExec) maxGateExec = m.execution_number;
			});

			if (maxGateExec === 0) return;

			const yPos = 150 + (maxGateExec + 0.5) * MILESTONE_HEIGHT;
			const totalWidth = visibleDepartments.length * DEPARTMENT_WIDTH;

			const status = gate.status;
			const isDone = status === "done";

			const gateLineColor = isDone ? "#22c55e" : "#ef4444";
			const gateBadgeBg = isDone ? "#dcfce7" : "#fff";
			const gateBadgeBorder = isDone ? "2px solid #22c55e" : "1px solid #777";

			nodes.push({
				id: `gate-${gate.id}`,
				type: "simple",
				position: {
					x: 0,
					y: yPos,
				},
				style: {
					height: 40,
					width: totalWidth,
					zIndex: 5,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					pointerEvents: "all",
				},
				data: {
					label: (
						<div className="w-full h-full flex items-center relative group">
							{/* The Line */}
							<div
								className="absolute w-full h-1 rounded"
								style={{
									backgroundColor: gateLineColor,
								}}
							/>
							<Tooltip>
								<TooltipTrigger asChild>
									{/* The Badge */}
									<div
										className="relative z-10 px-3 py-1 text-xs font-bold shadow-sm flex items-center justify-center cursor-help pointer-events-auto"
										style={{
											backgroundColor: gateBadgeBg,
											border: gateBadgeBorder,
											borderRadius: "12px",
											marginLeft: "-40px",
										}}
									>
										{gate.name}
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<div className="font-bold text-sm mb-1">{gate.name}</div>

									{gate.description && (
										<div className="text-xs mb-2 text-muted-foreground max-w-[300px]">
											{gate.description}
										</div>
									)}

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
									{gate.hyperlink && (
										<div className="text-xs mt-1">
											<a
												href={gate.hyperlink}
												target="_blank"
												rel="noopener noreferrer"
												className="underline"
											>
												Documentation
											</a>
										</div>
									)}
								</TooltipContent>

							</Tooltip>
						</div>
					),
				},
				draggable: false,
				selectable: false,
			});
		});

		return { initialNodes: nodes, initialEdges: edges };
	}, [milestones, qualityGates, visibleDepartments, labelInfo, labelXOffsets]);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	useEffect(() => {
		setNodes(initialNodes);
		setEdges(initialEdges);

		if (rfInstance) {
			const totalWidth = visibleDepartments.length * DEPARTMENT_WIDTH;
			const newCenteredX = totalWidth < 800 ? (800 - totalWidth) / 2 : 40;
			window.requestAnimationFrame(() => {
				rfInstance.setViewport(
					{ x: newCenteredX, y: 50, zoom: 0.75 },
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

	const totalWidth = visibleDepartments.length * DEPARTMENT_WIDTH;
	const centeredX = totalWidth < 800 ? (800 - totalWidth) / 2 : 0;

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
				className="relative"
				style={{
					height: "calc(100vh - 70px)",
					border: "1px solid #eee",
					borderRadius: 8,
					resize: "vertical",
					overflow: "hidden",
					minHeight: 300,
				}}
			>
				{/* Sticky Header */}
				<StickyHeader
					projectId={projectId}
					departments={visibleDepartments}
					labelsByDept={labelsByDept}
					labelInfo={labelInfo}
					labelXOffsets={labelXOffsets}
				/>

				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onInit={setRfInstance}
					defaultViewport={{ x: centeredX, y: 50, zoom: 0.75 }}
					nodesConnectable={false}
					nodesDraggable={false}
					nodeTypes={nodeTypes}
				>
					<Background />
					<Controls />
				</ReactFlow>
			</div>

			{/* Legend */}
			<GraphLegend />
		</div>
	);
}

export function MilestoneGraph(props: MilestoneGraphProps) {
	return (
		<ReactFlowProvider>
			<MilestoneGraphContent {...props} />
		</ReactFlowProvider>
	);
}
