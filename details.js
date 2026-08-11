const API_URL = "https://graphql.anilist.co";


// Get anime ID from URL
const params = new URLSearchParams(window.location.search);

const animeId = params.get("id");


// ========================================
// ANILIST REQUEST
// ========================================

async function getAnimeDetails() {

    if (!animeId) {

        document.getElementById("details").innerHTML = `
            <div class="loading">
                Anime not found.
            </div>
        `;

        return;
    }


    const query = `

        query ($id: Int) {

            Media(id: $id, type: ANIME) {

                id

                title {
                    romaji
                    english
                    native
                }

                description(asHtml: false)

                coverImage {
                    extraLarge
                    large
                }

                bannerImage

               trailer {
    id
    site
    thumbnail
}

                averageScore

                popularity

                episodes

                duration

                status

                season

                seasonYear

                format

                source

                genres

                studios {

                    nodes {
                        name
                    }

                }

                startDate {
                    year
                    month
                    day
                }

                endDate {
                    year
                    month
                    day
                }

                nextAiringEpisode {

                    airingAt
                    timeUntilAiring
                    episode

                }

                airingSchedule {

                    nodes {

                        airingAt
                        episode

                    }

                }

            }

        }

    `;


try {

    let response = null;
    let result = null;

    // ========================================
    // ANILIST REQUEST WITH RETRY
    // ========================================

    for (let attempt = 0; attempt < 4; attempt++) {

        response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                query: query,

                variables: {
                    id: Number(animeId)
                }

            })

        });


        // Rate limit / server error
        if (
            response.status === 429 ||
            response.status >= 500
        ) {

            if (attempt < 3) {

                const waitTime =
                    1000 * (attempt + 1);

                console.log(
                    `AniList retry ${attempt + 1}/3...`
                );

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            waitTime
                        )
                );

                continue;

            }

        }


        result =
            await response.json();


        break;

    }


    if (!response || !response.ok) {

        throw new Error(
            `AniList HTTP error: ${
                response ? response.status : "Unknown"
            }`
        );

    }


    if (
        !result ||
        result.errors
    ) {

        console.error(
            "AniList:",
            result?.errors
        );

        throw new Error(
            "AniList API error"
        );

    }


    if (
        !result.data ||
        !result.data.Media
    ) {

        throw new Error(
            "Anime details not found"
        );

    }

if (window.trackAnimeView) {

    trackAnimeView(
        animeId,
        result.data.Media.title.english ||
        result.data.Media.title.romaji ||
        result.data.Media.title.native ||
        "Unknown Anime"
    );

}

    showDetails(
        result.data.Media
    );


} catch (error) {

    console.error(
        "Anime details error:",
        error
    );


    document.getElementById(
        "details"
    ).innerHTML = `

        <div class="loading">

            ❌ Failed to load anime details.

            <br><br>

            Please try again.

            <br><br>

            <button
                onclick="location.reload()"
                class="retry-btn"
            >
                🔄 Retry
            </button>

        </div>

    `;

}

}


// ========================================
// SHOW DETAILS
// ========================================

