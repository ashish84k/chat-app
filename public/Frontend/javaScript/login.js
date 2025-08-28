import url from "../hostname.js";


class AdvancedPhoneValidator {
  constructor() {
    this.countryData = {
      "+91": {
        pattern: /^[6-9]\d{9}$/,
        length: 10,
        info: "10 digits starting with 6-9",
        flag: "🇮🇳",
        name: "India",
        format: (num) => `+91 ${num.slice(0, 5)} ${num.slice(5)}`,
      },
      "+1": {
        pattern: /^\d{10}$/,
        length: 10,
        info: "10 digits",
        flag: "🇺🇸",
        name: "USA",
        format: (num) =>
          `+1 (${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6)}`,
      },
      "+44": {
        pattern: /^[7-9]\d{9}$/,
        length: 10,
        info: "10 digits starting with 7-9",
        flag: "🇬🇧",
        name: "UK",
        format: (num) =>
          `+44 ${num.slice(0, 4)} ${num.slice(4, 7)} ${num.slice(7)}`,
      },
      "+86": {
        pattern: /^1[3-9]\d{9}$/,
        length: 11,
        info: "11 digits starting with 13-19",
        flag: "🇨🇳",
        name: "China",
        format: (num) =>
          `+86 ${num.slice(0, 3)} ${num.slice(3, 7)} ${num.slice(7)}`,
      },
      "+33": {
        pattern: /^[6-7]\d{8}$/,
        length: 9,
        info: "9 digits starting with 6-7",
        flag: "🇫🇷",
        name: "France",
        format: (num) =>
          `+33 ${num.slice(0, 1)} ${num.slice(1, 3)} ${num.slice(
            3,
            5
          )} ${num.slice(5, 7)} ${num.slice(7)}`,
      },
      "+49": {
        pattern: /^1[5-7]\d{9}$/,
        length: 10,
        info: "10 digits starting with 15-17",
        flag: "🇩🇪",
        name: "Germany",
        format: (num) => `+49 ${num.slice(0, 3)} ${num.slice(3)}`,
      },
      "+81": {
        pattern: /^[7-9]\d{9}$/,
        length: 10,
        info: "10 digits starting with 7-9",
        flag: "🇯🇵",
        name: "Japan",
        format: (num) =>
          `+81 ${num.slice(0, 2)}-${num.slice(2, 6)}-${num.slice(6)}`,
      },
      "+61": {
        pattern: /^4\d{8}$/,
        length: 9,
        info: "9 digits starting with 4",
        flag: "🇦🇺",
        name: "Australia",
        format: (num) =>
          `+61 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`,
      },
      "+7": {
        pattern: /^9\d{9}$/,
        length: 10,
        info: "10 digits starting with 9",
        flag: "🇷🇺",
        name: "Russia",
        format: (num) =>
          `+7 ${num.slice(0, 3)} ${num.slice(3, 6)}-${num.slice(
            6,
            8
          )}-${num.slice(8)}`,
      },
      "+55": {
        pattern: /^1[1-9]\d{8}$/,
        length: 10,
        info: "10 digits starting with 11-19",
        flag: "🇧🇷",
        name: "Brazil",
        format: (num) =>
          `+55 (${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`,
      },
    };

    this.currentCountryCode = "+91";
    this.isValidNumber = false;
    this.debugMode = false;

    this.initializeElements();
    this.setupEventListeners();
    this.updateCountryInfo();
  }

  initializeElements() {
    this.phoneInput = document.getElementById("phone");
    this.countrySelect = document.getElementById("country");
    this.countryCodeSpan = document.getElementById("countryCode");
    this.countryFlag = document.getElementById("countryFlag");
    this.phoneError = document.getElementById("phoneError");
    this.phoneSuccess = document.getElementById("phoneSuccess");
    this.phoneInfo = document.getElementById("phoneInfo");
    this.submitBtn = document.getElementById("submitBtn");
    this.clearBtn = document.getElementById("clearBtn");
    this.formatDisplay = document.getElementById("formatDisplay");
    this.formattedNumber = document.getElementById("formattedNumber");
    this.debugPanel = document.getElementById("debugPanel");
    this.debugContent = document.getElementById("debugContent");
    this.btnText = document.getElementById("btnText");
    this.loadingSpinner = document.getElementById("loadingSpinner");
    this.errorText = document.getElementById("errorText");
    this.infoText = document.getElementById("infoText");
  }

