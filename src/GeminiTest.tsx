import { GoogleGenAI } from "@google/genai";
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export default function GeminiTest() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [response, setResponse] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	const getResponse = async () => {
		setLoading(true);
		try {
			const result = await ai.models.generateContent({
				model: "gemini-2.5-flash",
				contents: "Explain how AI works in a few words",
			});
			setResponse(result);
			console.log(result.text);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<Button onClick={getResponse}>Get Response</Button>
			{loading && <div>loading...</div>}
			{response && <div>{response.text}</div>}
		</div>
	);
}
