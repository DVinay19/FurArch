
import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";

const viewer = document.getElementById("room3d");
const project = window.FURARCH?.project || {};

const STAGES = [
  {
    title: "Stage 1 — Empty room",
    description: "Explore the empty architectural shell in three dimensions.",
    progress: 10
  },
  {
    title: "Stage 2 — Structure and services",
    description: "Reveal the window, architectural details and indicative services.",
    progress: 30
  },
  {
    title: "Stage 3 — Materials and finishes",
    description: "Apply the proposed floor, rug, wall finishes and materials.",
    progress: 55
  },
  {
    title: "Stage 4 — Furniture installation",
    description: "See furniture arranged for your selected room type.",
    progress: 80
  },
  {
    title: "Stage 5 — Final styling",
    description: "Complete the room with decorative objects and plants.",
    progress: 100
  }
];

let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let resizeObserver = null;
let animationFrame = null;
let playTimer = null;

let currentStage = 0;
let isPlaying = false;
let autoRotate = false;

let roomLength = 12;
let roomWidth = 10;
let roomHeight = 8;

let structureGroup = null;
let servicesGroup = null;
let architectureGroup = null;
let finishesGroup = null;
let furnitureGroup = null;
let decorGroup = null;

const namedMaterials = {};

function createMaterial(name, color, roughness = 0.8, metalness = 0) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness
  });

  namedMaterials[name] = material;
  return material;
}

function addGroup(parent, name) {
  const result = new THREE.Group();
  result.name = name;
  parent.add(result);
  return result;
}

function addBox(parent, size, position, material, name = "") {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    material
  );

  mesh.position.set(position[0], position[1], position[2]);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

function addCylinder(parent, radiusTop, radiusBottom, height, position, material, name = "") {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 20),
    material
  );

  mesh.position.set(...position);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

function addSphere(parent, radius, position, material, name = "") {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 16, 12),
    material
  );

  mesh.position.set(...position);
  mesh.name = name;
  mesh.castShadow = true;
  parent.add(mesh);

  return mesh;
}

// Decorative plant with a pot, stems and several leaves.
function addPlant(parent, x, z) {
  const plant = addGroup(parent, "Decorative plant");
  plant.position.set(x, 0, z);

  addCylinder(
    plant, 0.16, 0.22, 0.38,
    [0, 0.19, 0],
    createMaterial("Plant pot", "#ad7755"),
    "Plant pot"
  );

  const stemMaterial = createMaterial("Plant stems", "#486c4d");
  const leafMaterials = [
    createMaterial("Plant leaves A", "#527d55"),
    createMaterial("Plant leaves B", "#78966d"),
    createMaterial("Plant leaves C", "#355c43")
  ];

  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI * 2 / 8;
    const height = 0.65 + (i % 3) * 0.12;

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.025, height, 8),
      stemMaterial
    );

    stem.position.set(
      Math.cos(angle) * 0.08,
      0.38 + height / 2,
      Math.sin(angle) * 0.08
    );

    stem.rotation.z = Math.cos(angle) * 0.2;
    plant.add(stem);

    const leaf = addSphere(
      plant,
      0.12,
      [
        Math.cos(angle) * 0.2,
        0.65 + (i % 3) * 0.12,
        Math.sin(angle) * 0.2
      ],
      leafMaterials[i % leafMaterials.length],
      "Plant leaf"
    );

    leaf.scale.set(0.7, 1.7, 0.65);
  }

  return plant;
}

