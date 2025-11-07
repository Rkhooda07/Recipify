from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv("API-Key.env")  # Loads API-Key.env file

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Use v1beta endpoint with widely available model
API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

# Debug: Print API key status (no sensitive data)
print(f"API Key loaded: {'Yes' if GEMINI_API_KEY else 'No'}")

class RecipeRequest(BaseModel):
    ingredients: str

@app.post("/generate-recipe")
async def generate_recipe(request: RecipeRequest):
    try:
        # Debug: Print received ingredients
        print(f"Received ingredients: {request.ingredients}")
        
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="Gemini API key not found")
        
        prompt = f"""You are a professional chef AI assistant. Create a detailed recipe using the following ingredients: {request.ingredients}.

Please provide:
1. Recipe name
2. Cooking time
3. Difficulty level
4. Complete ingredients list (including quantities)
5. Step-by-step cooking instructions
6. Nutritional highlights
7. Serving suggestions

Format the response in a clear, easy-to-read structure. If some common kitchen staples are needed (salt, pepper, oil), feel free to include them."""
        
        request_body = {
            "contents": [{
                "role": "user",
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 1024,
            }
        }
        
        headers = {"Content-Type": "application/json"}
        
        print(f"Calling Gemini API...")
        try:
            # Increase timeout to handle slower responses
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{API_URL}?key={GEMINI_API_KEY}",
                    json=request_body,
                    headers=headers
                )
        except httpx.TimeoutException:
            print("Gemini API request timed out")
            raise HTTPException(status_code=500, detail="Gemini API request timed out")
        except httpx.RequestError as e:
            print(f"Network error calling Gemini API: {e}")
            raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
        
        print(f"Gemini API response status: {response.status_code}")
        
        if response.status_code != 200:
            error_text = response.text
            print(f"Gemini API error response: {error_text}")
            # Surface upstream error message for debugging
            raise HTTPException(status_code=500, detail=f"Gemini API error {response.status_code}: {error_text}")
        
        data = response.json()
        print(f"Gemini API response structure: {list(data.keys())}")
        
        try:
            recipe_text = data["candidates"][0]["content"]["parts"][0]["text"]
            print(f"Recipe generated successfully, length: {len(recipe_text)}")
            return {"recipe": recipe_text}
        except (KeyError, IndexError) as e:
            print(f"Error parsing Gemini response: {e}")
            print(f"Response data: {data}")
            raise HTTPException(status_code=500, detail="Invalid response structure from Gemini API")
            
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)