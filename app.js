/**
 * NIKITKA AI PRO — Main Interactive Logic
 * Fully custom particle systems, Web Audio API processor, AI vocal chat simulator.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Particles Background Canvas
    initParticles();

    // 2. Navigation Scroll Effect
    initNavbar();
    initHeroCinematic();

    // 3. Model Switcher Showcase
    initModelSwitcher();
    initProductOrbit();
    initInsideVideo();

    // 4. Interactive Exploded 3D View
    initExplodedViewer();

    // 5. Web Audio API Console & Radio Simulator
    initAudioSimulator();

    // 6. Interactive Neural AI Voice Chatbot
    initAIChatbot();

    // 7. Interactive FAQ Accordion
    initFAQ();
    initNewsletterDemo();
});

/* ==========================================================================
   1. PARTICLES BACKGROUND CANVAS
   ========================================================================== */
function initParticles() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let particles = [];
    const particleCount = 65;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 0.4 - 0.2;
            this.speedY = Math.random() * 0.4 - 0.2;
            this.color = Math.random() > 0.5 ? 'rgba(138, 43, 226, 0.3)' : 'rgba(0, 240, 255, 0.25)';
            this.pulseSpeed = Math.random() * 0.02 + 0.005;
            this.alpha = Math.random() * 0.5 + 0.2;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Float boundary checks
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

            // Pulse size & glow
            this.alpha += this.pulseSpeed;
            if (this.alpha > 0.8 || this.alpha < 0.1) {
                this.pulseSpeed *= -1;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color.replace(/[^,]+(?=\))/, this.alpha);
            ctx.shadowBlur = this.size * 4;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow for efficiency
        }
    }

    // Initialize list of particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw subtle radial ambient glow following mouse movement
        drawAmbientGlow();

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Draw connections for close particles
        drawConnections();

        requestAnimationFrame(animate);
    }

    let mouse = { x: null, y: null };
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    function drawAmbientGlow() {
        if (mouse.x !== null) {
            const glow = ctx.createRadialGradient(
                mouse.x, mouse.y, 10,
                mouse.x, mouse.y, 450
            );
            glow.addColorStop(0, 'rgba(138, 43, 226, 0.04)');
            glow.addColorStop(0.5, 'rgba(0, 240, 255, 0.015)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(138, 43, 226, ${0.1 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    animate();
}

/* ==========================================================================
   2. NAVBAR SCROLL EFFECT
   ========================================================================== */
function initNavbar() {
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 1. Navigation Scrollspy
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let currentSection = '';
        const scrollPos = window.scrollY + 160; // offset for nav height

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        if (window.scrollY < 100) {
            navLinks.forEach(link => link.classList.remove('active'));
            const homeLink = document.querySelector('.nav-links a[href="#hero"]');
            if (homeLink) homeLink.classList.add('active');
            return;
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });

    // 2. Mobile Responsive Hamburger Navigation
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinksContainer = document.querySelector('.nav-links');
    const navLinksList = document.querySelectorAll('.nav-links a');

    if (menuToggle && navLinksContainer) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menuToggle.classList.toggle('active');
            navLinksContainer.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinksContainer.contains(e.target) && !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('active');
                navLinksContainer.classList.remove('active');
            }
        });

        // Close menu when clicking on any link
        navLinksList.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinksContainer.classList.remove('active');
            });
        });
    }
}

/* ==========================================================================
   3. CINEMATIC HERO CONTROLLER
   ========================================================================== */
function initHeroCinematic() {
    const hero = document.querySelector('.hero');
    const heroImage = hero ? hero.querySelector('.hero-cinema-img') : null;
    if (!hero || !heroImage) return;

    const reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setScrollFade() {
        const rect = hero.getBoundingClientRect();
        const progress = Math.min(Math.max(-rect.top / Math.max(rect.height * 0.72, 1), 0), 1);
        hero.style.setProperty('--hero-scroll-fade', progress.toFixed(3));
    }

    setScrollFade();
    window.addEventListener('scroll', setScrollFade, { passive: true });
    window.addEventListener('resize', setScrollFade);

    if (reduceMotion || window.matchMedia('(max-width: 768px)').matches) return;

    let pointerX = 0;
    let pointerY = 0;
    let rafId = 0;

    function applyPointerShift() {
        hero.style.setProperty('--hero-shift-x', `${pointerX.toFixed(1)}px`);
        hero.style.setProperty('--hero-shift-y', `${pointerY.toFixed(1)}px`);
        rafId = 0;
    }

    hero.addEventListener('pointermove', (event) => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        pointerX = x * -18;
        pointerY = y * -10;

        if (!rafId) {
            rafId = requestAnimationFrame(applyPointerShift);
        }
    });

    hero.addEventListener('pointerleave', () => {
        pointerX = 0;
        pointerY = 0;
        if (!rafId) {
            rafId = requestAnimationFrame(applyPointerShift);
        }
    });
}

/* ==========================================================================
   4. MODEL SWITCHER SHOWCASE
   ========================================================================== */
