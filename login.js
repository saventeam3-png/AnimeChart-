import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ========================================
// FIREBASE CONFIG
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyCahid9LpyDzSmVYWDqctAvbsRaMWiOsLk",
    authDomain: "animechart-697b9.firebaseapp.com",
    projectId: "animechart-697b9",
    storageBucket: "animechart-697b9.firebasestorage.app",
    messagingSenderId: "829485632392",
    appId: "1:829485632392:web:437cd242accbb2dc17083d",
    measurementId: "G-1CL3SGLZ1J"
};


// ========================================
// INITIALIZE FIREBASE
// ========================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);


// ========================================
// LOGIN
// ========================================

document
    .getElementById("loginForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        const message =
            document.getElementById("loginMessage");

        message.textContent = "Logging in...";

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            message.textContent =
                "Login successful ✓";

            setTimeout(() => {
                location.href = "index.html";
            }, 500);

        } catch (error) {

            console.error(error);

            message.textContent =
                getFirebaseError(error.code);

        }

    });


// ========================================
// REGISTER
// ========================================

document
    .getElementById("registerForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document
                .getElementById("registerEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("registerPassword")
                .value;

        const confirmPassword =
            document
                .getElementById("confirmPassword")
                .value;

        const message =
            document.getElementById(
                "registerMessage"
            );


        if (password !== confirmPassword) {

            message.textContent =
                "Passwords do not match.";

            return;
        }


        if (password.length < 6) {

            message.textContent =
                "Password must be at least 6 characters.";

            return;
        }


        message.textContent =
            "Creating account...";


        try {

            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


            message.textContent =
                "Account created ✓";


            setTimeout(() => {

                location.href = "index.html";

            }, 700);


        } catch (error) {

            console.error(error);

            message.textContent =
                getFirebaseError(error.code);

        }

    });


// ========================================
// PASSWORD SHOW / HIDE
// ========================================

window.togglePassword = function (
    inputId,
    button
) {

    const input =
        document.getElementById(inputId);


    if (input.type === "password") {

        input.type = "text";

        button.textContent = "🙈";

    } else {

        input.type = "password";

        button.textContent = "👁️";

    }

};


// ========================================
// LOGIN / REGISTER SWITCH
// ========================================

window.showRegister = function () {

    document
        .getElementById("loginBox")
        .classList
        .remove("active");


    document
        .getElementById("registerBox")
        .classList
        .add("active");

};


window.showLogin = function () {

    document
        .getElementById("registerBox")
        .classList
        .remove("active");


    document
        .getElementById("loginBox")
        .classList
        .add("active");

};


// ========================================
// FIREBASE ERRORS
// ========================================

function getFirebaseError(code) {

    switch (code) {

        case "auth/invalid-email":
            return "Invalid email address.";

        case "auth/user-not-found":
            return "No account found with this email.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/weak-password":
            return "Password is too weak.";

        case "auth/too-many-requests":
            return "Too many attempts. Try again later.";

        default:
            return "Something went wrong. Please try again.";

    }

}