import { GoogleGenAI } from "@google/genai";
import { useState } from "react";

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
      <button onClick={getResponse}>Get Response</button>
      {loading && <div>loading...</div>}
      {response && <div>{response.text}</div>}
    </div>
  );
}
