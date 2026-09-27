// admission/admission.js — Offline Admission Form Script

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

  // Photo file preview
  if (inputPhoto) {
    inputPhoto.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
          if (previewImg) previewImg.src = e.target.result;
          if (badgePhoto) badgePhoto.src = e.target.result;
        };
        reader.readAsDataURL(this.files[0]);
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

  function showSuccessModal(data, isPaid) {
    var modal = document.getElementById('adm-success-modal');
    if (!modal) return;

    var idEl = document.getElementById('modal-app-id');
    var nameEl = document.getElementById('modal-student-name');
    var feeEl = document.getElementById('modal-fee-status');

    if (idEl) idEl.textContent = data.admissionId || 'QAA-OFF-2026';
    if (nameEl) nameEl.textContent = data.fullName || 'Student';
    if (feeEl) {
      feeEl.textContent = isPaid ? '₹500 (Paid Online ✓)' : '₹500 (Pay Cash at Siwan Campus)';
      feeEl.style.color = isPaid ? '#16a34a' : '#d97706';
    }

    modal.style.display = 'flex';
  }

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