const MODELS_DATA = {
    lite: {
        name: "Nikitka AI <span class='neon-text-blue'>Lite</span>",
        desc: "Легкий entry-концепт для повседневного аудио: компактный кейс, мягкая посадка и базовые AI-профили звучания.",
        image: "bud-lite.png", // fallback placeholder/rendered
        accent: "#00f0ff",
        glow: "rgba(0, 240, 255, 0.4)",
        specs: {
            weight: "3.8 г",
            battery: "18 ч concept",
            anc: "Daily ANC concept",
            chip: "Neural Lite demo",
            sound: "Hi-Res Audio 48 kHz",
            mind: "Focus demo off"
        }
    },
    pro: {
        name: "Nikitka AI <span class='neon-text-purple'>PRO</span>",
        desc: "Главный портфолио-концепт: прозрачный OLED-кейс, живой радиотест, кинематографичная анатомия и интерактивные аудио-режимы.",
        image: "bud-pro.png",
        accent: "#8a2be2",
        glow: "rgba(138, 43, 226, 0.4)",
        specs: {
            weight: "4.2 г",
            battery: "До 24 часов",
            anc: "Adaptive ANC concept",
            chip: "NeuroCore AI PRO",
            sound: "96 kHz / 24 bit HD",
            mind: "Focus Gesture demo"
        }
    },
    ultra: {
        name: "Nikitka AI <span class='gradient-text'>Ultra</span>",
        desc: "Экспериментальная полноразмерная ветка: больше сцены, больше батареи и театральный режим пространственного звука.",
        image: "bud-ultra.png",
        accent: "#ff007f",
        glow: "rgba(255, 0, 127, 0.4)",
        specs: {
            weight: "240 г",
            battery: "60 ч concept",
            anc: "Hybrid ANC concept",
            chip: "NeuroEngine Max x2",
            sound: "192 kHz Acoustic Max",
            mind: "Focus Theater demo"
        }
    }
};

function initProductOrbit() {
    const tiltCards = document.querySelectorAll('[data-tilt-card]');
    const orbitButtons = document.querySelectorAll('.orbit-btn');
    const showcaseWrap = document.querySelector('.showcase-image-wrap');

    tiltCards.forEach(card => {
        card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
            card.style.setProperty('--tilt-y', `${x * 5.5}deg`);
            card.style.setProperty('--tilt-x', `${y * -4.5}deg`);
        });

        card.addEventListener('pointerleave', () => {
            card.style.setProperty('--tilt-y', '0deg');
            card.style.setProperty('--tilt-x', '0deg');
        });
    });

    orbitButtons.forEach(button => {
        button.addEventListener('click', () => {
            orbitButtons.forEach(item => item.classList.remove('active'));
            button.classList.add('active');
            if (!showcaseWrap) return;

            showcaseWrap.classList.remove('orbit-buds', 'orbit-explode');
            const mode = button.getAttribute('data-orbit');
            if (mode === 'buds') {
                showcaseWrap.classList.add('orbit-buds');
            } else if (mode === 'explode') {
                showcaseWrap.classList.add('orbit-explode');
            }
        });
    });
}

