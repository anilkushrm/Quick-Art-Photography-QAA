// meta-events.js  v5  (har page par defer se load karo, pixel + gtag base code ke BAAD)
// v5 changes:
// - Lead (Facebook) + generate_lead (GA4) ab SIRF tab fire honge jab form sach me submit hua ho.
//   site.js server se success milne par sessionStorage 'qa_lead_pending' = '1' set karega
//   (alag nishaan, kyunki 'qa-enquiry-received' ko site.js thank-you page par khud hata deta hai).
//   Thank-you page seedha kholne / refresh / bot / localhost par ab Lead NAHI judega.
// - GA4 generate_lead ab yahin se bheja jata hai. GA4 Admin me jo "Create event" rule
//   thank-you page view se generate_lead banata tha, use DELETE karna hai (warna double count).
// - Tracking sirf live domain par chalegi (localhost / 127.0.0.1 par nahi).
(function () {
  var host = location.hostname;
  var isLive = host === 'quickartphotography.in' || host === 'www.quickartphotography.in';
  if (!isLive) return; // localhost / testing par koi event nahi

  var path = location.pathname;
  window.dataLayer = window.dataLayer || [];

  function fb() { if (typeof fbq === 'function') fbq.apply(null, arguments); }
  function ga() { if (typeof gtag === 'function') gtag.apply(null, arguments); }

  // 1) LEAD - sirf thank-you page par, aur sirf jab form sach me submit hua ho
  if (/^\/thank-you\/?$/.test(path)) {
    var submitted = false;
    try { submitted = sessionStorage.getItem('qa_lead_pending') === '1'; } catch (e) {}

    if (submitted) {
      // nishaan turant hata do, taaki refresh / back par dobara Lead na jude
      try { sessionStorage.removeItem('qa_lead_pending'); } catch (e) {}

      var id = 'lead_' + Date.now();
      var LEAD_VALUE = 500; // andaazan value (INR) - chahein to badal sakte hain

      // Facebook / Meta
      fb('track', 'Lead', {
        content_name: 'Offline Course Enquiry',
        content_category: 'Offline',
        currency: 'INR',
        value: LEAD_VALUE
      }, { eventID: id });

      // Google Analytics 4 -> Google Ads conversion isi se import hota hai
      ga('event', 'generate_lead', {
        currency: 'INR',
        value: LEAD_VALUE,
        lead_source: 'website_form'
      });

      dataLayer.push({ event: 'lead_thank_you', event_id: id });
    }
  }

  // 2) ViewContent - course / master-class pages par
  if (/^\/(online\/[^/]+|courses\/[^/]+|master-class)\/?/.test(path) && !/^\/online\/?$/.test(path)) {
    fb('track', 'ViewContent', {
      content_name: document.title,
      content_type: 'course',
      content_category: path.indexOf('/online/') === 0 ? 'Online' : 'Offline'
    });
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
