// js/login.js
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const errorMessage = document.createElement('p');
errorMessage.style.color = '#e8716d';
errorMessage.style.textAlign = 'center';
errorMessage.style.marginBottom = '1rem';
loginForm.insertBefore(errorMessage, loginForm.querySelector('.forms_fieldset'));

// Si un usuario ya autenticado llega a la página de login, lo redirigimos al panel.
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = 'index.html';
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    errorMessage.textContent = ''; // Limpiar errores

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Si el login es exitoso, onAuthStateChanged se activará y redirigirá.
        console.log('Login exitoso:', userCredential.user.email);
    } catch (error) {
        let message = 'Ocurrió un error. Inténtalo de nuevo.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            message = 'Correo o contraseña incorrectos.';
        }
        console.error("Error de login:", error.code);
        errorMessage.textContent = message;
    }
});

/**
 * Variables para la animación
 */
const signupButton = document.getElementById('signup-button');
const loginButton = document.getElementById('login-button');
const userForms = document.getElementById('user_options-forms');

/**
 * Añadir evento al botón "Saber Más"
 */
signupButton.addEventListener('click', () => {
  userForms.classList.remove('bounceRight');
  userForms.classList.add('bounceLeft');
}, false);

/**
 * Añadir evento al botón "Iniciar Sesión"
 */
loginButton.addEventListener('click', () => {
  userForms.classList.remove('bounceLeft');
  userForms.classList.add('bounceRight');
}, false);