// Living-room sofa.
function addSofa(parent, x, z) {
  const sofa = addGroup(parent, "Living room sofa");
  sofa.position.set(x, 0, z);

  const sofaWidth = Math.min(3.4, roomLength * 0.38);

  const fabric = createMaterial("Sofa fabric", "#819985");
  const cushions = createMaterial("Sofa cushions", "#c3d0bd");
  const darkFabric = createMaterial("Sofa back fabric", "#647b68");
  const wood = createMaterial("Sofa feet", "#493d32");

  addBox(sofa, [sofaWidth, 0.42, 0.95], [0, 0.38, 0], fabric, "Sofa base");
  addBox(sofa, [sofaWidth, 0.72, 0.19], [0, 0.76, -0.38], darkFabric, "Sofa back");

  addBox(
    sofa, [0.18, 0.58, 0.88],
    [-sofaWidth / 2 + 0.08, 0.57, 0.02],
    fabric, "Sofa left arm"
  );

  addBox(
    sofa, [0.18, 0.58, 0.88],
    [sofaWidth / 2 - 0.08, 0.57, 0.02],
    fabric, "Sofa right arm"
  );

  for (let i = 0; i < 3; i++) {
    const cushionWidth = (sofaWidth - 0.5) / 3;

    addBox(
      sofa,
      [cushionWidth - 0.04, 0.12, 0.59],
      [-sofaWidth / 3 + i * sofaWidth / 3, 0.64, 0.08],
      cushions,
      "Seat cushion"
    );
  }

  for (const px of [-sofaWidth * 0.39, sofaWidth * 0.39]) {
    for (const pz of [-0.3, 0.3]) {
      addBox(sofa, [0.08, 0.2, 0.08], [px, 0.1, pz], wood, "Sofa leg");
    }
  }

  return sofa;
}

// Four-legged coffee table.
function addCoffeeTable(parent, x, z) {
  const table = addGroup(parent, "Coffee table");
  table.position.set(x, 0, z);

  const top = createMaterial("Coffee table wood", "#a77d52", 0.45);
  const legs = createMaterial("Coffee table legs", "#5a4937");

  addBox(table, [1.4, 0.12, 0.82], [0, 0.46, 0], top, "Tabletop");

  for (const px of [-0.55, 0.55]) {
    for (const pz of [-0.3, 0.3]) {
      addBox(table, [0.07, 0.43, 0.07], [px, 0.22, pz], legs, "Table leg");
    }
  }

  return table;
}

// Bedroom layout.
function addBed(parent, x, z) {
  const bed = addGroup(parent, "Bedroom bed");
  bed.position.set(x, 0, z);

  const frame = createMaterial("Bed frame", "#76583f");
  const mattress = createMaterial("Mattress", "#f1eee7");
  const pillow = createMaterial("Bedroom pillows", "#d7ded5");

  addBox(bed, [2.2, 0.3, 2.8], [0, 0.28, 0], frame, "Bed frame");
  addBox(bed, [2.1, 0.19, 2.65], [0, 0.53, 0], mattress, "Mattress");
  addBox(bed, [2.2, 0.85, 0.12], [0, 0.7, -1.38], frame, "Headboard");

  addBox(bed, [0.7, 0.12, 0.4], [-0.48, 0.67, -0.85], pillow, "Pillow left");
  addBox(bed, [0.7, 0.12, 0.4], [0.48, 0.67, -0.85], pillow, "Pillow right");

  return bed;
}

function addWardrobe(parent) {
  const wardrobe = addGroup(parent, "Bedroom wardrobe");
  wardrobe.position.set(-roomLength * 0.30, 0, -roomWidth * 0.15);

  const wood = createMaterial("Wardrobe wood", "#b8a087");
  const trim = createMaterial("Wardrobe trim", "#8b7259");

  addBox(wardrobe, [0.75, 2.5, 0.75], [0, 1.25, 0], wood, "Wardrobe body");
  addBox(wardrobe, [0.025, 2.35, 0.04], [0, 1.25, 0.39], trim, "Wardrobe divider");

  for (const x of [-0.18, 0.18]) {
    addSphere(wardrobe, 0.035, [x, 1.25, 0.42], trim, "Wardrobe handle");
  }
}

function addKitchen(parent) {
  const kitchen = addGroup(parent, "Kitchen layout");

  const cabinet = createMaterial("Kitchen cabinets", "#c5b39b");
  const counter = createMaterial("Kitchen counters", "#e8e1d5", 0.35);

  addBox(
    kitchen,
    [roomLength * 0.55, 1.05, 0.65],
    [0, 0.53, -roomWidth * 0.31],
    cabinet,
    "Kitchen base cabinets"
  );

  addBox(
    kitchen,
    [roomLength * 0.57, 0.09, 0.72],
    [0, 1.08, -roomWidth * 0.31],
    counter,
    "Kitchen counter"
  );

  addBox(
    kitchen,
    [roomLength * 0.33, 0.94, 0.5],
    [0, 0.47, -roomWidth * 0.43],
    createMaterial("Kitchen upper cabinets", "#d9d0c1"),
    "Kitchen upper cabinets"
  );

  addBox(
    kitchen,
    [Math.min(2.5, roomLength * 0.25), 0.12, 1.1],
    [roomLength * 0.12, 0.95, roomWidth * 0.12],
    createMaterial("Kitchen island", "#ddd5c8"),
    "Kitchen island"
  );

  // Indicate a sink within the counter.
  addBox(
    kitchen,
    [0.55, 0.025, 0.34],
    [-roomLength * 0.12, 1.135, -roomWidth * 0.31],
    createMaterial("Kitchen sink", "#687e80", 0.25, 0.3),
    "Kitchen sink"
  );

  return kitchen;
}

