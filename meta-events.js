// meta-events.js  (har page par defer se load karo, pixel base code ke BAAD)
(function () {
  if (typeof fbq !== 'function') return;
  var path = location.pathname;
  window.dataLayer = window.dataLayer || [];

  // 1) ViewContent - sirf course / master-class pages par
  if (/^\/(online\/[^/]+|courses\/[^/]+|master-class)\/?/.test(path) && !/^\/online\/?$/.test(path)) {
    fbq('track', 'ViewContent', { content_name: document.title, content_type: 'course', content_category: path.indexOf('/online/') === 0 ? 'Online' : 'Offline' });
  }

  // 2) Lead - enquiry / demo form submit  (form: [data-lead-form])
  document.addEventListener('submit', function (e) {
    if (e.target.matches && e.target.matches('[data-lead-form]')) {
      var id = 'lead_' + Date.now();
      fbq('track', 'Lead', { content_name: document.title, source: e.target.getAttribute('data-source') || 'form' }, { eventID: id });
      dataLayer.push({ event: 'lead_form_submit', event_id: id, page_path: path });
    }
  }, true);

  // 3) Contact - WhatsApp / call click
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="https://wa.me"],a[href^="tel:"]');
    if (!a) return;
    var type = a.href.indexOf('tel:') === 0 ? 'call' : 'whatsapp';
    fbq('track', 'Contact', { method: type, content_name: document.title });
    dataLayer.push({ event: 'contact_click', contact_method: type, page_path: path });
  }, true);

  // 4) InitiateCheckout - portal enroll button
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="portal/?enroll="],a[href*="portal/index.html?enroll="],a[href*="/portal/?enroll="]');
    if (a) { fbq('track', 'InitiateCheckout', { content_name: document.title, currency: 'INR' }); dataLayer.push({ event: 'begin_enroll', page_path: path }); }
  }, true);
})();
