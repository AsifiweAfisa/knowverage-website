(function () {
  "use strict";

  // Analytics helper: sends events to GA4 and Meta Pixel only when they are installed.
  function track(name, params) {
    params = params || {};
    if (typeof window.gtag === "function") window.gtag("event", name, params);
    if (typeof window.fbq === "function") {
      if (name === "generate_lead") window.fbq("track", "Lead", params);
      else if (name === "contact") window.fbq("track", "Contact", params);
    }
  }

  // Mobile menu
  var toggle = document.querySelector(".menu-toggle");
  var panel = document.getElementById("mobile-panel");
  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var open = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        panel.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) {
        panel.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  // Gentle reveal on scroll (content stays visible if this never runs)
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Track WhatsApp, phone, email and CTA clicks
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var label = a.getAttribute("data-cta") || "";
    if (href.indexOf("wa.me") !== -1) track("contact", { method: "whatsapp", location: label });
    else if (href.indexOf("tel:") === 0) track("contact", { method: "phone", location: label });
    else if (href.indexOf("mailto:") === 0) track("contact", { method: "email", location: label });
    else if (label) track("select_content", { content_type: "cta", item_id: label });
  });

  // Package buttons remember which package the visitor picked
  var form = document.getElementById("audit-form");
  document.querySelectorAll("[data-package]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!form) return;
      var field = form.querySelector('[name="package_interest"]');
      if (field) field.value = btn.getAttribute("data-package");
      track("select_item", { item_name: btn.getAttribute("data-package") });
    });
  });

  // Audit form: check required fields, then send it for real
  if (form) {
    var errorBox = document.getElementById("form-error");
    form.addEventListener("input", function (e) {
      if (e.target.matches("input, select")) e.target.removeAttribute("aria-invalid");
    });
    form.addEventListener("submit", function (e) {
      var missing = [];
      form.querySelectorAll("[required]").forEach(function (f) {
        var ok = f.type === "checkbox" ? f.checked : f.value.trim() !== "";
        if (!ok) { missing.push(f); f.setAttribute("aria-invalid", "true"); }
      });
      if (missing.length) {
        e.preventDefault();
        errorBox.textContent = missing.some(function (f) { return f.type === "checkbox"; }) && missing.length === 1
          ? "Please tick the box to agree to be contacted."
          : "Please fill in the highlighted fields.";
        missing[0].focus();
        return;
      }
      errorBox.textContent = "";
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = "Sending your request..."; }
      track("generate_lead", { form: "free_audit", package: form.querySelector('[name="package_interest"]').value });
    });
  }

  // Thank-you page conversion event
  if (document.body.getAttribute("data-page") === "thank-you") track("generate_lead_confirmed", { form: "free_audit" });
})();
