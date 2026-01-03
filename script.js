// ===========================================
// YOUTUBE API CONFIGURATION
// ===========================================
const YOUTUBE_CONFIG = {
    API_KEY: 'AIzaSyBbg_EAeR_76f27zzvvu-jMS6mKhZLYh30',
    CHANNEL_ID: 'UCMq4uUwcWnYgfe3z5w3Kt7A',
    CACHE_DURATION: 300000, // Cache data for 5 minutes (300000ms)
    USE_LIVE_API: true // Set to false to use manual data instead
};

// Manual fallback data (used if API fails or USE_LIVE_API is false)
const FALLBACK_DATA = {
    subscribers: 50000,
    totalViews: 2500000,
    videoCount: 150,
    studentsImpacted: 100000,
    latestUpload: '2 days ago',
    subscriberDisplay: '50K+',
    totalVideos: '150+'
};

// ===========================================
// MOBILE MENU TOGGLE
// ===========================================
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('active');
        mobileMenuOverlay.classList.toggle('active');
        document.body.style.overflow = mobileMenuOverlay.classList.contains('active') ? 'hidden' : '';
    });

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('active');
            mobileMenuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    mobileMenuOverlay.addEventListener('click', (e) => {
        if (e.target === mobileMenuOverlay) {
            mobileMenuToggle.classList.remove('active');
            mobileMenuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ===========================================
// SMOOTH SCROLLING
// ===========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ===========================================
// YOUTUBE DATA CACHE
// ===========================================
let youtubeDataCache = {
    data: null,
    timestamp: null
};

function isCacheValid() {
    if (!youtubeDataCache.data || !youtubeDataCache.timestamp) {
        return false;
    }
    const now = Date.now();
    return (now - youtubeDataCache.timestamp) < YOUTUBE_CONFIG.CACHE_DURATION;
}

// ===========================================
// FETCH YOUTUBE DATA FROM API
// ===========================================
async function fetchYouTubeData() {
    // Check if we should use cached data
    if (isCacheValid()) {
        console.log('✅ Using cached YouTube data');
        return youtubeDataCache.data;
    }

    // Check if API is enabled
    if (!YOUTUBE_CONFIG.USE_LIVE_API) {
        console.log('ℹ️ Live API disabled, using fallback data');
        return FALLBACK_DATA;
    }

    try {
        console.log('🔄 Fetching fresh YouTube data from API...');
        
        const { API_KEY, CHANNEL_ID } = YOUTUBE_CONFIG;

        // Fetch channel statistics
        const channelResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${API_KEY}`
        );

        if (!channelResponse.ok) {
            throw new Error(`API Error: ${channelResponse.status}`);
        }

        const channelData = await channelResponse.json();

        if (!channelData.items || channelData.items.length === 0) {
            throw new Error('No channel data found');
        }

        const stats = channelData.items[0].statistics;
        
        // Fetch latest video
        const videosResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=date&maxResults=1&type=video&key=${API_KEY}`
        );

        const videosData = await videosResponse.json();
        
        let latestUploadText = 'Recently';
        if (videosData.items && videosData.items.length > 0) {
            const uploadDate = new Date(videosData.items[0].snippet.publishedAt);
            const now = new Date();
            const daysAgo = Math.floor((now - uploadDate) / (1000 * 60 * 60 * 24));
            
            if (daysAgo === 0) latestUploadText = 'Today';
            else if (daysAgo === 1) latestUploadText = 'Yesterday';
            else if (daysAgo < 7) latestUploadText = `${daysAgo} days ago`;
            else if (daysAgo < 30) latestUploadText = `${Math.floor(daysAgo / 7)} weeks ago`;
            else latestUploadText = `${Math.floor(daysAgo / 30)} months ago`;
        }

        // Format subscriber count for display
        const subCount = parseInt(stats.subscriberCount);
        let subscriberDisplay;
        if (subCount >= 1000000) {
            subscriberDisplay = `${(subCount / 1000000).toFixed(1)}M`;
        } else if (subCount >= 1000) {
            subscriberDisplay = `${(subCount / 1000).toFixed(1)}K`;
        } else {
            subscriberDisplay = subCount.toLocaleString();
        }

        const videoCountNum = parseInt(stats.videoCount);
        const totalVideosDisplay = videoCountNum >= 100 ? `${videoCountNum}+` : videoCountNum.toString();

        const youtubeData = {
            subscribers: subCount,
            totalViews: parseInt(stats.viewCount),
            videoCount: videoCountNum,
            studentsImpacted: Math.floor(subCount * 2), // Estimate: 2x subscribers
            latestUpload: latestUploadText,
            subscriberDisplay: subscriberDisplay,
            totalVideos: totalVideosDisplay
        };

        // Cache the data
        youtubeDataCache = {
            data: youtubeData,
            timestamp: Date.now()
        };

        console.log('✅ YouTube data fetched successfully:', youtubeData);
        return youtubeData;

    } catch (error) {
        console.error('❌ Error fetching YouTube data:', error);
        console.log('⚠️ Falling back to manual data');
        return FALLBACK_DATA;
    }
}

// ===========================================
// ANIMATED COUNTERS FOR STATS
// ===========================================
const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
};

// ===========================================
// UPDATE STATS SECTION WITH YOUTUBE DATA
// ===========================================
async function updateStatsSection() {
    const data = await fetchYouTubeData();
    
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
                
                const statLabel = entry.target.closest('.stat-card')?.querySelector('.stat-label')?.textContent;
                let target = parseInt(entry.target.dataset.target);
                
                // Use YouTube API data
                if (statLabel && statLabel.includes('Subscribers')) {
                    target = data.subscribers;
                } else if (statLabel && statLabel.includes('Views')) {
                    target = data.totalViews;
                } else if (statLabel && statLabel.includes('Tutorials')) {
                    target = data.videoCount;
                } else if (statLabel && statLabel.includes('Students')) {
                    target = data.studentsImpacted;
                }
                
                animateCounter(entry.target, target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number').forEach(stat => {
        statsObserver.observe(stat);
    });
}

