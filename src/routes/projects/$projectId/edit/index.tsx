import { Label } from "@radix-ui/react-dropdown-menu";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import "@/database/initSessionDb.ts";
import { api, db } from "@/database/api.ts";
import { saveDbToSession } from "@/database/sessionPersistence.ts";

export const Route = createFileRoute("/projects/$projectId/edit/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { projectId } = Route.useParams();
	const navigate = useNavigate();

	const [loaded, setLoaded] = React.useState(false);
	const [submitting, setSubmitting] = React.useState(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [project, setProject] = React.useState<any | null>(null);

	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");

	React.useEffect(() => {
		const p = api.getProjectById(projectId);
		setProject(p ?? null);
		if (p) {
			setName(p.name ?? "");
			setDescription(p.description ?? "");
		} else {
			setName("");
			setDescription("");
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
			updated_at: new Date().toISOString(),
		};

		try {
			setSubmitting(true);
			const res = api.editProject(updated);
			if (!res) {
				alert("Failed to update project.");
				return;
			}
			saveDbToSession(db);
			navigate({ to: "/projects/$projectId", params: { projectId } });
		} finally {
			setSubmitting(false);
		}
	}

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
					<Button onClick={() => navigate({ to: "/projects" })}>Back</Button>
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

				<div className="flex gap-2">
					<Button type="submit" disabled={submitting}>
						{submitting ? "Saving..." : "Save"}
					</Button>
					<Button
						variant="ghost"
						type="button"
						onClick={() =>
							navigate({ to: "/projects/$projectId", params: { projectId } })
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
