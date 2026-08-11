const API_URL = "https://graphql.anilist.co";


// ========================================
// GLOBAL DATA
// ========================================

let animeData = [];

let selectedDay = new Date().getDay();

let countdownInterval = null;


// ========================================
// AUTOMATIC CURRENT SEASON
// ========================================

function getCurrentSeason() {

    const month =
        new Date().getMonth() + 1;

    if (month <= 3) {
        return "WINTER";
    }

    if (month <= 6) {
        return "SPRING";
    }

    if (month <= 9) {
        return "SUMMER";
    }

    return "FALL";
}


let currentYear =
    new Date().getFullYear();

let currentSeason =
    getCurrentSeason();
function updateActiveDay() {

    document
        .querySelectorAll(".day")
        .forEach(button => {

            button.classList.remove("active");

            if (
                Number(button.dataset.day) === selectedDay
            ) {

                button.classList.add("active");

            }

        });

}
function updateActiveYear() {

    document
        .querySelectorAll(".year-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                Number(
                    button.dataset.year
                ) === currentYear
            );

        });

}


// ========================================
// GENERATE YEAR BUTTONS
// ========================================

function generateYearButtons() {

    const container =
        document.getElementById("yearSelector");

    if (!container) return;


    const current =
        new Date().getFullYear();


    const startYear = current - 2;
    const endYear = current + 5;


    container.innerHTML = "";


    for (
        let year = startYear;
        year <= endYear;
        year++
    ) {

        const button =
            document.createElement("button");

        button.className = "year-btn";

        button.dataset.year = year;

        button.textContent = year;

        container.appendChild(button);

    }

}




// ========================================
// UPDATE ACTIVE SEASON
// ========================================

function updateActiveSeason() {

    document
        .querySelectorAll(".season-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.season === currentSeason
            );

        });


    const label =
        document.getElementById(
            "currentSeasonLabel"
        );


    if (label) {

        label.textContent =
            `${capitalize(currentSeason)} ${currentYear}`;

    }

}


// ========================================
// ANILIST REQUEST
// ========================================

async function anilistRequest(
    query,
    variables = {},
    retry = 0
) {

    try {

        const response = await fetch(
            API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    query: query,
                    variables: variables
                })
            }
        );


        // Rate limit / temporary error
        if (
            response.status === 429 ||
            response.status >= 500
        ) {

            if (retry < 3) {

                const waitTime =
                    1000 * (retry + 1);


                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            waitTime
                        )
                );


                return anilistRequest(
                    query,
                    variables,
                    retry + 1
                );

            }

        }


        const result =
            await response.json();


        if (result.errors) {

            console.error(
                "AniList:",
                result.errors
            );

            throw new Error(
                "AniList API error"
            );

        }


        return result.data;


    } catch (error) {

        console.error(error);

        throw error;

    }

}


// ========================================
// GET CURRENT AIRING ANIME
// ========================================

