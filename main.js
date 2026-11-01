(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  // Responsive navigation
  const menuToggle = $('.menu-toggle');
  const nav = $('#primary-nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) { nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); }
    });
  }
  // Accessible FAQ accordion: each question toggles its answer and state.
  $$('.faq-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const answerId = button.getAttribute('aria-controls');
      const answer = answerId ? document.getElementById(answerId) : null;
      if (!answer) return;
      const willOpen = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(willOpen));
      answer.hidden = !willOpen;
      const icon = button.querySelector('[aria-hidden="true"]');
      if (icon) icon.textContent = willOpen ? '−' : '+';
    });
  });

  const year = $('#current-year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Search and category filters on services.html
  const search = $('#service-search');
  const serviceCards = $$('.service-card');
  const filters = $$('.filter-button');
  const searchStatus = $('#search-status');
  const noServices = $('#no-services');
  let activeCategory = 'all';
  function filterServices() {
    if (!search || !serviceCards.length) return;
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    serviceCards.forEach(card => {
      const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
      const searchable = `${card.dataset.search || ''} ${card.innerText}`.toLocaleLowerCase();
      const matchesText = !query || searchable.includes(query);
      const visible = matchesCategory && matchesText;
      card.hidden = !visible;
      if (visible) count++;
    });
    if (searchStatus) searchStatus.textContent = `Showing ${count} ${count === 1 ? 'service' : 'services'}.`;
    if (noServices) noServices.hidden = count !== 0;
  }
  if (search) search.addEventListener('input', filterServices);
  filters.forEach(button => button.addEventListener('click', () => {
    activeCategory = button.dataset.filter || 'all';
    filters.forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
    filterServices();
  }));

  // Preselect service when arriving from a service card.
  const serviceSelect = $('#enquiry-service');
  if (serviceSelect) {
    const requested = new URLSearchParams(window.location.search).get('service');
    if (requested && Array.from(serviceSelect.options).some(option => option.value === requested || option.text === requested)) {
      serviceSelect.value = requested;
    }
  }

  // Accessible gallery lightbox with keyboard and button navigation.
  const lightbox = $('#lightbox');
  const lightboxImage = $('#lightbox-image');
  const lightboxCaption = $('#lightbox-caption');
  const galleryButtons = $$('[data-lightbox]');
  if (lightbox && lightboxImage && galleryButtons.length) {
    let currentIndex = 0;
    let lastTrigger = null;
    const closeButton = $('.lightbox-close', lightbox);
    const previousButton = $('.lightbox-prev', lightbox);
    const nextButton = $('.lightbox-next', lightbox);
    function showImage(index) {
      currentIndex = (index + galleryButtons.length) % galleryButtons.length;
      const trigger = galleryButtons[currentIndex];
      lightboxImage.src = trigger.dataset.lightbox;
      lightboxImage.alt = trigger.dataset.alt || trigger.querySelector('img')?.alt || 'Gallery image';
      lightboxCaption.textContent = trigger.dataset.alt || lightboxImage.alt;
    }
    function openLightbox(event, index) {
      lastTrigger = event.currentTarget;
      showImage(index);
      lightbox.hidden = false;
      document.body.classList.add('no-scroll');
      closeButton?.focus();
    }
    function closeLightbox() {
      lightbox.hidden = true;
      lightboxImage.src = '';
      document.body.classList.remove('no-scroll');
      lastTrigger?.focus();
    }
    galleryButtons.forEach((button, index) => button.addEventListener('click', event => openLightbox(event, index)));
    closeButton?.addEventListener('click', closeLightbox);
    previousButton?.addEventListener('click', () => showImage(currentIndex - 1));
    nextButton?.addEventListener('click', () => showImage(currentIndex + 1));
    lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', event => {
      if (lightbox.hidden) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showImage(currentIndex - 1);
      if (event.key === 'ArrowRight') showImage(currentIndex + 1);
      if (event.key === 'Tab') {
        const focusable = $$('button', lightbox).filter(button => !button.disabled);
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }

  // Reusable validation and asynchronous form submission. Configure the Formspree endpoint below before enabling live delivery.
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/mwllrqga";
  function setError(input, message) {
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    const error = input.form?.querySelector(`#${input.id}-error`);
    if (error) error.textContent = message;
  }
  function validateField(input) {
    const value = input.type === 'checkbox' ? input.checked : input.value.trim();
    let message = '';
    if (input.required && !value) message = input.type === 'checkbox' ? 'Please tick this box to continue.' : 'This field is required.';
    else if (input.type === 'email' && value && !input.validity.valid) message = 'Enter a valid email address, for example name@example.com.';
    else if (input.type === 'tel' && value && !input.validity.valid) message = 'Enter a phone number using 7–20 digits or common phone symbols.';
    else if (input.minLength > 0 && typeof value === 'string' && value && value.length < input.minLength) message = `Please enter at least ${input.minLength} characters.`;
    else if (input.maxLength > 0 && typeof value === 'string' && value.length > input.maxLength) message = `Please use no more than ${input.maxLength} characters.`;
    else if (input.type === 'date' && value) {
      const today = new Date(); today.setHours(0,0,0,0);
      const selected = new Date(`${value}T00:00:00`);
      if (selected < today) message = 'Choose today or a future date.';
    }
    setError(input, message);
    return !message;
  }
  $$('form[data-form-type]').forEach(form => {
    const status = form.id === 'enquiry-form' ? $('#enquiry-status') : $('#contact-status');
    const messageField = form.querySelector('textarea');
    const counterId = form.id === 'enquiry-form' ? '#message-count' : '#contact-message-count';
    const counter = $(counterId);
    if (messageField && counter) {
      const updateCount = () => { counter.textContent = String(messageField.value.length); };
      messageField.addEventListener('input', updateCount);
      updateCount();
    }
    form.querySelectorAll('input, select, textarea').forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validateField(input); });
      input.addEventListener('change', () => { if (input.getAttribute('aria-invalid') === 'true') validateField(input); });
    });
    form.addEventListener('reset', () => {
      window.setTimeout(() => {
        form.querySelectorAll('input, select, textarea').forEach(input => setError(input, ''));
        if (status) { status.className = 'form-status'; status.textContent = 'Form cleared. Complete the required fields to continue.'; }
        if (counter && messageField) counter.textContent = '0';
      }, 0);
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const inputs = Array.from(form.querySelectorAll('input, select, textarea')).filter(input => input.type !== 'reset' && input.type !== 'submit');
      const valid = inputs.map(validateField).every(Boolean);
      if (!valid) {
        if (status) { status.className = 'form-status error'; status.textContent = 'Please correct the highlighted fields before continuing.'; }
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }
      const data = new FormData(form);
      const isEnquiry = form.dataset.formType === 'enquiry';
      const subject = isEnquiry
        ? `Website service enquiry: ${data.get('service')}`
        : `Website contact message: ${data.get('type')}`;
      data.append('_subject', subject);

      // Until the owner creates a Formspree account and replaces the placeholder,
      // retain an honest email-draft fallback rather than pretending a message was sent.
      if (FORMSPREE_ENDPOINT.includes('REPLACE_WITH_YOUR_FORM_ID')) {
        const recipient = 'bookings@sedisbeauty.co.za'; // Confirm this address before publishing.
        const lines = isEnquiry
          ? [`Name: ${data.get('name')}`, `Email: ${data.get('email')}`, `Phone: ${data.get('phone')}`, `Service: ${data.get('service')}`, `Preferred date: ${data.get('date') || 'Not specified'}`, `Budget: ${data.get('budget') || 'Not specified'}`, '', 'Message:', data.get('message')]
          : [`Name: ${data.get('name')}`, `Email: ${data.get('email')}`, `Message type: ${data.get('type')}`, '', 'Message:', data.get('message')];
        const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
        if (status) { status.className = 'form-status error'; status.textContent = 'Formspree is not configured yet. Your email app will open with a draft; press Send there, or configure the endpoint for automatic AJAX submission.'; }
        window.location.href = mailto;
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Sending…'; }
      if (status) { status.className = 'form-status'; status.textContent = 'Sending your message securely…'; }
      try {
        const response = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('The form service rejected the submission.');
        form.reset();
        if (status) {
          window.setTimeout(() => {
            status.className = 'form-status success';
            status.textContent = isEnquiry
              ? 'Thank you. Your service enquiry has been sent successfully.'
              : 'Thank you. Your message has been sent successfully.';
          }, 0);
        }
      } catch (error) {
        if (status) { status.className = 'form-status error'; status.textContent = 'Sorry, your message could not be sent. Please check your connection and try again.'; }
      } finally {
        if (submitButton) { submitButton.disabled = false; submitButton.textContent = isEnquiry ? 'Send enquiry' : 'Send message'; }
      }
    });
  });
})();
