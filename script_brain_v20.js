// Log script start
console.log("Script loaded and executed.");

// Import necessary Three.js components
console.log("Scene, camera, and renderer initialized.");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
document.body.appendChild(renderer.domElement);

// Set initial camera position even farther away for a smaller perspective on the brain
camera.position.set(0, 0, 40); // Slightly increase the Z value to zoom out more

// Orbit Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Brighter directional light
directionalLight.position.set(10, 10, 10); // Position the light
directionalLight.castShadow = true; // Enable shadows from this light
scene.add(directionalLight);

// Load the GLB model
console.log("Attempting to load GLB model...");
const loader = new THREE.GLTFLoader();
let brain, dotCloud;

loader.load('brainBBBBB.glb', function (gltf) {
    console.log("GLB model loaded successfully!");
    brain = gltf.scene;
    brain.scale.set(0.5, 0.5, 0.5); // Adjust scale if necessary
    brain.position.set(0, 0, 0);

    // Set the material of the brain to pink initially
    brain.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({ color: 0xff69b4 }); // Set brain color to pink
            child.castShadow = true; // Enable shadows for the brain
            child.receiveShadow = true; // Enable the brain to receive shadows
        }
    });

    scene.add(brain);

    // Initialize quaternion for rotation
    brain.quaternion.set(0, 0, 0, 1);

    // Create and add the cloud of colored dots
    dotCloud = addColoredDotCloud();

    animate();
}, undefined, function (error) {
    console.error('An error happened while loading the GLB model:', error);
});

// Create a cloud of random colored dots surrounding the brain
function addColoredDotCloud() {
    const dotGeometry = new THREE.SphereGeometry(0.08, 38, 38);
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0x00ffff]; // Red, Green, Blue, Yellow, Cyan
    const dotGroup = new THREE.Group(); // Create a group to hold all dots

    for (let i = 0; i < 2000; i++) { // Adjust the number of dots as needed
        const dotMaterial = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)], opacity: 1, transparent: true });
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);

        // Randomly position dots within a certain radius around the brain
        const radius = 10 + Math.random() * 50; // Adjust the radius to control the cloud size (10 to create a donut hole)
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);

        dot.position.set(
            radius * Math.sin(phi) * Math.cos(theta), // X
            radius * Math.sin(phi) * Math.sin(theta), // Y
            radius * Math.cos(phi)                   // Z
        );

        dotGroup.add(dot);
    }

    scene.add(dotGroup);
    console.log("Colored dot cloud added around the brain.");
    return dotGroup; // Return the group so it can be rotated in the animate function
}

// Function to change dot colors
function changeDotColors(color, isRandom = false) {
    if (dotCloud) {
        dotCloud.children.forEach((dot) => {
            if (isRandom) {
                dot.material.color.set(getRandomColor());
            } else {
                dot.material.color.set(color);
            }
        });
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (brain) {
        const axis = new THREE.Vector3(0, 1, 0); // Rotation around Y-axis
        const angle = 0.002; // Rotation speed
        const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
        brain.quaternion.multiplyQuaternions(quaternion, brain.quaternion);
    }

    if (dotCloud) {
        dotCloud.rotation.y -= 0.002; // Rotate the dot cloud in the opposite direction
    }

    controls.update();
    renderer.render(scene, camera);
}

// Interaction zone to detect mouse/finger movement
function isWithinZone(x, y) {
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;
    const rectTop = screenHeight * 0.2; // Top boundary of the zone
    const rectBottom = screenHeight * 0.9; // Bottom boundary of the zone
    const rectLeft = screenWidth * 0.2; // Left boundary of the zone
    const rectRight = screenWidth * 0.8; // Right boundary of the zone

    return y > rectTop && y < rectBottom && x > rectLeft && x < rectRight;
}

// For web: handle mouse movements
document.addEventListener('mousemove', (event) => {
    if (isWithinZone(event.clientX, event.clientY)) {
        if (!toggle) {
            triggerColorChange();
        }
    } else {
        if (toggle) {
            triggerColorChange();
        }
    }
});

// For mobile: handle touch events
document.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    if (isWithinZone(touch.clientX, touch.clientY)) {
        if (!toggle) {
            triggerColorChange();
        }
    } else {
        if (toggle) {
            triggerColorChange();
        }
    }
});

// Trigger color change
let toggle = true; // To alternate between black/white and random colors

function triggerColorChange() {
    console.log("Color change triggered - toggling background, text, and dot colors.");
    const link = document.querySelector('#container a');

    if (toggle) {
        // Switch to random colors
        let newTextColor, newBgColor;

        do {
            newTextColor = getRandomColor();
            newBgColor = getRandomColor();
        } while (
            newTextColor === newBgColor || // Avoid matching text and background colors
            areColorsSimilar(newTextColor, newBgColor) // Avoid similar colors for text and background
        );

        // Apply new colors
        link.style.color = newTextColor;
        renderer.setClearColor(newBgColor);
        changeDotColors(newTextColor); // Change dots to match text color
    } else {
        // Switch back to black/white
        link.style.color = '#ffffff'; // Text to white
        renderer.setClearColor('#000000'); // Background to black
        changeDotColors(null, true); // Change dots back to random colors
    }

    // Toggle for next movement
    toggle = !toggle;
}

// Function to get a random color from the defined set
function getRandomColor() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff']; // Red, Green, Blue, Yellow, Cyan
    return colors[Math.floor(Math.random() * colors.length)];
}

// Function to check if two colors are similar
function areColorsSimilar(color1, color2) {
    const similarPairs = [
        ['#ff0000', '#ff00ff'], // Red and Magenta (even though magenta is removed)
        ['#00ff00', '#ffff00'], // Green and Yellow
        ['#0000ff', '#00ffff']  // Blue and Cyan
    ];
    return similarPairs.some(pair => pair.includes(color1) && pair.includes(color2));
}

// Trigger color change on page load
triggerColorChange();