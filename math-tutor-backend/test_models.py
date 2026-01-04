import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure with your key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

print("Available models:")
for model in genai.list_models():
    print(f"- {model.name}")
    if "generateContent" in model.supported_generation_methods:
        print(f"  ✅ Supports generateContent")
    else:
        print(f"  ❌ No generateContent")
    print()
