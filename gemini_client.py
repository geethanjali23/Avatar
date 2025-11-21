# gemini_client.py 
import os
import google.generativeai as genai

class GeminiClient:
    def __init__(self, model="gemini-2.0-flash"):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Missing GEMINI_API_KEY in .env")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)
        print(f"✅ Gemini client connected using model: {model}")

    def ask(self, prompt: str):
        response = self.model.generate_content(prompt)
        return response.text
