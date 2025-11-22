import {Label} from "@radix-ui/react-dropdown-menu";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import React from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {api, db} from "@/database/api.ts";

export const Route = createFileRoute("/projects/$projectId/edit/")({
    component: RouteComponent,
});

function RouteComponent() {
    const {projectId} = Route.useParams();
    const navigate = useNavigate();

    const [loaded, setLoaded] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [project, setProject] = React.useState<any | null>(null);

    const [name, setName] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [ownerId, setOwnerId] = React.useState<string | "">("");
    const [departmentId, setDepartmentId] = React.useState<string | "">("");

    React.useEffect(() => {
        const p = api.getProjectById(projectId);
        setProject(p ?? null);
        if (p) {
            setName(p.name ?? "");
            setDescription(p.description ?? "");
            // setOwnerId(p.owner_id ?? "");
            // setDepartmentId(p.department_id ?? "");
        } else {
            setName("");
            setDescription("");
            setOwnerId("");
            setDepartmentId("");
        }
        setLoaded(true);
    }, [projectId]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!project) return;

        if (!name.trim()) {
            alert("Project name is required.");
            return;
        }

        const updated = {
            ...project,
            name: name.trim(),
            description: description ?? "",
            owner_id: ownerId || null,
            department_id: departmentId || null,
            updated_at: new Date().toISOString(),
        };

        try {
            setSubmitting(true);
            const res = api.editProject(updated);
            if (!res) {
                alert("Failed to update project.");
                return;
            }
            navigate({to: "/projects/$projectId", params: {projectId}});
        } finally {
            setSubmitting(false);
        }
    }

    const users = db.users ?? [];
    const departments = db.departments ?? [];

    if (!loaded) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-semibold mb-4">Edit Project</h1>
                <div>Loading...</div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-semibold mb-4">Edit Project</h1>
                <div>Project not found.</div>
                <div className="mt-4">
                    <Button onClick={() => navigate({to: "/projects"})}>Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl">
            <h1 className="text-2xl font-semibold mb-6">Edit Project</h1>
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <Label className="block text-sm font-medium mb-1">Name</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={submitting}
                    />
                </div>

                <div>
                    <Label className="block text-sm font-medium mb-1">Description</Label>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={submitting}
                    />
                </div>

                <div>
                    <Label className="block text-sm font-medium mb-1">Owner</Label>
                    <select
                        value={ownerId}
                        onChange={(e) => setOwnerId(e.target.value)}
                        className="rounded-md border px-3 py-2 w-full"
                        disabled={submitting}
                    >
                        <option value="">— none —</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name || u.email || u.id}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <Label className="block text-sm font-medium mb-1">Department</Label>
                    <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="rounded-md border px-3 py-2 w-full"
                        disabled={submitting}
                    >
                        <option value="">— none —</option>
                        {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name || d.id}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2">
                    <Button type="submit" disabled={submitting}>
                        {submitting ? "Saving..." : "Save"}
                    </Button>
                    <Button
                        variant="ghost"
                        type="button"
                        onClick={() =>
                            navigate({to: "/projects/$projectId", params: {projectId}})
                        }
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
