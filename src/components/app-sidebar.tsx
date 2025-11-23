"use client";

import { Link } from "@tanstack/react-router";
import { Building2, Home, Pointer, ShieldCheck, Tag, User } from "lucide-react";
import type * as React from "react";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
	user: {
		name: "Wolfmüller Manager",
		email: "director@wm.de",
		avatar: `${import.meta.env.BASE_URL}wolfmueller.png`,
	},
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<div className="flex items-center gap-2 transition-[width,height] ease-linear group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
					<img
						src={`${import.meta.env.BASE_URL}wolff-muller-logo.svg`}
						alt="company logo"
						className="h-14 w-auto object-contain transition-all group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 dark:invert"
					/>
					<img
						src={`${import.meta.env.BASE_URL}node-navigator-logo.svg`}
						alt="node navigator logo"
						className="h-10 w-auto object-contain transition-all group-data-[collapsible=icon]:hidden dark:invert"
					/>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup className="group-data-[collapsible=icon]:hidden">
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link to="/projects">
									<Home />
									<span>Projects</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link to="/milestones">
									<Pointer />
									<span>Milestones</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link to="/users">
									<User />
									<span>Users</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link to="/departments">
									<Building2 />
									<span>Departments</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link to="/labels">
									<Tag />
									<span>Labels</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link to="/quality-gates">
									<ShieldCheck />
									<span>Quality Gates</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