// Office desk, monitor and chair.
function addOffice(parent) {
  const office = addGroup(parent, "Office layout");

  addBox(
    office,
    [Math.min(2.8, roomLength * 0.32), 0.12, 0.9],
    [0, 0.82, -roomWidth * 0.22],
    createMaterial("Office desk", "#a7835b"),
    "Office desk"
  );

  addBox(
    office,
    [0.8, 0.48, 0.08],
    [0, 1.12, -roomWidth * 0.27],
    createMaterial("Computer monitor", "#303a3a", 0.25),
    "Computer monitor"
  );

  addBox(
    office,
    [0.72, 0.12, 0.72],
    [0, 0.48, roomWidth * 0.02],
    createMaterial("Office chair seat", "#788d7b"),
    "Office chair seat"
  );

  addBox(
    office,
    [0.72, 0.8, 0.12],
    [0, 0.85, roomWidth * 0.05],
    createMaterial("Office chair back", "#536b5a"),
    "Office chair back"
  );

  return office;
}

// Dining table with four chairs.
function addDiningRoom(parent) {
  const dining = addGroup(parent, "Dining room layout");
  const wood = createMaterial("Dining table wood", "#98734e");
  const chairMaterial = createMaterial("Dining chair wood", "#846347");

  addBox(dining, [1.9, 0.14, 1.0], [0, 0.8, 0], wood, "Dining table");

  for (const x of [-0.78, 0.78]) {
    for (const z of [-0.35, 0.35]) {
      addBox(dining, [0.08, 0.76, 0.08], [x, 0.38, z], wood, "Dining table leg");
    }
  }

  function chair(x, z, angle) {
    const seat = addGroup(dining, "Dining chair");
    seat.position.set(x, 0, z);
    seat.rotation.y = angle;

    addBox(seat, [0.48, 0.12, 0.48], [0, 0.48, 0], chairMaterial, "Chair seat");
    addBox(seat, [0.48, 0.65, 0.1], [0, 0.8, -0.19], chairMaterial, "Chair back");

    for (const cx of [-0.17, 0.17]) {
      for (const cz of [-0.17, 0.17]) {
        addBox(seat, [0.055, 0.47, 0.055], [cx, 0.23, cz], chairMaterial, "Chair leg");
      }
    }
  }

  chair(0, -1.05, 0);
  chair(0, 1.05, Math.PI);
  chair(-1.18, 0, Math.PI / 2);
  chair(1.18, 0, -Math.PI / 2);

  return dining;
}

function addWindow() {
  const group = addGroup(architectureGroup, "Window assembly");

  const windowWidth = Math.min(3.2, roomLength * 0.34);
  const windowHeight = Math.min(2.1, roomHeight * 0.34);
  const y = roomHeight * 0.63;
  const z = -roomWidth / 2 + 0.1;
  const x = roomLength * 0.12;

  addBox(
    group,
    [windowWidth, windowHeight, 0.045],
    [x, y, z],
    createMaterial("Window glass", "#b9d2d1", 0.2, 0.1),
    "Window glass"
  );

  const frame = createMaterial("Window frame", "#f2eee5");

  addBox(group, [windowWidth + 0.16, 0.09, 0.1], [x, y + windowHeight / 2, z + 0.04], frame, "Window top frame");
  addBox(group, [windowWidth + 0.16, 0.09, 0.1], [x, y - windowHeight / 2, z + 0.04], frame, "Window bottom frame");
  addBox(group, [0.09, windowHeight, 0.1], [x - windowWidth / 2, y, z + 0.04], frame, "Window left frame");
  addBox(group, [0.09, windowHeight, 0.1], [x + windowWidth / 2, y, z + 0.04], frame, "Window right frame");
  addBox(group, [0.05, windowHeight, 0.11], [x, y, z + 0.05], frame, "Window divider");
}

