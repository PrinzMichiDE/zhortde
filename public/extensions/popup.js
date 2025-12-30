document.addEventListener('DOMContentLoaded', () => {
  const shortenBtn = document.getElementById('shorten-btn');
  const copyBtn = document.getElementById('copy-btn');
  const resetBtn = document.getElementById('reset-btn');
  const retryBtn = document.getElementById('retry-btn');
  
  const initialState = document.getElementById('initial-state');
  const loadingState = document.getElementById('loading');
  const resultState = document.getElementById('result-state');
  const errorState = document.getElementById('error-state');
  
  const shortUrlInput = document.getElementById('short-url');
  const successMsg = document.getElementById('success-msg');
  const errorMsg = document.getElementById('error-msg');

  // Helper to show specific state
  const showState = (state) => {
    [initialState, loadingState, resultState, errorState].forEach(el => {
      el.classList.add('hidden');
    });
    state.classList.remove('hidden');
  };

  // Get current tab URL
  const getCurrentTab = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  };

  // Shorten URL function
  const shortenUrl = async () => {
    showState(loadingState);
    
    try {
      const tab = await getCurrentTab();
      if (!tab || !tab.url) throw new Error('Keine URL gefunden');

      // Call Zhort API
      const response = await fetch('https://zhort.de/api/v1/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: tab.url
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Kürzen');
      }

      // Show result
      shortUrlInput.value = data.shortUrl;
      showState(resultState);
      
      // Auto-copy
      navigator.clipboard.writeText(data.shortUrl);
      successMsg.textContent = 'Automatisch kopiert!';
      successMsg.classList.remove('hidden');
      setTimeout(() => successMsg.classList.add('hidden'), 2000);

    } catch (err) {
      console.error(err);
      errorMsg.textContent = err.message || 'Ein unbekannter Fehler ist aufgetreten.';
      showState(errorState);
    }
  };

  // Event Listeners
  shortenBtn.addEventListener('click', shortenUrl);
  
  copyBtn.addEventListener('click', () => {
    shortUrlInput.select();
    navigator.clipboard.writeText(shortUrlInput.value);
    successMsg.textContent = 'Kopiert!';
    successMsg.classList.remove('hidden');
    setTimeout(() => successMsg.classList.add('hidden'), 2000);
  });

  resetBtn.addEventListener('click', () => {
    shortUrlInput.value = '';
    showState(initialState);
  });

  retryBtn.addEventListener('click', () => {
    showState(initialState);
  });
});
