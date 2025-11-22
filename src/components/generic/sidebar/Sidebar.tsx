import {SidebarProvider} from "@/components/ui/sidebar.tsx";
import {AppSidebar} from "@/components/app-sidebar.tsx";

export default function CustomSidebar() {
    return (
        <SidebarProvider>
            <AppSidebar />
        </SidebarProvider>
    )
}