function buildFurniture() {
  if (!furnitureGroup || !decorGroup) return;

  const roomType = String(
    viewer?.dataset.room ||
    project.room_type ||
    "Living Room"
  ).toLowerCase();

  console.log("FurArch 3D room type:", roomType);

  if (roomType.includes("bed")) {
    addBed(furnitureGroup, 0, -roomWidth * 0.10);
    addWardrobe(furnitureGroup);

    addBox(
      furnitureGroup,
      [0.55, 0.48, 0.48],
      [roomLength * 0.18, 0.24, -roomWidth * 0.25],
      createMaterial("Bedside table", "#8c6d50"),
      "Bedside table"
    );

  } else if (roomType.includes("kitchen")) {
    addKitchen(furnitureGroup);

  } else if (roomType.includes("office") || roomType.includes("study")) {
    addOffice(furnitureGroup);

  } else if (roomType.includes("dining")) {
    addDiningRoom(furnitureGroup);

  } else {
    addSofa(furnitureGroup, 0, -roomWidth * 0.13);
    addCoffeeTable(furnitureGroup, 0, roomWidth * 0.19);

    addBox(
      furnitureGroup,
      [0.58, 0.5, 0.52],
      [roomLength * 0.32, 0.25, roomWidth * 0.12],
      createMaterial("Living room side table", "#947452"),
      "Side table"
    );
  }

  addPlant(decorGroup, roomLength * 0.34, -roomWidth * 0.23);

  addBox(
    decorGroup,
    [0.65, 0.95, 0.07],
    [-roomLength * 0.25, roomHeight * 0.58, -roomWidth / 2 + 0.15],
    createMaterial("Wall artwork", "#b68b68"),
    "Wall artwork"
  );

  addBox(
    decorGroup,
    [0.55, 0.06, 0.06],
    [roomLength * 0.2, roomHeight * 0.75, -roomWidth * 0.05],
    createMaterial("Pendant light", "#d0a968", 0.3),
    "Pendant light"
  );

  const accentLight = new THREE.PointLight("#ffdda8", 16, 12);
  accentLight.position.set(roomLength * 0.2, roomHeight * 0.72, -roomWidth * 0.05);
  decorGroup.add(accentLight);
}

