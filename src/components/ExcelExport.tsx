import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExcelExportProps {
	data: Record<string, string | number | boolean | null | undefined>[];
	filename: string;
}

export function ExcelExport({ data, filename }: ExcelExportProps) {
	const handleExport = () => {
		if (!data || data.length === 0) {
			alert("No data to export");
			return;
		}

		// Get headers from the first object
		const headers = Object.keys(data[0]);

		// Create CSV content
		const csvContent = [
			// Headers row
			headers.join(","),
			// Data rows
			...data.map((row) =>
				headers
					.map((header) => {
						const value = row[header];
						// Handle strings that might contain commas or newlines
						if (typeof value === "string") {
							// Escape quotes and wrap in quotes
							return `"${value.replace(/"/g, '""')}"`;
						}
						if (value === null || value === undefined) {
							return "";
						}
						return value;
					})
					.join(","),
			),
		].join("\n");

		// Create blob and download
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `${filename}.csv`);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<Button variant="outline" onClick={handleExport} className="gap-2">
			<Download className="h-4 w-4" />
			Export to Excel
		</Button>
	);
}
