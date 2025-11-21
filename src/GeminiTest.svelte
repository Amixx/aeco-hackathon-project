<script lang="ts">
  import { GoogleGenAI } from "@google/genai";

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  let response: any;
  let loading = false;

  const getResponse = async () => {
    loading = true;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Explain how AI works in a few words",
      });
      console.log(response.text);
    } finally {
      loading = false;
    }
  };
</script>

<div>
  <button on:click={getResponse}>Get Response</button>
  {#if loading}
    <div>loading...</div>
  {/if}
  {#if response}
    <div>{response.text}</div>
  {/if}
</div>
