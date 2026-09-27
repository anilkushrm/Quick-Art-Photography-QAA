// meta-events.js  v4  (har page par defer se load karo, pixel + gtag base code ke BAAD)
// - Facebook "Lead" ab sirf /thank-you/ page par (form successfully submit hone ke baad) fire hota hai
// - GA4 generate_lead GA4 ke andar "Create event" rule se banta hai, isliye yahan se NAHI bheja jata (double count se bachav)
(function () {
  var path = location.pathname;
  window.dataLayer = window.dataLayer || [];

  function fb() { if (typeof fbq === 'function') fbq.apply(null, arguments); }
  function ga() { if (typeof gtag === 'function') gtag.apply(null, arguments); }

  // 1) LEAD - sirf thank-you page par, ek session me ek baar
  if (/^\/thank-you\/?$/.test(path)) {
    var already = false;
    try { already = sessionStorage.getItem('qa_fb_lead') === '1'; } catch (e) {}
    if (!already) {
      var id = 'lead_' + Date.now();
      fb('track', 'Lead', { content_name: 'Offline Course Enquiry', content_category: 'Offline', currency: 'INR', value: 0 }, { eventID: id });
      dataLayer.push({ event: 'lead_thank_you', event_id: id });
      try { sessionStorage.setItem('qa_fb_lead', '1'); } catch (e) {}
    }
  }

  // 2) ViewContent - course / master-class pages par
  if (/^\/(online\/[^/]+|courses\/[^/]+|master-class)\/?/.test(path) && !/^\/online\/?$/.test(path)) {
    fb('track', 'ViewContent', { content_name: document.title, content_type: 'course', content_category: path.indexOf('/online/') === 0 ? 'Online' : 'Offline' });
  }

  // 3) Contact - WhatsApp / call click
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="https://wa.me"],a[href^="tel:"]');
    if (!a) return;
    var type = a.href.indexOf('tel:') === 0 ? 'call' : 'whatsapp';
    fb('track', 'Contact', { method: type, content_name: document.title });
    ga('event', 'contact_click', { contact_method: type, page_path: path });
    dataLayer.push({ event: 'contact_click', contact_method: type, page_path: path });
  }, true);

  // 4) InitiateCheckout - online course enroll button
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="portal/?enroll="],a[href*="portal/index.html?enroll="]');
    if (!a) return;
    fb('track', 'InitiateCheckout', { content_name: document.title, currency: 'INR' });
    ga('event', 'begin_checkout', { currency: 'INR', item_name: document.title });
    dataLayer.push({ event: 'begin_enroll', page_path: path });
  }, true);
})();
