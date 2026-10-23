export function buildEmailDraft(values) {
  const body = ['First Name: '+values.firstName, 'Last Name: '+values.lastName,
    'Email Address: '+values.email, 'Country Code: '+values.countryCode,
    'Contact Number: '+values.phone, '', 'Your Message:', values.message].join('\r\n');
  return { body, url: 'mailto:info@acgafrica.com?subject='+encodeURIComponent('ACG website enquiry')+'&body='+encodeURIComponent(body) };
}

export function initializeContactForms(document) {
  document.querySelectorAll('[data-contact-form]').forEach(form => {
    const fields = [...form.querySelectorAll('[data-contact-field]')];
    const status = form.querySelector('.contact-status');
    const copy = form.querySelector('[data-copy-enquiry]');
    const fallback = form.querySelector('.contact-copy-fallback');
    copy.hidden = false;
    const values = () => Object.fromEntries(fields.map(field => [field.dataset.contactField, field.value.trim()]));
    function validateField(field) {
      field.setCustomValidity('');
      if (!field.value.trim()) field.setCustomValidity('Please complete this field.');
      const valid = field.validity.valid;
      field.setAttribute('aria-invalid', String(!valid));
      form.querySelector('#'+field.id+'-error').textContent = valid ? '' : field.validationMessage;
      return valid;
    }
    fields.forEach(field => {
      field.addEventListener('invalid', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') validateField(field);
        status.textContent = '';
        fallback.hidden = true;
      });
      field.addEventListener('change', () => {
        if (field.getAttribute('aria-invalid') === 'true') validateField(field);
      });
    });
    function validate() {
      const valid = fields.map(validateField).every(Boolean);
      if (!valid) { form.reportValidity(); fields.find(f => !f.validity.valid)?.focus(); }
      return valid;
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!validate()) return;
      const draft = buildEmailDraft(values());
      // Opening the user's email editor never claims delivery or clears entries.
      status.textContent = 'Your email app should open with your enquiry. Send the email to complete it. If it does not open, use Copy enquiry.';
      window.location.href = draft.url;
    });
    copy.addEventListener('click', async () => {
      if (!validate()) return;
      const {body} = buildEmailDraft(values());
      try {
        await navigator.clipboard.writeText(body);
        status.textContent = 'Enquiry copied. Paste it into an email to info@acgafrica.com and send it.';
      } catch {
        fallback.value = body;
        fallback.hidden = false;
        fallback.focus();
        fallback.select();
        status.textContent = 'Copy the selected text, then paste it into an email to info@acgafrica.com.';
      }
    });
  });
}
if (typeof document !== 'undefined') initializeContactForms(document);
