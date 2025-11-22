import { Button } from "@/components/ui/button";
import { useRef } from "react";

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
			<Button variant="outline" onClick={handleButtonClick}>
				Import from Excel
			</Button>
		</>
	);
}