function buildRoom() {
  if (!viewer) return;

  roomLength = Math.max(6, Math.min(30, Number(viewer.dataset.length || project.length) || 12));
  roomWidth = Math.max(6, Math.min(30, Number(viewer.dataset.width || project.width) || 10));
  roomHeight = Math.max(6, Math.min(14, Number(viewer.dataset.height || project.height) || 8));

  const wallColor = viewer.dataset.wall || project.wall_color || "#e7ded0";
  const floorColor = viewer.dataset.floor || project.floor_color || "#b78c63";

  viewer.style.position = "relative";
  viewer.style.display = "block";
  viewer.style.width = "100%";
  viewer.style.height = "min(68vh, 680px)";
  viewer.style.minHeight = "440px";
  viewer.style.overflow = "hidden";
  viewer.style.borderRadius = "18px";
  viewer.style.background = "#e9e6dd";

  scene = new THREE.Scene();
  scene.background = new THREE.Color("#e9e6dd");

  camera = new THREE.PerspectiveCamera(
    42,
    Math.max(viewer.clientWidth, 1) / Math.max(viewer.clientHeight, 1),
    0.1,
    150
  );

  camera.position.set(roomLength * 1.05, roomHeight * 0.95, roomWidth * 1.45);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(Math.max(viewer.clientWidth, 1), Math.max(viewer.clientHeight, 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  renderer.domElement.style.cssText =
    "position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:none;";

  const stageLabel = document.createElement("div");
  stageLabel.id = "stageTitle";
  stageLabel.className = "four-d-label";
  stageLabel.textContent = STAGES[0].title;
  stageLabel.style.cssText =
    "position:absolute;left:18px;bottom:18px;z-index:3;pointer-events:none;background:#fffdf3;color:#24352c;padding:12px 16px;border-radius:12px;font-weight:800;box-shadow:0 4px 18px #00000012;";

  viewer.replaceChildren(renderer.domElement, stageLabel);

  scene.add(new THREE.HemisphereLight("#fff8eb", "#797f74", 2));

  const sunlight = new THREE.DirectionalLight("#fff0d6", 3);
  sunlight.position.set(-roomLength, roomHeight * 2.2, roomWidth);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  scene.add(sunlight);

  const fill = new THREE.PointLight("#f5d8b3", 35, 40);
  fill.position.set(0, roomHeight * 0.85, roomWidth * 0.2);
  scene.add(fill);

  const room = addGroup(scene, "FurArch 3D room");

  structureGroup = addGroup(room, "Room structure");
  servicesGroup = addGroup(room, "Indicative services");
  architectureGroup = addGroup(room, "Architecture");
  finishesGroup = addGroup(room, "Materials and finishes");
  furnitureGroup = addGroup(room, "Furniture");
  decorGroup = addGroup(furnitureGroup, "Final styling");

  // Actual room shell: floor slab, back wall and left wall.
  addBox(
    structureGroup,
    [roomLength, 0.2, roomWidth],
    [0, -0.1, 0],
    createMaterial("Structural slab", "#aaa69c"),
    "Structural slab"
  );

  addBox(
    structureGroup,
    [roomLength, roomHeight, 0.16],
    [0, roomHeight / 2, -roomWidth / 2],
    createMaterial("Back wall", wallColor),
    "Back wall"
  );

  addBox(
    structureGroup,
    [0.16, roomHeight, roomWidth],
    [-roomLength / 2, roomHeight / 2, 0],
    createMaterial("Left wall", wallColor),
    "Left wall"
  );

  // Architectural baseboards.
  addBox(
    architectureGroup,
    [roomLength, 0.14, 0.08],
    [0, 0.07, -roomWidth / 2 + 0.09],
    createMaterial("Back baseboard", "#b4a693"),
    "Back baseboard"
  );

  addBox(
    architectureGroup,
    [0.08, 0.14, roomWidth],
    [-roomLength / 2 + 0.09, 0.07, 0],
    createMaterial("Left baseboard", "#b4a693"),
    "Left baseboard"
  );

  addWindow();

  // Indicative visual service routes, not construction instructions.
  addBox(
    servicesGroup,
    [roomLength * 0.55, 0.055, 0.055],
    [0, 0.08, -roomWidth * 0.25],
    createMaterial("Service route one", "#bd854d"),
    "Service route"
  );

  addBox(
    servicesGroup,
    [0.055, 0.055, roomWidth * 0.42],
    [-roomLength * 0.22, 0.08, 0],
    createMaterial("Service route two", "#62879a"),
    "Cross service route"
  );

  // Finish layer.
  addBox(
    finishesGroup,
    [roomLength * 0.995, 0.025, roomWidth * 0.995],
    [0, 0.018, 0],
    createMaterial("Finished floor", floorColor, 0.55),
    "Finished floor"
  );

  addBox(
    finishesGroup,
    [roomLength * 0.43, roomHeight * 0.38, 0.035],
    [roomLength * 0.1, roomHeight * 0.56, -roomWidth / 2 + 0.105],
    createMaterial("Decorative wall panel", "#d3c0a5"),
    "Decorative wall panel"
  );

  addBox(
    finishesGroup,
    [Math.min(4.6, roomLength * 0.47), 0.045, Math.min(3.2, roomWidth * 0.43)],
    [0, 0.048, roomWidth * 0.12],
    createMaterial("Area rug", "#d7c5ae"),
    "Area rug"
  );

  buildFurniture();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.target.set(0, roomHeight * 0.34, 0);
  controls.minDistance = 4;
  controls.maxDistance = 45;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.update();

  const resize = () => {
    if (!renderer || !camera || !viewer) return;

    const width = viewer.clientWidth;
    const height = viewer.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(viewer);
  } else {
    window.addEventListener("resize", resize);
  }

  function animate() {
    animationFrame = requestAnimationFrame(animate);

    if (!renderer || !scene || !camera) return;

    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.65;
    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  const dimensions = document.getElementById("roomDimensions");
  if (dimensions) {
    dimensions.textContent = `${roomLength} × ${roomWidth} ft · ${roomHeight} ft high`;
  }
}

// Animate a newly revealed layer entering the scene.
function revealLayer(layer) {
  if (!layer) return;

  if (layer.userData.revealFrame) {
    cancelAnimationFrame(layer.userData.revealFrame);
  }

  layer.visible = true;
  layer.position.y = 0.65;
  layer.scale.setScalar(0.96);

  const startTime = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - startTime) / 650);
    const eased = 1 - Math.pow(1 - t, 3);

    layer.position.y = 0.65 * (1 - eased);
    layer.scale.setScalar(0.96 + 0.04 * eased);

    if (t < 1) {
      layer.userData.revealFrame = requestAnimationFrame(tick);
    } else {
      layer.position.y = 0;
      layer.scale.setScalar(1);
      layer.userData.revealFrame = null;
    }
  }

  layer.userData.revealFrame = requestAnimationFrame(tick);
}

