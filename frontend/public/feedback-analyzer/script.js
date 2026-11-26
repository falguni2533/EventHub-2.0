document.addEventListener("DOMContentLoaded", function () {
    // ----------------------------------
    // 1. HTML ELEMENTS & CONFIG
    // ----------------------------------
    const feedbackForm = document.getElementById("feedbackForm");
    const submitFeedbackBtn = document.getElementById("submitFeedbackBtn");
    const feedbackList = document.getElementById("feedbackList");
    const feedbackMessage = document.getElementById("feedbackMessage");

    const studentName = document.getElementById("studentName");
    const feedbackCategory = document.getElementById("feedbackCategory");
    const studentRating = document.getElementById("studentRating");
    const studentFeedback = document.getElementById("studentFeedback");

    const starRatingGroup = document.getElementById("starRatingGroup");
    const ratingCaption = document.getElementById("ratingCaption");
    const starButtons = starRatingGroup
        ? Array.from(starRatingGroup.querySelectorAll(".star-btn"))
        : [];

    const eventSelect = document.getElementById("eventSelect");
    const apiStatus = document.getElementById("apiStatus");
    const apiStatusText = document.getElementById("apiStatusText");

    const loadDemoBtn = document.getElementById("loadDemoBtn");
    const clearDataBtn = document.getElementById("clearDataBtn");
    const themeToggle = document.getElementById("themeToggle");
    const themeIconSun = document.getElementById("themeIconSun");
    const themeIconMoon = document.getElementById("themeIconMoon");

    const totalReviewsEl = document.getElementById("totalReviews");
    const averageRatingEl = document.getElementById("averageRating");
    const positivePercentEl = document.getElementById("positivePercent");
    const positiveCountEl = document.getElementById("positiveCount");
    const negativePercentEl = document.getElementById("negativePercent");
    const negativeCountEl = document.getElementById("negativeCount");

    const csvFile = document.getElementById("csvFile");
    const csvDropzone = document.getElementById("csvDropzone");
    const csvFileName = document.getElementById("csvFileName");
    const uploadCSV = document.getElementById("uploadCSV");
    const downloadSampleCsvBtn = document.getElementById("downloadSampleCsvBtn");
    const csvMessage = document.getElementById("csvMessage");

    const lovedInsights = document.getElementById("lovedInsights");
    const complaintInsights = document.getElementById("complaintInsights");
    const suggestionInsights = document.getElementById("suggestionInsights");
    const insightsNote = document.getElementById("insightsNote");

    const feedbackSearch = document.getElementById("feedbackSearch");
    const sentimentFilter = document.getElementById("sentimentFilter");
    const categoryFilter = document.getElementById("categoryFilter");
    const toggleShowAllBtn = document.getElementById("toggleShowAllBtn");
    const recentCountLabel = document.getElementById("recentCountLabel");
    const exportCsvBtn = document.getElementById("exportCsvBtn");
    const exportJsonBtn = document.getElementById("exportJsonBtn");

    const analysisStatus = document.getElementById("analysisStatus");
    const eventStatus = document.getElementById("eventStatus");
    const overallScore = document.getElementById("overallScore");
    const statusDescription = document.getElementById("statusDescription");
    const evalGaugeArc = document.getElementById("evalGaugeArc");
    const evalGaugeValue = document.getElementById("evalGaugeValue");
    const evalSentimentLabel = document.getElementById("evalSentimentLabel");
    const evalBarPos = document.getElementById("evalBarPos");
    const evalBarNeu = document.getElementById("evalBarNeu");
    const evalBarNeg = document.getElementById("evalBarNeg");
    const evalCategoryBars = document.getElementById("evalCategoryBars");

    const API_BASE = resolveApiBase();
    const STORAGE_KEY = "aiFeedbackAnalyzerData";
    const THEME_STORAGE_KEY = "aiFeedbackAnalyzerTheme";
    const RATING_LABELS = {
        1: "1 / 5 — Very Poor",
        2: "2 / 5 — Poor",
        3: "3 / 5 — Average",
        4: "4 / 5 — Good",
        5: "5 / 5 — Excellent"
    };

    let showAllFeedback = false;
    let submittedFeedback = loadFeedback();

    /**
     * Resolves the backend origin so both file:// / Live Server and same-origin hosting work.
     */
    function resolveApiBase() {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;
        const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

        if (protocol === "file:" || (isLocalHost && port !== "5000")) {
            return "http://localhost:5000";
        }
        return "";
    }

    function setStatusMessage(element, message, variant) {
        if (!element) return;
        element.textContent = message;
        element.className = "status-msg" + (variant ? " is-" + variant : "");
    }

    // ----------------------------------
    // 2. THEME MANAGEMENT (LIGHT / DARK)
    // ----------------------------------
    function getPreferredTheme() {
        try {
            const saved = localStorage.getItem(THEME_STORAGE_KEY);
            if (saved === "light" || saved === "dark") return saved;
        } catch (error) {
            console.warn("Could not read theme preference:", error);
        }
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (error) {
            console.warn("Could not persist theme preference:", error);
        }

        if (themeIconSun && themeIconMoon) {
            themeIconSun.classList.toggle("hidden", theme !== "dark");
            themeIconMoon.classList.toggle("hidden", theme === "dark");
        }

        updateChartThemes();
    }

    // ----------------------------------
    // 3. INTERACTIVE STAR RATING PICKER
    // ----------------------------------
    function renderStars(activeValue, hoverValue) {
        const displayValue = hoverValue || activeValue || 0;
        starButtons.forEach(function (btn) {
            const val = Number(btn.dataset.value);
            btn.classList.toggle("is-active", val <= activeValue);
            btn.classList.toggle("is-hover", hoverValue > 0 && val <= hoverValue);
            btn.setAttribute("aria-checked", val === activeValue ? "true" : "false");
        });

        if (ratingCaption) {
            ratingCaption.textContent = displayValue
                ? RATING_LABELS[displayValue]
                : "Select 1 to 5 stars";
        }
    }

    function setRatingValue(value) {
        const numeric = Number(value);
        if (studentRating) {
            studentRating.value = numeric >= 1 && numeric <= 5 ? String(numeric) : "";
        }
        renderStars(numeric >= 1 && numeric <= 5 ? numeric : 0, 0);
    }

    starButtons.forEach(function (btn, index) {
        btn.addEventListener("click", function () {
            setRatingValue(btn.dataset.value);
        });

        btn.addEventListener("mouseenter", function () {
            const active = Number(studentRating ? studentRating.value : 0);
            renderStars(active, Number(btn.dataset.value));
        });

        btn.addEventListener("keydown", function (event) {
            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                const next = Math.min(5, index + 2);
                setRatingValue(next);
                starButtons[next - 1].focus();
            } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                const prev = Math.max(1, index);
                setRatingValue(prev);
                starButtons[prev - 1].focus();
            }
        });
    });

    if (starRatingGroup) {
        starRatingGroup.addEventListener("mouseleave", function () {
            const active = Number(studentRating ? studentRating.value : 0);
            renderStars(active, 0);
        });
    }

    // ----------------------------------
    // 4. LOCAL STORAGE & DEMO DATASET
    // ----------------------------------
    function createFeedbackId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return "fb-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    }

    function loadFeedback() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            const parsed = savedData ? JSON.parse(savedData) : [];
            if (!Array.isArray(parsed)) return [];
            return parsed.map(function (item) {
                return item && item.id ? item : { ...item, id: createFeedbackId() };
            });
        } catch (error) {
            console.error("Saved feedback could not be loaded:", error);
            return [];
        }
    }

    function saveFeedback() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(submittedFeedback));
        } catch (error) {
            console.error("Feedback could not be saved:", error);
        }
    }

    function buildDemoDataset() {
        const dayMs = 24 * 60 * 60 * 1000;
        const isoDaysAgo = function (days) {
            return new Date(Date.now() - days * dayMs).toISOString();
        };

        return [
            {
                id: "demo-1",
                name: "Aarav Mehta",
                category: "Speakers",
                rating: 5,
                feedback: "The AI keynote speaker explained real-world LLM architecture clearly and answered every student question.",
                sentiment: "Positive",
                aiSummary: "Strong praise for the keynote speaker's clarity and interactive Q&A.",
                aiSuggestions: ["Invite the speaker back for a hands-on follow-up workshop."],
                provider: "gemini",
                event: "Tech Fest 2026",
                date: isoDaysAgo(0),
                isDemo: true
            },
            {
                name: "Priya Nair",
                category: "Registration",
                rating: 2,
                feedback: "Check-in queues took over 40 minutes and QR scanner kept disconnecting at the main gate.",
                sentiment: "Negative",
                aiSummary: "Long registration wait times caused by unreliable QR check-in scanners.",
                aiSuggestions: ["Add parallel check-in desks and offline QR validation backup."],
                provider: "gemini",
                event: "Tech Fest 2026",
                date: isoDaysAgo(1),
                isDemo: true
            },
            {
                name: "Rohan Kulkarni",
                category: "Content",
                rating: 4,
                feedback: "Hands-on cloud lab was engaging, though the final deployment section felt slightly rushed.",
                sentiment: "Positive",
                aiSummary: "Engaging cloud workshop, with minor pacing pressure near the end.",
                aiSuggestions: ["Extend lab duration by 20 minutes for deployment troubleshooting."],
                provider: "openai",
                event: "Tech Fest 2026",
                date: isoDaysAgo(2),
                isDemo: true
            },
            {
                name: "Sneha Verma",
                category: "Venue",
                rating: 3,
                feedback: "Auditorium seating was comfortable, but the projector brightness in the back rows was average.",
                sentiment: "Neutral",
                aiSummary: "Decent seating comfort offset by dim projection visibility in rear rows.",
                aiSuggestions: ["Add side repeater screens or increase projector contrast."],
                provider: "gemini",
                event: "Tech Fest 2026",
                date: isoDaysAgo(3),
                isDemo: true
            },
            {
                name: "Kabir Malhotra",
                category: "Food",
                rating: 5,
                feedback: "Lunch boxes were well organized with plenty of vegetarian options and zero bottlenecks.",
                sentiment: "Positive",
                aiSummary: "Fast, well-managed catering with good dietary variety.",
                aiSuggestions: ["Retain the dual-counter meal distribution layout next year."],
                provider: "gemini",
                event: "Tech Fest 2026",
                date: isoDaysAgo(4),
                isDemo: true
            },
            {
                name: "Ananya Iyer",
                category: "Organization",
                rating: 5,
                feedback: "24-hour mentorship checkpoints kept our team unblocked and judging criteria were transparent.",
                sentiment: "Positive",
                aiSummary: "Mentorship cadence and clear judging rubrics drove strong participant satisfaction.",
                aiSuggestions: ["Publish mentor office-hour slots on the event portal ahead of kickoff."],
                provider: "gemini",
                event: "Hackathon 2026",
                date: isoDaysAgo(1),
                isDemo: true
            },
            {
                name: "Devansh Patel",
                category: "Venue",
                rating: 2,
                feedback: "Wi-Fi dropped repeatedly in Block B during the final pitch submission window.",
                sentiment: "Negative",
                aiSummary: "Critical Wi-Fi instability in Block B disrupted hackathon submissions.",
                aiSuggestions: ["Deploy dedicated backup routers in submission zones."],
                provider: "openai",
                event: "Hackathon 2026",
                date: isoDaysAgo(2),
                isDemo: true
            },
            {
                name: "Meera Joshi",
                category: "Content",
                rating: 5,
                feedback: "Cultural night performances and lighting production were outstanding and ran right on schedule.",
                sentiment: "Positive",
                aiSummary: "High production quality and punctual stage management.",
                aiSuggestions: ["Share the backstage cue sheet template with future fest committees."],
                provider: "gemini",
                event: "Annual Fest 2026",
                date: isoDaysAgo(5),
                isDemo: true
            }
        ];
    }

    function loadDemoData() {
        const userEntries = submittedFeedback.filter(item => !item.isDemo);
        const demoItems = buildDemoDataset().map(function (item, idx) {
            return { ...item, id: "demo-" + (idx + 1) };
        });
        submittedFeedback = [...userEntries, ...demoItems];
        saveFeedback();
        if (eventSelect) {
            eventSelect.value = "all";
        }
        updateDashboard();
        setStatusMessage(
            feedbackMessage,
            "Demo dataset loaded across all events (All Events view active).",
            "success"
        );
    }

    function clearAllData() {
        submittedFeedback = [];
        saveFeedback();
        updateDashboard();
        setStatusMessage(feedbackMessage, "All stored feedback has been cleared.", "warning");
        setStatusMessage(csvMessage, "", "");
    }

    // ----------------------------------
    // 5. API HEALTH CHECK & LOCAL FALLBACK
    // ----------------------------------
    async function checkApiHealth() {
        if (!apiStatus || !apiStatusText) return;

        try {
            const response = await fetch(API_BASE + "/api/health");
            if (!response.ok) {
                throw new Error("Health check failed (" + response.status + ")");
            }

            const data = await response.json();
            const providers = data.providers || {};
            const activeProviders = [];

            if (providers.geminiConfigured) activeProviders.push("Gemini");
            if (providers.openaiConfigured) activeProviders.push("OpenAI");

            if (activeProviders.length > 0) {
                apiStatus.className = "api-status status-ready";
                apiStatusText.textContent = "AI Ready (" + activeProviders.join(" + ") + ")";
            } else if (providers.localFallbackEnabled) {
                apiStatus.className = "api-status status-local";
                apiStatusText.textContent = "Local Analyzer Mode";
            } else {
                apiStatus.className = "api-status status-offline";
                apiStatusText.textContent = "AI Provider Not Configured";
            }
        } catch (error) {
            console.warn("Backend health check unavailable:", error.message);
            apiStatus.className = "api-status status-offline";
            apiStatusText.textContent = "Backend Offline (Client Fallback)";
        }
    }

    function analyzeSentiment(feedback) {
        const lowerText = String(feedback || "").toLowerCase();

        const englishPositive = [
            "good", "great", "excellent", "amazing", "awesome", "best", "love",
            "loved", "helpful", "nice", "wonderful", "fantastic", "enjoyed",
            "perfect", "satisfied", "clear", "interesting", "well", "engaging"
        ];
        const englishNegative = [
            "bad", "poor", "worst", "boring", "waste", "problem", "issue",
            "disappointed", "difficult", "late", "dirty", "slow", "unhappy",
            "improve", "confusing", "rushed", "unclear", "terrible"
        ];
        const phrasePositive = ["अच्छा", "बहुत अच्छा", "शानदार", "बढ़िया"];
        const phraseNegative = [
            "not good", "not helpful", "not clear",
            "खराब", "बेकार", "समस्या", "गंदा"
        ];

        let score = 0;
        englishPositive.forEach(function (word) {
            if (new RegExp("\\b" + word + "\\b", "i").test(lowerText)) score += 1;
        });
        englishNegative.forEach(function (word) {
            if (new RegExp("\\b" + word + "\\b", "i").test(lowerText)) score -= 1;
        });
        phrasePositive.forEach(function (phrase) {
            if (lowerText.includes(phrase)) score += 1;
        });
        phraseNegative.forEach(function (phrase) {
            if (lowerText.includes(phrase)) score -= 2;
        });

        if (score > 0) return "Positive";
        if (score < 0) return "Negative";
        return "Neutral";
    }

    function buildLocalAnalysis(feedback) {
        const sentiment = analyzeSentiment(feedback);
        const trimmed = String(feedback || "").trim().replace(/\s+/g, " ");
        const summary = trimmed.length > 140 ? trimmed.slice(0, 137) + "..." : trimmed;
        const suggestions = [];

        if (sentiment === "Negative") {
            suggestions.push("Review this issue with event organizers and address key pain points.");
        } else if (sentiment === "Positive") {
            suggestions.push("Maintain these strengths and document what worked well for future events.");
        } else {
            suggestions.push("Follow up with attendees for more specific improvement ideas.");
        }

        return { sentiment: sentiment, summary: summary, suggestions: suggestions };
    }

    // ----------------------------------
    // 6. CHART SETUP & THEME SYNC
    // ----------------------------------
    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded. Check the Chart.js CDN in index.html.");
    }

    let sentimentChart = null;
    let categoryChart = null;
    let trendChart = null;
    let ratingChart = null;

    function getChartThemePalette() {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        return {
            text: isDark ? "#cbd5e1" : "#475569",
            title: isDark ? "#f8fafc" : "#0f172a",
            grid: isDark ? "rgba(148, 163, 184, 0.14)" : "rgba(15, 23, 42, 0.08)"
        };
    }

    const centerTextPlugin = {
        id: "centerText",
        afterDraw: function (chart) {
            if (chart.config.type !== "doughnut") return;
            const ctx = chart.ctx;
            const area = chart.chartArea;
            if (!area) return;

            const palette = getChartThemePalette();
            const centerX = (area.left + area.right) / 2;
            const centerY = (area.top + area.bottom) / 2;

            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = palette.title;
            ctx.font = "700 22px 'Plus Jakarta Sans', Inter, sans-serif";
            ctx.fillText(String(getCurrentFeedback().length), centerX, centerY);
            ctx.restore();
        }
    };

    function updateChartThemes() {
        const palette = getChartThemePalette();

        [categoryChart, trendChart, ratingChart].forEach(function (chart) {
            if (!chart) return;
            if (chart.options.scales?.x) {
                chart.options.scales.x.ticks.color = palette.text;
                chart.options.scales.x.grid.color = palette.grid;
            }
            if (chart.options.scales?.y) {
                chart.options.scales.y.ticks.color = palette.text;
                chart.options.scales.y.grid.color = palette.grid;
            }
            if (chart.options.plugins?.legend?.labels) {
                chart.options.plugins.legend.labels.color = palette.text;
            }
            chart.update();
        });

        if (sentimentChart) {
            if (sentimentChart.options.plugins?.legend?.labels) {
                sentimentChart.options.plugins.legend.labels.color = palette.text;
            }
            sentimentChart.update();
        }
    }

    if (typeof Chart !== "undefined") {
        Chart.register(centerTextPlugin);

        const sentimentCanvas = document.getElementById("sentimentChart");
        const categoryCanvas = document.getElementById("categoryChart");
        const trendCanvas = document.getElementById("trendChart");
        const ratingCanvas = document.getElementById("ratingChart");
        const palette = getChartThemePalette();

        if (sentimentCanvas) {
            sentimentChart = new Chart(sentimentCanvas, {
                type: "doughnut",
                data: {
                    labels: ["Positive", "Negative", "Neutral"],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: ["#22c55e", "#ef4444", "#f59e0b"],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: { color: palette.text, padding: 16 }
                        }
                    }
                }
            });
        }

        if (categoryCanvas) {
            categoryChart = new Chart(categoryCanvas, {
                type: "bar",
                data: {
                    labels: [],
                    datasets: [{
                        label: "Average Rating",
                        data: [],
                        backgroundColor: "#6366f1",
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            ticks: { color: palette.text },
                            grid: { display: false }
                        },
                        y: {
                            beginAtZero: true,
                            min: 0,
                            max: 5,
                            ticks: { stepSize: 1, color: palette.text },
                            grid: { color: palette.grid }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        if (trendCanvas) {
            trendChart = new Chart(trendCanvas, {
                type: "line",
                data: {
                    labels: [],
                    datasets: [{
                        label: "Feedback received",
                        data: [],
                        borderColor: "#6366f1",
                        backgroundColor: "rgba(99, 102, 241, 0.16)",
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointBackgroundColor: "#6366f1"
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            ticks: { color: palette.text },
                            grid: { display: false }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0, color: palette.text },
                            grid: { color: palette.grid }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: palette.text }
                        }
                    }
                }
            });
        }

        if (ratingCanvas) {
            ratingChart = new Chart(ratingCanvas, {
                type: "bar",
                data: {
                    labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
                    datasets: [{
                        label: "Number of Reviews",
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: [
                            "#ef4444",
                            "#f97316",
                            "#f59e0b",
                            "#84cc16",
                            "#22c55e"
                        ],
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            ticks: { color: palette.text },
                            grid: { display: false }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0, color: palette.text },
                            grid: { color: palette.grid }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    }

    // ----------------------------------
    // 7. EVENT FILTER & PROVIDER LABELS
    // ----------------------------------
    function getCurrentFeedback() {
        if (!eventSelect || !eventSelect.value) {
            return submittedFeedback;
        }

        const selectedEvent = eventSelect.value;
        if (selectedEvent.toLowerCase() === "all") {
            return submittedFeedback;
        }

        return submittedFeedback.filter(function (item) {
            return item.event === selectedEvent;
        });
    }

    function getSubmissionEventName() {
        if (!eventSelect || !eventSelect.value || eventSelect.value.toLowerCase() === "all") {
            return "General";
        }
        return eventSelect.value;
    }

    function formatProviderLabel(provider) {
        if (provider === "gemini") return { text: "AI: Gemini", className: "provider-ai" };
        if (provider === "openai") return { text: "AI: OpenAI", className: "provider-ai" };
        if (provider === "local-fallback") return { text: "Server Fallback", className: "provider-local" };
        if (provider === "offline-fallback") return { text: "Offline Local", className: "provider-local" };
        if (provider === "csv-local") return { text: "CSV Keyword", className: "provider-local" };
        return null;
    }

    // ----------------------------------
    // 8. CHART UPDATES
    // ----------------------------------
    function updateSentimentChart(feedbackData) {
        if (!sentimentChart) return;
        const positive = feedbackData.filter(item => item.sentiment === "Positive").length;
        const negative = feedbackData.filter(item => item.sentiment === "Negative").length;
        const neutral = feedbackData.filter(item => item.sentiment === "Neutral").length;
        sentimentChart.data.datasets[0].data = [positive, negative, neutral];
        sentimentChart.update();
    }

    function updateCategoryChart(feedbackData) {
        if (!categoryChart) return;
        const categories = {};

        feedbackData.forEach(function (item) {
            const category = item.category || "Other";
            const rating = Number(item.rating);
            if (!categories[category]) {
                categories[category] = { total: 0, count: 0 };
            }
            if (rating >= 1 && rating <= 5) {
                categories[category].total += rating;
                categories[category].count++;
            }
        });

        const labels = Object.keys(categories);
        const averages = labels.map(function (category) {
            const data = categories[category];
            return data.count ? Number((data.total / data.count).toFixed(1)) : 0;
        });

        categoryChart.data.labels = labels;
        categoryChart.data.datasets[0].data = averages;
        categoryChart.update();
    }

    function updateTrendChart(feedbackData) {
        if (!trendChart) return;
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - i);
            days.push(date);
        }

        const labels = days.map(function (date) {
            return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        });

        const counts = days.map(function (day) {
            const dayKey = day.toDateString();
            return feedbackData.filter(function (item) {
                const itemDate = new Date(item.date);
                return !isNaN(itemDate.getTime()) && itemDate.toDateString() === dayKey;
            }).length;
        });

        trendChart.data.labels = labels;
        trendChart.data.datasets[0].data = counts;
        trendChart.update();
    }

    function updateRatingChart(feedbackData) {
        if (!ratingChart) return;
        const ratingCounts = [0, 0, 0, 0, 0];
        feedbackData.forEach(function (item) {
            const rating = Number(item.rating);
            if (rating >= 1 && rating <= 5) {
                ratingCounts[rating - 1]++;
            }
        });
        ratingChart.data.datasets[0].data = ratingCounts;
        ratingChart.update();
    }

    // ----------------------------------
    // 9. FILTERING, DELETE & RECENT FEEDBACK
    // ----------------------------------
    function getFilteredFeed(feedbackData) {
        const query = feedbackSearch ? feedbackSearch.value.trim().toLowerCase() : "";
        const sentimentVal = sentimentFilter ? sentimentFilter.value : "all";
        const categoryVal = categoryFilter ? categoryFilter.value : "all";

        return feedbackData.filter(function (item) {
            if (sentimentVal !== "all" && (item.sentiment || "Neutral") !== sentimentVal) {
                return false;
            }
            if (categoryVal !== "all" && (item.category || "Other") !== categoryVal) {
                return false;
            }
            if (query) {
                const haystack = [
                    item.name,
                    item.feedback,
                    item.aiSummary,
                    item.category,
                    item.event
                ].join(" ").toLowerCase();
                if (!haystack.includes(query)) return false;
            }
            return true;
        });
    }

    function resetFeedFilters() {
        if (feedbackSearch) feedbackSearch.value = "";
        if (sentimentFilter) sentimentFilter.value = "all";
        if (categoryFilter) categoryFilter.value = "all";
        displayFeedback(getCurrentFeedback());
    }

    function deleteFeedbackById(id) {
        submittedFeedback = submittedFeedback.filter(item => item.id !== id);
        saveFeedback();
        updateDashboard();
    }

    function displayFeedback(feedbackData) {
        if (!feedbackList) return;
        feedbackList.innerHTML = "";

        if (feedbackData.length === 0) {
            if (recentCountLabel) recentCountLabel.textContent = "Showing 0 of 0";
            if (toggleShowAllBtn) toggleShowAllBtn.classList.add("hidden");

            const emptyBox = document.createElement("div");
            emptyBox.className = "empty-state-box";

            const emptyMessage = document.createElement("p");
            emptyMessage.className = "empty-message";
            emptyMessage.textContent = "No feedback submitted for this view yet. Submit a review above or load the sample dataset.";

            const quickDemoBtn = document.createElement("button");
            quickDemoBtn.type = "button";
            quickDemoBtn.className = "btn-secondary";
            quickDemoBtn.textContent = "Load Sample Reviews";
            quickDemoBtn.addEventListener("click", loadDemoData);

            emptyBox.appendChild(emptyMessage);
            emptyBox.appendChild(quickDemoBtn);
            feedbackList.appendChild(emptyBox);
            return;
        }

        const filtered = getFilteredFeed(feedbackData);

        if (filtered.length === 0) {
            if (recentCountLabel) {
                recentCountLabel.textContent = "Showing 0 of " + feedbackData.length;
            }
            if (toggleShowAllBtn) toggleShowAllBtn.classList.add("hidden");

            const emptyBox = document.createElement("div");
            emptyBox.className = "empty-state-box";

            const emptyMessage = document.createElement("p");
            emptyMessage.className = "empty-message";
            emptyMessage.textContent = "No reviews match your search or filter criteria.";

            const resetBtn = document.createElement("button");
            resetBtn.type = "button";
            resetBtn.className = "btn-secondary";
            resetBtn.textContent = "Reset Filters";
            resetBtn.addEventListener("click", resetFeedFilters);

            emptyBox.appendChild(emptyMessage);
            emptyBox.appendChild(resetBtn);
            feedbackList.appendChild(emptyBox);
            return;
        }

        const reversed = [...filtered].reverse();
        const visibleItems = showAllFeedback ? reversed : reversed.slice(0, 5);

        if (recentCountLabel) {
            recentCountLabel.textContent = "Showing " + visibleItems.length + " of " + filtered.length;
        }
        if (toggleShowAllBtn) {
            const hasOverflow = filtered.length > 5;
            toggleShowAllBtn.classList.toggle("hidden", !hasOverflow);
            toggleShowAllBtn.textContent = showAllFeedback
                ? "Show Latest 5"
                : "Show All (" + filtered.length + ")";
        }

        visibleItems.forEach(function (item) {
            const card = document.createElement("article");
            card.className = "feedback-item";

            const header = document.createElement("div");
            header.className = "feedback-header";

            const heading = document.createElement("h4");
            heading.textContent = item.name || "Anonymous";

            const badges = document.createElement("div");
            badges.className = "feedback-badges";

            const sentimentValue = item.sentiment || "Neutral";
            const sentimentBadge = document.createElement("span");
            sentimentBadge.textContent = sentimentValue;
            sentimentBadge.className = "sentiment " + sentimentValue.toLowerCase();
            badges.appendChild(sentimentBadge);

            const providerMeta = formatProviderLabel(item.provider);
            if (providerMeta) {
                const providerBadge = document.createElement("span");
                providerBadge.textContent = providerMeta.text;
                providerBadge.className = "provider-badge " + providerMeta.className;
                badges.appendChild(providerBadge);
            }

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "delete-item-btn";
            deleteBtn.title = "Delete review";
            deleteBtn.setAttribute("aria-label", "Delete feedback from " + (item.name || "Anonymous"));
            deleteBtn.textContent = "×";
            deleteBtn.addEventListener("click", function () {
                deleteFeedbackById(item.id);
            });
            badges.appendChild(deleteBtn);

            header.appendChild(heading);
            header.appendChild(badges);

            const meta = document.createElement("div");
            meta.className = "feedback-meta";
            const ratingNum = Math.min(5, Math.max(0, Number(item.rating) || 0));
            const stars = "★".repeat(ratingNum) + "☆".repeat(5 - ratingNum);
            const feedbackDate = new Date(item.date);
            const dateStr = isNaN(feedbackDate.getTime())
                ? ""
                : feedbackDate.toLocaleDateString("en-IN");

            const metaParts = [
                item.category || "Other",
                stars + " (" + ratingNum + "/5)",
                item.event || "General"
            ];
            if (dateStr) metaParts.push(dateStr);
            meta.textContent = metaParts.join("  •  ");

            const message = document.createElement("p");
            message.className = "feedback-text";
            message.textContent = item.feedback || "";

            card.appendChild(header);
            card.appendChild(meta);
            card.appendChild(message);

            if (item.aiSummary) {
                const summaryBox = document.createElement("div");
                summaryBox.className = "ai-summary-box";
                const summaryLabel = document.createElement("strong");
                summaryLabel.textContent = "AI Summary: ";
                summaryBox.appendChild(summaryLabel);
                summaryBox.appendChild(document.createTextNode(item.aiSummary));
                card.appendChild(summaryBox);
            }

            if (Array.isArray(item.aiSuggestions) && item.aiSuggestions.length > 0) {
                const suggestionsList = document.createElement("ul");
                suggestionsList.className = "ai-suggestions-list";
                item.aiSuggestions.slice(0, 2).forEach(function (tip) {
                    const li = document.createElement("li");
                    li.textContent = tip;
                    suggestionsList.appendChild(li);
                });
                card.appendChild(suggestionsList);
            }

            feedbackList.appendChild(card);
        });
    }

    // ----------------------------------
    // 10. UPDATE INSIGHTS & EVALUATION
    // ----------------------------------
    function updateInsights(feedbackData) {
        if (lovedInsights) lovedInsights.innerHTML = "";
        if (complaintInsights) complaintInsights.innerHTML = "";
        if (suggestionInsights) suggestionInsights.innerHTML = "";

        const positiveItems = feedbackData.filter(item => item.sentiment === "Positive");
        const negativeItems = feedbackData.filter(
            item => item.sentiment === "Negative" || Number(item.rating) <= 2
        );

        const aiSuggestionItems = [];
        const seenSuggestions = new Set();

        [...feedbackData].reverse().forEach(function (item) {
            if (!Array.isArray(item.aiSuggestions)) return;
            item.aiSuggestions.forEach(function (tip) {
                const cleanTip = String(tip || "").trim();
                if (cleanTip && !seenSuggestions.has(cleanTip.toLowerCase())) {
                    seenSuggestions.add(cleanTip.toLowerCase());
                    aiSuggestionItems.push(cleanTip);
                }
            });
        });

        const keywordSuggestions = feedbackData.filter(function (item) {
            if (Array.isArray(item.aiSuggestions) && item.aiSuggestions.length > 0) return false;
            const text = String(item.feedback || "").toLowerCase();
            return (
                text.includes("suggest") ||
                text.includes("should") ||
                text.includes("improve") ||
                text.includes("need") ||
                text.includes("चाहिए") ||
                text.includes("सुधार")
            );
        });

        function addInsight(container, message) {
            if (!container) return;
            const paragraph = document.createElement("p");
            paragraph.textContent = message;
            container.appendChild(paragraph);
        }

        if (positiveItems.length) {
            positiveItems.slice(-3).reverse().forEach(function (item) {
                const excerpt = item.aiSummary || item.feedback;
                addInsight(lovedInsights, (item.category || "General") + ": " + excerpt);
            });
        } else {
            addInsight(lovedInsights, "No positive feedback available yet.");
        }

        if (negativeItems.length) {
            negativeItems.slice(-3).reverse().forEach(function (item) {
                const excerpt = item.aiSummary || item.feedback;
                addInsight(complaintInsights, (item.category || "General") + ": " + excerpt);
            });
        } else {
            addInsight(complaintInsights, "No major complaints found yet.");
        }

        const combinedSuggestions = aiSuggestionItems.slice(0, 4);
        if (combinedSuggestions.length < 4 && keywordSuggestions.length) {
            keywordSuggestions
                .slice(-(4 - combinedSuggestions.length))
                .reverse()
                .forEach(function (item) {
                    combinedSuggestions.push((item.category || "General") + ": " + item.feedback);
                });
        }

        if (combinedSuggestions.length) {
            combinedSuggestions.forEach(function (tip) {
                addInsight(suggestionInsights, "• " + tip);
            });
        } else {
            addInsight(suggestionInsights, "Submit feedback to generate actionable suggestions.");
        }

        if (insightsNote) {
            const cloudCount = feedbackData.filter(
                item => item.provider === "gemini" || item.provider === "openai"
            ).length;
            if (feedbackData.length === 0) {
                insightsNote.textContent =
                    "Insights combine AI-generated summaries & suggestions with local keyword analysis for bulk CSV imports.";
            } else if (cloudCount > 0) {
                insightsNote.textContent =
                    cloudCount + " of " + feedbackData.length + " review(s) analyzed via Cloud AI; remaining rows use local keyword analysis.";
            } else {
                insightsNote.textContent =
                    "Current entries were analyzed using the local keyword engine.";
            }
        }
    }

    function updateEvaluation(feedbackData, averageRating) {
        const score = feedbackData.length ? Math.round((averageRating / 5) * 100) : 0;

        if (overallScore) {
            overallScore.textContent = String(score);
        }

        let status = "WAITING FOR FEEDBACK";
        let statusClass = "status-waiting";
        let description = "Submit student feedback to generate the event evaluation.";

        if (feedbackData.length > 0) {
            if (score >= 80) {
                status = "EXCELLENT";
                statusClass = "status-excellent";
                description = "The event received strong ratings. Keep up the good work!";
            } else if (score >= 60) {
                status = "GOOD";
                statusClass = "status-good";
                description = "The event performed well, with some areas to improve.";
            } else if (score >= 40) {
                status = "NEEDS IMPROVEMENT";
                statusClass = "status-fair";
                description = "Review student complaints and work on targeted improvements.";
            } else {
                status = "POOR";
                statusClass = "status-poor";
                description = "The event needs significant improvement based on student ratings.";
            }
        }

        if (analysisStatus) {
            analysisStatus.textContent = feedbackData.length
                ? "● Analysis Complete"
                : "● Waiting for feedback";
            analysisStatus.className = "analysis-pill " +
                (feedbackData.length ? "status-complete" : "status-waiting");
        }

        if (eventStatus) {
            eventStatus.textContent = status;
            eventStatus.className = "status " + statusClass;
        }

        if (statusDescription) {
            statusDescription.textContent = description;
        }

        // Update circular SVG score gauge
        const gaugeCircumference = 2 * Math.PI * 42;
        if (evalGaugeArc) {
            const offset = gaugeCircumference * (1 - Math.min(100, Math.max(0, score)) / 100);
            evalGaugeArc.style.strokeDasharray = gaugeCircumference.toFixed(2);
            evalGaugeArc.style.strokeDashoffset = offset.toFixed(2);
            evalGaugeArc.setAttribute("class", "eval-gauge-arc " + statusClass);
        }
        if (evalGaugeValue) {
            evalGaugeValue.textContent = String(score);
        }

        // Update stacked sentiment split diagram
        const total = feedbackData.length;
        const posCount = feedbackData.filter(item => item.sentiment === "Positive").length;
        const negCount = feedbackData.filter(item => item.sentiment === "Negative").length;
        const neuCount = Math.max(0, total - posCount - negCount);

        const posPct = total ? Math.round((posCount / total) * 100) : 0;
        const negPct = total ? Math.round((negCount / total) * 100) : 0;
        const neuPct = total ? Math.max(0, 100 - posPct - negPct) : 0;

        if (evalBarPos) evalBarPos.style.width = posPct + "%";
        if (evalBarNeu) evalBarNeu.style.width = neuPct + "%";
        if (evalBarNeg) evalBarNeg.style.width = negPct + "%";
        if (evalSentimentLabel) {
            evalSentimentLabel.textContent = posPct + "% Pos · " + neuPct + "% Neu · " + negPct + "% Neg";
        }

        // Update category health bars diagram
        if (evalCategoryBars) {
            evalCategoryBars.innerHTML = "";

            if (total === 0) {
                const hint = document.createElement("p");
                hint.className = "eval-empty-hint";
                hint.textContent = "Category bars appear once feedback is submitted.";
                evalCategoryBars.appendChild(hint);
                return;
            }

            const categoryStats = {};
            feedbackData.forEach(function (item) {
                const cat = item.category || "Other";
                const r = Number(item.rating);
                if (!categoryStats[cat]) {
                    categoryStats[cat] = { total: 0, count: 0 };
                }
                if (r >= 1 && r <= 5) {
                    categoryStats[cat].total += r;
                    categoryStats[cat].count += 1;
                }
            });

            const sortedCategories = Object.keys(categoryStats)
                .map(function (cat) {
                    const entry = categoryStats[cat];
                    const avg = entry.count ? entry.total / entry.count : 0;
                    return { name: cat, avg: avg };
                })
                .sort((a, b) => b.avg - a.avg);

            sortedCategories.forEach(function (cat) {
                const row = document.createElement("div");
                row.className = "eval-cat-row";

                const nameEl = document.createElement("span");
                nameEl.className = "eval-cat-name";
                nameEl.textContent = cat.name;
                nameEl.title = cat.name;

                const track = document.createElement("div");
                track.className = "eval-cat-track";

                const fill = document.createElement("div");
                const tierClass = cat.avg >= 4 ? "bar-high" : cat.avg >= 3 ? "bar-mid" : "bar-low";
                fill.className = "eval-cat-fill " + tierClass;
                fill.style.width = Math.min(100, Math.max(0, (cat.avg / 5) * 100)).toFixed(0) + "%";
                track.appendChild(fill);

                const valEl = document.createElement("span");
                valEl.className = "eval-cat-val";
                valEl.textContent = cat.avg.toFixed(1);

                row.appendChild(nameEl);
                row.appendChild(track);
                row.appendChild(valEl);
                evalCategoryBars.appendChild(row);
            });
        }
    }

    function updateDashboard() {
        const feedbackData = getCurrentFeedback();
        const total = feedbackData.length;

        const positive = feedbackData.filter(item => item.sentiment === "Positive").length;
        const negative = feedbackData.filter(item => item.sentiment === "Negative").length;

        const ratings = feedbackData
            .map(item => Number(item.rating))
            .filter(rating => rating >= 1 && rating <= 5);

        const averageRating = ratings.length
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0;

        const positivePercentage = total ? Math.round((positive / total) * 100) : 0;
        const negativePercentage = total ? Math.round((negative / total) * 100) : 0;

        if (totalReviewsEl) totalReviewsEl.textContent = String(total);
        if (averageRatingEl) averageRatingEl.textContent = averageRating.toFixed(1) + " / 5";
        if (positivePercentEl) positivePercentEl.textContent = positivePercentage + "%";
        if (positiveCountEl) {
            positiveCountEl.textContent = positive + (positive === 1 ? " review" : " reviews");
        }
        if (negativePercentEl) negativePercentEl.textContent = negativePercentage + "%";
        if (negativeCountEl) {
            negativeCountEl.textContent = negative + (negative === 1 ? " review" : " reviews");
        }

        updateSentimentChart(feedbackData);
        updateCategoryChart(feedbackData);
        updateTrendChart(feedbackData);
        updateRatingChart(feedbackData);
        displayFeedback(feedbackData);
        updateInsights(feedbackData);
        updateEvaluation(feedbackData, averageRating);
    }

    // ----------------------------------
    // 11. STUDENT FEEDBACK FORM SUBMIT
    // ----------------------------------
    if (feedbackForm) {
        feedbackForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const name = studentName ? studentName.value.trim() : "";
            const category = feedbackCategory ? feedbackCategory.value : "";
            const rating = studentRating ? Number(studentRating.value) : 0;
            const feedback = studentFeedback ? studentFeedback.value.trim() : "";

            if (!name || !category || !feedback || rating < 1 || rating > 5) {
                setStatusMessage(
                    feedbackMessage,
                    "Please fill all fields and pick a 1–5 star rating.",
                    "error"
                );
                return;
            }

            setStatusMessage(feedbackMessage, "AI is analyzing your feedback...", "loading");
            if (submitFeedbackBtn) {
                submitFeedbackBtn.disabled = true;
                submitFeedbackBtn.textContent = "Analyzing...";
            }

            try {
                let aiResult;
                let provider = "local-fallback";
                let warning = "";

                try {
                    const headers = { "Content-Type": "application/json" };
                    try {
                        const token = localStorage.getItem("eventhub_token");
                        if (token) headers.Authorization = "Bearer " + token;
                    } catch {
                        // Ignore storage read errors
                    }

                    const response = await fetch(API_BASE + "/api/analyze", {
                        method: "POST",
                        headers: headers,
                        body: JSON.stringify({
                            name: name,
                            category: category,
                            rating: rating,
                            feedback: feedback,
                            event: getSubmissionEventName()
                        })
                    });

                    const result = await response.json();

                    if (!response.ok || !result.success) {
                        throw new Error(result.message || "AI analysis failed.");
                    }

                    aiResult = result.analysis;
                    provider = result.provider || "local-fallback";
                    warning = result.warning || "";
                } catch (networkOrApiError) {
                    if (networkOrApiError instanceof TypeError) {
                        aiResult = buildLocalAnalysis(feedback);
                        provider = "offline-fallback";
                        warning = "Backend unreachable; saved using offline local analysis.";
                    } else {
                        throw networkOrApiError;
                    }
                }

                const newFeedback = {
                    id: createFeedbackId(),
                    name: name,
                    category: category,
                    rating: rating,
                    feedback: feedback,
                    sentiment: aiResult.sentiment,
                    aiSummary: aiResult.summary,
                    aiSuggestions: aiResult.suggestions,
                    provider: provider,
                    event: getSubmissionEventName(),
                    date: new Date().toISOString()
                };

                submittedFeedback.push(newFeedback);
                saveFeedback();
                updateDashboard();
                feedbackForm.reset();
                setRatingValue(0);

                if (warning) {
                    setStatusMessage(
                        feedbackMessage,
                        aiResult.sentiment + " — " + warning,
                        "warning"
                    );
                } else {
                    setStatusMessage(
                        feedbackMessage,
                        "AI Analysis (" + provider + "): " + aiResult.sentiment + " | " + aiResult.summary,
                        "success"
                    );
                }
            } catch (error) {
                console.error("AI connection error:", error);
                setStatusMessage(
                    feedbackMessage,
                    "AI analysis failed: " + error.message,
                    "error"
                );
            } finally {
                if (submitFeedbackBtn) {
                    submitFeedbackBtn.disabled = false;
                    submitFeedbackBtn.textContent = "Analyze & Submit Feedback";
                }
            }
        });
    }

    // ----------------------------------
    // 12. DRAG & DROP CSV + SAMPLE DOWNLOAD
    // ----------------------------------
    function updateDropzoneSelection(file) {
        if (!csvDropzone || !csvFileName) return;
        if (file) {
            csvDropzone.classList.add("has-file");
            csvFileName.textContent = "Selected: " + file.name + " (" + Math.max(1, Math.round(file.size / 1024)) + " KB)";
        } else {
            csvDropzone.classList.remove("has-file");
            csvFileName.textContent = "or click to browse from your device";
        }
    }

    if (csvDropzone && csvFile) {
        csvDropzone.addEventListener("click", function () {
            csvFile.click();
        });

        csvDropzone.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                csvFile.click();
            }
        });

        csvDropzone.addEventListener("dragover", function (event) {
            event.preventDefault();
            csvDropzone.classList.add("is-dragover");
        });

        csvDropzone.addEventListener("dragleave", function () {
            csvDropzone.classList.remove("is-dragover");
        });

        csvDropzone.addEventListener("drop", function (event) {
            event.preventDefault();
            csvDropzone.classList.remove("is-dragover");
            const droppedFiles = event.dataTransfer?.files;
            if (droppedFiles && droppedFiles.length > 0) {
                const dt = new DataTransfer();
                dt.items.add(droppedFiles[0]);
                csvFile.files = dt.files;
                updateDropzoneSelection(droppedFiles[0]);
            }
        });

        csvFile.addEventListener("change", function () {
            updateDropzoneSelection(csvFile.files && csvFile.files[0]);
        });
    }

    if (downloadSampleCsvBtn) {
        downloadSampleCsvBtn.addEventListener("click", function () {
            const sampleCsv = [
                "name,category,rating,feedback",
                "Neha Kapoor,Speakers,5,\"Keynote session was super insightful and well structured.\"",
                "Vikram Rao,Venue,3,\"Sound system was clear but seating near the exit felt cramped.\"",
                "Ishita Sen,Registration,2,\"Badge printing was slow and should be improved next time.\""
            ].join("\n");

            const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "sample_student_feedback.csv";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }

    if (uploadCSV) {
        uploadCSV.addEventListener("click", function () {
            if (!csvFile || !csvFile.files || !csvFile.files[0]) {
                setStatusMessage(csvMessage, "Please select or drop a CSV file first.", "error");
                return;
            }

            if (typeof Papa === "undefined") {
                setStatusMessage(
                    csvMessage,
                    "CSV library is not loaded. Check the PapaParse CDN.",
                    "error"
                );
                return;
            }

            const file = csvFile.files[0];

            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,

                complete: function (results) {
                    const rows = results.data || [];
                    let importedCount = 0;
                    let invalidCount = 0;
                    const importedEvent = getSubmissionEventName();

                    rows.forEach(function (row) {
                        const normalizedRow = {};
                        Object.keys(row).forEach(function (key) {
                            normalizedRow[
                                key.trim().toLowerCase().replace(/[\s_-]/g, "")
                            ] = row[key];
                        });

                        const name = String(normalizedRow.name || "").trim();
                        const category = String(normalizedRow.category || "").trim();
                        const feedback = String(normalizedRow.feedback || "").trim();
                        const rating = Number(normalizedRow.rating || normalizedRow.stars);

                        if (
                            !name ||
                            !category ||
                            !feedback ||
                            !Number.isInteger(rating) ||
                            rating < 1 ||
                            rating > 5
                        ) {
                            invalidCount++;
                            return;
                        }

                        submittedFeedback.push({
                            id: createFeedbackId(),
                            name: name,
                            category: category,
                            rating: rating,
                            feedback: feedback,
                            sentiment: analyzeSentiment(feedback),
                            provider: "csv-local",
                            event: importedEvent,
                            date: new Date().toISOString()
                        });

                        importedCount++;
                    });

                    if (importedCount > 0) {
                        saveFeedback();
                        updateDashboard();
                    }

                    setStatusMessage(
                        csvMessage,
                        importedCount + " feedback record(s) imported. " +
                        invalidCount + " invalid row(s) skipped.",
                        importedCount > 0 ? "success" : "error"
                    );

                    csvFile.value = "";
                    updateDropzoneSelection(null);
                },

                error: function (error) {
                    console.error("CSV parsing error:", error);
                    setStatusMessage(csvMessage, "Could not read this CSV file.", "error");
                }
            });
        });
    }

    // ----------------------------------
    // 13. REPORT EXPORTS & GLOBAL CONTROLS
    // ----------------------------------
    function triggerDownload(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function escapeCsvCell(value) {
        const str = String(value == null ? "" : value);
        return "\"" + str.replace(/"/g, "\"\"") + "\"";
    }

    function exportCsvReport() {
        const rows = getFilteredFeed(getCurrentFeedback());
        if (rows.length === 0) {
            setStatusMessage(feedbackMessage, "No matching reviews available to export.", "warning");
            return;
        }

        const headers = ["name", "event", "category", "rating", "sentiment", "provider", "feedback", "aiSummary", "date"];
        const lines = [headers.join(",")];

        rows.forEach(function (item) {
            lines.push([
                escapeCsvCell(item.name),
                escapeCsvCell(item.event || "General"),
                escapeCsvCell(item.category),
                escapeCsvCell(item.rating),
                escapeCsvCell(item.sentiment),
                escapeCsvCell(item.provider || ""),
                escapeCsvCell(item.feedback),
                escapeCsvCell(item.aiSummary || ""),
                escapeCsvCell(item.date || "")
            ].join(","));
        });

        triggerDownload("feedback_report.csv", lines.join("\n"), "text/csv;charset=utf-8;");
    }

    function exportJsonReport() {
        const rows = getFilteredFeed(getCurrentFeedback());
        if (rows.length === 0) {
            setStatusMessage(feedbackMessage, "No matching reviews available to export.", "warning");
            return;
        }

        const ratings = rows.map(r => Number(r.rating)).filter(r => r >= 1 && r <= 5);
        const avg = ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : 0;

        const report = {
            exportedAt: new Date().toISOString(),
            eventFilter: eventSelect ? eventSelect.value : "all",
            totalReviews: rows.length,
            averageRating: avg,
            overallScore: ratings.length ? Math.round((avg / 5) * 100) : 0,
            reviews: rows
        };

        triggerDownload("feedback_report.json", JSON.stringify(report, null, 2), "application/json;charset=utf-8;");
    }

    if (feedbackSearch) {
        feedbackSearch.addEventListener("input", function () {
            displayFeedback(getCurrentFeedback());
        });
    }

    if (sentimentFilter) {
        sentimentFilter.addEventListener("change", function () {
            displayFeedback(getCurrentFeedback());
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", function () {
            displayFeedback(getCurrentFeedback());
        });
    }

    if (toggleShowAllBtn) {
        toggleShowAllBtn.addEventListener("click", function () {
            showAllFeedback = !showAllFeedback;
            displayFeedback(getCurrentFeedback());
        });
    }

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener("click", exportCsvReport);
    }

    if (exportJsonBtn) {
        exportJsonBtn.addEventListener("click", exportJsonReport);
    }

    if (eventSelect) {
        eventSelect.addEventListener("change", updateDashboard);
    }

    if (loadDemoBtn) {
        loadDemoBtn.addEventListener("click", loadDemoData);
    }

    if (clearDataBtn) {
        clearDataBtn.addEventListener("click", clearAllData);
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const current = document.documentElement.getAttribute("data-theme") === "dark"
                ? "dark"
                : "light";
            applyTheme(current === "dark" ? "light" : "dark");
        });
    }

    applyTheme(getPreferredTheme());
    checkApiHealth();
    updateDashboard();
});
