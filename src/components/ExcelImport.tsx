import { Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

export function ExcelImport() {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			// In a real application, we would process the file here
			window.alert("Success");
			// Clear the input so the same file can be selected again if needed
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const handleButtonClick = () => {
		fileInputRef.current?.click();
	};

	return (
		<>
			<input
				type="file"
				accept=".xlsx, .xls"
				className="hidden"
				ref={fileInputRef}
				onChange={handleFileChange}
				style={{ display: "none" }}
			/>
			<Button variant="outline" onClick={handleButtonClick} className="gap-2">
				<Upload className="h-4 w-4" />
				Import from Excel
			</Button>
		</>
	);
}
