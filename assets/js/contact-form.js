/* Frontend only: no messages are sent or saved until a backend is connected. */
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const fields = {name: document.getElementById('contactName'), email: document.getElementById('contactEmail'), subject: document.getElementById('contactSubject'), message: document.getElementById('contactMessage')};
  const result = document.getElementById('contactFormResult');
  const count = document.getElementById('contactCharCount');
  const emailLink = '<a href="mailto:karopays.online@gmail.com">karopays.online@gmail.com</a>';
  const errors = {name: document.getElementById('contactNameError'), email: document.getElementById('contactEmailError'), subject: document.getElementById('contactSubjectError'), message: document.getElementById('contactMessageError')};
  function setError(key, message) { errors[key].textContent = message; fields[key].setAttribute('aria-invalid', message ? 'true' : 'false'); }
  fields.message.addEventListener('input', () => { count.textContent = `${fields.message.value.length}/3000`; count.classList.toggle('over', fields.message.value.length > 3000); });
  form.addEventListener('submit', (event) => {
    event.preventDefault(); let valid = true;
    Object.keys(fields).forEach((key) => {
      const value = fields[key].value.trim(); let message = '';
      if (!value) message = 'This field is required.';
      else if (key === 'email' && !fields.email.validity.valid) message = 'Enter a valid email address.';
      else if (key === 'name' && value.length < 2) message = 'Enter your full name.';
      else if (key === 'subject' && value.length < 3) message = 'Please enter a more descriptive subject.';
      else if (key === 'message' && value.length < 10) message = 'Please provide at least 10 characters.';
      setError(key, message); if (message) valid = false;
    });
    if (!valid) { result.className = 'contact-status error show'; result.textContent = 'Please check the highlighted fields and try again.'; const first = form.querySelector('[aria-invalid="true"]'); if (first) first.focus(); return; }
    result.className = 'contact-status info show';
    result.innerHTML = 'Your message was checked in this browser, but it has not been sent or saved because the backend is not connected yet. Please email us at ' + emailLink + '.';
  });
  Object.keys(fields).forEach((key) => fields[key].addEventListener('input', () => { if (fields[key].getAttribute('aria-invalid') === 'true') setError(key, ''); }));
})();
