import * as THREE from 'three';

const ready = (callback) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
};

ready(() => {
    const mount = document.getElementById('exploded-viewer');
    const canvas = document.getElementById('anatomy-canvas');
    const button = document.getElementById('anatomy-scan-toggle');
    const readout = document.getElementById('anatomy-readout');
    const progressFill = document.getElementById('anatomy-progress-fill');

    if (!mount || !canvas || !button) return;

    const hasWebGL = (() => {
        try {
            const testCanvas = document.createElement('canvas');
            return Boolean(window.WebGLRenderingContext && (
                testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')
            ));
        } catch {
            return false;
        }
    })();

    if (!hasWebGL) {
        mount.classList.add('webgl-missing');
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

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.22, 6.3);

    const root = new THREE.Group();
    root.rotation.set(-0.08, -0.22, 0);
    scene.add(root);

    scene.add(new THREE.AmbientLight(0x8ea6ff, 0.58));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3.6, 3.2, 5.2);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x00f0ff, 4.2, 8.5);
    rimLight.position.set(-2.2, 1.2, 2.6);
    scene.add(rimLight);

    const purpleLight = new THREE.PointLight(0x8a2be2, 3.2, 7);
    purpleLight.position.set(2.5, -1.1, 2.2);
    scene.add(purpleLight);

    const materials = {
        smokedGlass: new THREE.MeshPhysicalMaterial({
            color: 0x0f1524,
            roughness: 0.18,
            metalness: 0.08,
            transmission: 0.42,
            thickness: 0.48,
            transparent: true,
            opacity: 0.58,
            ior: 1.42,
            clearcoat: 1,
            clearcoatRoughness: 0.08
        }),
        carbonShell: new THREE.MeshPhysicalMaterial({
            color: 0x070812,
            roughness: 0.34,
            metalness: 0.48,
            clearcoat: 1,
            clearcoatRoughness: 0.12
        }),
        ceramicBlack: new THREE.MeshPhysicalMaterial({
            color: 0x050510,
            roughness: 0.21,
            metalness: 0.36,
            clearcoat: 1,
            clearcoatRoughness: 0.06
        }),
        driverMetal: new THREE.MeshStandardMaterial({
            color: 0xb7c7d8,
            roughness: 0.22,
            metalness: 0.88
        }),
        driverMesh: new THREE.MeshStandardMaterial({
            color: 0x121826,
            roughness: 0.45,
            metalness: 0.68
        }),
        cyan: new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x00d7ff,
            emissiveIntensity: 1.25,
            roughness: 0.22,
            metalness: 0.28
        }),
        purple: new THREE.MeshStandardMaterial({
            color: 0x8a2be2,
            emissive: 0x6d28d9,
            emissiveIntensity: 0.9,
            roughness: 0.28,
            metalness: 0.25
        }),
        pcb: new THREE.MeshStandardMaterial({
            color: 0x052c36,
            emissive: 0x003544,
            emissiveIntensity: 0.38,
            roughness: 0.32,
            metalness: 0.5
        }),
        chip: new THREE.MeshStandardMaterial({
            color: 0x06e7ff,
            emissive: 0x00c8ff,
            emissiveIntensity: 0.95,
            roughness: 0.18,
            metalness: 0.42
        })
    };

    const parts = [];
    const addPart = (name, group, sealed, exploded, threshold) => {
        group.position.copy(sealed);
        group.userData = { name, sealed, exploded, threshold };
        parts.push(group);
        root.add(group);
        return group;
    };

    const makeEllipsoid = (material, scale, rotation = [0, 0, 0]) => {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 48), material);
        mesh.scale.set(scale.x, scale.y, scale.z);
        mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
        return mesh;
    };

    const makeCylinder = (radius, depth, material, radialSegments = 96) => {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, radialSegments), material);
        mesh.rotation.x = Math.PI / 2;
        return mesh;
    };

    const makeCapsule = (radius, length, material, rotation = [0, 0, 0]) => {
        const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 14, 48), material);
        mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
        return mesh;
    };

    const shell = new THREE.Group();
    shell.add(makeEllipsoid(materials.smokedGlass, { x: 0.66, y: 1.2, z: 0.28 }));
    const shellRim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.018, 24, 128), materials.cyan);
    shellRim.scale.set(0.72, 1.24, 0.15);
    shell.add(shellRim);
    const nozzle = makeCapsule(0.16, 0.58, materials.ceramicBlack, [0.12, 0, 0.86]);
    nozzle.position.set(-0.5, -0.72, 0.1);
    shell.add(nozzle);
    const siliconeTip = makeEllipsoid(materials.smokedGlass, { x: 0.3, y: 0.18, z: 0.18 }, [0.08, 0, 0.86]);
    siliconeTip.position.set(-0.78, -0.94, 0.12);
    shell.add(siliconeTip);
    const acousticPort = makeCylinder(0.08, 0.06, materials.cyan, 48);
    acousticPort.position.set(-0.62, -0.82, 0.24);
    acousticPort.scale.y = 0.48;
    shell.add(acousticPort);
    addPart('shell', shell, new THREE.Vector3(-0.1, 0, -0.02), new THREE.Vector3(-1.22, 0, -0.16), 0.18);

    const driver = new THREE.Group();
    const driverBody = makeCylinder(0.54, 0.16, materials.driverMetal);
    driverBody.scale.y = 0.42;
    driver.add(driverBody);
    const driverMesh = makeCylinder(0.39, 0.18, materials.driverMesh);
    driverMesh.scale.y = 0.42;
    driverMesh.position.z = 0.03;
    driver.add(driverMesh);
    const driverRing = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.03, 24, 128), materials.purple);
    driverRing.scale.y = 0.52;
    driverRing.position.z = 0.12;
    driver.add(driverRing);
    const driverCore = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 24), materials.cyan);
    driverCore.scale.set(1, 1, 0.36);
    driverCore.position.z = 0.22;
    driver.add(driverCore);
    for (let i = 0; i < 12; i += 1) {
        const angle = (i / 12) * Math.PI * 2;
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.26, 0.032), materials.driverMetal);
        spoke.position.set(Math.cos(angle) * 0.24, Math.sin(angle) * 0.24, 0.2);
        spoke.rotation.z = angle;
        driver.add(spoke);
    }
    addPart('driver', driver, new THREE.Vector3(0.05, 0, 0.05), new THREE.Vector3(-0.38, 0.02, 0.1), 0.42);

    const board = new THREE.Group();
    const boardPlate = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.74, 0.08), materials.pcb);
    boardPlate.rotation.z = -0.08;
    board.add(boardPlate);
    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.09), materials.chip);
    chip.position.z = 0.08;
    board.add(chip);
    const neuralChip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.08), materials.driverMetal);
    neuralChip.position.set(0.16, -0.24, 0.1);
    neuralChip.rotation.z = -0.08;
    board.add(neuralChip);
    for (let i = -1; i <= 1; i += 1) {
        const trace = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.62, 0.035), materials.cyan);
        trace.position.set(i * 0.17, 0, 0.11);
        trace.rotation.z = i * 0.14;
        board.add(trace);
    }
    addPart('board', board, new THREE.Vector3(0.15, -0.01, 0.02), new THREE.Vector3(0.42, -0.02, 0.02), 0.68);

    const battery = new THREE.Group();
    const batteryCell = makeCapsule(0.13, 0.54, materials.driverMetal, [0, 0, -0.18]);
    batteryCell.scale.z = 0.5;
    battery.add(batteryCell);
    const batteryGlow = makeCapsule(0.06, 0.34, materials.purple, [0, 0, -0.18]);
    batteryGlow.position.z = 0.13;
    batteryGlow.scale.z = 0.24;
    battery.add(batteryGlow);
    addPart('battery', battery, new THREE.Vector3(0.12, -0.16, 0.03), new THREE.Vector3(0.73, -0.6, 0.06), 0.78);

    const cap = new THREE.Group();
    cap.add(makeEllipsoid(materials.ceramicBlack, { x: 0.7, y: 1.24, z: 0.32 }, [0, -0.1, 0]));
    const faceGlow = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.016, 24, 96), materials.cyan);
    faceGlow.position.z = 0.32;
    cap.add(faceGlow);
    const faceCore = new THREE.Mesh(new THREE.SphereGeometry(0.18, 40, 24), materials.cyan);
    faceCore.scale.set(1, 1, 0.22);
    faceCore.position.z = 0.34;
    cap.add(faceCore);
    const accentLine = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.86, 0.035), materials.purple);
    accentLine.position.z = 0.36;
    cap.add(accentLine);
    addPart('sensor', cap, new THREE.Vector3(0.08, 0, 0.08), new THREE.Vector3(1.14, 0.02, 0.08), 0.88);

    const orbit = new THREE.Group();
    const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.006, 16, 160), new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.18
    }));
    orbitRing.scale.y = 0.68;
    orbit.add(orbitRing);
    const orbitRing2 = orbitRing.clone();
    orbitRing2.rotation.y = Math.PI / 2;
    orbitRing2.material = orbitRing.material.clone();
    orbitRing2.material.opacity = 0.11;
    orbit.add(orbitRing2);
    root.add(orbit);

    let targetProgress = 0;
    let progress = 0;
    let targetRotationY = -0.22;
    let targetRotationX = -0.08;
    let dragging = false;
    let lastPointer = { x: 0, y: 0 };

    const labels = [
        { threshold: 0, label: 'Цельный модуль' },
        { threshold: 0.18, label: 'Корпус отделен' },
        { threshold: 0.42, label: 'Акустический драйвер' },
        { threshold: 0.68, label: 'AI-чип раскрыт' },
        { threshold: 0.78, label: 'Графеновая батарея' },
        { threshold: 0.88, label: 'Сенсорная крышка' }
    ];

    const getLabel = (value) => labels.reduce((current, item) => (
        value >= item.threshold ? item : current
    ), labels[0]).label;

    const setTarget = (value) => {
        targetProgress = value;
        const isOpen = value > 0.5;
        button.classList.toggle('is-open', isOpen);
        button.setAttribute('aria-pressed', String(isOpen));
        button.textContent = isOpen ? 'Собрать модуль' : 'Разобрать модуль';
        mount.dataset.phase = isOpen ? 'open' : 'sealed';
    };

    button.addEventListener('click', () => {
        setTarget(targetProgress > 0.5 ? 0 : 1);
    });

    mount.addEventListener('pointerdown', (event) => {
        dragging = true;
        lastPointer = { x: event.clientX, y: event.clientY };
        mount.setPointerCapture(event.pointerId);
    });

    mount.addEventListener('pointermove', (event) => {
        if (!dragging) return;
        const dx = event.clientX - lastPointer.x;
        const dy = event.clientY - lastPointer.y;
        targetRotationY += dx * 0.008;
        targetRotationX = THREE.MathUtils.clamp(targetRotationX + (dy * 0.005), -0.45, 0.28);
        lastPointer = { x: event.clientX, y: event.clientY };
    });

    const releasePointer = (event) => {
        dragging = false;
        if (event.pointerId && mount.hasPointerCapture(event.pointerId)) {
            mount.releasePointerCapture(event.pointerId);
        }
    };

    mount.addEventListener('pointerup', releasePointer);
    mount.addEventListener('pointercancel', releasePointer);
    mount.addEventListener('pointerleave', () => {
        dragging = false;
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

    const updateParts = () => {
        progress += (targetProgress - progress) * (reducedMotion ? 1 : 0.075);
        const eased = progress * progress * (3 - (2 * progress));

        parts.forEach((part) => {
            part.position.lerpVectors(part.userData.sealed, part.userData.exploded, eased);
            const focus = THREE.MathUtils.smoothstep(eased, part.userData.threshold - 0.08, part.userData.threshold + 0.12);
            part.scale.setScalar(0.96 + (focus * 0.06));
        });

        orbit.rotation.z += reducedMotion ? 0 : 0.0025;
        root.rotation.y += (targetRotationY - root.rotation.y) * 0.08;
        root.rotation.x += (targetRotationX - root.rotation.x) * 0.08;
        if (!dragging && !reducedMotion) targetRotationY += 0.0018;

        if (progressFill) progressFill.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
        if (readout) readout.textContent = getLabel(progress);
    };

    const render = () => {
        updateParts();
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    };

    render();

    window.NIKITKA_THREE_ANATOMY = {
        getState: () => ({
            progress,
            targetProgress,
            phase: mount.dataset.phase,
            label: readout ? readout.textContent : '',
            partCount: parts.length,
            isWebGL2: renderer.capabilities.isWebGL2,
            canvas: {
                width: canvas.width,
                height: canvas.height
            }
        })
    };
});
