import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar.tsx";

export const Route = createRootRoute({
	component: () => (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />
						<Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-4"
						/>
						{/* TODO: Add Breadcrumbs */}
						{/*<Breadcrumb>*/}
						{/*  <BreadcrumbList>*/}
						{/*    <BreadcrumbItem className="hidden md:block">*/}
						{/*      <BreadcrumbLink href="#">*/}
						{/*        Building Your Application*/}
						{/*      </BreadcrumbLink>*/}
						{/*    </BreadcrumbItem>*/}
						{/*    <BreadcrumbSeparator className="hidden md:block" />*/}
						{/*    <BreadcrumbItem>*/}
						{/*      <BreadcrumbPage>Data Fetching</BreadcrumbPage>*/}
						{/*    </BreadcrumbItem>*/}
						{/*  </BreadcrumbList>*/}
						{/*</Breadcrumb>*/}
					</div>
				</header>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	),
});