  setupEventListeners() {
    // Country selection
    this.countrySelect.addEventListener("change", () =>
      this.updateCountryInfo()
    );

    // Phone input events
    this.phoneInput.addEventListener("input", (e) => this.handleInput(e));
    this.phoneInput.addEventListener("paste", (e) => this.handlePaste(e));
    this.phoneInput.addEventListener("focus", () => this.handleFocus());
    this.phoneInput.addEventListener("blur", () => this.handleBlur());

    // Clear button
    this.clearBtn.addEventListener("click", () => this.clearInput());

    // Form submission
    document
      .getElementById("phoneForm")
      .addEventListener("submit", (e) => this.handleSubmit(e));

    // Debug toggle (Ctrl+D)
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        this.toggleDebug();
      }
    });

    // Debug panel close
    document
      .getElementById("toggleDebug")
      .addEventListener("click", () => this.toggleDebug());
  }

  cleanPhoneNumber(phone) {
    return phone.replace(/[\s\-\(\)\+\.]/g, "");
  }

  detectCountryFromNumber(phone) {
    const cleaned = this.cleanPhoneNumber(phone);

    // Enhanced country code detection
    for (const [code, data] of Object.entries(this.countryData)) {
      const codeDigits = code.substring(1);

      // Check for exact country code match
      if (cleaned.startsWith(codeDigits)) {
        const remainingNumber = cleaned.substring(codeDigits.length);

        // Validate if remaining number matches country pattern
        if (
          remainingNumber.length === data.length &&
          data.pattern.test(remainingNumber)
        ) {
          return {
            countryCode: code,
            phoneNumber: remainingNumber,
            confidence: "high",
          };
        }
      }
    }

    // Fallback: try to guess based on length and pattern
    for (const [code, data] of Object.entries(this.countryData)) {
      if (cleaned.length === data.length && data.pattern.test(cleaned)) {
        return {
          countryCode: code,
          phoneNumber: cleaned,
          confidence: "medium",
        };
      }
    }

    return {
      countryCode: this.currentCountryCode,
      phoneNumber: cleaned,
      confidence: "low",
    };
  }

  updateCountryInfo() {
    const selectedOption = this.countrySelect.selectedOptions[0];
    this.currentCountryCode = selectedOption.value;
    const data = this.countryData[this.currentCountryCode];

    this.countryCodeSpan.textContent = this.currentCountryCode;
    this.countryFlag.textContent = data.flag;
    this.infoText.textContent = `Expected: ${data.info}`;

    // Update phone input maxlength
    this.phoneInput.maxLength = data.length;

    this.validatePhone();
    this.updateDebugInfo();
  }

  handleInput(e) {
    // Allow only digits
    let value = e.target.value.replace(/[^\d]/g, "");
    const data = this.countryData[this.currentCountryCode];

    // Limit to country-specific length
    if (value.length > data.length) {
      value = value.substring(0, data.length);
    }

    e.target.value = value;

    // Show/hide clear button
    this.clearBtn.style.opacity = value ? "1" : "0";

    this.validatePhone();
    this.updateFormatDisplay();
    this.updateDebugInfo();
  }

  handlePaste(e) {
    e.preventDefault();

    const pastedText = (e.clipboardData || window.clipboardData).getData(
      "text"
    );
    const detected = this.detectCountryFromNumber(pastedText);

    // Show detection feedback
    if (
      detected.confidence === "high" &&
      detected.countryCode !== this.currentCountryCode
    ) {
      this.showNotification(
        `Detected ${this.countryData[detected.countryCode].name} number`,
        "info"
      );
      this.countrySelect.value = detected.countryCode;
      this.updateCountryInfo();
    }

    this.phoneInput.value = detected.phoneNumber;
    this.clearBtn.style.opacity = detected.phoneNumber ? "1" : "0";

    this.validatePhone();
    this.updateFormatDisplay();
    this.updateDebugInfo();
  }

  handleFocus() {
    this.phoneInput.parentElement.classList.add("ring-2", "ring-blue-400/50");
  }

  handleBlur() {
    this.phoneInput.parentElement.classList.remove(
      "ring-2",
      "ring-blue-400/50"
    );
  }

  clearInput() {
    this.phoneInput.value = "";
    this.clearBtn.style.opacity = "0";
    this.validatePhone();
    this.updateFormatDisplay();
    this.phoneInput.focus();
  }

  validatePhone() {
    const phone = this.cleanPhoneNumber(this.phoneInput.value);
    const data = this.countryData[this.currentCountryCode];

    // Reset states
    this.hideAllMessages();
    this.submitBtn.disabled = true;
    this.isValidNumber = false;

    if (!phone) {
      this.showMessage("info");
      return false;
    }

    // Length validation
    if (phone.length < data.length) {
      const remaining = data.length - phone.length;
      this.showMessage(
        "error",
        `${remaining} more digit${remaining > 1 ? "s" : ""} required`
      );
      return false;
    }

    if (phone.length > data.length) {
      this.showMessage("error", `Too many digits (max ${data.length})`);
      return false;
    }

    // Pattern validation
    if (!data.pattern.test(phone)) {
      this.showMessage("error", `Invalid format for ${data.name}`);
      return false;
    }

    // Valid number
    this.showMessage("success");
    this.submitBtn.disabled = false;
    this.isValidNumber = true;
    return true;
  }

  hideAllMessages() {
    this.phoneError.classList.add("hidden");
    this.phoneSuccess.classList.add("hidden");
    this.phoneInfo.classList.add("hidden");
  }

  showMessage(type, text = "") {
    this.hideAllMessages();

    switch (type) {
      case "error":
        this.errorText.textContent = text;
        this.phoneError.classList.remove("hidden");
        break;
      case "success":
        this.phoneSuccess.classList.remove("hidden");
        break;
      case "info":
        this.phoneInfo.classList.remove("hidden");
        break;
    }
  }

  updateFormatDisplay() {
    const phone = this.cleanPhoneNumber(this.phoneInput.value);

    if (phone.length > 0) {
      const data = this.countryData[this.currentCountryCode];
      const formatted = data.format(phone.padEnd(data.length, "X"));
      this.formattedNumber.textContent = formatted;
      this.formatDisplay.classList.remove("hidden");
    } else {
      this.formatDisplay.classList.add("hidden");
    }
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border-l-4 transform transition-all duration-300 ${
      type === "error"
        ? "border-red-500 text-red-700"
        : type === "success"
        ? "border-green-500 text-green-700"
        : "border-blue-500 text-blue-700"
    }`;

    notification.innerHTML = `
                    <div class="flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${
                              type === "error"
                                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
                                : type === "success"
                                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
                                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
                            }
                        </svg>
                        <span class="font-medium">${message}</span>
                        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-gray-400 hover:text-gray-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                `;

    // Add to DOM
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
      notification.style.opacity = "1";
    }, 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  toggleDebug() {
    this.debugMode = !this.debugMode;
    this.debugPanel.classList.toggle("hidden", !this.debugMode);

    if (this.debugMode) {
      this.updateDebugInfo();
    }
  }

  updateDebugInfo() {
    if (!this.debugMode) return;

    const phone = this.cleanPhoneNumber(this.phoneInput.value);
    const data = this.countryData[this.currentCountryCode];
    const detected = this.detectCountryFromNumber(
      this.phoneInput.value || "1234567890"
    );

    const debugInfo = {
      "Input Value": `"${this.phoneInput.value}"`,
      Cleaned: `"${phone}"`,
      Country: `${data.name} (${this.currentCountryCode})`,
      "Expected Length": `${data.length}`,
      "Current Length": `${phone.length}`,
      Pattern: `${data.pattern}`,
      "Pattern Match": `${phone ? data.pattern.test(phone) : "N/A"}`,
      "Detection Confidence": `${detected.confidence}`,
      "Validation Status": `${this.isValidNumber ? "VALID" : "INVALID"}`,
      Formatted: `${
        phone ? data.format(phone.padEnd(data.length, "X")) : "N/A"
      }`,
    };

    this.debugContent.innerHTML = Object.entries(debugInfo)
      .map(
        ([key, value]) =>
          `<div><span class="text-white/50">${key}:</span> ${value}</div>`
      )
      .join("");
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.validatePhone()) {
      this.showNotification("Please enter a valid phone number", "error");
      return;
    }

    const fullPhoneNumber =
      this.currentCountryCode + this.cleanPhoneNumber(this.phoneInput.value);
    const data = this.countryData[this.currentCountryCode];

    // Show loading state
    this.setLoadingState(true);

    try {
      // Simulate API call with realistic timing
      await this.simulateApiCall(fullPhoneNumber);

      // Success
      this.showNotification(
        `Verification sent to ${data.format(
          this.cleanPhoneNumber(this.phoneInput.value)
        )}`,
        "success"
      );

      // Here you would integrate with your actual API
      const response = await fetch(`${url}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: fullPhoneNumber }),
          credentials: 'include'
      });

      const result = await response.json();
      if (response.ok) {
        this.showNotification('Login successful!', 'success');
          // window.location.href = '/verify-otp';
          window.location.href = '/';
      } else {
        this.showNotification(result.message || 'Login failed', 'error');
          throw new Error(result.message || 'Login failed');
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showNotification(
        error.message || "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      this.setLoadingState(false);
    }
  }

  setLoadingState(loading) {
    this.submitBtn.disabled = loading;
    this.phoneInput.disabled = loading;
    this.countrySelect.disabled = loading;

    if (loading) {
      this.btnText.classList.add("hidden");
      this.loadingSpinner.classList.remove("hidden");
      this.submitBtn.classList.add("cursor-not-allowed");
    } else {
      this.btnText.classList.remove("hidden");
      this.loadingSpinner.classList.add("hidden");
      this.submitBtn.classList.remove("cursor-not-allowed");
    }
  }

  async simulateApiCall(phoneNumber) {
    // Simulate network delay
    await new Promise((resolve) =>
      setTimeout(resolve, 2000 + Math.random() * 1000)
    );

    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error("Network error. Please check your connection.");
    }

    console.log("Would send verification SMS to:", phoneNumber);
    return { success: true, message: "OTP sent successfully" };
  }

  // Utility method for phone number formatting in different styles
  formatPhoneNumber(phone, style = "international") {
    const data = this.countryData[this.currentCountryCode];

    switch (style) {
      case "international":
        return data.format(phone);
      case "national":
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
      case "raw":
        return this.currentCountryCode + phone;
      default:
        return phone;
    }
  }

  // Method to get country info by phone number
  getCountryByNumber(phone) {
    const detected = this.detectCountryFromNumber(phone);
    return {
      country: this.countryData[detected.countryCode],
      countryCode: detected.countryCode,
      confidence: detected.confidence,
    };
  }
}

