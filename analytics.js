// ========================================
// ANIMECHART ANALYTICS
// ========================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAnalytics,
    logEvent
} from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";


const firebaseConfig = {

    apiKey: "AIzaSyCahid9LpyDzSmVYWDqctAvbsRaMWiOsLk",

    authDomain: "animechart-697b9.firebaseapp.com",

    projectId: "animechart-697b9",

    storageBucket: "animechart-697b9.firebasestorage.app",

    messagingSenderId: "829485632392",

    appId: "1:829485632392:web:437cd242accbb2dc17083d",

    measurementId: "G-1CL3SGLZ1J"

};


const app =
    initializeApp(firebaseConfig);


const analytics =
    getAnalytics(app);


// ========================================
// PAGE VIEW
// ========================================

logEvent(
    analytics,
    "page_view"
);


// ========================================
// ANIME VIEW
// ========================================

window.trackAnimeView =
    function (animeId, animeTitle) {

        logEvent(
            analytics,
            "anime_view",
            {
                anime_id: String(animeId),
                anime_title: animeTitle
            }
        );

    };