// admission/admission.js — Offline Admission Form Script
// 28-Sep-2026: Facebook + Google conversion tracking (qaTrackAdmission) add kiya + inputPhone fix

document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('offline-admission-form');
  var submitBtn = document.getElementById('btn-submit-admission');
  var statusBox = document.getElementById('adm-status-msg');

  // Badge live preview elements
  var badgeName = document.getElementById('id-badge-name');
  var badgeRole = document.getElementById('id-badge-role');
  var badgeStudio = document.getElementById('id-badge-studio');
  var badgeCity = document.getElementById('id-badge-city');
  var badgePhoto = document.getElementById('id-badge-photo');
  var previewImg = document.getElementById('photo-preview-img');

  // Input listeners for live ID Badge preview
  var inputName = document.getElementById('adm-name');
  var inputRole = document.getElementById('adm-role');
  var inputStudio = document.getElementById('adm-studio');
  var inputCity = document.getElementById('adm-city');
  var inputWorkCity = document.getElementById('adm-workcity');
  var inputPhoto = document.getElementById('adm-photo');
  var inputAadhaar = document.getElementById('adm-aadhaar');
  var inputCert = document.getElementById('adm-cert');
  var inputBlood = document.getElementById('adm-bloodgroup');
  var inputPhone = document.getElementById('adm-phone');

  if (inputName && badgeName) {
    inputName.addEventListener('input', function () {
      badgeName.textContent = this.value.trim() || 'Your Full Name';
    });
  }

  if (inputRole && badgeRole) {
    inputRole.addEventListener('change', function () {
      badgeRole.textContent = this.value || 'Offline Masterclass Student';
    });
  }

  var badgeBlood = document.getElementById('id-badge-blood');
  if (inputBlood && badgeBlood) {
    inputBlood.addEventListener('change', function () {
      badgeBlood.textContent = this.value || 'B+';
    });
  }

  if (inputStudio && badgeStudio) {
    inputStudio.addEventListener('input', function () {
      var val = this.value.trim() || 'Your Studio Name';
      badgeStudio.innerHTML = 'Studio: <span>' + escapeHtml(val) + '</span>';
    });
  }

  function updateCityPreview() {
    var c = (inputWorkCity && inputWorkCity.value.trim()) || (inputCity && inputCity.value.trim()) || 'Siwan, Bihar';
    if (badgeCity) {
      badgeCity.innerHTML = 'Location: <span>' + escapeHtml(c) + '</span>';
    }
  }

  if (inputCity) inputCity.addEventListener('input', updateCityPreview);
  if (inputWorkCity) inputWorkCity.addEventListener('input', updateCityPreview);

  // Photo file preview with 500 KB size limit
  var MAX_PHOTO_BYTES = 500 * 1024; // 500 KB

  if (inputPhoto) {
    inputPhoto.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        var file = this.files[0];
        if (file.size > MAX_PHOTO_BYTES) {
          alert('Photo ka size 500 KB se adhik hai (' + Math.round(file.size / 1024) + ' KB)। Kripya 500 KB se chhota photo select karein.');
          this.value = '';
          return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
          if (previewImg) previewImg.src = e.target.result;
          if (badgePhoto) badgePhoto.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // File label updates
  function attachFileLabel(inputEl, labelId) {
    if (!inputEl) return;
    inputEl.addEventListener('change', function () {
      var label = document.getElementById(labelId);
      if (label && this.files && this.files[0]) {
        label.textContent = '✓ ' + this.files[0].name;
      }
    });
  }
  attachFileLabel(inputAadhaar, 'aadhaar-label');
  attachFileLabel(inputCert, 'cert-label');

  // Form submission handler
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Check photo size before submitting
      if (inputPhoto && inputPhoto.files && inputPhoto.files[0]) {
        if (inputPhoto.files[0].size > MAX_PHOTO_BYTES) {
          showStatus('Photo ka size 500 KB se adhik hai (' + Math.round(inputPhoto.files[0].size / 1024) + ' KB)। Kripya 500 KB se chhota photo upload karein.', 'error');
          inputPhoto.focus();
          return;
        }
      }

      showStatus('Submitting your admission form & documents...', 'info');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Processing Application...';
      }

      var formData = new FormData(form);

      fetch('../api/lms.php?action=submit-offline-admission', {
        method: 'POST',
        body: formData
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data.ok) {
            throw new Error(data.error || 'Submission failed. Please check your data.');
          }

          // If Razorpay order returned for online payment
          if (data.paymentMode === 'online' && data.razorpay && window.Razorpay) {
            handleRazorpayPayment(data);
          } else {
            // Cash on arrival or direct confirmed
            showSuccessModal(data);
          }
        })
        .catch(function (err) {
          showStatus(err.message, 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Admission Form <span aria-hidden="true">→</span>';
          }
        });
    });
  }

  // Razorpay payment integration
  function handleRazorpayPayment(admissionData) {
    var rp = admissionData.razorpay;
    var options = {
      key: rp.keyId,
      amount: rp.amount,
      currency: rp.currency,
      name: rp.name,
      description: rp.description,
      order_id: rp.orderId,
      prefill: rp.prefill,
      theme: { color: '#d97706' },
      handler: function (response) {
        showStatus('Verifying payment signature with academy server...', 'info');

        fetch('../api/lms.php?action=verify-offline-admission-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admissionId: admissionData.admissionId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          })
        })
          .then(function (res) { return res.json(); })
          .then(function (verifyData) {
            if (verifyData.ok) {
              if (verifyData.token) {
                try { localStorage.setItem('qa_student_token', verifyData.token); } catch (e) { }
              }
              showSuccessModal(admissionData, true);
            } else {
              showStatus('Payment verification failed. Please contact academy support: +91 9939800780', 'error');
            }
          })
          .catch(function (e) {
            showStatus('Network error verifying payment. Your payment ID is: ' + response.razorpay_payment_id, 'error');
          });
      },
      modal: {
        ondismiss: function () {
          showStatus('Payment was not completed. You can pay ₹500 at campus on arrival or retry.', 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '🎓 Retry Online Payment (₹500) →';
          }
        }
      }
    };

    var rzp1 = new Razorpay(options);
    rzp1.open();
  }

  function showStatus(msg, type) {
    if (!statusBox) return;
    statusBox.textContent = msg;
    statusBox.className = 'adm-status-box ' + (type === 'error' ? 'error' : (type === 'success' ? 'success' : ''));
    statusBox.style.display = 'block';
  }

  // ===== Conversion tracking (Facebook + Google) =====
  // Admission successful hone par ek virtual "thank-you" page view bhejta hai:
  // - Facebook custom conversion "Website Lead - Thank You Page" (URL contains "thank-you") isse count karega
  // - GA4 generate_lead (page_location contains "/thank-you/") -> Google Ads "Website Lead - Thank You Page" count karega
  // Student ka flow bilkul same rehta hai (ID card popup + portal). Ek admission sirf ek baar count hota hai.
  function qaTrackAdmission(data, isPaid) {
    try {
      var admId = (data && data.admissionId) || ('adm_' + Date.now());
      try {
        var key = 'qa_adm_tracked_' + admId;
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, '1');
      } catch (e) { }

      var origin = window.location.origin;
      var virtualPath = '/admission/thank-you/';
      var virtualUrl = origin + virtualPath + '?type=offline-admission' + (isPaid ? '&fee=paid' : '&fee=cash');

      // Page reload kiye bina URL thodi der ke liye virtual thank-you URL par
      var originalUrl = window.location.href;
      try { history.replaceState(history.state, '', virtualPath + '?type=offline-admission'); } catch (e) { }

      // Facebook Pixel
      if (typeof fbq === 'function') {
        fbq('track', 'PageView');
        fbq('track', 'Lead', {
          content_name: 'Offline Admission Form',
          content_category: 'Offline',
          currency: 'INR',
          value: 0
        }, { eventID: 'adm_' + admId });
      }

      // Google Analytics 4 (G-H6DKT8Y659)
      if (typeof gtag === 'function') {
        gtag('event', 'page_view', {
          page_location: virtualUrl,
          page_path: virtualPath,
          page_title: 'Admission Thank You'
        });
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'offline_admission_submit', admission_id: admId, fee_paid: !!isPaid });

      // Address bar wapas original URL par (refresh karne par form hi khule)
      setTimeout(function () {
        try { history.replaceState(history.state, '', originalUrl); } catch (e) { }
      }, 1500);
    } catch (err) {
      // Tracking kabhi bhi admission ko nahi rokega
      if (window.console) console.warn('Admission tracking error', err);
    }
  }

  function showSuccessModal(data, isPaid) {
    qaTrackAdmission(data, isPaid);

    var modal = document.getElementById('adm-success-modal');
    if (!modal) return;

    var sName = data.fullName || (inputName ? inputName.value.trim() : '') || 'Student';
    var sId = data.admissionId || 'QAA-OFF-2026-LIVE';
    var sPhone = data.phone || (inputPhone ? inputPhone.value.trim() : '');
    var sCourse = (document.getElementById('adm-course') ? document.getElementById('adm-course').value : '') || 'Wedding Film-making Course';
    var sStudio = (inputStudio ? inputStudio.value.trim() : '') || 'Independent Studio';
    var sCity = (inputCity ? inputCity.value.trim() : '') || 'Siwan, Bihar';

    var sBlood = data.bloodGroup || (inputBlood ? inputBlood.value : '') || 'B+';

    var idEl = document.getElementById('modal-app-id');
    var nameEl = document.getElementById('modal-student-name');
    var courseEl = document.getElementById('modal-student-course');
    var phoneEl = document.getElementById('modal-student-phone');
    var studioEl = document.getElementById('modal-student-studio');
    var cityEl = document.getElementById('modal-student-city');
    var bloodEl = document.getElementById('modal-student-blood');
    var backBloodEl = document.getElementById('modal-back-blood');
    var backCityEl = document.getElementById('modal-back-city');
    var backBarcodeEl = document.getElementById('modal-back-barcode');
    var backIdTextEl = document.getElementById('modal-back-id-text');
    var issuedPhoto = document.getElementById('issued-id-photo');
    var qrImg = document.getElementById('issued-id-qr');

    if (idEl) idEl.textContent = sId;
    if (nameEl) nameEl.textContent = sName;
    if (courseEl) courseEl.textContent = sCourse;
    if (phoneEl) phoneEl.textContent = sPhone ? '+91 ' + sPhone : '+91 9939800780';
    if (studioEl) studioEl.textContent = sStudio;
    if (cityEl) cityEl.textContent = sCity;
    if (bloodEl) bloodEl.textContent = sBlood;
    if (backBloodEl) backBloodEl.textContent = sBlood + ' (Positive)';
    if (backCityEl) backCityEl.textContent = sCity + ' (IN)';
    if (backBarcodeEl) backBarcodeEl.textContent = '*' + sId.replace(/[^a-zA-Z0-9-]/g, '') + '*';
    if (backIdTextEl) backIdTextEl.textContent = sId;

    // Set student photo on the issued ID Card
    if (issuedPhoto) {
      if (previewImg && previewImg.src && previewImg.src.indexOf('anil-sharma') === -1) {
        issuedPhoto.src = previewImg.src;
      } else if (badgePhoto && badgePhoto.src) {
        issuedPhoto.src = badgePhoto.src;
      }
    }

    // Generate Verification URL & Scannable QR Code
    var verifyUrl = 'https://quickartphotography.in/admission/verify.html?id=' + encodeURIComponent(sId) +
                    '&name=' + encodeURIComponent(sName) +
                    '&course=' + encodeURIComponent(sCourse) +
                    '&studio=' + encodeURIComponent(sStudio) +
                    '&city=' + encodeURIComponent(sCity) +
                    '&blood=' + encodeURIComponent(sBlood);

    if (qrImg) {
      var qrApi = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=1&data=' + encodeURIComponent(verifyUrl);
      qrImg.src = qrApi;
    }

    modal.style.display = 'flex';
  }

  // 📥 Download Issued ID Card as High-Res PNG (Front or Back)
  window.downloadIssuedIdCard = function (side) {
    side = side || 'front';
    var targetId = side === 'back' ? 'issued-id-card-back' : 'issued-id-card-front';
    var card = document.getElementById(targetId) || document.getElementById('issued-id-card-to-download');
    if (!card) return;

    var sId = (document.getElementById('modal-app-id') ? document.getElementById('modal-app-id').textContent.trim() : '') || 'QAA-STUDENT-ID';
    var btn = side === 'back' ? document.getElementById('btn-dl-back') : document.getElementById('btn-dl-front');
    if (btn) btn.innerHTML = '⏳ Generating High-Res ' + side.toUpperCase() + '...';

    if (window.html2canvas) {
      window.html2canvas(card, {
        scale: 3, // 300 DPI high resolution
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#0a0d14'
      }).then(function (canvas) {
        var a = document.createElement('a');
        a.download = 'QAA_Student_ID_' + sId.replace(/[^a-zA-Z0-9_-]/g, '_') + '_' + side.toUpperCase() + '.png';
        a.href = canvas.toDataURL('image/png');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (btn) btn.innerHTML = '✓ ' + side.toUpperCase() + ' Downloaded! 📥';
        setTimeout(function () {
          if (btn) btn.innerHTML = '<span>📥 Download ' + (side === 'front' ? 'Front' : 'Back') + ' Side (PNG)</span>';
        }, 3000);
      }).catch(function (err) {
        console.error('html2canvas error:', err);
        window.print();
        if (btn) btn.innerHTML = '<span>📥 Download ' + (side === 'front' ? 'Front' : 'Back') + ' Side (PNG)</span>';
      });
    } else {
      window.print();
    }
  };

  // 🖨️ Print ID Card
  window.printIssuedIdCard = function () {
    window.print();
  };

  window.closeAdmissionModal = function () {
    var modal = document.getElementById('adm-success-modal');
    if (modal) modal.style.display = 'none';
    window.location.href = '../portal/';
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});