// Enhanced Feature: Auto-complete from contacts (if permission granted)
class ContactsIntegration {
  static async requestContactsPermission() {
    if ("navigator" in window && "contacts" in navigator) {
      try {
        const contacts = await navigator.contacts.select(["tel"], {
          multiple: false,
        });
        return contacts[0]?.tel?.[0] || null;
      } catch (error) {
        console.log("Contacts access denied or unavailable");
        return null;
      }
    }
    return null;
  }
}

// Enhanced Feature: Geolocation-based country detection
class LocationBasedCountry {
  static async detectCountryByLocation() {
    try {
      const response = await fetch("https://ipapi.co/json/", { timeout: 3000 });
      const data = await response.json();

      const countryMappings = {
        IN: "+91",
        US: "+1",
        GB: "+44",
        CN: "+86",
        FR: "+33",
        DE: "+49",
        JP: "+81",
        AU: "+61",
        RU: "+7",
        BR: "+55",
      };

      return countryMappings[data.country_code] || "+1";
    } catch (error) {
      console.log("Could not detect location-based country");
      return "+91"; // Default fallback
    }
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize the main validator
  const phoneValidator = new AdvancedPhoneValidator();

  // Try to detect country by location (optional)
  try {
    const detectedCountry =
      await LocationBasedCountry.detectCountryByLocation();
    if (detectedCountry !== phoneValidator.currentCountryCode) {
      document.getElementById("country").value = detectedCountry;
      phoneValidator.updateCountryInfo();
      phoneValidator.showNotification(
        `Country detected: ${phoneValidator.countryData[detectedCountry].name}`,
        "info"
      );
    }
  } catch (error) {
    console.log("Location detection failed, using default country");
  }

  // Add keyboard shortcuts info
  document.addEventListener("keydown", (e) => {
    // Ctrl + L to focus phone input
    if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      document.getElementById("phone").focus();
    }

    // Ctrl + C to change country
    if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      document.getElementById("country").focus();
    }
  });

  // Add paste detection for better UX
  let pasteDetected = false;
  document.addEventListener("paste", () => {
    if (!pasteDetected) {
      pasteDetected = true;
      setTimeout(() => {
        phoneValidator.showNotification(
          "Tip: The system auto-detects country codes from pasted numbers!",
          "info"
        );
      }, 1000);
    }
  });

  // Expose validator to global scope for debugging
  window.phoneValidator = phoneValidator;

  console.log("🚀 Advanced Phone Login System initialized!");
  console.log(
    "📱 Keyboard shortcuts: Ctrl+D (debug), Ctrl+L (focus input), Ctrl+C (focus country)"
  );
  console.log("🔧 Access validator via: window.phoneValidator");
});
"phoneForm"