function initInsideVideo() {
    const video = document.getElementById('inside-video');
    const toggle = document.getElementById('inside-toggle');
    const toggleLabel = document.getElementById('inside-toggle-label');
    const progress = document.getElementById('inside-progress');
    const timecode = document.getElementById('inside-timecode');
    const layerButtons = document.querySelectorAll('.inside-layer-btn');
    const layerTitle = document.getElementById('inside-layer-title');
    const layerText = document.getElementById('inside-layer-text');
    const layerMetric = document.getElementById('inside-layer-metric');

    if (!video || !toggle || !progress || !timecode || !layerButtons.length) return;

    const layers = {
        shell: {
            title: 'Прозрачный стеклокарбон',
            text: 'Полупрозрачный корпус показывает внутреннюю архитектуру, защищает электронику и оставляет световой контур по кромке наушника.',
            metric: '0.8 мм оболочка'
        },
        driver: {
            title: '12 мм графеновый драйвер',
            text: 'Крупная мембрана держит плотный низ, чистую середину и воздушные верха без ощущения пластикового мини-динамика.',
            metric: '96 kHz / 24 bit'
        },
        chip: {
            title: 'NeuroCore AI PRO',
            text: 'Мини-плата управляет профилями звучания, адаптивным шумоподавлением, голосовым ассистентом и быстрым переключением режимов.',
            metric: '2.4 TOPS edge AI'
        },
        anc: {
            title: 'Сетка ANC-микрофонов',
            text: 'Внешние и внутренние микрофоны считывают окружение, отделяют речь от шума и подстраивают прозрачность в реальном времени.',
            metric: '-42 dB Smart ANC'
        },
        battery: {
            title: 'Плотная energy-cell батарея',
            text: 'Компактная ячейка питает драйвер, подсветку и AI-чип, а кейс быстро возвращает заряд через беспроводную Qi 2.0 станцию.',
            metric: '24 ч с кейсом'
        }
    };

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    let userPaused = Boolean(reducedMotion && reducedMotion.matches);

    function formatTime(seconds) {
        const safeSeconds = Math.max(0, Math.floor(seconds || 0));
        return `00:${String(safeSeconds).padStart(2, '0')}`;
    }

    function updateToggleState() {
        const isPaused = video.paused || video.ended;
        toggle.setAttribute('aria-label', isPaused ? 'Запустить ролик анатомии' : 'Поставить ролик на паузу');
        if (toggleLabel) {
            toggleLabel.textContent = isPaused ? 'Смотреть' : 'Пауза';
        }
    }

    function updateProgress() {
        const duration = video.duration || 8;
        const ratio = duration ? Math.min(video.currentTime / duration, 1) : 0;
        progress.style.transform = `scaleX(${ratio})`;
        timecode.textContent = formatTime(video.currentTime);
    }

    function playVideo() {
        if (userPaused) return;
        const playRequest = video.play();
        if (playRequest && typeof playRequest.catch === 'function') {
            playRequest.catch(() => updateToggleState());
        }
    }

    async function prepareSeekableVideo() {
        const source = video.querySelector('source');
        const sourceUrl = source ? source.src : video.currentSrc;
        if (!sourceUrl || window.location.protocol === 'file:') return;

        try {
            const response = await fetch(sourceUrl, { cache: 'force-cache' });
            if (!response.ok) return;

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            video.src = blobUrl;
            video.load();
            window.addEventListener('beforeunload', () => URL.revokeObjectURL(blobUrl), { once: true });
        } catch (error) {
            // Range requests are enough on production hosts; blob fallback only protects simple local servers.
        }
    }

    function seekVideo(seconds) {
        const target = Number.parseFloat(seconds);
        if (!Number.isFinite(target)) return;

        const applySeek = () => {
            const duration = video.duration || 8;
            video.currentTime = Math.min(Math.max(target, 0), Math.max(duration - 0.15, 0));
            updateProgress();
        };

        if (video.readyState >= 1) {
            applySeek();
        } else {
            video.addEventListener('loadedmetadata', applySeek, { once: true });
        }
    }

    function setActiveLayer(button) {
        const layerKey = button.getAttribute('data-layer');
        const layer = layers[layerKey];
        if (!layer) return;

        layerButtons.forEach(item => {
            item.classList.remove('active');
            item.setAttribute('aria-pressed', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');

        if (layerTitle) layerTitle.textContent = layer.title;
        if (layerText) layerText.textContent = layer.text;
        if (layerMetric) layerMetric.textContent = layer.metric;

        seekVideo(button.getAttribute('data-inside-time'));
        if (!userPaused) playVideo();
    }

    layerButtons.forEach(button => {
        button.addEventListener('click', () => setActiveLayer(button));
    });

    toggle.addEventListener('click', () => {
        if (video.paused || video.ended) {
            userPaused = false;
            playVideo();
        } else {
            userPaused = true;
            video.pause();
        }
        updateToggleState();
    });

    video.addEventListener('play', updateToggleState);
    video.addEventListener('pause', updateToggleState);
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);

    prepareSeekableVideo().finally(() => {
        if (reducedMotion && reducedMotion.matches) {
            video.pause();
            updateToggleState();
        } else {
            playVideo();
        }
    });

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    video.pause();
                    return;
                }
                if (!userPaused && !(reducedMotion && reducedMotion.matches)) {
                    playVideo();
                }
            });
        }, { threshold: 0.24 });

        observer.observe(video);
    }
}

function initModelSwitcher() {
    const buttons = document.querySelectorAll('.selector-btn');
    const modelTitle = document.getElementById('model-title');
    const modelDesc = document.getElementById('model-desc');
    const specWeight = document.getElementById('spec-weight');
    const specBattery = document.getElementById('spec-battery');
    const specANC = document.getElementById('spec-anc');
    const specChip = document.getElementById('spec-chip');
    const specSound = document.getElementById('spec-sound');
    const specMind = document.getElementById('spec-mind');
    const mainImg = document.getElementById('showcase-image');
    const glowCircle = document.querySelector('.showcase-glow-circle');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const modelKey = btn.getAttribute('data-model');
            const data = MODELS_DATA[modelKey];

            // Animate transition of content
            [modelTitle, modelDesc, mainImg].forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(15px)';
            });

            setTimeout(() => {
                // Update text details
                modelTitle.innerHTML = data.name;
                modelDesc.textContent = data.desc;
                
                // Update specs
                specWeight.textContent = data.specs.weight;
                specBattery.textContent = data.specs.battery;
                specANC.textContent = data.specs.anc;
                specChip.textContent = data.specs.chip;
                specSound.textContent = data.specs.sound;
                specMind.textContent = data.specs.mind;

                // Update styling variables
                document.documentElement.style.setProperty('--primary', data.accent);
                document.documentElement.style.setProperty('--primary-glow', data.glow);
                
                if (glowCircle) {
                    glowCircle.style.borderColor = data.glow;
                }

                // Update image simulation
                // For live demo we'll use neat SVG-generated filters or style changes
                if (modelKey === 'lite') {
                    mainImg.style.filter = 'hue-rotate(180deg) drop-shadow(0 15px 30px rgba(0, 240, 255, 0.45))';
                } else if (modelKey === 'pro') {
                    mainImg.style.filter = 'none';
                } else if (modelKey === 'ultra') {
                    mainImg.style.filter = 'hue-rotate(290deg) saturate(1.5) drop-shadow(0 15px 30px rgba(255, 0, 127, 0.45))';
                }

                // Fade back in
                [modelTitle, modelDesc, mainImg].forEach(el => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                });
            }, 300);
        });
    });
}

