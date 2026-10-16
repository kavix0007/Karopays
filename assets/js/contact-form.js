/* =========================================================
   KaroPays — Contact form (frontend only)

   No backend is connected. Nothing is sent anywhere, and the UI never
   claims a message was delivered.

   HOW TO CONNECT A BACKEND LATER
   Register a transport once, after this file loads, e.g. in contact.html:

     KaroPaysContact.setTransport(async (payload) => {
       // payload = { name, email, subject, message }
       // ...call your backend here...
       return { ok: true };            // or { ok: false, error: "reason" }
     });

   While no transport is registered the form validates input, then shows
   "not available yet" with the support email instead of submitting.
   ========================================================= */
(function () {
  "use strict";

  var CONFIG = {
    supportEmail: "karopays.online@gmail.com",
    limits: {
      name:    { min: 2,  max: 80 },
      subject: { min: 3,  max: 120 },
      message: { min: 10, max: 2000 }
    }
  };

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var transport = null;

  /* ---------- Validation (pure: no DOM, easy to test/reuse) ---------- */
  function validate(values) {
    var L = CONFIG.limits, errors = {};
    var name = (values.name || "").trim();
    var email = (values.email || "").trim();
    var subject = (values.subject || "").trim();
    var message = (values.message || "").trim();

    if (!name) errors.name = "Please enter your full name.";
    else if (name.length < L.name.min) errors.name = "Name must be at least " + L.name.min + " characters.";
    else if (name.length > L.name.max) errors.name = "Name must be " + L.name.max + " characters or fewer.";

    if (!email) errors.email = "Please enter your email address.";
    else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address, like name@example.com.";

    if (!subject) errors.subject = "Please enter a subject.";
    else if (subject.length < L.subject.min) errors.subject = "Subject must be at least " + L.subject.min + " characters.";
    else if (subject.length > L.subject.max) errors.subject = "Subject must be " + L.subject.max + " characters or fewer.";

    if (!message) errors.message = "Please write a message.";
    else if (message.length < L.message.min) errors.message = "Message must be at least " + L.message.min + " characters.";
    else if (message.length > L.message.max) errors.message = "Message must be " + L.message.max + " characters or fewer.";

    return errors;
  }

  /* ---------- Submission adapter (the only place a backend plugs in) ---------- */
  function isBackendAvailable() { return typeof transport === "function"; }

  function setTransport(fn) {
    transport = typeof fn === "function" ? fn : null;
  }

  async function submit(payload) {
    if (!isBackendAvailable()) return { ok: false, code: "BACKEND_NOT_CONNECTED" };
    try {
      var result = await transport(payload);
      return result && result.ok === true ? { ok: true } : { ok: false, code: "SEND_FAILED", error: result && result.error };
    } catch (err) {
      return { ok: false, code: "SEND_FAILED", error: err && err.message };
    }
  }

  function buildMailto(values) {
    var body = "Name: " + (values.name || "").trim() + "\nEmail: " + (values.email || "").trim() + "\n\n" + (values.message || "").trim();
    return "mailto:" + CONFIG.supportEmail +
      "?subject=" + encodeURIComponent((values.subject || "").trim()) +
      "&body=" + encodeURIComponent(body);
  }

  /* ---------- UI wiring ---------- */
  function init() {
    var form = document.getElementById("contactForm");
    if (!form) return;

    var fields = ["name", "email", "subject", "message"];
    var els = {};
    fields.forEach(function (f) {
      els[f] = {
        input: document.getElementById("contact" + f.charAt(0).toUpperCase() + f.slice(1)),
        error: document.getElementById("contact" + f.charAt(0).toUpperCase() + f.slice(1) + "Error")
      };
    });
    var status = document.getElementById("contactStatus");
    var button = document.getElementById("contactSubmit");
    var counter = document.getElementById("contactCount");
    var honeypot = document.getElementById("contactWebsite");

    function values() {
      return {
        name: els.name.input.value, email: els.email.input.value,
        subject: els.subject.input.value, message: els.message.input.value
      };
    }

    function showFieldError(field, text) {
      var e = els[field];
      e.error.textContent = text || "";
      if (text) e.input.setAttribute("aria-invalid", "true");
      else e.input.removeAttribute("aria-invalid");
    }

    function clearStatus() {
      status.className = "contact-status";
      status.textContent = "";
    }

    function showStatus(kind, text, mailtoHref) {
      status.className = "contact-status show " + kind;
      status.textContent = text + " ";
      var a = document.createElement("a");
      a.href = mailtoHref || ("mailto:" + CONFIG.supportEmail);
      a.textContent = mailtoHref ? "open this message in your email app" : CONFIG.supportEmail;
      status.appendChild(a);
      if (mailtoHref) status.appendChild(document.createTextNode("."));
    }

    function updateCounter() {
      var max = CONFIG.limits.message.max, len = els.message.input.value.length;
      counter.textContent = len + " / " + max;
      counter.classList.toggle("over", len > max);
    }

    // Re-validate a field as the user leaves it, and clear its error as they fix it.
    fields.forEach(function (f) {
      els[f].input.addEventListener("blur", function () {
        showFieldError(f, validate(values())[f]);
      });
      els[f].input.addEventListener("input", function () {
        if (els[f].input.getAttribute("aria-invalid")) showFieldError(f, validate(values())[f]);
      });
    });
    els.message.input.addEventListener("input", updateCounter);
    updateCounter();

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      clearStatus();
      if (honeypot && honeypot.value) return; // bots fill hidden fields; humans don't

      var vals = values();
      var errors = validate(vals);
      fields.forEach(function (f) { showFieldError(f, errors[f]); });

      var firstBad = fields.filter(function (f) { return errors[f]; })[0];
      if (firstBad) {
        showStatus("error", "Please fix the highlighted fields and try again. You can also email us at");
        els[firstBad].input.focus();
        return;
      }

      if (!isBackendAvailable()) {
        showStatus("info", "Online message submission is not available yet, so your message has not been sent. Please email us at", buildMailto(vals));
        // Replace the trailing period-link pattern with the plain address too, so it is always visible.
        status.insertBefore(document.createTextNode(CONFIG.supportEmail + " or "), status.querySelector("a"));
        return;
      }

      button.disabled = true;
      button.textContent = "Sending...";
      var result = await submit({ name: vals.name.trim(), email: vals.email.trim(), subject: vals.subject.trim(), message: vals.message.trim() });
      button.disabled = false;
      button.textContent = "Send message";

      if (result.ok) {
        form.reset();
        updateCounter();
        showStatus("success", "Your message was sent. If you do not hear back, you can also email");
      } else {
        showStatus("error", "We could not send your message. Please try again, or email us at");
      }
    });
  }

  window.KaroPaysContact = { config: CONFIG, validate: validate, setTransport: setTransport, isBackendAvailable: isBackendAvailable };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
