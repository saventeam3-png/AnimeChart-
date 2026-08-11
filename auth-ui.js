import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


const firebaseConfig = {
    apiKey: "AIzaSyCahid9LpyDzSmVYWDqctAvbsRaMWiOsLk",
    authDomain: "animechart-697b9.firebaseapp.com",
    projectId: "animechart-697b9",
    storageBucket: "animechart-697b9.firebasestorage.app",
    messagingSenderId: "829485632392",
    appId: "1:829485632392:web:437cd242accbb2dc17083d",
    measurementId: "G-1CL3SGLZ1J"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);


const loginBtn =
    document.getElementById("loginBtn");

const userMenu =
    document.getElementById("userMenu");

const userBtn =
    document.getElementById("userBtn");

const userDropdown =
    document.getElementById("userDropdown");

const userEmail =
    document.getElementById("userEmail");

const dropdownEmail =
    document.getElementById("dropdownEmail");

const logoutBtn =
    document.getElementById("logoutBtn");


// ========================================
// AUTH STATE
// ========================================

onAuthStateChanged(
    auth,
    (user) => {

        if (user) {

            // Logged in
            loginBtn.style.display =
                "none";

            userMenu.style.display =
                "block";

            userEmail.textContent =
                user.email;

            dropdownEmail.textContent =
                user.email;

        } else {

            // Not logged in
            loginBtn.style.display =
                "inline-flex";

            userMenu.style.display =
                "none";

        }

    }
);


// ========================================
// USER MENU
// ========================================

userBtn?.addEventListener(
    "click",
    (event) => {

        event.stopPropagation();

        userDropdown.classList.toggle(
            "show"
        );

    }
);


// Close dropdown
document.addEventListener(
    "click",
    () => {

        userDropdown?.classList.remove(
            "show"
        );

    }
);


// ========================================
// LOGOUT
// ========================================

logoutBtn?.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            userDropdown.classList.remove(
                "show"
            );

        } catch (error) {

            console.error(
                "Logout failed:",
                error
            );

        }

    }
);