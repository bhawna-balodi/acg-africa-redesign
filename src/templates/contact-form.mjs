const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Labels, country choices and required states come from the official form.
export function renderContactForm(schema, prefix) {
  const fields = schema.fields.map(field => {
    const id = `${prefix}-${field.key}`;
    const attributes = `id="${id}" name="${escape(field.label)}" data-contact-field="${field.key}" required aria-required="true" aria-describedby="${id}-error"`;
    let input;
    if (field.type === 'select') input = `<select ${attributes} autocomplete="tel-country-code">${field.options.map(o => `<option value="${escape(o.value)}"${o.value === schema.defaultCountry ? ' selected' : ''}>${escape(o.text)}</option>`).join('')}</select>`;
    else if (field.type === 'textarea') input = `<textarea ${attributes} rows="6"></textarea>`;
    else input = `<input ${attributes} type="${field.type}" autocomplete="${field.autocomplete}"${field.type === 'tel' ? ' inputmode="tel"' : ''}>`;
    return `<div class="contact-field${field.fullWidth ? ' contact-field--full' : ''}"><label for="${id}">${escape(field.label)} <span class="required-mark" aria-hidden="true">*</span></label>${input}<span class="field-error" id="${id}-error"></span></div>`;
  }).join('');
  return `<form class="contact-form" data-contact-form action="mailto:info@acgafrica.com" method="post" enctype="text/plain" aria-label="Get in Touch" aria-describedby="${prefix}-delivery">
    <p class="contact-required">${escape(schema.requiredLegend)}</p>
    <div class="contact-fields">${fields}</div>
    <div class="contact-submit-group">
      <p class="contact-delivery" id="${prefix}-delivery">Submit prepares an email to <a href="mailto:info@acgafrica.com">info@acgafrica.com</a>. Send it from your email app to complete your enquiry.</p>
      <div class="contact-actions"><button type="submit" class="contact-submit">${escape(schema.submit)} <span aria-hidden="true">↗</span></button><button type="button" data-copy-enquiry hidden>Copy enquiry</button></div>
      <p class="contact-status" role="status" aria-live="polite" aria-atomic="true"></p>
      <textarea class="contact-copy-fallback" aria-label="Enquiry text to copy" readonly hidden></textarea>
    </div>
  </form>`;
}
