// Front-end validation only. Connect a trusted backend before enabling message delivery.
(() => {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('contactStatus');
  if (!form || !status) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    status.textContent = 'Your details look complete, but message delivery is not connected yet. Nothing has been sent or saved.';
  });
})();
