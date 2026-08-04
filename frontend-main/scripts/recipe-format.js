// Shared recipe rendering: HTML-escape first, then markdown-lite formatting.
// Used by chat.js and my-recipes.js.

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handles **bold**, # headings, -/*/• bullets and 1. numbered lists.
function formatRecipeContent(content) {
  const lines = escapeHtml(content).split('\n');
  let html = '';
  let list = null;
  const closeList = () => {
    if (list) {
      html += `</${list}>`;
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim().replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    let m;
    if (!line) {
      closeList();
    } else if ((m = line.match(/^#{1,6}\s+(.*)/))) {
      closeList();
      html += `<h3>${m[1]}</h3>`;
    } else if ((m = line.match(/^[-*•]\s+(.*)/))) {
      if (list !== 'ul') { closeList(); html += '<ul>'; list = 'ul'; }
      html += `<li>${m[1]}</li>`;
    } else if ((m = line.match(/^\d+[.)]\s+(.*)/))) {
      if (list !== 'ol') { closeList(); html += '<ol>'; list = 'ol'; }
      html += `<li>${m[1]}</li>`;
    } else {
      closeList();
      html += `<p>${line}</p>`;
    }
  }
  closeList();
  return html;
}