function setLayerVisible(layer, visible) {
  if (!layer) return;

  if (visible && !layer.visible) {
    revealLayer(layer);
  } else if (!visible) {
    if (layer.userData.revealFrame) {
      cancelAnimationFrame(layer.userData.revealFrame);
      layer.userData.revealFrame = null;
    }

    layer.visible = false;
    layer.position.y = 0;
    layer.scale.setScalar(1);
  }
}

function showStage(index) {
  currentStage = Math.max(0, Math.min(STAGES.length - 1, Number(index) || 0));

  if (structureGroup) structureGroup.visible = true;

  setLayerVisible(servicesGroup, currentStage >= 1);
  setLayerVisible(architectureGroup, currentStage >= 1);
  setLayerVisible(finishesGroup, currentStage >= 2);
  setLayerVisible(furnitureGroup, currentStage >= 3);
  setLayerVisible(decorGroup, currentStage >= 4);

  const stage = STAGES[currentStage];

  const title = document.getElementById("stageTitle");
  const heading = document.getElementById("stageHeading");
  const description = document.getElementById("stageDescription");
  const counter = document.getElementById("stageCount");
  const slider = document.getElementById("stageSlider");

  if (title) title.textContent = stage.title;
  if (heading) heading.textContent = stage.title;
  if (description) description.textContent = stage.description;

  if (counter) {
    counter.textContent =
      `${String(currentStage + 1).padStart(2, "0")} / 05`;
  }

  if (slider) slider.value = String(currentStage);

  document.querySelectorAll(".stage-button").forEach(button => {
    const active = Number(button.dataset.stage) === currentStage;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const progress = document.getElementById("stageProgress");
  const progressBar = document.getElementById("progressBar");

  if (progress) progress.textContent = `${stage.progress}%`;
  if (progressBar) progressBar.style.width = `${stage.progress}%`;

  updateStageDate();
}

function stopTimeline() {
  isPlaying = false;

  if (playTimer !== null) {
    clearInterval(playTimer);
    playTimer = null;
  }

  const button = document.getElementById("playTimeline");
  if (button) button.textContent = "▶ Play simulation";
}

function startTimeline() {
  if (isPlaying) {
    stopTimeline();
    return;
  }

  if (currentStage >= STAGES.length - 1) {
    showStage(0);
  }

  isPlaying = true;

  const button = document.getElementById("playTimeline");
  if (button) button.textContent = "Ⅱ Pause simulation";

  playTimer = setInterval(() => {
    if (currentStage >= STAGES.length - 1) {
      stopTimeline();
      return;
    }

    showStage(currentStage + 1);

    if (currentStage >= STAGES.length - 1) {
      stopTimeline();
    }
  }, 2400);
}

function updateStageDate() {
  const dateInput = document.getElementById("projectStartDate");
  const dateLabel = document.getElementById("stageDate");
  const dayLabel = document.getElementById("currentDay");

  const start = dateInput?.value
    ? new Date(`${dateInput.value}T12:00:00`)
    : new Date();

  if (dateLabel) {
    if (Number.isNaN(start.getTime())) {
      dateLabel.textContent = "Choose a valid project start date.";
      return;
    }

    const stageStart = new Date(start);
    stageStart.setDate(stageStart.getDate() + currentStage * 3);

    const stageEnd = new Date(stageStart);
    stageEnd.setDate(stageEnd.getDate() + 2);

    const format = date => date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    dateLabel.textContent =
      `${format(stageStart)} – ${format(stageEnd)} · concept timeline`;
  }

  if (dayLabel) {
    dayLabel.textContent = `Day ${currentStage * 3 + 1}`;
  }
}

function updateRoomColor(target, color) {
  if (!scene) return;

  scene.traverse(object => {
    if (!object.isMesh || !object.material?.color) return;

    if (
      target === "wall" &&
      ["Back wall", "Left wall"].includes(object.name)
    ) {
      object.material.color.set(color);
    }

    if (target === "floor" && object.name === "Finished floor") {
      object.material.color.set(color);
    }
  });
}

// Start the 3D renderer only on pages that contain the planner.
if (viewer) {
  try {
    buildRoom();
    showStage(0);

    console.log("FurArch 3D renderer initialized.");
    console.log("Room type:", viewer.dataset.room || project.room_type || "Living Room");
  } catch (error) {
    console.error("FurArch 3D initialization failed:", error);

    const message = document.createElement("div");
    message.style.cssText =
      "padding:24px;color:#783d2b;background:#fff8f0;border-radius:12px;";

    message.textContent =
      `The 3D renderer could not start: ${error.message}. Check your connection and browser console.`;

    viewer.replaceChildren(message);
  }
}

// One set of timeline controls; timeline.js should not be loaded separately.
document.getElementById("playTimeline")?.addEventListener("click", event => {
  event.preventDefault();
  startTimeline();
});

document.getElementById("previousStage")?.addEventListener("click", () => {
  stopTimeline();
  showStage(currentStage - 1);
});

document.getElementById("nextStage")?.addEventListener("click", () => {
  stopTimeline();
  showStage(currentStage + 1);
});

document.getElementById("stageSlider")?.addEventListener("input", event => {
  stopTimeline();
  showStage(event.target.value);
});

document.querySelectorAll(".stage-button").forEach(button => {
  button.addEventListener("click", () => {
    stopTimeline();
    showStage(button.dataset.stage);
  });
});

document.getElementById("resetTimeline")?.addEventListener("click", () => {
  stopTimeline();
  showStage(0);
});

document.getElementById("projectStartDate")?.addEventListener("change", updateStageDate);

document.getElementById("resetCamera")?.addEventListener("click", () => {
  if (!camera || !controls) return;

  camera.position.set(roomLength * 1.05, roomHeight * 0.95, roomWidth * 1.45);
  controls.target.set(0, roomHeight * 0.34, 0);
  controls.update();
});

document.getElementById("toggleOrbit")?.addEventListener("click", () => {
  autoRotate = !autoRotate;
});

["wall_color", "plannerWall"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", event => {
    updateRoomColor("wall", event.target.value);
  });
});

