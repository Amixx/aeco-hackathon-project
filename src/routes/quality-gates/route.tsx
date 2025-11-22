import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/quality-gates")({
	component: QualityGatesLayout,
});

function QualityGatesLayout() {
	return <Outlet />;
}
