// Master Plan Sample Plot Data for Sky Cadastral 3D Land Plot Booking System Demo

export const LAYOUT_METADATA = {
  id: "layout-sky-phase-1",
  name: "Sky Cadastral Master Plan - Phase 1",
  location: "Sunrise Valley, Pune-Nashik Highway, Maharashtra",
  totalAreaSqFt: 35200,
  totalPlots: 24,
  surveyNumber: "Gat No. 142/A & 142/B",
  approvalStatus: "N.A. Sanctioned & PMRDA Approved",
  scaleFactor: 1.0,
  viewCenter: [110, 80],
  bounds: { minX: 0, maxX: 220, minY: 0, maxY: 160 }
};

export const ROADS = [
  {
    id: "road-main-boulevard",
    name: "60ft Main Avenue Boulevard",
    width: 20,
    coordinates: [
      [0, 70],
      [220, 70],
      [220, 90],
      [0, 90]
    ]
  },
  {
    id: "road-entrance-vertical",
    name: "40ft Central Entrance Way",
    width: 20,
    coordinates: [
      [100, 0],
      [120, 0],
      [120, 160],
      [100, 160]
    ]
  },
  {
    id: "road-north-lane",
    name: "30ft North Internal Road",
    width: 10,
    coordinates: [
      [0, 135],
      [220, 135],
      [220, 145],
      [0, 145]
    ]
  },
  {
    id: "road-south-lane",
    name: "30ft South Internal Road",
    width: 10,
    coordinates: [
      [0, 15],
      [220, 15],
      [220, 25],
      [0, 25]
    ]
  },
  {
    id: "road-west-lane",
    name: "30ft West Internal Access Road",
    width: 10,
    coordinates: [
      [45, 0],
      [55, 0],
      [55, 160],
      [45, 160]
    ]
  },
  {
    id: "road-east-lane",
    name: "30ft East Internal Access Road",
    width: 10,
    coordinates: [165, 0],
    coordinates: [
      [165, 0],
      [175, 0],
      [175, 160],
      [165, 160]
    ]
  }
];

export const GREEN_AREAS = [
  {
    id: "park-central",
    name: "Central Amenity Park & Children Play Zone",
    type: "Park",
    coordinates: [
      [10, 72],
      [45, 72],
      [45, 88],
      [10, 88]
    ]
  },
  {
    id: "park-east",
    name: "Landscape Green Corridor",
    type: "Green Belt",
    coordinates: [
      [175, 72],
      [210, 72],
      [210, 88],
      [175, 88]
    ]
  }
];

