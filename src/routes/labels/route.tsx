import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/labels")({
	component: LabelsLayout,
});

function LabelsLayout() {
	return <Outlet />;
}
