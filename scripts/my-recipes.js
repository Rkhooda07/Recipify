// Load and display recipes from localStorage
function loadUserRecipes() {
  try {
    const recipes = JSON.parse(localStorage.getItem('userRecipes') || '[]');
    const historyCardsContainer = document.querySelector('.history-cards');
    
    if (recipes.length === 0) {
      // Show empty state
      historyCardsContainer.innerHTML = `
        <div class="empty-state">
          <h3>No recipes yet</h3>
          <p>Generate your first recipe to see it here!</p>
          <a href="chat.html" class="generate-btn">Generate Recipe</a>
        </div>
      `;
      return;
    }
    
    // Clear existing content
    historyCardsContainer.innerHTML = '';
    
    // Display each recipe
    recipes.forEach(recipe => {
      const recipeCard = createRecipeCard(recipe);
      historyCardsContainer.appendChild(recipeCard);
    });
    
  } catch (error) {
    console.error('Error loading recipes:', error);
    displayError('Failed to load recipes');
  }
}

// Create a recipe card element
function createRecipeCard(recipe) {
  const card = document.createElement('div');
  card.className = 'history-card';
  card.setAttribute('data-recipe-id', recipe.id);
  
  // Format the date
  const date = new Date(recipe.dateViewed);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  card.innerHTML = `
    <h3>${escapeHtml(recipe.name)}</h3>
    <p>Viewed on: ${formattedDate}</p>
    <p class="recipe-ingredients">Ingredients: ${escapeHtml(recipe.ingredients)}</p>
  `;
  
  // Add click event to view recipe details
  card.addEventListener('click', () => {
    viewRecipeDetails(recipe);
  });
  
  return card;
}

// View recipe details in a modal
function viewRecipeDetails(recipe) {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'recipe-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${escapeHtml(recipe.name)}</h2>
        <button class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div class="recipe-info">
          <p><strong>Ingredients used:</strong> ${escapeHtml(recipe.ingredients)}</p>
          <p><strong>Created:</strong> ${new Date(recipe.dateCreated).toLocaleDateString()}</p>
        </div>
        <div class="recipe-content">
          ${formatRecipeContent(recipe.recipe)}
        </div>
      </div>
      <div class="modal-footer">
        <button class="delete-btn" onclick="deleteRecipe(${recipe.id})">Delete Recipe</button>
        <button class="close-modal-btn">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  modal.querySelector('.close-btn').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.querySelector('.close-modal-btn').addEventListener('click', () => {
    modal.remove();
  });
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // Update last viewed date
  updateRecipeViewDate(recipe.id);
}

// Delete a recipe
function deleteRecipe(recipeId) {
  if (confirm('Are you sure you want to delete this recipe?')) {
    try {
      const recipes = JSON.parse(localStorage.getItem('userRecipes') || '[]');
      const updatedRecipes = recipes.filter(recipe => recipe.id !== recipeId);
      localStorage.setItem('userRecipes', JSON.stringify(updatedRecipes));
      
      // Reload the page to update the display
      location.reload();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Failed to delete recipe');
    }
  }
}

// Update recipe view date
function updateRecipeViewDate(recipeId) {
  try {
    const recipes = JSON.parse(localStorage.getItem('userRecipes') || '[]');
    const recipeIndex = recipes.findIndex(recipe => recipe.id === recipeId);
    
    if (recipeIndex !== -1) {
      recipes[recipeIndex].dateViewed = new Date().toISOString();
      localStorage.setItem('userRecipes', JSON.stringify(recipes));
    }
  } catch (error) {
    console.error('Error updating recipe view date:', error);
  }
}

// Format recipe content for display
function formatRecipeContent(content) {
  return content
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Display error message
function displayError(message) {
  const historyCardsContainer = document.querySelector('.history-cards');
  historyCardsContainer.innerHTML = `
    <div class="error-state">
      <h3>Error</h3>
      <p>${message}</p>
    </div>
  `;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  loadUserRecipes();
}); 