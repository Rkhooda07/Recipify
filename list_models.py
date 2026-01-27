import httpx
import os
from dotenv import load_dotenv
import asyncio

# Load environment variables
load_dotenv("API-Key.env")

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("Error: GEMINI_API_KEY not found in API-Key.env")
    exit(1)

API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

async def list_models():
    print(f"Fetching models from {API_URL}...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{API_URL}?key={API_KEY}",
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                models = data.get("models", [])
                print(f"\nFound {len(models)} models:")
                print("=" * 60)
                for model in models:
                    name = model.get('name', 'Unknown')
                    display_name = model.get('displayName', 'Unknown')
                    description = model.get('description', 'No description')
                    methods = model.get('supportedGenerationMethods', [])
                    
                    print(f"Model: {display_name} ({name})")
                    print(f"Description: {description}")
                    print(f"Supported Methods: {', '.join(methods)}")
                    print("-" * 60)
            else:
                print(f"Error fetching models: {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    asyncio.run(list_models())
