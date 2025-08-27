import url from "../hostname.js";



document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // ✅ default reload roko

    // Input values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document
      .getElementById("confirm_password")
      .value.trim();
    const terms = document.getElementById("terms").checked;

    // ✅ Password confirm check
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (!terms) {
      alert("You must agree to the Terms & Privacy Policy");
      return;
    }

    try {
      // ✅ Send POST request to /signup
      const res = await fetch(`${url}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          terms,
          confirmPassword,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        alert("Signup successful! Please login.");
        window.location.href = `${url}/login`;
      } else {
        alert(data.message || "Signup failed, try again.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Something went wrong, please try again.");
    }
  });
});
