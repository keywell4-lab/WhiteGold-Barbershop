
import { supabase } from "./supabase-client.js";

const form = document.getElementById("loginForm");
const message = document.getElementById("message");

const passwordInput = document.getElementById("password");
const eyeToggle = document.getElementById("togglePassword");
const eyeOpen = document.getElementById("eyeOpen");
const eyeClosed = document.getElementById("eyeClosed");

eyeToggle.addEventListener("click", () => {
    const showing = passwordInput.type === "password";

    passwordInput.type = showing ? "text" : "password";
    eyeOpen.style.display = showing ? "none" : "block";
    eyeClosed.style.display = showing ? "block" : "none";
    eyeToggle.title = showing ? "Hide password" : "Show password";
});

form.addEventListener("submit", async event => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Signing in...";

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        message.textContent = "Login failed: " + error.message;
        return;
    }

    const { data: admin, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

    if (adminError || !admin) {
        await supabase.auth.signOut();
        message.textContent = "This account is not authorised as an admin.";
        return;
    }

    window.location.href = "admin.html";
});