function showDetails(anime) {

    const container =
        document.getElementById("details");


    const title =
        anime.title.english ||
        anime.title.romaji ||
        anime.title.native ||
        "Unknown";

let trailerHTML = "";

if (
    anime.trailer &&
    anime.trailer.id &&
    anime.trailer.site === "youtube"
) {

    trailerHTML = `

        <section class="anime-trailer">

            <h2>🎬 Trailer</h2>

            <div class="trailer-container">

                <iframe
                    src="https://www.youtube.com/embed/${anime.trailer.id}"
                    title="${title} Trailer"
                    loading="lazy"
                    allow="
                        accelerometer;
                        autoplay;
                        clipboard-write;
                        encrypted-media;
                        gyroscope;
                        picture-in-picture;
                        web-share
                    "
                    allowfullscreen>
                </iframe>

            </div>

        </section>

    `;

}

    const description =
        anime.description ||
        "No description available.";


    const score =
        anime.averageScore
            ? anime.averageScore + "%"
            : "N/A";


    const episodes =
        anime.episodes || "N/A";


    const duration =
        anime.duration
            ? anime.duration + " min"
            : "N/A";


    const studios =
        anime.studios.nodes.length
            ? anime.studios.nodes
                .map(studio => studio.name)
                .join(", ")
            : "Unknown";


    const genres =
        anime.genres.length
            ? anime.genres.join(", ")
            : "N/A";


    const season =
        anime.season
            ? anime.season + " " + (anime.seasonYear || "")
            : "N/A";


    let nextEpisodeHTML = "";


    if (anime.nextAiringEpisode) {

        nextEpisodeHTML = `

            <div class="details-next">

                <h3>🔴 Next Episode</h3>

                <p>
                    Episode ${anime.nextAiringEpisode.episode}
                </p>

                <div
                    id="detailsCountdown"
                    class="details-timer"
                    data-airing="${anime.nextAiringEpisode.airingAt}"
                >
                    Loading countdown...
                </div>

            </div>

        `;

    }


    container.innerHTML = `

        <div
            class="details-hero"
            style="
                background-image:
                linear-gradient(
                    rgba(11,15,25,.75),
                    rgba(11,15,25,.98)
                ),
                url('${anime.bannerImage || anime.coverImage.large}');
            "
        >

            <div class="details-main">

                <img
                    class="details-poster"
                    src="${anime.coverImage.extraLarge || anime.coverImage.large}"
                    alt="${title}"
                >


                <div class="details-info">

                    <h1>
                        ${title}
                    </h1>

                    ${
                        anime.title.romaji &&
                        anime.title.romaji !== title
                        ? `<p class="romaji">
                            ${anime.title.romaji}
                          </p>`
                        : ""
                    }


                    <div class="details-tags">

                        <span>
                            ${anime.status || "Unknown"}
                        </span>

                        <span>
                            ${anime.format || "TV"}
                        </span>

                        <span>
                            ${season}
                        </span>

                    </div>


                    <div class="details-stats">

                        <div>
                            <strong>⭐ ${score}</strong>
                            <small>Score</small>
                        </div>

                        <div>
                            <strong>${episodes}</strong>
                            <small>Episodes</small>
                        </div>

                        <div>
                            <strong>${duration}</strong>
                            <small>Duration</small>
                        </div>

                    </div>


                    ${nextEpisodeHTML}

             ${trailerHTML}

                    <div class="description">

                        <h2>Synopsis</h2>

                        <p>
                            ${description}
                        </p>

                    </div>


                    <div class="extra-info">

                        <p>
                            <strong>Genres:</strong>
                            ${genres}
                        </p>

                        <p>
                            <strong>Studio:</strong>
                            ${studios}
                        </p>

                        <p>
                            <strong>Source:</strong>
                            ${anime.source || "N/A"}
                        </p>

                    </div>

                </div>

            </div>

        </div>

    `;


    startDetailsCountdown();

}


// ========================================
// DETAILS COUNTDOWN
// ========================================

let detailsTimer = null;


function startDetailsCountdown() {

    const timer =
        document.getElementById(
            "detailsCountdown"
        );


    if (!timer) {
        return;
    }


    const airingAt =
        Number(
            timer.dataset.airing
        );


    function update() {

        const now =
            Math.floor(
                Date.now() / 1000
            );


        let difference =
            airingAt - now;


        if (difference <= 0) {

            timer.textContent =
                "Episode is airing now!";

            clearInterval(detailsTimer);

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


        timer.innerHTML = `

            <div>
                <strong>${String(days).padStart(2, "0")}</strong>
                <small>Days</small>
            </div>

            <div>
                <strong>${String(hours).padStart(2, "0")}</strong>
                <small>Hours</small>
            </div>

            <div>
                <strong>${String(minutes).padStart(2, "0")}</strong>
                <small>Minutes</small>
            </div>

            <div>
                <strong>${String(seconds).padStart(2, "0")}</strong>
                <small>Seconds</small>
            </div>

        `;

    }


    update();

    detailsTimer =
        setInterval(update, 1000);

}


// ========================================
// THEME
// ========================================

const themeBtn =
    document.getElementById("themeBtn");


if (themeBtn) {

    themeBtn.addEventListener(
        "click",
        () => {

            document.body
                .classList
                .toggle("light");


            themeBtn.textContent =
                document.body.classList.contains("light")
                    ? "☀️"
                    : "🌙";

        }
    );

}


// ========================================
// START
// ========================================

getAnimeDetails();