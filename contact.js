const contactForm = document.querySelector('#contact-form');
const successDialog = document.querySelector('#success-dialog');
const submittedName = document.querySelector('#submitted-name');
const formStatus = document.querySelector('#form-status');
const submitButton = contactForm?.querySelector('[type="submit"]');

contactForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const formData = new FormData(contactForm);
  const name = String(formData.get('name') ?? '').trim();
  if (formStatus) formStatus.textContent = '';
  if (location.protocol === 'file:') {
    if (formStatus) formStatus.textContent = 'This form sends when the website is deployed on Netlify.';
    return;
  }
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
  }
  try {
    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString()
    });
    if (!response.ok) throw new Error(`Submission failed (${response.status})`);
    if (submittedName) submittedName.textContent = name.split(/\s+/)[0] || 'there';
    contactForm.reset();
    successDialog?.showModal();
  } catch {
    if (formStatus) formStatus.textContent = 'We couldn’t send that just now. Please try again, or contact us through another channel.';
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
    }
  }
});
successDialog?.querySelector('.dialog-close')?.addEventListener('click', () => successDialog.close());
successDialog?.querySelector('.dialog-done')?.addEventListener('click', () => { window.location.href = 'index.html'; });
successDialog?.addEventListener('click', event => { if (event.target === successDialog) successDialog.close(); });
