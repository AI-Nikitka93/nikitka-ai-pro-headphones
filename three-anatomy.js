import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MODEL_URL = 'assets/nikitka-ai-pro-product.glb?v=20260522-teardown-v1';

const ready = (callback) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
};

const partLabels = {
    case: 'корпус и посадочные колодцы',
    lid: 'крышка, шарнир и магнитный замок',
    buds: 'акустический драйвер вкладыша',
    ai: 'AI-плата, DSP и OLED-интерфейс',
    battery: 'аккумуляторы, Qi-катушка и контакты',
    signal: 'маршрут сигнала от платы к драйверу'
};

const stageMeta = {
    assembled: {
        label: 'Собранный кейс',
        readout: 'Собрано',
        part: 'case',
        camera: 'case',
        progress: 0,
        caption: 'Закрытый прозрачный корпус держит вкладыши, батареи, OLED и плату в одном модуле.'
    },
    lid: {
        label: 'Открываем крышку',
        readout: 'Шарнир',
        part: 'lid',
        camera: 'lid',
        progress: 0.35,
        caption: 'Крышка уходит назад: видны шарнир, магнитная губа и внутренняя OLED-панель.'
    },
    internals: {
        label: 'Внутренности кейса',
        readout: 'Компоненты',
        part: 'ai',
        camera: 'ai',
        progress: 0.72,
        caption: 'Батареи, AI-плата, Qi-катушка и зарядные контакты расходятся слоями без каши.'
    },
    signal: {
        label: 'Как работает наушник',
        readout: 'Сигнал',
        part: 'signal',
        camera: 'signal',
        progress: 1,
        caption: 'AI-плата отдает сигнал на контакт, вкладыш получает питание и двигает микродрайвер.'
    }
};

const zeroVector = new THREE.Vector3();
const zeroEuler = new THREE.Euler(0, 0, 0);

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

const sideOf = (lowerName) => {
    if (lowerName.includes('left') || lowerName.includes('_-1')) return -1;
    if (lowerName.includes('right') || lowerName.includes('_1')) return 1;
    return 0;
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));

