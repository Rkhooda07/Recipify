document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('recipe-form');
  const userIngredient = document.getElementById('ingredient-input');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    const userInput = userIngredient.value.trim();

    if (userInput === '') {
      showErrorMessage('Please enter a valid ingredients to get the recipie');
      return;
    }

    localStorage.setItem('userIngredients', userInput);

    window.location.href = 'chat.html';
  });

  function showErrorMessage(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = 'red';
    errorDiv.style.marginTop = '-25px';
    errorDiv.style.marginBottom = '10px';
    errorDiv.style.fontSize = '16px';

    form.parentNode.insertBefore(errorDiv, form.nextSibling);

    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }
});