["floor_color", "plannerFloor"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", event => {
    updateRoomColor("floor", event.target.value);
  });
});

document.getElementById("designForm")?.addEventListener("input", event => {
  if (!["length", "width", "height"].includes(event.target.id)) return;

  const dimensions = document.getElementById("roomDimensions");
  if (!dimensions) return;

  const length = document.getElementById("length")?.value || 12;
  const width = document.getElementById("width")?.value || 10;
  const height = document.getElementById("height")?.value || 8;

  dimensions.textContent =
    `${length} × ${width} ft · ${height} ft high (save to update the 3D room)`;
});

// Preserve the existing assistant panel.
const assistantPanel = document.getElementById("assistantPanel");

document.getElementById("assistantToggle")?.addEventListener("click", () => {
  assistantPanel?.classList.toggle("open");
});

document.getElementById("assistantClose")?.addEventListener("click", () => {
  assistantPanel?.classList.remove("open");
});

const chatMessages = document.getElementById("chatMessages");

function addChatBubble(text, kind) {
  if (!chatMessages) return null;

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${kind}`;
  bubble.textContent = text;

  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return bubble;
}

document.getElementById("chatForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const input = document.getElementById("chatInput");
  const message = input?.value.trim();

  if (!message) return;

  addChatBubble(message, "user");
  input.value = "";

  const pending = addChatBubble("Thinking…", "bot");

  try {
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Assistant request failed.");
    }

    if (pending) {
      pending.textContent = result.reply;
      pending.dataset.mode = result.mode || "fallback";
    }
  } catch (error) {
    if (pending) {
      pending.textContent =
        "I couldn't reach the assistant. Check that your Flask server is running.";
    }
  }
});

window.addEventListener("beforeunload", () => {
  stopTimeline();

  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
  }

  if (resizeObserver) resizeObserver.disconnect();
  if (controls) controls.dispose();
  if (renderer) renderer.dispose();
});