// ===========================================
// UPDATE YOUTUBE WIDGET
// ===========================================
async function updateYouTubeWidget() {
    const latestVideo = document.getElementById('latest-video');
    const subscriberCount = document.getElementById('subscriber-count');
    const videoCount = document.getElementById('video-count');
    
    // Show loading state
    if (latestVideo) latestVideo.textContent = 'Loading...';
    if (subscriberCount) subscriberCount.textContent = 'Loading...';
    if (videoCount) videoCount.textContent = 'Loading...';
    
    const data = await fetchYouTubeData();
    
    // Update with fetched data
    setTimeout(() => {
        if (latestVideo) latestVideo.textContent = data.latestUpload;
        if (subscriberCount) subscriberCount.textContent = data.subscriberDisplay;
        if (videoCount) videoCount.textContent = data.totalVideos;
        
        console.log('✅ YouTube Widget updated');
    }, 500);
}

// Initialize YouTube data fetching
updateStatsSection();
updateYouTubeWidget();

// Refresh data every cache duration
setInterval(() => {
    console.log('🔄 Cache expired, refreshing YouTube data...');
    youtubeDataCache.timestamp = null; // Invalidate cache
    updateYouTubeWidget();
}, YOUTUBE_CONFIG.CACHE_DURATION);

// ===========================================
// VIDEO DISPLAY MANAGEMENT
// ===========================================
const videoGrid = document.querySelector('.video-grid');
const videoCards = document.querySelectorAll('.video-card');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const resultsCount = document.getElementById('resultsCount');
let allVideosShown = false;

function updateResultsCount() {
    if (!resultsCount) return;
    
    const visibleCards = Array.from(videoCards).filter(card => {
        return !card.classList.contains('hidden') && !card.classList.contains('initially-hidden');
    });
    
    const total = videoCards.length;
    const showing = visibleCards.length;
    
    resultsCount.textContent = `Showing ${showing} of ${total} tutorials`;
}