async function loadAnime() {

    const container =
        document.getElementById("animeList");

    // Clean loading state
    container.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Loading Anime...</p>
            <small id="loadingProgress">
                0 / 300
            </small>
        </div>
    `;


    animeData = [];


    // 50 × 6 = maximum 300 anime
    const PER_PAGE = 50;
    const MAX_PAGES = 6;


    try {

        for (
            let page = 1;
            page <= MAX_PAGES;
            page++
        ) {

            const query = `

                query (
                    $page: Int,
                    $perPage: Int,
                    $season: MediaSeason,
                    $seasonYear: Int
                ) {

                    Page(
                        page: $page,
                        perPage: $perPage
                    ) {

                        pageInfo {
                            hasNextPage
                            currentPage
                            lastPage
                            total
                        }

                        media(
                            type: ANIME,
                            season: $season,
                            seasonYear: $seasonYear,
                            sort: POPULARITY_DESC
                        ) {

                            id

                            title {
                                romaji
                                english
                                native
                            }

                            coverImage {
                                large
                            }

                            bannerImage

                            averageScore

                            episodes

                            status

startDate {
    year
    month
    day
}

                            format

                            genres

                            studios {
                                nodes {
                                    name
                                }
                            }

                            nextAiringEpisode {
                                airingAt
                                timeUntilAiring
                                episode
                            }

                            airingSchedule(
                                notYetAired: false,
                                perPage: 10
                            ) {

                                nodes {
                                    airingAt
                                    episode
                                }

                            }

                        }

                    }

                }

            `;


            const data =
                await anilistRequest(
                    query,
                    {
                        page: page,
                        perPage: PER_PAGE,

                        // এগুলো আপনার Step 7-এর
                        // selected season variable দিয়ে
                        // replace করবেন
                        season: currentSeason,
                        seasonYear: currentYear
                    }
                );


            if (!data || !data.Page) {
                break;
            }


            const pageAnime =
                data.Page.media || [];


            animeData.push(
                ...pageAnime
            );


            // Update loading progress
            const progress =
                document.getElementById(
                    "loadingProgress"
                );


            if (progress) {

                progress.textContent =
                    `${animeData.length} anime loaded`;

            }


            // আর page থাকলে পরের page
            if (
                !data.Page.pageInfo.hasNextPage
            ) {

                break;

            }


            // API-কে খুব দ্রুত hit না করার জন্য
            await new Promise(
                resolve =>
                    setTimeout(resolve, 250)
            );

        }


        console.log(
            "Total anime loaded:",
            animeData.length
        );


        // =================================
        // RENDER EVERYTHING
        // =================================

        showAnimeList();

        showCountdown();

        updateActiveDay();

        showSchedule(selectedDay);


    } catch (error) {

        console.error(
            "Anime loading error:",
            error
        );


        container.innerHTML = `

            <div class="loading">

                ❌ Failed to load anime.

                <br><br>

                <button
                    onclick="loadAnime()"
                    class="retry-btn"
                >
                    🔄 Retry
                </button>

            </div>

        `;

    }

}


// ========================================
// ANIME TITLE
// ========================================

function getTitle(anime) {

    return (
        anime.title.english ||
        anime.title.romaji ||
        anime.title.native ||
        "Unknown Anime"
    );

}


// ========================================
// ANIME LIST
// ========================================

function showAnimeList(list = animeData) {

    const container =
        document.getElementById("animeList");


    if (!list.length) {

        container.innerHTML = `
            <div class="loading">
                No anime found.
            </div>
        `;

        return;
    }


    container.innerHTML = list.map(anime => {

        const title = getTitle(anime);

      let startDateText = "";

if (
    anime.startDate &&
    anime.startDate.year &&
    anime.startDate.month
) {

    const date = new Date(
        anime.startDate.year,
        anime.startDate.month - 1,
        anime.startDate.day || 1
    );

    startDateText =
        date.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );

}

        const score =
            anime.averageScore
                ? anime.averageScore + "%"
                : "N/A";


        const episode =
            anime.nextAiringEpisode
                ? "EP " + anime.nextAiringEpisode.episode
                : anime.episodes
                    ? anime.episodes + " Episodes"
                    : "Airing";


        const format =
            anime.format || "TV";


        const studio =
            anime.studios &&
            anime.studios.nodes.length
                ? anime.studios.nodes[0].name
                : "Unknown Studio";


        let airingText = "Airing";


        if (anime.nextAiringEpisode) {

            const date =
                new Date(
                    anime.nextAiringEpisode.airingAt * 1000
                );


            airingText =
                date.toLocaleDateString([], {
                    weekday: "short"
                });

        }


        return `

            <div
                class="anime-card"
                onclick="openAnime(${anime.id})"
            >

                <div class="anime-poster">

    <img
        src="${anime.coverImage.large}"
        alt="${title}"
        loading="lazy"
    >

    ${
        startDateText
            ? `
                <div class="anime-date-badge">
                    📅 ${startDateText}
                </div>
              `
            : ""
    }

    <div class="anime-format">
        ${format}
    </div>

</div>


                <div class="anime-info">

                    <h3 title="${title}">
                        ${title}
                    </h3>


                    <div class="anime-meta">

                        <span>
                            📺 ${episode}
                        </span>

                        <span>
                            ⭐ ${score}
                        </span>

                    </div>


                    <div class="anime-extra">

                        <span>
                            📅 ${airingText}
                        </span>

                        <span>
                            ${studio}
                        </span>

                    </div>

                </div>

            </div>

        `;

    }).join("");

}


// ========================================
// LIVE COUNTDOWN
// ========================================

function showCountdown() {

    const container =
        document.getElementById("countdownBox");


    const airingAnime =
        animeData
            .filter(anime =>
                anime.nextAiringEpisode &&
                anime.nextAiringEpisode.airingAt
            )
            .sort((a, b) =>
                a.nextAiringEpisode.airingAt -
                b.nextAiringEpisode.airingAt
            );


    if (!airingAnime.length) {

        container.innerHTML = `
            <div class="loading">
                No upcoming episodes found.
            </div>
        `;

        return;
    }


    container.innerHTML =
        airingAnime.map(anime => {

            const title =
                getTitle(anime);

            const episode =
                anime.nextAiringEpisode.episode;

            const airingAt =
                anime.nextAiringEpisode.airingAt;


            return `

                <div
                    class="countdown-card"
                    onclick="openAnime(${anime.id})"
                >

                    <img
                        src="${anime.coverImage.large}"
                        alt="${title}"
                        loading="lazy"
                    >


                    <div class="countdown-card-info">

                        <div class="next-airing">
                            🔴 NEXT AIRING
                        </div>


                        <h3 title="${title}">
                            ${title}
                        </h3>


                        <div class="countdown-episode">
                            Episode ${episode}
                        </div>


                        <p class="countdown-label">
                            Next episode in:
                        </p>


                        <div
                            class="mini-timer"
                            data-airing="${airingAt}"
                        >

                            <div>
                                <strong class="cd-days">
                                    00
                                </strong>

                                <small>Days</small>
                            </div>


                            <div>
                                <strong class="cd-hours">
                                    00
                                </strong>

                                <small>Hours</small>
                            </div>


                            <div>
                                <strong class="cd-minutes">
                                    00
                                </strong>

                                <small>Minutes</small>
                            </div>


                            <div>
                                <strong class="cd-seconds">
                                    00
                                </strong>

                                <small>Seconds</small>
                            </div>

                        </div>

                    </div>

                </div>

            `;

        }).join("");


    startAllCountdowns();

}


// ========================================
// COUNTDOWN TIMER
// ========================================

let allCountdownInterval = null;


function startAllCountdowns() {

    if (allCountdownInterval) {
        clearInterval(allCountdownInterval);
    }


    function updateAll() {

        const timers =
            document.querySelectorAll(
                ".mini-timer"
            );


        const now =
            Math.floor(
                Date.now() / 1000
            );


        timers.forEach(timer => {

            const airingAt =
                Number(
                    timer.dataset.airing
                );


            let difference =
                airingAt - now;


            if (difference <= 0) {

    if (!window.animeRefreshing) {

        window.animeRefreshing = true;

        loadAnime()
            .finally(() => {

                window.animeRefreshing = false;

            });

    }

    return;
}


            const days =
                Math.floor(
                    difference / 86400
                );


            const hours =
                Math.floor(
                    (difference % 86400) / 3600
                );


            const minutes =
                Math.floor(
                    (difference % 3600) / 60
                );


            const seconds =
                difference % 60;


            const daysEl =
                timer.querySelector(".cd-days");

            const hoursEl =
                timer.querySelector(".cd-hours");

            const minutesEl =
                timer.querySelector(".cd-minutes");

            const secondsEl =
                timer.querySelector(".cd-seconds");


            daysEl.textContent =
                String(days).padStart(2, "0");


            hoursEl.textContent =
                String(hours).padStart(2, "0");


            minutesEl.textContent =
                String(minutes).padStart(2, "0");


            secondsEl.textContent =
                String(seconds).padStart(2, "0");

        });

    }


    updateAll();


    allCountdownInterval =
        setInterval(
            updateAll,
            1000
        );

}

// ========================================
// WEEKLY SCHEDULE
// ========================================

function getDateForDay(day) {

    const today = new Date();

    const currentDay = today.getDay();

    let difference = day - currentDay;

    const date = new Date(today);

    date.setDate(today.getDate() + difference);

    return date;
}


function showSchedule(day) {

    const container =
        document.getElementById("scheduleList");


    // Selected date
    const selectedDate =
        getDateForDay(day);


    const selectedYear =
        selectedDate.getFullYear();

    const selectedMonth =
        selectedDate.getMonth();

    const selectedDateNumber =
        selectedDate.getDate();


    const schedule = [];


    animeData.forEach(anime => {

        if (
            !anime.airingSchedule ||
            !anime.airingSchedule.nodes
        ) {
            return;
        }


        anime.airingSchedule.nodes.forEach(item => {

            const airingDate =
                new Date(item.airingAt * 1000);


            // IMPORTANT:
            // Match exact DATE, not only weekday
            if (
                airingDate.getFullYear() === selectedYear &&
                airingDate.getMonth() === selectedMonth &&
                airingDate.getDate() === selectedDateNumber
            ) {

                schedule.push({

                    anime: anime,

                    airingAt: item.airingAt,

                    episode: item.episode

                });

            }

        });

    });


    // Sort by time
    schedule.sort(
        (a, b) =>
            a.airingAt - b.airingAt
    );


    updateActiveDay();


    if (!schedule.length) {

        container.innerHTML = `

            <div class="schedule-empty">

                <div class="empty-icon">
                    📭
                </div>

                <h3>
                    No episodes today
                </h3>

                <p>
                    No anime episodes are scheduled
                    for this day.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        schedule.map(item => {

            const anime =
                item.anime;


            const title =
                getTitle(anime);


            const date =
                new Date(
                    item.airingAt * 1000
                );


            const time =
                date.toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );


            return `

                <div
                    class="schedule-item"
                    onclick="openAnime(${anime.id})"
                >

                    <img
                        src="${anime.coverImage.large}"
                        alt="${title}"
                        loading="lazy"
                    >


                    <div class="schedule-info">

                        <h3>
                            ${title}
                        </h3>

                        <p>
                            Episode ${item.episode}
                        </p>

                    </div>


                    <div class="schedule-right">

                        <div class="schedule-time">
                            ${time}
                        </div>

                    </div>

                </div>

            `;

        }).join("");

}


