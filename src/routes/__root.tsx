import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="p-2 flex gap-2 text-lg border-b">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
        <Link to="/projects" className="[&.active]:font-bold">
          Projects
        </Link>
        <Link to="/milestones" className="[&.active]:font-bold">
          Milestones
        </Link>
        <Link to="/users" className="[&.active]:font-bold">
          Users
        </Link>
        <Link to="/departments" className="[&.active]:font-bold">
          Departments
        </Link>
      </div>
      <Outlet />
    </>
  ),
});