function initializeVideoDisplay() {
    const cardsArray = Array.from(videoCards);
    
    // Shuffle array (Fisher-Yates algorithm)
    for (let i = cardsArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardsArray[i], cardsArray[j]] = [cardsArray[j], cardsArray[i]];
    }
    
    cardsArray.forEach(card => {
        videoGrid.appendChild(card);
    });
    
    cardsArray.forEach((card, index) => {
        if (index >= 3) {
            card.classList.add('initially-hidden');
        }
    });
    
    updateResultsCount();
    console.log('Videos randomized. Showing 3 out of', cardsArray.length);
}

if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
        videoGrid.classList.add('show-all');
        document.querySelectorAll('.video-card.initially-hidden').forEach(card => {
            card.classList.remove('initially-hidden');
        });
        loadMoreBtn.classList.add('hidden');
        allVideosShown = true;
        updateResultsCount();
        console.log('All videos now visible');
    });
}

initializeVideoDisplay();

// ===========================================
// SEARCH FUNCTIONALITY
// ===========================================
const searchInput = document.getElementById('searchInput');

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm.length > 0) {
            videoGrid.classList.add('show-all');
            loadMoreBtn.classList.add('hidden');
            
            let matchCount = 0;
            
            videoCards.forEach(card => {
                const title = card.dataset.title || '';
                const category = card.dataset.category || '';
                const text = card.textContent.toLowerCase();
                
                card.classList.remove('initially-hidden');
                
                if (title.includes(searchTerm) || category.includes(searchTerm) || text.includes(searchTerm)) {
                    card.classList.remove('hidden');
                    matchCount++;
                } else {
                    card.classList.add('hidden');
                }
            });
            
            if (resultsCount) {
                resultsCount.textContent = `Found ${matchCount} of ${videoCards.length} tutorials`;
            }
        } else {
            if (!allVideosShown) {
                videoGrid.classList.remove('show-all');
                loadMoreBtn.classList.remove('hidden');
                
                videoCards.forEach((card, index) => {
                    card.classList.remove('hidden');
                    if (index >= 3) {
                        card.classList.add('initially-hidden');
                    } else {
                        card.classList.remove('initially-hidden');
                    }
                });
            } else {
                videoCards.forEach(card => {
                    card.classList.remove('hidden');
                });
            }
            
            updateResultsCount();
        }
    });
}

// ===========================================
// FILTER FUNCTIONALITY
// ===========================================
const filterButtons = document.querySelectorAll('.filter-btn');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const filter = button.dataset.filter;
        
        if (filter === 'all') {
            videoGrid.classList.remove('show-all');
            if (!allVideosShown) {
                loadMoreBtn.classList.remove('hidden');
                videoCards.forEach((card, index) => {
                    card.classList.remove('hidden');
                    if (index >= 3) {
                        card.classList.add('initially-hidden');
                    } else {
                        card.classList.remove('initially-hidden');
                    }
                });
            } else {
                loadMoreBtn.classList.add('hidden');
                videoCards.forEach(card => {
                    card.classList.remove('hidden', 'initially-hidden');
                });
            }
            updateResultsCount();
        } else {
            videoGrid.classList.add('show-all');
            loadMoreBtn.classList.add('hidden');
            
            let matchCount = 0;
            
            videoCards.forEach(card => {
                card.classList.remove('initially-hidden');
                
                const categories = card.dataset.category || '';
                if (categories.includes(filter)) {
                    card.classList.remove('hidden');
                    matchCount++;
                } else {
                    card.classList.add('hidden');
                }
            });
            
            if (resultsCount) {
                resultsCount.textContent = `Found ${matchCount} of ${videoCards.length} tutorials`;
            }
        }
        
        if (searchInput) {
            searchInput.value = '';
        }
    });
});

// ===========================================
// FADE-IN ANIMATION ON SCROLL
// ===========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.video-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `all 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

document.querySelectorAll('.skill-card, .community-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `all 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});
