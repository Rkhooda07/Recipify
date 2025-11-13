// DOM Elements
const recipeForm = document.getElementById('recipeForm');
const recipePage = document.getElementById('recipePage');
const backBtn = document.getElementById('backBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const recipeContent = document.getElementById('recipeContent');
const navLinks = document.querySelectorAll('.nav-link');

// Gemini API Configuration
const GEMINI_API_KEY = "AIzaSyDSOQ2IBE8oc39kk4WmhGv51L_4AL0fT4M";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Sample recipe data for demonstration (replace with actual API call)
const sampleRecipes = {
    'chicken rice tomatoes': {
        title: 'Chicken Tomato Rice Bowl',
        description: 'A delicious and healthy one-pot meal featuring tender chicken, fresh tomatoes, and fluffy rice.',
        ingredients: [
            '2 chicken breasts, diced',
            '1 cup rice',
            '2 tomatoes, chopped',
            '1 onion, diced',
            '2 cloves garlic, minced',
            '2 tbsp olive oil',
            'Salt and pepper to taste',
            '1 tsp dried oregano',
            '2 cups chicken broth'
        ],
        instructions: [
            'Heat olive oil in a large skillet over medium heat.',
            'Add diced chicken and cook until golden brown, about 5-7 minutes.',
            'Add onion and garlic, sauté until fragrant, about 2 minutes.',
            'Add chopped tomatoes and cook for 3-4 minutes until they soften.',
            'Stir in rice, oregano, salt, and pepper.',
            'Pour in chicken broth and bring to a boil.',
            'Reduce heat to low, cover, and simmer for 20-25 minutes until rice is tender.',
            'Let stand for 5 minutes before serving.',
            'Garnish with fresh herbs if desired.'
        ],
        prepTime: '10 minutes',
        cookTime: '25 minutes',
        servings: '4',
        difficulty: 'Easy',
        cuisine: 'Mediterranean'
    },
    'pasta cheese spinach': {
        title: 'Creamy Spinach Pasta',
        description: 'A comforting pasta dish with creamy cheese sauce and fresh spinach.',
        ingredients: [
            '1 lb pasta (penne or fettuccine)',
            '2 cups fresh spinach',
            '1 cup shredded cheese (mozzarella or parmesan)',
            '2 tbsp butter',
            '2 tbsp flour',
            '1 cup milk',
            '2 cloves garlic, minced',
            'Salt and pepper to taste',
            '1/4 cup reserved pasta water'
        ],
        instructions: [
            'Cook pasta according to package directions until al dente.',
            'Reserve 1/4 cup of pasta water before draining.',
            'In a large skillet, melt butter over medium heat.',
            'Add minced garlic and sauté until fragrant, about 1 minute.',
            'Whisk in flour and cook for 1 minute to make a roux.',
            'Gradually whisk in milk until smooth.',
            'Add cheese and stir until melted and creamy.',
            'Add fresh spinach and cook until wilted, about 2 minutes.',
            'Add cooked pasta and reserved pasta water.',
            'Toss until well combined and serve immediately.'
        ],
        prepTime: '5 minutes',
        cookTime: '15 minutes',
        servings: '4',
        difficulty: 'Easy',
        cuisine: 'Italian'
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Add event listeners
    recipeForm.addEventListener('submit', handleFormSubmit);
    backBtn.addEventListener('click', goBackToHome);
    
    // Add smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });
    
    // Add floating elements animation
    initFloatingElements();
    
    // Add scroll effects
    initScrollEffects();
    
    console.log('CulinaryAI Recipe Generator with Gemini API initialized!');
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(recipeForm);
    const ingredients = formData.get('ingredients').toLowerCase().trim();
    const cuisine = formData.get('cuisine');
    const dietary = formData.get('dietary');
    
    if (!ingredients) {
        showNotification('Please enter some ingredients!', 'error');
        return;
    }
    
    // Show loading overlay
    showLoading(true);
    
    try {
        await generateRecipe(ingredients, cuisine, dietary);
    } catch (error) {
        console.error('Error in form submission:', error);
        showNotification('Something went wrong. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Generate recipe using Gemini API
async function generateRecipe(ingredients, cuisine, dietary) {
    try {
        // Create the prompt for the Gemini API
        const prompt = createRecipePrompt(ingredients, cuisine, dietary);
        
        // Make API call to Gemini
        const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('API rate limit exceeded. Please try again in a moment.');
            } else if (response.status === 403) {
                throw new Error('API access denied. Please check your API key.');
            } else {
                throw new Error(`API request failed: ${response.status}`);
            }
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const recipeText = data.candidates[0].content.parts[0].text;
            const recipe = parseRecipeFromResponse(recipeText, ingredients, cuisine, dietary);
            displayRecipe(recipe);
            showRecipePage();
        } else if (data.error) {
            throw new Error(data.error.message || 'API returned an error');
        } else {
            throw new Error('Invalid response format from API');
        }
        
    } catch (error) {
        console.error('Error generating recipe:', error);
        showNotification(error.message || 'Failed to generate recipe. Please try again.', 'error');
        
        // Fallback to sample recipe
        const fallbackRecipe = generateGenericRecipe(ingredients, cuisine, dietary);
        displayRecipe(fallbackRecipe);
        showRecipePage();
    }
}

// Create prompt for Gemini API
function createRecipePrompt(ingredients, cuisine, dietary) {
    let prompt = `Create a detailed recipe using these ingredients: ${ingredients}.`;
    
    if (cuisine) {
        prompt += ` Make it in ${cuisine} style.`;
    }
    
    if (dietary) {
        prompt += ` Ensure it's ${dietary} friendly.`;
    }
    
    prompt += `

Please provide the recipe in the following JSON format:
{
    "title": "Recipe Title",
    "description": "Brief description of the recipe",
    "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
    "instructions": ["step 1", "step 2", "step 3"],
    "prepTime": "X minutes",
    "cookTime": "X minutes", 
    "servings": "X",
    "difficulty": "Easy/Medium/Hard",
    "cuisine": "cuisine type"
}

Make sure the recipe is practical, delicious, and uses the provided ingredients creatively. Include common pantry items if needed. Keep instructions clear and easy to follow.`;

    return prompt;
}

// Parse recipe from Gemini API response
function parseRecipeFromResponse(recipeText, ingredients, cuisine, dietary) {
    try {
        // Try to extract JSON from the response
        const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const recipeData = JSON.parse(jsonMatch[0]);
            
            // Validate and return the parsed recipe
            return {
                title: recipeData.title || `${cuisine ? cuisine.charAt(0).toUpperCase() + cuisine.slice(1) : 'Delicious'} Recipe`,
                description: recipeData.description || `A creative recipe using ${ingredients}`,
                ingredients: recipeData.ingredients || [],
                instructions: recipeData.instructions || [],
                prepTime: recipeData.prepTime || '10 minutes',
                cookTime: recipeData.cookTime || '20 minutes',
                servings: recipeData.servings || '2-4',
                difficulty: recipeData.difficulty || 'Easy',
                cuisine: recipeData.cuisine || cuisine || 'International'
            };
        }
    } catch (error) {
        console.error('Error parsing recipe JSON:', error);
    }
    
    // Fallback: parse from text if JSON parsing fails
    return parseRecipeFromText(recipeText, ingredients, cuisine, dietary);
}

// Parse recipe from text response (fallback)
function parseRecipeFromText(recipeText, ingredients, cuisine, dietary) {
    const lines = recipeText.split('\n').filter(line => line.trim());
    
    // Extract title (usually the first line)
    const title = lines[0] || `${cuisine ? cuisine.charAt(0).toUpperCase() + cuisine.slice(1) : 'Delicious'} Recipe`;
    
    // Extract ingredients (look for common patterns)
    const ingredientsList = [];
    const instructionsList = [];
    let inIngredients = false;
    let inInstructions = false;
    
    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (lowerLine.includes('ingredient') || lowerLine.includes('what you need')) {
            inIngredients = true;
            inInstructions = false;
            continue;
        }
        
        if (lowerLine.includes('instruction') || lowerLine.includes('step') || lowerLine.includes('method')) {
            inIngredients = false;
            inInstructions = true;
            continue;
        }
        
        if (inIngredients && line.trim() && !line.toLowerCase().includes('instruction')) {
            ingredientsList.push(line.trim());
        }
        
        if (inInstructions && line.trim()) {
            instructionsList.push(line.trim());
        }
    }
    
    return {
        title: title,
        description: `A creative recipe using ${ingredients}`,
        ingredients: ingredientsList.length > 0 ? ingredientsList : [`1 cup ${ingredients.split(',')[0]}`],
        instructions: instructionsList.length > 0 ? instructionsList : ['Prepare and cook your ingredients as desired.'],
        prepTime: '10 minutes',
        cookTime: '20 minutes',
        servings: '2-4',
        difficulty: 'Easy',
        cuisine: cuisine || 'International'
    };
}

// Generate generic recipe for unmatched ingredients
function generateGenericRecipe(ingredients, cuisine, dietary) {
    const ingredientList = ingredients.split(',').map(item => item.trim());
    
    return {
        title: `${cuisine ? cuisine.charAt(0).toUpperCase() + cuisine.slice(1) : 'Delicious'} ${ingredientList[0]} Recipe`,
        description: `A creative recipe using your available ingredients: ${ingredients}`,
        ingredients: [
            ...ingredientList.map(ingredient => `1 cup ${ingredient}`),
            '2 tbsp olive oil',
            'Salt and pepper to taste',
            '1 onion, diced',
            '2 cloves garlic, minced'
        ],
        instructions: [
            'Prepare all your ingredients by washing and chopping as needed.',
            'Heat oil in a large pan over medium heat.',
            'Add diced onion and garlic, sauté until fragrant.',
            `Add ${ingredientList[0]} and cook for 5-7 minutes.`,
            'Season with salt and pepper to taste.',
            'Add remaining ingredients and cook until everything is tender.',
            'Serve hot and enjoy your delicious creation!'
        ],
        prepTime: '10 minutes',
        cookTime: '20 minutes',
        servings: '2-4',
        difficulty: 'Easy',
        cuisine: cuisine || 'International'
    };
}

// Display recipe in the recipe page
function displayRecipe(recipe) {
    const recipeHTML = `
        <div class="recipe-display">
            <div class="recipe-header-info">
                <h1 class="recipe-title">${recipe.title}</h1>
                <p class="recipe-description">${recipe.description}</p>
                
                <div class="recipe-meta">
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>Prep: ${recipe.prepTime}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-fire"></i>
                        <span>Cook: ${recipe.cookTime}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-users"></i>
                        <span>Serves: ${recipe.servings}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-star"></i>
                        <span>Difficulty: ${recipe.difficulty}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-globe"></i>
                        <span>Cuisine: ${recipe.cuisine}</span>
                    </div>
                </div>
            </div>
            
            <div class="recipe-sections">
                <div class="recipe-section">
                    <h3><i class="fas fa-list"></i> Ingredients</h3>
                    <ul class="ingredients-list">
                        ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="recipe-section">
                    <h3><i class="fas fa-utensils"></i> Instructions</h3>
                    <ol class="instructions-list">
                        ${recipe.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                    </ol>
                </div>
            </div>
            
            <div class="recipe-actions">
                <button class="action-btn print-btn" onclick="window.print()">
                    <i class="fas fa-print"></i>
                    Print Recipe
                </button>
                <button class="action-btn share-btn" onclick="shareRecipe()">
                    <i class="fas fa-share"></i>
                    Share Recipe
                </button>
                <button class="action-btn save-btn" onclick="saveRecipe()">
                    <i class="fas fa-bookmark"></i>
                    Save Recipe
                </button>
            </div>
        </div>
    `;
    
    recipeContent.innerHTML = recipeHTML;
}

// Show recipe page
function showRecipePage() {
    recipePage.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Go back to home page
function goBackToHome() {
    recipePage.classList.remove('active');
    document.body.style.overflow = 'auto';
    recipeForm.reset();
}

// Show/hide loading overlay
function showLoading(show) {
    if (show) {
        loadingOverlay.classList.add('active');
    } else {
        loadingOverlay.classList.remove('active');
    }
}

// Handle navigation clicks
function handleNavClick(e) {
    e.preventDefault();
    
    const targetId = this.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
    
    // Update active nav link
    navLinks.forEach(link => link.classList.remove('active'));
    this.classList.add('active');
}

// Initialize floating elements animation
function initFloatingElements() {
    const floatingItems = document.querySelectorAll('.floating-item');
    
    floatingItems.forEach(item => {
        const speed = parseFloat(item.getAttribute('data-speed'));
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5 * speed;
            item.style.transform = `translateY(${rate}px)`;
        });
    });
}