/* ==========================================================================
   4. INTERACTIVE EXPLODED 3D VIEW
   ========================================================================== */
function initExplodedViewer() {
    const viewer = document.getElementById('exploded-viewer');
    const layerButtons = document.querySelectorAll('.layer-command');
    const layerImages = viewer ? viewer.querySelectorAll('.layer-img[data-layer]') : [];
    const layerLabels = viewer ? viewer.querySelectorAll('.viewer-label[data-layer-label]') : [];
    const autoButton = document.getElementById('layer-auto-scan');
    const autoButtonText = autoButton ? autoButton.querySelector('.layer-auto-text') : null;
    const readout = document.getElementById('layer-readout');

    if (!viewer || !layerButtons.length) return;

    const layers = [
        { key: 'shell', index: '01', name: 'Корпус' },
        { key: 'driver', index: '02', name: 'Драйвер' },
        { key: 'board', index: '03', name: 'AI-чип' },
        { key: 'case', index: '04', name: 'Сенсор' }
    ];
    const layerByKey = layers.reduce((acc, layer) => {
        acc[layer.key] = layer;
        return acc;
    }, {});
    let activeIndex = 0;
    let scanTimer = null;

    const setLayer = (layerKey) => {
        const layer = layerByKey[layerKey] || layers[0];
        activeIndex = layers.findIndex(item => item.key === layer.key);

        viewer.classList.add('active');
        viewer.dataset.activeLayer = layer.key;

        layerButtons.forEach((button) => {
            const isActive = button.dataset.layer === layer.key;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        layerImages.forEach((image) => {
            image.classList.toggle('active-layer', image.dataset.layer === layer.key);
        });

        layerLabels.forEach((label) => {
            label.classList.toggle('active', label.dataset.layerLabel === layer.key);
        });

        if (readout) {
            readout.textContent = `${layer.index} / ${layer.name} активен`;
        }
    };

    const stopScan = () => {
        if (scanTimer) {
            clearInterval(scanTimer);
            scanTimer = null;
        }
        viewer.classList.remove('scanning');
        if (autoButton) {
            autoButton.classList.remove('active');
            autoButton.setAttribute('aria-pressed', 'false');
            if (autoButtonText) autoButtonText.textContent = 'Автоскан';
        }
    };

    layerButtons.forEach((button) => {
        button.addEventListener('click', () => {
            stopScan();
            setLayer(button.dataset.layer);
        });
    });

    if (autoButton) {
        autoButton.addEventListener('click', () => {
            if (scanTimer) {
                stopScan();
                return;
            }

            viewer.classList.add('scanning');
            autoButton.classList.add('active');
            autoButton.setAttribute('aria-pressed', 'true');
            if (autoButtonText) autoButtonText.textContent = 'Стоп скан';

            scanTimer = setInterval(() => {
                activeIndex = (activeIndex + 1) % layers.length;
                setLayer(layers[activeIndex].key);
            }, 1400);
        });
    }

    setLayer('shell');
}

/* ==========================================================================
   5. WEB AUDIO API CONSOLE & RADIO SIMULATOR
   ========================================================================== */
function initAudioSimulator() {
    const radioSelect = document.getElementById('radio-select');
    const playBtn = document.getElementById('play-btn');
    const eqButtons = document.querySelectorAll('.eq-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const focusSlider = document.getElementById('focus-slider');
    const focusWidget = document.getElementById('focus-widget-card');
    const visualizer = document.getElementById('visualizer');
    const stationNow = document.getElementById('station-now');
    const stationTitle = document.getElementById('station-title');
    const stationDesc = document.getElementById('station-desc');
    const stationCodec = document.getElementById('station-codec');
    const stationBitrate = document.getElementById('station-bitrate');
    const streamStatus = document.getElementById('stream-status');
    const stationPills = document.querySelectorAll('.station-pill');

    if (!playBtn) return;

    const RADIO_STREAMS = {
        groove: {
            title: "Groove Salad",
            desc: "Ambient/downtempo beats and chilled grooves.",
            url: "https://ice2.somafm.com/groovesalad-128-mp3",
            codec: "MP3",
            bitrate: "128 kbps"
        },
        drone: {
            title: "Drone Zone",
            desc: "Slow atmospheric textures for deep focus.",
            url: "https://ice2.somafm.com/dronezone-128-mp3",
            codec: "MP3",
            bitrate: "128 kbps"
        },
        deep: {
            title: "Deep Space One",
            desc: "Deep ambient electronic and space music.",
            url: "https://ice2.somafm.com/deepspaceone-128-mp3",
            codec: "MP3",
            bitrate: "128 kbps"
        },
        spacestation: {
            title: "Space Station Soma",
            desc: "Cosmic ambient and mid-tempo electronic music.",
            url: "https://ice2.somafm.com/spacestation-128-mp3",
            codec: "MP3",
            bitrate: "128 kbps"
        },
        defcon: {
            title: "DEF CON Radio",
            desc: "Electronic music for hacking and cyber-night work.",
            url: "https://ice2.somafm.com/defcon-128-mp3",
            codec: "MP3",
            bitrate: "128 kbps"
        },
        mission: {
            title: "Mission Control",
            desc: "Ambient music mixed with NASA mission audio.",
            url: "https://ice2.somafm.com/missioncontrol-128-mp3",
            codec: "MP3",
            bitrate: "128 kbps"
        }
    };

    let audioCtx = null;
    let audioTag = null;
    let sourceNode = null;
    let analyserNode = null;
    let bypassGain = null;
    let filterLowpass = null;
    let filterPeaking = null;
    let spatialGain = null;
    let masterGain = null;
    let synthesizerInterval = null; // offline fallback synthesizer

    let isPlaying = false;
    let activePreset = 'bypass'; // bypass, neuro, anc, mind

    function getStation() {
        return RADIO_STREAMS[radioSelect.value] || RADIO_STREAMS.groove;
    }

    function setStreamStatus(label) {
        if (streamStatus) streamStatus.textContent = label;
    }

    function syncStationUI() {
        const station = getStation();
        if (stationNow) stationNow.textContent = `SomaFM ${station.title} • ${station.bitrate} ${station.codec}`;
        if (stationTitle) stationTitle.textContent = station.title;
        if (stationDesc) stationDesc.textContent = station.desc;
        if (stationCodec) stationCodec.textContent = station.codec;
        if (stationBitrate) stationBitrate.textContent = station.bitrate;
        stationPills.forEach(pill => {
            pill.classList.toggle('active', pill.getAttribute('data-station') === radioSelect.value);
        });
    }

    // Canvas Visualizer setup
    const canvas = visualizer;
    const ctx = canvas.getContext('2d');
    let bufferLength = 0;
    let dataArray = null;

    function resizeVisualizer() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight - 40;
    }
    resizeVisualizer();
    window.addEventListener('resize', resizeVisualizer);

    // Dynamic wave animation loop when audio is NOT playing (idle wave)
    function drawIdleVisualizer() {
        if (isPlaying) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        
        const time = Date.now() * 0.004;
        for (let x = 0; x < canvas.width; x++) {
            const y = canvas.height / 2 + Math.sin(x * 0.015 + time) * 8 * Math.cos(x * 0.005);
            ctx.lineTo(x, y);
        }
        
        ctx.strokeStyle = 'rgba(138, 43, 226, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        requestAnimationFrame(drawIdleVisualizer);
    }
    drawIdleVisualizer();

    // Create the Web Audio Routing graph
    function setupWebAudio() {
        if (audioCtx) return;

        // Initialize audio tag
        audioTag = new Audio();
        audioTag.crossOrigin = "anonymous";
        audioTag.preload = "none";
        audioTag.src = getStation().url;
        audioTag.addEventListener('waiting', () => setStreamStatus('Buffering'));
        audioTag.addEventListener('playing', () => setStreamStatus('Live'));
        audioTag.addEventListener('pause', () => setStreamStatus('Paused'));
        audioTag.addEventListener('error', () => setStreamStatus('Synth fallback'));

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();

        // 1. Source node
        sourceNode = audioCtx.createMediaElementSource(audioTag);

        // 2. Analyser
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 256;
        bufferLength = analyserNode.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        // 3. Noise Filter (BiquadFilter lowpass representing ambient sound block)
        filterLowpass = audioCtx.createBiquadFilter();
        filterLowpass.type = 'lowpass';
        filterLowpass.frequency.setValueAtTime(20000, audioCtx.currentTime); // Off initially

        // 4. Focus Equalizer (Peaking Filter representing thought concentration)
        filterPeaking = audioCtx.createBiquadFilter();
        filterPeaking.type = 'peaking';
        filterPeaking.Q.setValueAtTime(1.5, audioCtx.currentTime);
        filterPeaking.frequency.setValueAtTime(1000, audioCtx.currentTime);
        filterPeaking.gain.setValueAtTime(0, audioCtx.currentTime); // Off initially

        // 5. Spatial NeuroSound (Gain for emulation of expansion)
        spatialGain = audioCtx.createGain();
        spatialGain.gain.setValueAtTime(1.0, audioCtx.currentTime);

        // 6. Master Volume Node
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(volumeSlider.value / 100, audioCtx.currentTime);

        // Routing: Source -> Analyser -> Lowpass -> Peaking -> Spatial -> Master -> Destination
        sourceNode.connect(analyserNode);
        analyserNode.connect(filterLowpass);
        filterLowpass.connect(filterPeaking);
        filterPeaking.connect(spatialGain);
        spatialGain.connect(masterGain);
        masterGain.connect(audioCtx.destination);
    }

    // Connect Eq button interactions
    eqButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            eqButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const preset = btn.getAttribute('data-eq');
            activePreset = preset;

            // Trigger click feedback noise or simple beep if context initialized
            playUIBeep();

            // Toggle Mental focus panel enabling
            if (preset === 'mind') {
                focusWidget.classList.remove('disabled');
            } else {
                focusWidget.classList.add('disabled');
            }

            applyAudioFilters();
        });
    });

    function applyAudioFilters() {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        // Reset all nodes
        filterLowpass.frequency.setTargetAtTime(20000, now, 0.1);
        filterPeaking.gain.setTargetAtTime(0, now, 0.1);
        spatialGain.gain.setTargetAtTime(1.0, now, 0.1);

        if (activePreset === 'bypass') {
            // standard sound, direct bypass
        } 
        else if (activePreset === 'neuro') {
            // Bass expansion + high clarity
            spatialGain.gain.setTargetAtTime(1.35, now, 0.2);
            filterPeaking.type = 'peaking';
            filterPeaking.frequency.setTargetAtTime(80, now, 0.1); // Boost Sub-Bass
            filterPeaking.gain.setTargetAtTime(7.5, now, 0.1);
        } 
        else if (activePreset === 'anc') {
            // Cut high environmental frequencies and dynamic compression emulation
            filterLowpass.frequency.setTargetAtTime(2800, now, 0.3); // Heavy muffled lowpass
            spatialGain.gain.setTargetAtTime(0.85, now, 0.2);
        } 
        else if (activePreset === 'mind') {
            // Hook filter to focus-slider
            updateFocusFilter();
        }
    }

    function updateFocusFilter() {
        if (!audioCtx || activePreset !== 'mind') return;
        const now = audioCtx.currentTime;
        const val = parseInt(focusSlider.value); // 0 - 100

        // Map focus value to frequency sweeps
        // Low focus = smooth low ambient drone, High focus = sharp mid crisp
        const freq = 200 + (val * 85);
        const gain = -10 + (val * 0.28); // Boost as focus rises
        
        filterPeaking.type = 'peaking';
        filterPeaking.frequency.setTargetAtTime(freq, now, 0.05);
        filterPeaking.gain.setTargetAtTime(gain, now, 0.05);
    }

    focusSlider.addEventListener('input', updateFocusFilter);

    // Offline / Loading backup ambient synthesizer (in case streams fail or loading takes too long)
    function startBackupSynth() {
        if (synthesizerInterval) clearInterval(synthesizerInterval);
        
        // Setup oscillator sweeps to keep visualizer moving and sound playing
        let osc = audioCtx.createOscillator();
        let amp = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime); // Warm chord baseline
        
        amp.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        amp.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 1.5);

        osc.connect(amp);
        amp.connect(analyserNode);
        osc.start();

        // Arpeggiator sweeps simulating neural waves
        let tick = 0;
        synthesizerInterval = setInterval(() => {
            const freq = [120, 160, 240, 320, 480][tick % 5];
            osc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.25);
            tick++;
        }, 1200);

        // Store references to destroy later
        audioTag.backupSynthOsc = osc;
        audioTag.backupSynthAmp = amp;
    }

    function stopBackupSynth() {
        if (synthesizerInterval) {
            clearInterval(synthesizerInterval);
            synthesizerInterval = null;
        }
        if (audioTag && audioTag.backupSynthOsc) {
            try {
                audioTag.backupSynthAmp.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
                setTimeout(() => {
                    audioTag.backupSynthOsc.stop();
                    audioTag.backupSynthOsc.disconnect();
                    audioTag.backupSynthAmp.disconnect();
                }, 500);
            } catch(e){}
        }
    }

    // UI Beep synthesizer
    function playUIBeep() {
        if (!audioCtx) return;
        try {
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        } catch(e){}
    }

    // Toggle Play Action
    playBtn.addEventListener('click', async () => {
        try {
            setupWebAudio();
            
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }

            if (!isPlaying) {
                playBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="#000">
                        <rect x="4" y="4" width="4" height="16" rx="1"></rect>
                        <rect x="16" y="4" width="4" height="16" rx="1"></rect>
                    </svg>
                `;
                
                // Play stream
                audioTag.src = getStation().url;
                
                // Set loading status indicator
                playBtn.style.opacity = '0.7';
                setStreamStatus('Buffering');
                
                audioTag.play()
                    .then(() => {
                        isPlaying = true;
                        playBtn.style.opacity = '1';
                        setStreamStatus('Live');
                        stopBackupSynth();
                        applyAudioFilters();
                        drawActiveVisualizer();
                    })
                    .catch(err => {
                        console.warn("Direct stream load failed (CORS or network). Starting local Neural Synth fallback!", err);
                        // Start offline synthesizer simulation so page *still* functions perfectly
                        isPlaying = true;
                        playBtn.style.opacity = '1';
                        setStreamStatus('Synth fallback');
                        startBackupSynth();
                        applyAudioFilters();
                        drawActiveVisualizer();
                    });
            } else {
                playBtn.innerHTML = `
                    <svg class="play-icon-symbol" viewBox="0 0 24 24" width="22" height="22" fill="#000">
                        <polygon points="5 3 19 12 5 21"></polygon>
                    </svg>
                `;
                audioTag.pause();
                stopBackupSynth();
                isPlaying = false;
                setStreamStatus('Paused');
                drawIdleVisualizer();
            }
        } catch (e) {
            console.error("Audio initialization error: ", e);
        }
    });

    // Handle Radio Channel Switching
    radioSelect.addEventListener('change', () => {
        syncStationUI();
        if (isPlaying) {
            playBtn.style.opacity = '0.7';
            setStreamStatus('Buffering');
            audioTag.src = getStation().url;
            audioTag.play().then(() => {
                playBtn.style.opacity = '1';
                setStreamStatus('Live');
                stopBackupSynth();
            }).catch(() => {
                startBackupSynth();
                playBtn.style.opacity = '1';
                setStreamStatus('Synth fallback');
            });
        }
    });

    stationPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const station = pill.getAttribute('data-station');
            if (!RADIO_STREAMS[station]) return;
            radioSelect.value = station;
            radioSelect.dispatchEvent(new Event('change'));
        });
    });

    // Volume adjustment
    volumeSlider.addEventListener('input', (e) => {
        const vol = parseInt(e.target.value) / 100;
        if (masterGain) {
            masterGain.gain.setValueAtTime(vol, audioCtx.currentTime);
        }
    });

    syncStationUI();

    // Active visualizer animation
    function drawActiveVisualizer() {
        if (!isPlaying) return;
        
        analyserNode.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.6;
        let barHeight;
        let x = 0;

        // Draw multiple beautiful visual paths: bar graph & smooth glow envelope
        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];

            // Color gradient mapping: blue to purple
            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, 'rgba(138, 43, 226, 0.15)');
            gradient.addColorStop(0.5, 'rgba(0, 240, 255, 0.7)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

            ctx.fillStyle = gradient;
            
            // Draw visualizer bar
            const heightMultiplier = canvas.height * 0.0028;
            const h = barHeight * heightMultiplier;
            ctx.fillRect(x, canvas.height - h, barWidth - 2, h);

            x += barWidth;
        }

        requestAnimationFrame(drawActiveVisualizer);
    }
}

/* ==========================================================================
   6. INTERACTIVE NEURAL AI VOICE CHATBOT
   ========================================================================== */
const AI_RESPONSES = {
    weather: "Это демо-ассистент без доступа к геолокации. В реальном сценарии гарнитура могла бы взять прогноз со смартфона и предложить режим: прозрачность для улицы или ANC для транспорта.",
    translate: "Демо перевода на японский:\n「Nikitka AI PROは、未来のサウンドを今ここに届けます。」\nСмысл: Nikitka AI PRO приносит звук будущего уже сейчас.",
    cafe: "Я не запрашиваю геолокацию в этом портфолио-демо. Могу показать сценарий: ассистент предложил бы места рядом, а затем включил бы режим прозрачности, чтобы безопасно идти по маршруту.",
    focus: "Режим фокуса в этом сайте является интерфейсной концепцией. Он меняет аудио-профиль, визуальный спектр и подсказывает спокойный сценарий прослушивания без заявления о реальном биометрическом сканировании."
};

function initAIChatbot() {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('btn-send');
    const voiceBtn = document.getElementById('btn-voice');
    const suggestions = document.querySelectorAll('.suggestion-chip');

    if (!chatMessages) return;

    let voiceEnabled = false;

    // Suggestion chips clicks
    suggestions.forEach(chip => {
        chip.addEventListener('click', () => {
            const trigger = chip.getAttribute('data-trigger');
            const questionText = chip.textContent;
            
            // Send user message
            addMessage(questionText, 'user');
            
            // Simulate AI thinking and replying
            simulateAIResponse(trigger);
        });
    });

    // Text Input submit
    sendBtn.addEventListener('click', submitMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitMessage();
    });

    // Voice Synthesis Toggle
    voiceBtn.addEventListener('click', () => {
        voiceEnabled = !voiceEnabled;
        voiceBtn.classList.toggle('active', voiceEnabled);
        
        // Beep indicator
        try {
            const beep = new AudioContext();
            const osc = beep.createOscillator();
            const gain = beep.createGain();
            osc.frequency.setValueAtTime(voiceEnabled ? 880 : 440, beep.currentTime);
            gain.gain.setValueAtTime(0.05, beep.currentTime);
            osc.connect(gain);
            gain.connect(beep.destination);
            osc.start();
            osc.stop(beep.currentTime + 0.1);
        } catch(e){}
    });

    function submitMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';

        // Match terms or give generic answers
        let matchedTrigger = 'focus';
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('погод')) matchedTrigger = 'weather';
        else if (lowerText.includes('япон') || lowerText.includes('переведи')) matchedTrigger = 'translate';
        else if (lowerText.includes('кафе') || lowerText.includes('кофе')) matchedTrigger = 'cafe';
        else if (lowerText.includes('фокус') || lowerText.includes('мозг')) matchedTrigger = 'focus';

        simulateAIResponse(matchedTrigger);
    }

    function addMessage(text, sender) {
        const bubble = document.createElement('div');
        bubble.classList.add('message-bubble', sender);
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const messageText = document.createElement('div');
        messageText.textContent = text;
        messageText.innerHTML = messageText.innerHTML.replace(/\n/g, '<br>');

        const meta = document.createElement('span');
        meta.className = 'message-meta';
        meta.textContent = `${sender === 'ai' ? 'Nikitka AI' : 'Вы'} • ${timestamp}`;

        bubble.appendChild(messageText);
        bubble.appendChild(meta);
        
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // CSS Entrance trigger
        bubble.style.opacity = '0';
        bubble.style.transform = 'translateY(15px)';
        setTimeout(() => {
            bubble.style.opacity = '1';
            bubble.style.transform = 'translateY(0)';
            bubble.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
        }, 50);
    }

    function simulateAIResponse(trigger) {
        // Typing indicator element
        const typingBubble = document.createElement('div');
        typingBubble.classList.add('message-bubble', 'ai');
        typingBubble.innerHTML = `<span class="neon-text-purple">Nikitka AI печатает...</span>`;
        chatMessages.appendChild(typingBubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(() => {
            chatMessages.removeChild(typingBubble);
            const answer = AI_RESPONSES[trigger];
            addMessage(answer, 'ai');

            // Web Speech TTS synth
            if (voiceEnabled && ('speechSynthesis' in window)) {
                // Cancel existing utterances
                window.speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(answer.replace(/\n/g, ' '));
                utterance.lang = 'ru-RU';
                utterance.rate = 1.05; // slightly faster futuristic cadence
                utterance.pitch = 0.95; // deep cool voice
                
                window.speechSynthesis.speak(utterance);
            }
        }, 1200);
    }

    // Voice Recognition (Speech-to-Text) binding to "#btn-chat-trigger"
    const chatTrigger = document.getElementById('btn-chat-trigger');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micIconMarkup = `
        <svg class="mic-icon chat-trigger-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <path d="M12 19v3"></path>
        </svg>`;

    if (chatTrigger && SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        let isListening = false;

        chatTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Scroll to chatbot
            const assistantSection = document.getElementById('assistant');
            if (assistantSection) {
                assistantSection.scrollIntoView({ behavior: 'smooth' });
            }

            if (isListening) {
                recognition.stop();
                return;
            }

            try {
                recognition.start();
            } catch (err) {
                console.error("Speech recognition error starting: ", err);
            }
        });

        recognition.onstart = () => {
            isListening = true;
            chatTrigger.classList.add('listening');
            chatTrigger.innerHTML = `<span class="listening-dot"></span> Слушаю...`;
            // Enable voice output automatically when talking to the AI
            voiceEnabled = true;
            voiceBtn.classList.add('active');
        };

        recognition.onend = () => {
            isListening = false;
            chatTrigger.classList.remove('listening');
            chatTrigger.innerHTML = `${micIconMarkup} Поговорить с AI`;
        };

        recognition.onresult = (event) => {
            const speechToText = event.results[0][0].transcript;
            console.log("Transcribed speech: ", speechToText);
            
            chatInput.value = speechToText;
            
            // Submit the transcribed message
            submitMessage();
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error: ", event.error);
            isListening = false;
            chatTrigger.classList.remove('listening');
            chatTrigger.innerHTML = `${micIconMarkup} Поговорить с AI`;
        };
    } else if (chatTrigger) {
        chatTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            chatInput.focus();
            chatInput.placeholder = "Голос не поддерживается вашим браузером. Напишите здесь...";
            const assistantSection = document.getElementById('assistant');
            if (assistantSection) {
                assistantSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

/* ==========================================================================
   7. INTERACTIVE FAQ ACCORDION
   ========================================================================== */
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close other items
            faqItems.forEach(i => i.classList.remove('active'));

            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

function initNewsletterDemo() {
    const form = document.getElementById('newsletter-form');
    const status = document.getElementById('newsletter-status');
    if (!form || !status) return;

    const input = form.querySelector('.newsletter-input');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        status.textContent = 'Готово: демо-состояние показано локально, email никуда не отправлен.';
        if (input) input.value = '';
    });
}
