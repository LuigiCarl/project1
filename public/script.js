const authCard = document.querySelector("#auth-card");
const welcomeScreen = document.querySelector("#welcome-screen");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginMessage = document.querySelector("#login-message");
const registerMessage = document.querySelector("#register-message");
const authTitle = document.querySelector("#auth-title");
const authIntro = document.querySelector("#auth-intro");
const switchToRegister = document.querySelector("#switch-to-register");
const switchToLogin = document.querySelector("#switch-to-login");
const welcomeUsername = document.querySelector("#welcome-username");
const logoutButton = document.querySelector("#logout-button");

function showMessage(element, message, type = "") {
  element.textContent = message;
  element.className = `form-message ${type}`.trim();
}

function setFormMode(mode) {
  const isLogin = mode === "login";
  loginForm.hidden = !isLogin;
  registerForm.hidden = isLogin;
  switchToRegister.hidden = !isLogin;
  switchToLogin.hidden = isLogin;
  authTitle.textContent = isLogin ? "Welcome back" : "Create your account";
  authIntro.textContent = isLogin
    ? "Log in to continue to your dashboard."
    : "Create an account to get started.";
  showMessage(loginMessage, "");
  showMessage(registerMessage, "");
  (isLogin ? loginForm : registerForm).querySelector("input").focus();
}

function showWelcome(username) {
  welcomeUsername.textContent = username;
  authCard.hidden = true;
  welcomeScreen.hidden = false;
}

function showLogin() {
  welcomeScreen.hidden = true;
  authCard.hidden = false;
  loginForm.reset();
  registerForm.reset();
  setFormMode("login");
}

async function submitForm(form, messageElement, endpoint) {
  showMessage(messageElement, "Working...");
  const formData = new FormData(form);
  const payload = {
    username: formData.get("username"),
    password: formData.get("password"),
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Something went wrong. Please try again.");
    }

    return result;
  } catch (error) {
    showMessage(messageElement, error.message, "error");
    return null;
  }
}

switchToRegister.querySelector("button").addEventListener("click", () => {
  setFormMode("register");
});

switchToLogin.querySelector("button").addEventListener("click", () => {
  setFormMode("login");
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;

  const result = await submitForm(loginForm, loginMessage, "/api/login");
  if (result) showWelcome(result.username);
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!registerForm.reportValidity()) return;

  const result = await submitForm(registerForm, registerMessage, "/api/register");
  if (result) {
    registerForm.reset();
    showMessage(registerMessage, result.message, "success");
    window.setTimeout(() => setFormMode("login"), 800);
  }
});

logoutButton.addEventListener("click", showLogin);