// Initialize scroll effects
function initScrollEffects() {
    const header = document.querySelector('.header');
    const featureCards = document.querySelectorAll('.feature-card');
    
    // Header scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    });
    
    // Feature cards animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Add styles for notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'error' ? '#ff6b6b' : '#4CAF50'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Share recipe function
function shareRecipe() {
    if (navigator.share) {
        navigator.share({
            title: 'Check out this amazing recipe!',
            text: 'I found this delicious recipe on CulinaryAI',
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            showNotification('Recipe link copied to clipboard!', 'info');
        });
    }
}

// Save recipe function
function saveRecipe() {
    // In a real app, this would save to localStorage or a database
    showNotification('Recipe saved to your favorites!', 'info');
}

// Add some additional CSS for recipe display
const additionalStyles = `
    .recipe-display {
        max-width: 100%;
    }
    
    .recipe-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: #333;
        margin-bottom: 1rem;
    }
    
    .recipe-description {
        font-size: 1.1rem;
        color: #666;
        margin-bottom: 2rem;
        line-height: 1.6;
    }
    
    .recipe-meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: white;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    
    .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #666;
    }
    
    .meta-item i {
        color: #ff6b6b;
        width: 20px;
    }
    
    .recipe-sections {
        display: grid;
        gap: 2rem;
        margin-bottom: 2rem;
    }
    
    .recipe-section {
        background: white;
        padding: 2rem;
        border-radius: 15px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    
    .recipe-section h3 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #333;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .recipe-section h3 i {
        color: #ff6b6b;
    }
    
    .ingredients-list {
        list-style: none;
        display: grid;
        gap: 0.75rem;
    }
    
    .ingredients-list li {
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #ff6b6b;
        transition: all 0.3s ease;
    }
    
    .ingredients-list li:hover {
        background: #e9ecef;
        transform: translateX(5px);
    }
    
    .instructions-list {
        counter-reset: step-counter;
        list-style: none;
        display: grid;
        gap: 1rem;
    }
    
    .instructions-list li {
        counter-increment: step-counter;
        padding: 1.5rem;
        background: #f8f9fa;
        border-radius: 10px;
        position: relative;
        padding-left: 3rem;
        transition: all 0.3s ease;
    }
    
    .instructions-list li::before {
        content: counter(step-counter);
        position: absolute;
        left: 1rem;
        top: 1.5rem;
        width: 30px;
        height: 30px;
        background: #ff6b6b;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.9rem;
    }
    
    .instructions-list li:hover {
        background: #e9ecef;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    
    .recipe-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        justify-content: center;
    }
    
    .action-btn {
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 25px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    .action-btn:hover {
        background: #ee5a24;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
    }
    
    @media (max-width: 768px) {
        .recipe-title {
            font-size: 2rem;
        }
        
        .recipe-meta {
            grid-template-columns: 1fr;
        }
        
        .recipe-actions {
            flex-direction: column;
        }
        
        .action-btn {
            justify-content: center;
        }
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && recipePage.classList.contains('active')) {
        goBackToHome();
    }
});

// Add form validation
const ingredientsInput = document.getElementById('ingredients');
ingredientsInput.addEventListener('input', function() {
    if (this.value.length > 0) {
        this.style.borderColor = '#4CAF50';
    } else {
        this.style.borderColor = '#e1e5e9';
    }
});

console.log('CulinaryAI Recipe Generator with Gemini API - All systems ready! 🍳✨');