export const INITIAL_PLOTS_DATA = [
  // ================= SECTOR 100 (NORTH-WEST) =================
  {
    id: "plot-101",
    plotNumber: "P-101",
    sector: "Sector A",
    area: 1360,
    price: 4760000,
    facing: "North-West",
    status: "available",
    type: "Corner",
    dimensions: "32' x 42.5'",
    roadWidth: "30 ft Internal Road",
    description: "Premium corner plot with dual road access and optimal natural ventilation.",
    coordinates: [
      [10, 145],
      [42, 145],
      [42, 158],
      [10, 158]
    ]
  },
  {
    id: "plot-102",
    plotNumber: "P-102",
    sector: "Sector A",
    area: 1280,
    price: 4100000,
    facing: "West",
    status: "available",
    type: "Regular",
    dimensions: "32' x 40'",
    roadWidth: "30 ft West Access Road",
    description: "Ideal rectangular residential plot facing West with direct access to West lane.",
    coordinates: [
      [10, 120],
      [42, 120],
      [42, 140],
      [10, 140]
    ]
  },
  {
    id: "plot-103",
    plotNumber: "P-103",
    sector: "Sector A",
    area: 1088,
    price: 3800000,
    facing: "West",
    status: "booked",
    type: "Regular",
    dimensions: "32' x 34'",
    roadWidth: "30 ft West Access Road",
    description: "Standard residential plot close to central boulevard.",
    coordinates: [
      [10, 95],
      [42, 95],
      [42, 115],
      [10, 115]
    ]
  },
  {
    id: "plot-104",
    plotNumber: "P-104",
    sector: "Sector A",
    area: 1420,
    price: 4970000,
    facing: "North",
    status: "available",
    type: "Irregular",
    dimensions: "35' x 40.5'",
    roadWidth: "30 ft North Internal Road",
    description: "Distinctive plot featuring a tapered boundary and extra backyard space.",
    coordinates: [
      [58, 145],
      [90, 145],
      [98, 152],
      [98, 158],
      [58, 158]
    ]
  },
  {
    id: "plot-105",
    plotNumber: "P-105",
    sector: "Sector A",
    area: 1480,
    price: 5180000,
    facing: "East",
    status: "available",
    type: "Regular",
    dimensions: "37' x 40'",
    roadWidth: "40 ft Entrance Way",
    description: "East-facing Vastu-compliant plot situated directly along the entrance avenue.",
    coordinates: [
      [58, 120],
      [95, 120],
      [95, 140],
      [58, 140]
    ]
  },
  {
    id: "plot-106",
    plotNumber: "P-106",
    sector: "Sector A",
    area: 1258,
    price: 5660000,
    facing: "South (Main Road)",
    status: "sold",
    type: "Premium",
    dimensions: "37' x 34'",
    roadWidth: "60 ft Main Boulevard",
    description: "High-value commercial-cum-residential plot directly facing the 60ft main boulevard.",
    coordinates: [
      [58, 95],
      [95, 95],
      [95, 115],
      [58, 115]
    ]
  },

  // ================= SECTOR 200 (NORTH-EAST) =================
  {
    id: "plot-201",
    plotNumber: "P-201",
    sector: "Sector B",
    area: 1258,
    price: 5900000,
    facing: "South (Main Road)",
    status: "available",
    type: "Premium Corner",
    dimensions: "37' x 34'",
    roadWidth: "60 ft Main Boulevard & Entrance Way",
    description: "Flagship corner plot at the entrance intersection of 60ft Boulevard and Entrance Way.",
    coordinates: [
      [125, 95],
      [162, 95],
      [162, 115],
      [125, 115]
    ]
  },
  {
    id: "plot-202",
    plotNumber: "P-202",
    sector: "Sector B",
    area: 1480,
    price: 4880000,
    facing: "West",
    status: "booked",
    type: "Regular",
    dimensions: "37' x 40'",
    roadWidth: "40 ft Entrance Way",
    description: "Spacious residential plot facing the main central green corridor entrance.",
    coordinates: [
      [125, 120],
      [162, 120],
      [162, 140],
      [125, 140]
    ]
  },
  {
    id: "plot-203",
    plotNumber: "P-203",
    sector: "Sector B",
    area: 1360,
    price: 4400000,
    facing: "North-West",
    status: "available",
    type: "Corner",
    dimensions: "37' x 34'",
    roadWidth: "30 ft North Internal Road",
    description: "Quiet North-facing corner plot ideal for a multi-story bungalow.",
    coordinates: [
      [125, 145],
      [162, 145],
      [162, 158],
      [125, 158]
    ]
  },
  {
    id: "plot-204",
    plotNumber: "P-204",
    sector: "Sector B",
    area: 1088,
    price: 3900000,
    facing: "East",
    status: "sold",
    type: "Regular",
    dimensions: "32' x 34'",
    roadWidth: "30 ft East Internal Access Road",
    description: "Compact East-facing plot in quiet residential zone.",
    coordinates: [
      [178, 95],
      [210, 95],
      [210, 115],
      [178, 115]
    ]
  },
  {
    id: "plot-205",
    plotNumber: "P-205",
    sector: "Sector B",
    area: 1280,
    price: 4350000,
    facing: "East",
    status: "available",
    type: "Regular",
    dimensions: "32' x 40'",
    roadWidth: "30 ft East Internal Access Road",
    description: "Well-proportioned East-facing plot with excellent sunlight exposure.",
    coordinates: [
      [178, 120],
      [210, 120],
      [210, 140],
      [178, 140]
    ]
  },
  {
    id: "plot-206",
    plotNumber: "P-206",
    sector: "Sector B",
    area: 1320,
    price: 5200000,
    facing: "North-East",
    status: "available",
    type: "Irregular Corner",
    dimensions: "32' x 42'",
    roadWidth: "30 ft North & East Internal Roads",
    description: "Exclusive North-East corner plot with unique geometry and high ventilation.",
    coordinates: [
      [178, 145],
      [210, 145],
      [210, 158],
      [195, 158],
      [178, 150]
    ]
  },

  // ================= SECTOR 300 (SOUTH-WEST) =================
  {
    id: "plot-301",
    plotNumber: "P-301",
    sector: "Sector C",
    area: 1180,
    price: 4130000,
    facing: "South-West",
    status: "available",
    type: "Irregular",
    dimensions: "32' x 35'",
    roadWidth: "30 ft South Internal Road",
    description: "Custom trapezoidal plot offering high privacy at the South-West boundary.",
    coordinates: [
      [10, 2],
      [42, 2],
      [42, 15],
      [22, 15],
      [10, 10]
    ]
  },
  {
    id: "plot-302",
    plotNumber: "P-302",
    sector: "Sector C",
    area: 1280,
    price: 4220000,
    facing: "West",
    status: "booked",
    type: "Regular",
    dimensions: "32' x 40'",
    roadWidth: "30 ft West Access Road",
    description: "Prime West-facing plot adjacent to South internal road.",
    coordinates: [
      [10, 20],
      [42, 20],
      [42, 40],
      [10, 40]
    ]
  },
  {
    id: "plot-303",
    plotNumber: "P-303",
    sector: "Sector C",
    area: 1088,
    price: 3950000,
    facing: "West",
    status: "available",
    type: "Regular",
    dimensions: "32' x 34'",
    roadWidth: "30 ft West Access Road",
    description: "Regular residential plot near Central Amenity Park.",
    coordinates: [
      [10, 45],
      [42, 45],
      [42, 65],
      [10, 65]
    ]
  },
  {
    id: "plot-304",
    plotNumber: "P-304",
    sector: "Sector C",
    area: 1258,
    price: 4400000,
    facing: "South",
    status: "available",
    type: "Regular",
    dimensions: "37' x 34'",
    roadWidth: "30 ft South Internal Road",
    description: "South-facing rectangular plot with peaceful surroundings.",
    coordinates: [
      [58, 2],
      [95, 2],
      [95, 15],
      [58, 15]
    ]
  },
  {
    id: "plot-305",
    plotNumber: "P-305",
    sector: "Sector C",
    area: 1480,
    price: 5920000,
    facing: "North (Main Road)",
    status: "available",
    type: "Premium",
    dimensions: "37' x 40'",
    roadWidth: "60 ft Main Boulevard",
    description: "High visibility boulevard plot facing the North main road.",
    coordinates: [
      [58, 20],
      [95, 20],
      [95, 40],
      [58, 40]
    ]
  },
  {
    id: "plot-306",
    plotNumber: "P-306",
    sector: "Sector C",
    area: 1258,
    price: 5400000,
    facing: "North (Main Road)",
    status: "sold",
    type: "Corner",
    dimensions: "37' x 34'",
    roadWidth: "60 ft Main Boulevard",
    description: "Corner plot facing the main entrance avenue and 60ft road.",
    coordinates: [
      [58, 45],
      [95, 45],
      [95, 65],
      [58, 65]
    ]
  },

  // ================= SECTOR 400 (SOUTH-EAST) =================
  {
    id: "plot-401",
    plotNumber: "P-401",
    sector: "Sector D",
    area: 1258,
    price: 5660000,
    facing: "North (Main Road)",
    status: "available",
    type: "Corner",
    dimensions: "37' x 34'",
    roadWidth: "60 ft Main Boulevard & Entrance",
    description: "Main Boulevard corner plot near entrance gate.",
    coordinates: [
      [125, 45],
      [162, 45],
      [162, 65],
      [125, 65]
    ]
  },
  {
    id: "plot-402",
    plotNumber: "P-402",
    sector: "Sector D",
    area: 1480,
    price: 6200000,
    facing: "North (Main Road)",
    status: "available",
    type: "Premium",
    dimensions: "37' x 40'",
    roadWidth: "60 ft Main Boulevard",
    description: "Premium large plot facing main 60ft road, ideal for luxury villa.",
    coordinates: [
      [125, 20],
      [162, 20],
      [162, 40],
      [125, 40]
    ]
  },
  {
    id: "plot-403",
    plotNumber: "P-403",
    sector: "Sector D",
    area: 1258,
    price: 4400000,
    facing: "South",
    status: "available",
    type: "Regular",
    dimensions: "37' x 34'",
    roadWidth: "30 ft South Internal Road",
    description: "Quiet residential plot facing South internal road.",
    coordinates: [
      [125, 2],
      [162, 2],
      [162, 15],
      [125, 15]
    ]
  },
  {
    id: "plot-404",
    plotNumber: "P-404",
    sector: "Sector D",
    area: 1150,
    price: 4250000,
    facing: "East",
    status: "booked",
    type: "Irregular",
    dimensions: "32' x 34'",
    roadWidth: "30 ft East Internal Access Road",
    description: "Unique corner plot with chamfered edge near green corridor.",
    coordinates: [
      [178, 45],
      [210, 45],
      [210, 65],
      [195, 65],
      [178, 58]
    ]
  },
  {
    id: "plot-405",
    plotNumber: "P-405",
    sector: "Sector D",
    area: 1280,
    price: 4300000,
    facing: "East",
    status: "available",
    type: "Regular",
    dimensions: "32' x 40'",
    roadWidth: "30 ft East Internal Access Road",
    description: "East-facing rectangular plot with great cross-breeze.",
    coordinates: [
      [178, 20],
      [210, 20],
      [210, 40],
      [178, 40]
    ]
  },
  {
    id: "plot-406",
    plotNumber: "P-406",
    sector: "Sector D",
    area: 1088,
    price: 4800000,
    facing: "South-East",
    status: "booked",
    type: "Premium",
    dimensions: "32' x 34'",
    roadWidth: "30 ft South & East Roads",
    description: "South-East corner plot near the landscape green corridor.",
    coordinates: [
      [178, 2],
      [210, 2],
      [210, 15],
      [178, 15]
    ]
  }
];
