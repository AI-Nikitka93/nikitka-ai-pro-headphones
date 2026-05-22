import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MODEL_URL = 'assets/nikitka-ai-pro-product.glb';

const ready = (callback) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
};

const partLabels = {
    case: 'Кейс и прозрачная крышка',
    buds: 'Два вкладыша Nikitka AI PRO',
    ai: 'AI/OLED интерфейс и голограмма',
    battery: 'OLED-индикатор батареи',
    sensor: 'Сенсорные панели вкладышей'
};

const hasWebGL = () => {
    try {
        const testCanvas = document.createElement('canvas');
        return Boolean(window.WebGLRenderingContext && (
            testCanvas.getContext('webgl2') ||
            testCanvas.getContext('webgl') ||
            testCanvas.getContext('experimental-webgl')
        ));
    } catch {
        return false;
    }
};

ready(() => {
    const mount = document.getElementById('exploded-viewer');
    const canvas = document.getElementById('product-3d-canvas');
    const button = document.getElementById('anatomy-scan-toggle');
    const readout = document.getElementById('anatomy-readout');
    const progressFill = document.getElementById('anatomy-progress-fill');
    const loading = document.getElementById('model-loading');
    const partButtons = document.querySelectorAll('[data-viewer-part]');

    if (!mount || !canvas || !button) return;

    if (!hasWebGL()) {
        mount.dataset.phase = 'fallback';
        mount.classList.add('webgl-missing');
        if (loading) loading.textContent = 'WebGL недоступен, показан статичный рендер';
        return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.88;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    camera.position.set(4.15, 2.55, 6.35);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.minDistance = 4.4;
    controls.maxDistance = 9.2;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 0.36;
    controls.target.set(0, 0.45, 0);

    scene.add(new THREE.AmbientLight(0x7e96d8, 0.36));

    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    key.position.set(4.2, 5.4, 5.0);
    scene.add(key);

    const cyan = new THREE.PointLight(0x00f0ff, 3.8, 8.5);
    cyan.position.set(-2.4, 1.9, 2.2);
    scene.add(cyan);

    const purple = new THREE.PointLight(0x8a2be2, 4.2, 8.5);
    purple.position.set(2.7, 0.7, 2.9);
    scene.add(purple);

    const pivot = new THREE.Group();
    pivot.rotation.set(-0.04, -0.34, 0);
    scene.add(pivot);

    let model = null;
    let loaded = false;
    let targetProgress = 0;
    let progress = 0;
    let activePart = 'case';
    const meshes = [];

    const classifyMesh = (name) => {
        const lower = name.toLowerCase();
        const categories = new Set();

        if (lower.includes('earbud')) categories.add('buds');
        if (lower.includes('fingerprint') || lower.includes('sensor')) categories.add('sensor');
        if (lower.includes('battery')) categories.add('battery');
        if (lower.includes('lid_ui') || lower.includes('adaptive') || lower.includes('hologram') || lower.includes('oled')) categories.add('ai');
        if (lower.startsWith('case') || lower.includes('lid') || lower.includes('well')) categories.add('case');
        if (!categories.size) categories.add('case');

        return Array.from(categories);
    };

    const explodeOffsetFor = (name) => {
        const lower = name.toLowerCase();
        if (lower.startsWith('left_floating_earbud')) return new THREE.Vector3(-0.48, 0.38, 0.05);
        if (lower.startsWith('right_docked_earbud')) return new THREE.Vector3(0.44, 0.25, 0.06);
        if (lower.includes('fingerprint') || lower.includes('sensor')) return new THREE.Vector3(0.55, 0.45, 0.1);
        if (lower.includes('battery') || lower.includes('front_oled_panel')) return new THREE.Vector3(0, -0.18, 0.52);
        if (lower.includes('lid') || lower.includes('adaptive')) return new THREE.Vector3(0, 0.46, -0.2);
        if (lower.includes('hologram')) return new THREE.Vector3(0, 0.72, 0);
        if (lower.includes('case_top')) return new THREE.Vector3(0, 0.2, 0);
        if (lower.startsWith('case')) return new THREE.Vector3(0, -0.14, 0);
        return new THREE.Vector3(0, 0, 0);
    };

    const cloneMaterial = (mesh) => {
        if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((item) => item.clone());
        } else if (mesh.material) {
            mesh.material = mesh.material.clone();
        }
    };

    const eachMaterial = (mesh, callback) => {
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(callback);
        } else if (mesh.material) {
            callback(mesh.material);
        }
    };

    const rememberMesh = (mesh) => {
        cloneMaterial(mesh);
        const categories = classifyMesh(mesh.name);
        mesh.userData.basePosition = mesh.position.clone();
        mesh.userData.baseScale = mesh.scale.clone();
        mesh.userData.explodeOffset = explodeOffsetFor(mesh.name);
        mesh.userData.categories = categories;
        mesh.userData.baseEmissive = [];
        mesh.userData.baseEmissiveIntensity = [];

        eachMaterial(mesh, (mat, index) => {
            tuneMaterial(mat);
            mesh.userData.baseEmissive[index] = mat.emissive ? mat.emissive.clone() : null;
            mesh.userData.baseEmissiveIntensity[index] = typeof mat.emissiveIntensity === 'number' ? mat.emissiveIntensity : 0;
            mat.needsUpdate = true;
        });
        meshes.push(mesh);
    };

    const tuneMaterial = (mat) => {
        const name = (mat.name || '').toLowerCase();
        if (name.includes('smoked') || name.includes('transparent')) {
            mat.color.set(0x07101d);
            mat.transparent = true;
            mat.opacity = name.includes('lid') ? 0.36 : 0.3;
            mat.depthWrite = false;
            mat.metalness = 0.12;
            mat.roughness = 0.12;
            mat.side = THREE.DoubleSide;
        }
        if (name.includes('obsidian') || name.includes('ceramic')) {
            mat.color.set(0x02030a);
            mat.metalness = 0.72;
            mat.roughness = 0.16;
        }
        if (name.includes('oled') || name.includes('panel')) {
            mat.color.set(0x01030b);
            mat.metalness = 0.22;
            mat.roughness = 0.08;
        }
        if (name.includes('cyan')) {
            mat.color.set(0x00f0ff);
            if (mat.emissive) mat.emissive.set(0x00c9ff);
            mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 2.2);
        }
        if (name.includes('violet') || name.includes('purple')) {
            mat.color.set(0x9b5cff);
            if (mat.emissive) mat.emissive.set(0x7c2cff);
            mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 2.6);
        }
    };

    const setReadout = () => {
        if (!readout) return;
        if (!loaded) {
            readout.textContent = 'Загрузка 3D-модели';
            return;
        }
        readout.textContent = targetProgress > 0.5
            ? `Разбор: ${partLabels[activePart]}`
            : `3D-модель: ${partLabels[activePart]}`;
    };

    const setActivePart = (part) => {
        activePart = partLabels[part] ? part : 'case';
        partButtons.forEach((item) => {
            item.classList.toggle('is-active', item.dataset.viewerPart === activePart);
        });
        setReadout();
    };

    const setOpenState = (nextOpen) => {
        targetProgress = nextOpen ? 1 : 0;
        mount.dataset.phase = nextOpen ? 'open' : (loaded ? 'sealed' : 'loading');
        button.classList.toggle('is-open', nextOpen);
        button.setAttribute('aria-pressed', String(nextOpen));
        button.textContent = nextOpen ? 'Собрать модель' : 'Разобрать в 3D';
        setReadout();
    };

    button.addEventListener('click', () => {
        setOpenState(targetProgress <= 0.5);
    });

    partButtons.forEach((item) => {
        item.addEventListener('click', () => {
            setActivePart(item.dataset.viewerPart);
            setOpenState(true);
        });
    });

    const resize = () => {
        const rect = mount.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const loader = new GLTFLoader();
    loader.load(
        MODEL_URL,
        (gltf) => {
            model = gltf.scene;
            model.traverse((object) => {
                if (object.isMesh) {
                    rememberMesh(object);
                }
            });

            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            model.position.sub(center);
            model.scale.setScalar(4.58 / maxDim);
            pivot.add(model);

            loaded = true;
            mount.classList.add('is-loaded');
            mount.dataset.phase = 'sealed';
            if (loading) loading.textContent = 'GLB-модель загружена';
            setActivePart('case');
            setOpenState(false);
        },
        (event) => {
            if (!loading || !event.total) return;
            const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
            loading.textContent = `Загружаю GLB ${percent}%`;
        },
        () => {
            mount.dataset.phase = 'fallback';
            mount.classList.add('model-error');
            if (loading) loading.textContent = 'Не удалось загрузить GLB, показан рендер';
        }
    );

    const updateModel = () => {
        progress += (targetProgress - progress) * (reducedMotion ? 1 : 0.075);
        const eased = progress * progress * (3 - (2 * progress));

        meshes.forEach((mesh) => {
            const lowerName = mesh.name.toLowerCase();
            const target = mesh.userData.basePosition.clone().addScaledVector(mesh.userData.explodeOffset, eased);
            mesh.position.lerp(target, 0.24);

            const isActive = mesh.userData.categories.includes(activePart);
            const isBroadCaseSurface = activePart === 'case' && (
                lowerName.includes('case_base') ||
                lowerName.includes('case_top') ||
                lowerName.includes('open_lid') ||
                lowerName.includes('lid_inner')
            );
            const shouldGlow = false;
            const activeScale = isActive ? (isBroadCaseSurface ? 1.008 : 1.032) : 1;
            const openScale = 1 + (eased * (isActive ? 0.028 : 0));
            mesh.scale.lerp(mesh.userData.baseScale.clone().multiplyScalar(activeScale * openScale), 0.16);

            eachMaterial(mesh, (mat, index) => {
                const materialName = (mat.name || '').toLowerCase();
                const baseIntensity = mesh.userData.baseEmissiveIntensity[index] || 0;
                const canGlow = baseIntensity > 0.15 || materialName.includes('cyan') || materialName.includes('violet') || materialName.includes('purple');
                if (mat.emissive) {
                    const base = mesh.userData.baseEmissive[index] || new THREE.Color(0x000000);
                    const targetColor = shouldGlow && canGlow ? new THREE.Color(0x00f0ff) : base;
                    mat.emissive.lerp(targetColor, 0.12);
                }
                if (typeof mat.emissiveIntensity === 'number') {
                    const targetIntensity = shouldGlow && canGlow ? Math.max(baseIntensity, 1.18) : baseIntensity;
                    mat.emissiveIntensity += (targetIntensity - mat.emissiveIntensity) * 0.12;
                }
            });
        });

        if (progressFill) {
            progressFill.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
        }
    };

    const render = () => {
        updateModel();
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    };
    render();

    window.NIKITKA_THREE_ANATOMY = {
        getState: () => ({
            loaded,
            phase: mount.dataset.phase,
            activePart,
            partLabel: partLabels[activePart],
            targetProgress,
            progress,
            meshCount: meshes.length,
            modelUrl: MODEL_URL,
            canvas: {
                width: canvas.width,
                height: canvas.height
            },
            webgl2: renderer.capabilities.isWebGL2
        })
    };
});