// ========================================
// DAY BUTTONS
// ========================================

document
    .querySelectorAll(".day")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectedDay =
                    Number(
                        button.dataset.day
                    );


                updateActiveDay();


                showSchedule(
                    selectedDay
                );

            }
        );

    });
document
    .querySelectorAll(".season-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                document
                    .querySelectorAll(".season-btn")
                    .forEach(btn =>
                        btn.classList.remove("active")
                    );

                button.classList.add("active");

                currentSeason =
                    button.dataset.season;


                document.getElementById(
                    "currentSeasonLabel"
                ).textContent =
                    `${capitalize(currentSeason)} ${currentYear}`;


                document.getElementById(
                    "animeList"
                ).innerHTML = `
                    <div class="loading">
                        Loading ${capitalize(currentSeason)}
                        ${currentYear}...
                    </div>
                `;


                await loadAnime();

            }
        );

    });
// ========================================
// YEAR BUTTONS
// ========================================

// ========================================
// YEAR BUTTONS
// ========================================

function setupYearButtons() {

    document
        .querySelectorAll(".year-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    document
                        .querySelectorAll(".year-btn")
                        .forEach(btn => {
                            btn.classList.remove("active");
                        });


                    button.classList.add("active");


                    currentYear =
                        Number(button.dataset.year);


                    document.getElementById(
                        "currentSeasonLabel"
                    ).textContent =
                        `${capitalize(currentSeason)} ${currentYear}`;


                    document.getElementById(
                        "animeList"
                    ).innerHTML = `

                        <div class="loading">

                            <div class="loading-spinner"></div>

                            <p>
                                Loading
                                ${capitalize(currentSeason)}
                                ${currentYear}...
                            </p>

                        </div>

                    `;


                    await loadAnime();

                }
            );

        });

}

