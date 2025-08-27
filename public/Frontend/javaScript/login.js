import url from "../hostname";



document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // ✅ default reload rokna

    const phone = document.getElementById("phone").value.trim();

    if (!phone) {
      alert("Please enter phone number");
      return;
    }

    try {
      // ✅ Fetch POST request
      const res = await fetch(`${url}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
        credentials: "include", // JWT/cookies ke liye
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Login success
        alert("Login successful!");
        window.location.href = "/";
      } else {
        alert(data.message || "Login failed, try again");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong, please try again");
    }
  });
});