ready(() => {
    const mount = document.getElementById('exploded-viewer');
    const canvas = document.getElementById('product-3d-canvas');
    const button = document.getElementById('anatomy-scan-toggle');
    const readout = document.getElementById('anatomy-readout');
    const progressFill = document.getElementById('anatomy-progress-fill');
    const loading = document.getElementById('model-loading');
    const partButtons = document.querySelectorAll('[data-viewer-part]');
    const stageButtons = document.querySelectorAll('[data-viewer-stage]');
    const caption = document.getElementById('anatomy-stage-caption');

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
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    camera.position.set(4.25, 2.45, 6.45);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = false;
    controls.minDistance = 4.35;
    controls.maxDistance = 9.4;
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 0.34;
    controls.target.set(0, 0.35, 0.04);

    const cameraPresets = {
        case: {
            position: new THREE.Vector3(4.25, 2.45, 6.45),
            target: new THREE.Vector3(0, 0.32, 0.08)
        },
        lid: {
            position: new THREE.Vector3(3.55, 2.85, 5.45),
            target: new THREE.Vector3(0, 0.86, -0.18)
        },
        buds: {
            position: new THREE.Vector3(3.05, 2.34, 5.0),
            target: new THREE.Vector3(0.16, 0.95, 0.04)
        },
        ai: {
            position: new THREE.Vector3(3.35, 2.68, 4.95),
            target: new THREE.Vector3(0, 0.72, 0.24)
        },
        battery: {
            position: new THREE.Vector3(3.75, 2.05, 5.18),
            target: new THREE.Vector3(0, 0.4, 0.34)
        },
        signal: {
            position: new THREE.Vector3(2.72, 2.36, 4.58),
            target: new THREE.Vector3(0.08, 0.94, 0.16)
        }
    };
    const cameraGoal = cameraPresets.case.position.clone();
    const targetGoal = cameraPresets.case.target.clone();
    let cameraPresetFrames = 0;

    const setCameraPreset = (key) => {
        const preset = cameraPresets[key] || cameraPresets.case;
        cameraGoal.copy(preset.position);
        targetGoal.copy(preset.target);
        cameraPresetFrames = reducedMotion ? 1 : 170;
    };

    scene.add(new THREE.AmbientLight(0x8aa6e8, 0.42));

    const key = new THREE.DirectionalLight(0xffffff, 2.85);
    key.position.set(4.2, 5.4, 5.0);
    scene.add(key);

    const cyan = new THREE.PointLight(0x00f0ff, 4.2, 8.5);
    cyan.position.set(-2.4, 1.9, 2.2);
    scene.add(cyan);

    const purple = new THREE.PointLight(0x8a2be2, 4.2, 8.5);
    purple.position.set(2.7, 0.7, 2.9);
    scene.add(purple);

    const frontFill = new THREE.DirectionalLight(0xd9f7ff, 1.5);
    frontFill.position.set(-2.2, 1.6, 4.6);
    scene.add(frontFill);

    const pivot = new THREE.Group();
    pivot.rotation.set(-0.04, -0.34, 0);
    scene.add(pivot);

    let model = null;
    let loaded = false;
    let targetProgress = 0;
    let progress = 0;
    let activePart = 'case';
    let activeStage = 'assembled';
    const meshes = [];

    const classifyMesh = (name) => {
        const lower = name.toLowerCase();
        const categories = new Set();

        if (lower.includes('signal_path') || lower.includes('sound_wavefront')) categories.add('signal');
        if (lower.includes('earbud') || lower.includes('driver') || lower.includes('diaphragm') || lower.includes('acoustic') || lower.includes('ear_tip')) categories.add('buds');
        if (lower.includes('fingerprint') || lower.includes('sensor') || lower.includes('mic_port')) categories.add('buds');
        if (lower.includes('battery') || lower.includes('qi_charging') || lower.includes('charge_pin') || lower.includes('contact_bus')) categories.add('battery');
        if (lower.includes('ai_core') || lower.includes('neural') || lower.includes('chip') || lower.includes('board') || lower.includes('trace') || lower.includes('ribbon')) categories.add('ai');
        if (lower.includes('oled') || lower.includes('hologram')) categories.add('ai');
        if (lower.includes('lid') || lower.includes('hinge') || lower.includes('magnetic_lip')) categories.add('lid');
        if (lower.startsWith('case') || lower.includes('well') || lower.includes('latch')) categories.add('case');
        if (!categories.size) categories.add('case');

        return Array.from(categories);
    };

    const stageOffsetFor = (name, stage) => {
        const lower = name.toLowerCase();
        const side = sideOf(lower);
        const isLid = lower.includes('case_lid') || lower.includes('lid_') || lower.includes('hinge_frame') || lower.includes('magnetic_lip');
        const isTopShell = lower.includes('case_top_smoked');
        const isHinge = lower.includes('case_precision_hinge');
        const isBatteryCell = lower.includes('battery_cell');
        const isBatteryRoute = lower.includes('battery_contact') || lower.includes('qi_charging') || lower.includes('charge_pin') || lower.includes('contact_bridge');
        const isBoard = lower.includes('ai_core') || lower.includes('neural') || lower.includes('chip') || lower.includes('board') || lower.includes('trace') || lower.includes('ribbon');
        const isEarbud = lower.includes('earbud');
        const isDriver = lower.includes('driver') || lower.includes('diaphragm') || lower.includes('sound_wavefront');
        const isSignal = lower.includes('signal_path') || lower.includes('sound_wavefront');

        if (stage === 'assembled') return zeroVector;

        if (stage === 'lid') {
            if (isLid) return new THREE.Vector3(0, 0.72, -0.5);
            if (isHinge) return new THREE.Vector3(0, 0.18, -0.1);
            if (isTopShell) return new THREE.Vector3(0, 0.12, -0.03);
            return zeroVector;
        }

        if (stage === 'internals') {
            if (isLid) return new THREE.Vector3(0, 1.08, -0.68);
            if (isTopShell) return new THREE.Vector3(0, 0.42, -0.08);
            if (isBatteryCell) return new THREE.Vector3(side * 0.18, 0.52, 0.44);
            if (isBatteryRoute) return new THREE.Vector3(side * 0.08, 0.3, 0.32);
            if (isBoard) return new THREE.Vector3(0, 0.72, 0.48);
            if (isEarbud) return new THREE.Vector3(side * 0.3, 0.42, 0.08);
            if (lower.includes('hologram')) return new THREE.Vector3(0, 0.62, 0.04);
            if (lower.includes('case_base')) return new THREE.Vector3(0, -0.08, 0);
            return zeroVector;
        }

        if (stage === 'signal') {
            if (isLid) return new THREE.Vector3(0, 1.0, -0.68);
            if (isTopShell) return new THREE.Vector3(0, 0.34, -0.08);
            if (isBoard) return new THREE.Vector3(0, 0.62, 0.42);
            if (isBatteryCell) return new THREE.Vector3(side * 0.14, 0.42, 0.34);
            if (isBatteryRoute) return new THREE.Vector3(side * 0.08, 0.36, 0.34);
            if (isEarbud) return new THREE.Vector3(side * 0.42, 0.52, 0.08);
            if (isDriver) return new THREE.Vector3(side * 0.55, 0.68, 0.2);
            if (isSignal) return new THREE.Vector3(side * 0.12, 0.58, 0.26);
            if (lower.includes('hologram')) return new THREE.Vector3(0, 0.7, 0.02);
        }

        return zeroVector;
    };

    const stageRotationFor = (name, stage) => {
        const lower = name.toLowerCase();
        const side = sideOf(lower);
        const isLid = lower.includes('case_lid') || lower.includes('lid_') || lower.includes('hinge_frame') || lower.includes('magnetic_lip');
        if (stage === 'assembled') return zeroEuler;
        if (isLid) return new THREE.Euler(-0.98, 0, 0);
        if (lower.includes('battery_cell')) return new THREE.Euler(0, 0, side * 0.09);
        if (lower.includes('ai_core') || lower.includes('board')) return new THREE.Euler(0.06, 0, -0.02);
        if (lower.includes('left_floating_earbud')) return new THREE.Euler(-0.05, -0.08, -0.14);
        if (lower.includes('right_docked_earbud')) return new THREE.Euler(-0.04, 0.06, 0.14);
        if (lower.includes('sound_wavefront')) return new THREE.Euler(0.04, 0, side * 0.08);
        return zeroEuler;
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

    const tuneMaterial = (mat) => {
        const name = (mat.name || '').toLowerCase();
        if (name.includes('smoked') || name.includes('transparent')) {
            mat.color.set(0x07101d);
            mat.transparent = true;
            mat.opacity = name.includes('lid') ? 0.34 : 0.3;
            mat.depthWrite = false;
            mat.metalness = 0.12;
            mat.roughness = 0.08;
            mat.envMapIntensity = 1.45;
            mat.side = THREE.DoubleSide;
        }
        if (name.includes('obsidian') || name.includes('ceramic')) {
            mat.color.set(0x04050c);
            mat.metalness = 0.68;
            mat.roughness = 0.1;
            mat.envMapIntensity = 2.35;
        }
        if (name.includes('oled') || name.includes('panel')) {
            mat.color.set(0x01030b);
            mat.metalness = 0.22;
            mat.roughness = 0.08;
            mat.envMapIntensity = 1.1;
        }
        if (name.includes('titanium')) {
            mat.metalness = 0.9;
            mat.roughness = 0.11;
            mat.envMapIntensity = 2.1;
        }
        if (name.includes('silicone')) {
            mat.color.set(0x0b0c13);
            mat.roughness = 0.42;
            mat.envMapIntensity = 0.85;
        }
        if (name.includes('copper') || name.includes('contact')) {
            mat.metalness = 0.74;
            mat.roughness = 0.18;
            mat.envMapIntensity = 1.5;
        }
        if (name.includes('cyan')) {
            mat.color.set(0x00f0ff);
            if (mat.emissive) mat.emissive.set(0x00c9ff);
            mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 2.35);
        }
        if (name.includes('violet') || name.includes('purple')) {
            mat.color.set(0x9b5cff);
            if (mat.emissive) mat.emissive.set(0x7c2cff);
            mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 2.65);
        }
    };

    const rememberMesh = (mesh) => {
        cloneMaterial(mesh);
        const categories = classifyMesh(mesh.name);
        mesh.userData.basePosition = mesh.position.clone();
        mesh.userData.baseScale = mesh.scale.clone();
        mesh.userData.baseQuaternion = mesh.quaternion.clone();
        mesh.userData.categories = categories;
        mesh.userData.baseEmissive = [];
        mesh.userData.baseEmissiveIntensity = [];
        mesh.userData.baseOpacity = [];

        eachMaterial(mesh, (mat, index) => {
            tuneMaterial(mat);
            if (categories.includes('signal')) {
                mat.transparent = true;
                mat.depthWrite = false;
            }
            mesh.userData.baseEmissive[index] = mat.emissive ? mat.emissive.clone() : null;
            mesh.userData.baseEmissiveIntensity[index] = typeof mat.emissiveIntensity === 'number' ? mat.emissiveIntensity : 0;
            mesh.userData.baseOpacity[index] = typeof mat.opacity === 'number' ? mat.opacity : 1;
            mat.needsUpdate = true;
        });
        meshes.push(mesh);
    };

    const setCaption = () => {
        if (!caption) return;
        const meta = stageMeta[activeStage] || stageMeta.assembled;
        caption.innerHTML = `<span>assembly state</span><strong>${meta.label}</strong><p>${meta.caption}</p>`;
    };

    const setReadout = () => {
        if (!readout) return;
        if (!loaded) {
            readout.textContent = 'Загрузка 3D-модели';
            return;
        }
        const meta = stageMeta[activeStage] || stageMeta.assembled;
        readout.textContent = `${meta.readout}: ${partLabels[activePart] || partLabels.case}`;
    };

    const updateButtons = () => {
        stageButtons.forEach((item) => {
            item.classList.toggle('is-active', item.dataset.viewerStage === activeStage);
        });
        partButtons.forEach((item) => {
            item.classList.toggle('is-active', item.dataset.viewerPart === activePart);
        });
        button.classList.toggle('is-open', activeStage !== 'assembled');
        button.setAttribute('aria-pressed', String(activeStage !== 'assembled'));
        button.textContent = activeStage === 'assembled' ? 'Разобрать кейс' : 'Собрать кейс';
    };

    const setStage = (stage, options = {}) => {
        activeStage = stageMeta[stage] ? stage : 'assembled';
        const meta = stageMeta[activeStage];
        if (options.syncPart !== false) {
            activePart = meta.part;
        }
        targetProgress = meta.progress;
        mount.dataset.phase = activeStage === 'assembled' ? 'sealed' : activeStage;
        controls.autoRotate = !reducedMotion && activeStage === 'assembled';
        setCameraPreset(meta.camera || activePart);
        updateButtons();
        setReadout();
        setCaption();
    };

    const partStage = (part) => {
        if (part === 'case') return activeStage === 'assembled' ? 'assembled' : 'internals';
        if (part === 'lid') return 'lid';
        if (part === 'signal' || part === 'buds') return part === 'signal' ? 'signal' : 'internals';
        return 'internals';
    };

    const setActivePart = (part) => {
        activePart = partLabels[part] ? part : 'case';
        setStage(partStage(activePart), { syncPart: false });
        setCameraPreset(activePart);
        updateButtons();
        setReadout();
    };

    button.addEventListener('click', () => {
        setStage(activeStage === 'assembled' ? 'internals' : 'assembled');
    });

    stageButtons.forEach((item) => {
        item.addEventListener('click', () => {
            setStage(item.dataset.viewerStage);
        });
    });

    partButtons.forEach((item) => {
        item.addEventListener('click', () => {
            setActivePart(item.dataset.viewerPart);
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
            model.scale.setScalar(4.26 / maxDim);
            pivot.add(model);

            loaded = true;
            mount.classList.add('is-loaded');
            if (loading) loading.textContent = 'GLB-модель загружена';
            setStage('assembled');
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

    const targetOpacityFor = (mesh, matIndex, isActive) => {
        const categories = mesh.userData.categories;
        const baseOpacity = mesh.userData.baseOpacity[matIndex] ?? 1;
        const isSignal = categories.includes('signal');
        const isTransparentSurface = baseOpacity < 0.98;
        if (activeStage === 'assembled' && isSignal) return 0.04;
        if (activeStage !== 'signal' && isSignal) return 0.12;
        if (activeStage === 'signal' && isSignal) return Math.max(baseOpacity, 0.88);
        if (activeStage !== 'assembled' && !isActive && !categories.includes('case')) {
            return isTransparentSurface ? baseOpacity : 0.64;
        }
        return baseOpacity;
    };

    const updateModel = () => {
        progress += (targetProgress - progress) * (reducedMotion ? 1 : 0.075);

        meshes.forEach((mesh) => {
            const lowerName = mesh.name.toLowerCase();
            const stageOffset = stageOffsetFor(mesh.name, activeStage);
            const target = mesh.userData.basePosition.clone().add(stageOffset);
            mesh.position.lerp(target, 0.22);

            const stageRotation = stageRotationFor(mesh.name, activeStage);
            const targetQuaternion = mesh.userData.baseQuaternion.clone().multiply(new THREE.Quaternion().setFromEuler(stageRotation));
            mesh.quaternion.slerp(targetQuaternion, 0.16);

            const categories = mesh.userData.categories;
            const isActive = categories.includes(activePart) || (activePart === 'case' && categories.includes('case'));
            const isStructuralCase = categories.includes('case') || categories.includes('lid');
            const isSignal = categories.includes('signal');
            const activeScale = isActive ? (isStructuralCase ? 1.012 : 1.045) : 1;
            const signalScale = activeStage === 'signal' && isSignal ? 1.08 : 1;
            mesh.scale.lerp(mesh.userData.baseScale.clone().multiplyScalar(activeScale * signalScale), 0.14);

            eachMaterial(mesh, (mat, index) => {
                const materialName = (mat.name || '').toLowerCase();
                const baseIntensity = mesh.userData.baseEmissiveIntensity[index] || 0;
                const canGlow = baseIntensity > 0.15 || materialName.includes('cyan') || materialName.includes('violet') || materialName.includes('purple');
                const shouldGlow = (isActive && canGlow) || (activeStage === 'signal' && isSignal);
                if (mat.emissive) {
                    const base = mesh.userData.baseEmissive[index] || new THREE.Color(0x000000);
                    const glowColor = activeStage === 'signal' && isSignal ? new THREE.Color(0x00f0ff) : new THREE.Color(0x8a2be2);
                    mat.emissive.lerp(shouldGlow ? glowColor : base, 0.12);
                }
                if (typeof mat.emissiveIntensity === 'number') {
                    const boost = activeStage === 'signal' && isSignal ? 2.8 : 1.35;
                    const targetIntensity = shouldGlow ? Math.max(baseIntensity, boost) : baseIntensity;
                    mat.emissiveIntensity += (targetIntensity - mat.emissiveIntensity) * 0.12;
                }

                const targetOpacity = clamp01(targetOpacityFor(mesh, index, isActive));
                if (targetOpacity < 0.98 || mat.transparent) {
                    mat.transparent = true;
                    mat.depthWrite = false;
                    mat.opacity += (targetOpacity - mat.opacity) * 0.14;
                    mat.needsUpdate = true;
                }
            });

            mesh.visible = !(activeStage === 'assembled' && categories.includes('signal'));
        });

        if (progressFill) {
            progressFill.style.transform = `scaleX(${clamp01(progress)})`;
        }
    };

    const render = () => {
        updateModel();
        if (cameraPresetFrames > 0) {
            camera.position.lerp(cameraGoal, reducedMotion ? 1 : 0.035);
            controls.target.lerp(targetGoal, reducedMotion ? 1 : 0.04);
            cameraPresetFrames -= 1;
        }
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    };
    render();

    window.NIKITKA_THREE_ANATOMY = {
        getState: () => ({
            loaded,
            phase: mount.dataset.phase,
            activeStage,
            stageLabel: stageMeta[activeStage]?.label,
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
        }),
        setStage
    };
});
