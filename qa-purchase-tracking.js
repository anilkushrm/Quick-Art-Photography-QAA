// qa-purchase-tracking.js
// Online course purchase (Razorpay) ko Facebook + Google (GA4 / Google Ads) me track karta hai.
// portal/index.html me portal.js se PEHLE load karein:
//   <script src="/qa-purchase-tracking.js"></script>
(function () {
  window.qaTrackPurchase = function (orderRes, response, courseId) {
    try {
      var paymentId = (response && response.razorpay_payment_id) || ('order_' + Date.now());

      // Ek payment sirf ek baar count ho (refresh / double call se bachav)
      try {
        var key = 'qa_purchase_' + paymentId;
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, '1');
      } catch (e) {}

      var value = Number(orderRes && orderRes.amount ? orderRes.amount / 100 : 0); // Razorpay amount paise me hota hai
      var currency = (orderRes && orderRes.currency) || 'INR';
      var title = (orderRes && orderRes.courseTitle) || courseId || 'Online Course';

      // Facebook / Meta Pixel - standard Purchase event (value ke saath)
      if (typeof fbq === 'function') {
        fbq('track', 'Purchase', {
          value: value,
          currency: currency,
          content_name: title,
          content_ids: [courseId],
          content_type: 'product'
        }, { eventID: paymentId });
      }

      // Google Analytics 4 - recommended purchase event (Google Ads isi ko import karega)
      if (typeof gtag === 'function') {
        gtag('event', 'purchase', {
          transaction_id: paymentId,
          value: value,
          currency: currency,
          items: [{ item_id: courseId, item_name: title, price: value, quantity: 1, item_category: 'Online Course' }]
        });
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'online_course_purchase', transaction_id: paymentId, value: value, currency: currency, course_id: courseId });
    } catch (err) {
      // Tracking kabhi bhi payment / course unlock ko nahi rokega
      if (window.console) console.warn('Purchase tracking error', err);
    }
  };
})();
