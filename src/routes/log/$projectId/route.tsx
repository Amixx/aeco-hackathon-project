import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/log/$projectId")({
	component: RouteComponent,
});

function RouteComponent() {
	return <Outlet />;
}
