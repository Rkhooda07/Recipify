// API Configuration (frontend now calls local backend to avoid exposing keys)
console.log('[Recipify] chat.js loaded (backend mode)');
const BACKEND_URL = 'http://127.0.0.1:8000/generate-recipe';

// Main function now calls the local FastAPI backend
async function generateRecipeFromGemini(ingredients) {
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Backend error: ${response.status} ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  return data.recipe;
}

// Display messages in chat
function displayMessage(content, sender, isLoading = false) {
  const chatContainer = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  
  messageDiv.className = `message ${sender}-message ${isLoading ? 'loading' : ''}`;
  
  if (isLoading) {
    messageDiv.innerHTML = `
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <span>${content}</span>
    `;
    messageDiv.id = 'loading-message';
  } else {
    messageDiv.innerHTML = formatRecipeContent(content);
  }
  
  chatContainer.appendChild(messageDiv);
  
  // Smooth scroll to bottom with a small delay to ensure content is rendered
  setTimeout(() => {
    chatContainer.scrollTo({
      top: chatContainer.scrollHeight,
      behavior: 'smooth'
    });
  }, 100);
}

// Format recipe content for better display
function formatRecipeContent(content) {
  return content
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

// Remove loading message
function removeLoadingMessage() {
  const loadingMessage = document.getElementById('loading-message');
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

// Handle recipe generation with error handling
async function handleRecipeGeneration(ingredients) {
  try {
    // Show loading message
    displayMessage('Let me think of a perfect recipe for you...', 'ai', true);
    
    // Generate recipe from API
    const recipe = await generateRecipeFromGemini(ingredients);
    
    // Remove loading message and show recipe
    removeLoadingMessage();
    displayMessage(recipe, 'ai');
    
    // Save recipe to localStorage
    saveRecipeToLocalStorage(recipe, ingredients);
  } catch (error) {
    console.error('Recipe generation error:', error);
    removeLoadingMessage();
    displayMessage('Sorry, there was an issue generating your recipe. Please try again.', 'ai');
  }
}

// Save recipe to localStorage
function saveRecipeToLocalStorage(recipe, ingredients) {
  try {
    // Get existing recipes from localStorage
    const existingRecipes = JSON.parse(localStorage.getItem('userRecipes') || '[]');
    
    // Create new recipe object
    const newRecipe = {
      id: Date.now(),
      name: extractRecipeName(recipe),
      ingredients: ingredients,
      recipe: recipe,
      dateCreated: new Date().toISOString(),
      dateViewed: new Date().toISOString()
    };
    
    // Add to beginning of array (most recent first)
    existingRecipes.unshift(newRecipe);
    
    // Keep only the last 20 recipes to avoid localStorage limits
    if (existingRecipes.length > 20) {
      existingRecipes.splice(20);
    }
    
    // Save back to localStorage
    localStorage.setItem('userRecipes', JSON.stringify(existingRecipes));
    
    console.log('Recipe saved to localStorage:', newRecipe.name);
  } catch (error) {
    console.error('Error saving recipe to localStorage:', error);
  }
}

// Extract recipe name from the generated recipe text
function extractRecipeName(recipe) {
  // Try to find the recipe name from the first few lines
  const lines = recipe.split('\n');
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#') && !line.toLowerCase().includes('ingredients') && 
        !line.toLowerCase().includes('instructions') && !line.toLowerCase().includes('time')) {
      return line.replace(/^[0-9]+\.\s*/, '').replace(/^[-*]\s*/, '');
    }
  }
  return 'Generated Recipe';
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', function() {
  const storedIngredients = localStorage.getItem('userIngredients');
  const urlParams = new URLSearchParams(window.location.search);
  const paramIngredients = urlParams.get('ingredients');

  const userIngredients = (storedIngredients && storedIngredients.trim())
    ? storedIngredients.trim()
    : (paramIngredients && paramIngredients.trim()) ? paramIngredients.trim() : '';

  // If we have prefilled ingredients, auto-generate
  if (userIngredients) {
    console.log('User ingredients: ', userIngredients);
    displayMessage(`I have these ingredients: ${userIngredients}`, 'user');
    if (storedIngredients) {
      localStorage.removeItem('userIngredients');
    }
    handleRecipeGeneration(userIngredients);
  } else {
    console.log('No prefilled ingredients. You can type into the input below.');
  }

  // Handle manual submit from chat input
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const typed = (chatInput.value || '').trim();
      if (!typed) {
        return;
      }
      displayMessage(`I have these ingredients: ${typed}`, 'user');
      chatInput.value = '';
      handleRecipeGeneration(typed);
    });
  }
});