function capitalize(text) {

    return text.charAt(0) +
           text.slice(1).toLowerCase();

}

// ========================================
// SEARCH
// ========================================

// ========================================
// SMART SEARCH
// ========================================

const searchInput =
    document.getElementById("search");

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .trim()
                    .toLowerCase();


            // Empty search
            if (!search) {

                showAnimeList(
                    animeData
                );

                return;

            }


            const filteredAnime =
                animeData.filter(
                    anime => {

                        const titles =
                            anime.title || {};


                        const english =
                            (
                                titles.english ||
                                ""
                            )
                            .toLowerCase();


                        const romaji =
                            (
                                titles.romaji ||
                                ""
                            )
                            .toLowerCase();


                        const native =
                            (
                                titles.native ||
                                ""
                            )
                            .toLowerCase();


                        return (
                            english.includes(search) ||
                            romaji.includes(search) ||
                            native.includes(search)
                        );

                    }
                );


            if (!filteredAnime.length) {

                const list =
                    document.getElementById(
                        "animeList"
                    );


                list.innerHTML = `

                    <div class="search-empty">

                        <div class="search-empty-icon">
                            🔍
                        </div>

                        <h2>
                            No Anime Found
                        </h2>

                        <p>
                            No anime matches
                            "<strong>${escapeHTML(this.value)}</strong>"
                        </p>

                    </div>

                `;

                return;

            }


            showAnimeList(
                filteredAnime
            );

        }
    );

}


// ========================================
// OPEN ANIME
// ========================================

function openAnime(id) {

    window.location.href =
        `details.html?id=${id}`;

}


// ========================================
// THEME
// ========================================

document
    .getElementById("themeBtn")
    .addEventListener(
        "click",
        () => {

            document.body
                .classList
                .toggle("light");


            const button =
                document.getElementById(
                    "themeBtn"
                );


            if (
                document.body.classList.contains(
                    "light"
                )
            ) {

                button.textContent = "☀️";

            } else {

                button.textContent = "🌙";

            }

        }
    );


// ========================================
// START
// ========================================
updateActiveYear();
updateActiveSeason();
generateYearButtons();
setupYearButtons();
loadAnime();
// ========================================
// SAFE HTML
// ========================================

function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}