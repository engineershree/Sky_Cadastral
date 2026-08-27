// Master Plan Canonical Data Model for Sky Cadastral 2D + 3D Land Plot Booking Platform
// Exact survey master plan matching user reference image (A01-A20, B01-B12, C01-C12, D01-D12, E01-E12)

export const LAYOUT_METADATA = {
  id: "layout-sky-sunrise-valley",
  name: "Sky Cadastral Master Plan - Sunrise Valley",
  location: "Sunrise Valley, Pune-Nashik Expressway Corridor",
  surveyNumber: "Gat No. 142/A & 142/B, PMRDA Sanctioned",
  approvalStatus: "N.A. Sanctioned & RERA Approved",
  totalAreaSqFt: 98500,
  totalPlots: 60,
  scaleFactor: 1.0,
  viewCenter: [130, 100],
  bounds: { minX: 0, maxX: 270, minY: 0, maxY: 200 }
};

export const ENTRANCE_GATE = {
  id: "entrance-gate-main",
  name: "Sky Cadastral Grand Entrance Plaza",
  coordinates: [60, 6],
  width: 30,
  height: 8,
  title: "MAIN ENTRANCE ROAD"
};

export const ROADS = [
  {
    id: "road-main-entrance",
    name: "MAIN ENTRANCE ROAD",
    width: 14,
    coordinates: [
      [0, 0],
      [270, 0],
      [270, 12],
      [0, 12]
    ]
  },
  {
    id: "road-18m-top",
    name: "18M WIDE ROAD",
    width: 12,
    coordinates: [
      [10, 160],
      [215, 160],
      [215, 172],
      [10, 172]
    ]
  },
  {
    id: "road-12m-middle-top",
    name: "12M WIDE ROAD",
    width: 12,
    coordinates: [
      [5, 124],
      [215, 124],
      [215, 136],
      [5, 136]
    ]
  },
  {
    id: "road-12m-middle-bottom",
    name: "12M WIDE ROAD",
    width: 12,
    coordinates: [
      [5, 60],
      [215, 60],
      [215, 72],
      [5, 72]
    ]
  },
  {
    id: "road-18m-central-vertical",
    name: "18M WIDE ROAD",
    width: 14,
    coordinates: [
      [104, 12],
      [118, 12],
      [118, 136],
      [104, 136]
    ]
  }
];

export const GREEN_AREAS = [
  {
    id: "lake-water-pond",
    name: "Water Pond Lake",
    type: "Water Body",
    coordinates: [
      [220, 170],
      [238, 170],
      [242, 195],
      [224, 195]
    ]
  },
  {
    id: "clubhouse-zone",
    name: "Clubhouse",
    type: "Clubhouse",
    coordinates: [
      [220, 140],
      [245, 140],
      [245, 165],
      [220, 165]
    ]
  },
  {
    id: "children-play-area",
    name: "Children's Play Area",
    type: "Play Area",
    coordinates: [
      [222, 110],
      [255, 110],
      [255, 135],
      [222, 135]
    ]
  },
  {
    id: "central-park",
    name: "Central Park",
    type: "Park",
    coordinates: [
      [220, 50],
      [255, 50],
      [255, 105],
      [220, 105]
    ]
  },
  {
    id: "sports-area",
    name: "Sports Area",
    type: "Sports",
    coordinates: [
      [220, 12],
      [255, 12],
      [255, 45],
      [220, 45]
    ]
  }
];

// Helper generator for exact plot canonical definitions
function createPlot(id, plotNumber, status, area, facing, price, coords) {
  return {
    id: `plot-${id.toLowerCase()}`,
    plotNumber,
    status: status.toLowerCase(), // 'available', 'booked', 'sold', 'reserved'
    area,
    facing,
    price,
    coordinates: coords,
    lengthFt: 50,
    widthFt: 30,
    surveyNumber: "Gat No. 142/A",
    description: `Prime residential plot ${plotNumber} situated along ${facing}-facing avenue.`
  };
}

export const PLOTS = [
  // ==========================================
  // ROW 1: TOP ROW (A01 - A10)
  // ==========================================
  createPlot("A01", "A01", "available", 1500, "North", 4500000, [[15, 172], [34, 172], [34, 192], [22, 192]]),
  createPlot("A02", "A02", "available", 1500, "North", 4500000, [[34, 172], [53, 172], [53, 192], [34, 192]]),
  createPlot("A03", "A03", "available", 1500, "North", 4500000, [[53, 172], [72, 172], [72, 192], [53, 192]]),
  createPlot("A04", "A04", "available", 1500, "North", 4500000, [[72, 172], [91, 172], [91, 192], [72, 192]]),
  createPlot("A05", "A05", "available", 1500, "North", 4500000, [[91, 172], [110, 172], [110, 192], [91, 192]]),
  createPlot("A06", "A06", "available", 1500, "North", 4500000, [[110, 172], [129, 172], [129, 192], [110, 192]]),
  createPlot("A07", "A07", "reserved", 1500, "North", 4500000, [[129, 172], [148, 172], [148, 192], [129, 192]]), // Pastel yellow reserved
  createPlot("A08", "A08", "available", 1500, "North", 4500000, [[148, 172], [167, 172], [167, 192], [148, 192]]),
  createPlot("A09", "A09", "available", 1500, "North", 4500000, [[167, 172], [186, 172], [186, 192], [167, 192]]),
  createPlot("A10", "A10", "available", 1500, "North", 4500000, [[186, 172], [205, 172], [205, 192], [186, 192]]),

  // ==========================================
  // ROW 2: SECOND BLOCK (A11 - A20)
  // ==========================================
  createPlot("A11", "A11", "sold", 1800, "South", 5400000, [[10, 136], [34, 136], [34, 160], [10, 160]]), // Grey sold
  createPlot("A12", "A12", "available", 1500, "South", 4500000, [[34, 136], [53, 136], [53, 160], [34, 160]]),
  createPlot("A13", "A13", "available", 1500, "South", 4500000, [[53, 136], [72, 136], [72, 160], [53, 160]]),
  createPlot("A14", "A14", "available", 1500, "South", 4500000, [[72, 136], [91, 136], [91, 160], [72, 160]]),
  createPlot("A15", "A15", "sold", 1500, "South", 4500000, [[91, 136], [110, 136], [110, 160], [91, 160]]), // Grey sold
  createPlot("A16", "A16", "available", 1500, "South", 4500000, [[110, 136], [129, 136], [129, 160], [110, 160]]),
  createPlot("A17", "A17", "available", 1500, "South", 4500000, [[129, 136], [148, 136], [148, 160], [129, 160]]),
  createPlot("A18", "A18", "available", 1500, "South", 4500000, [[148, 136], [167, 136], [167, 160], [148, 160]]),
  createPlot("A19", "A19", "sold", 1500, "South", 4500000, [[167, 136], [186, 136], [186, 160], [167, 160]]), // Grey sold
  createPlot("A20", "A20", "available", 1500, "South", 4500000, [[186, 136], [205, 136], [205, 160], [186, 160]]),

  // ==========================================
  // CENTRAL SECTION - BLOCK B (LEFT: B01 - B12)
  // ==========================================
  createPlot("B01", "B01", "available", 1600, "East", 4800000, [[8, 98], [24, 98], [24, 124], [8, 124]]),
  createPlot("B02", "B02", "available", 1600, "East", 4800000, [[24, 98], [40, 98], [40, 124], [24, 124]]),
  createPlot("B03", "B03", "available", 1600, "East", 4800000, [[40, 98], [56, 98], [56, 124], [40, 124]]),
  createPlot("B04", "B04", "available", 1600, "East", 4800000, [[56, 98], [72, 98], [72, 124], [56, 124]]),
  createPlot("B05", "B05", "available", 1600, "East", 4800000, [[72, 98], [88, 98], [88, 124], [72, 124]]),
  createPlot("B06", "B06", "available", 1600, "East", 4800000, [[88, 98], [104, 98], [104, 124], [88, 124]]),

  createPlot("B07", "B07", "available", 1600, "West", 4800000, [[8, 72], [24, 72], [24, 98], [8, 98]]),
  createPlot("B08", "B08", "available", 1600, "West", 4800000, [[24, 72], [40, 72], [40, 98], [24, 98]]),
  createPlot("B09", "B09", "available", 1600, "West", 4800000, [[40, 72], [56, 72], [56, 98], [40, 98]]),
  createPlot("B10", "B10", "booked", 1600, "West", 4800000, [[56, 72], [72, 72], [72, 98], [56, 98]]), // Pastel pink booked
  createPlot("B11", "B11", "available", 1600, "West", 4800000, [[72, 72], [88, 72], [88, 98], [72, 98]]),
  createPlot("B12", "B12", "available", 1600, "West", 4800000, [[88, 72], [104, 72], [104, 98], [88, 98]]),

  // ==========================================
  // CENTRAL SECTION - BLOCK C (RIGHT: C01 - C12)
  // ==========================================
  createPlot("C01", "C01", "available", 1600, "East", 4800000, [[118, 98], [134, 98], [134, 124], [118, 124]]),
  createPlot("C02", "C02", "available", 1600, "East", 4800000, [[134, 98], [150, 98], [150, 124], [134, 124]]),
  createPlot("C03", "C03", "available", 1600, "East", 4800000, [[150, 98], [166, 98], [166, 124], [150, 124]]),
  createPlot("C04", "C04", "available", 1600, "East", 4800000, [[166, 98], [182, 98], [182, 124], [166, 124]]),
  createPlot("C05", "C05", "available", 1600, "East", 4800000, [[182, 98], [198, 98], [198, 124], [182, 124]]),
  createPlot("C06", "C06", "available", 1600, "East", 4800000, [[198, 98], [214, 98], [214, 124], [198, 124]]),

  createPlot("C07", "C07", "available", 1600, "West", 4800000, [[118, 72], [134, 72], [134, 98], [118, 98]]),
  createPlot("C08", "C08", "available", 1600, "West", 4800000, [[134, 72], [150, 72], [150, 98], [134, 98]]),
  createPlot("C09", "C09", "available", 1600, "West", 4800000, [[150, 72], [166, 72], [166, 98], [150, 98]]),
  createPlot("C10", "C10", "available", 1600, "West", 4800000, [[166, 72], [182, 72], [182, 98], [166, 98]]),
  createPlot("C11", "C11", "available", 1600, "West", 4800000, [[182, 72], [198, 72], [198, 98], [182, 98]]),
  createPlot("C12", "C12", "available", 1600, "West", 4800000, [[198, 72], [214, 72], [214, 98], [198, 98]]),

  // ==========================================
  // BOTTOM SECTION - BLOCK D (LEFT: D01 - D12)
  // ==========================================
  createPlot("D01", "D01", "available", 1600, "North", 4800000, [[6, 36], [22, 36], [22, 60], [6, 60]]),
  createPlot("D02", "D02", "available", 1600, "North", 4800000, [[22, 36], [38, 36], [38, 60], [22, 60]]),
  createPlot("D03", "D03", "available", 1600, "North", 4800000, [[38, 36], [54, 36], [54, 60], [38, 60]]), // Selected highlight
  createPlot("D04", "D04", "available", 1600, "North", 4800000, [[54, 36], [70, 36], [70, 60], [54, 60]]),
  createPlot("D05", "D05", "available", 1600, "North", 4800000, [[70, 36], [86, 36], [86, 60], [70, 60]]),
  createPlot("D06", "D06", "available", 1600, "North", 4800000, [[86, 36], [102, 36], [102, 60], [86, 60]]),

  createPlot("D07", "D07", "available", 1600, "South", 4800000, [[4, 12], [22, 12], [22, 36], [4, 36]]),
  createPlot("D08", "D08", "available", 1600, "South", 4800000, [[22, 12], [38, 12], [38, 36], [22, 36]]),
  createPlot("D09", "D09", "available", 1600, "South", 4800000, [[38, 12], [54, 12], [54, 36], [38, 36]]),
  createPlot("D10", "D10", "available", 1600, "South", 4800000, [[54, 12], [70, 12], [70, 36], [54, 36]]),
  createPlot("D11", "D11", "available", 1600, "South", 4800000, [[70, 12], [86, 12], [86, 36], [70, 36]]),
  createPlot("D12", "D12", "available", 1600, "South", 4800000, [[86, 12], [102, 12], [102, 36], [86, 36]]),

  // ==========================================
  // BOTTOM SECTION - BLOCK E (RIGHT: E01 - E12)
  // ==========================================
  createPlot("E01", "E01", "available", 1600, "North", 4800000, [[118, 36], [134, 36], [134, 60], [118, 60]]),
  createPlot("E02", "E02", "sold", 1600, "North", 4800000, [[134, 36], [150, 36], [150, 60], [134, 60]]), // Grey sold
  createPlot("E03", "E03", "available", 1600, "North", 4800000, [[150, 36], [166, 36], [166, 60], [150, 60]]),
  createPlot("E04", "E04", "available", 1600, "North", 4800000, [[166, 36], [182, 36], [182, 60], [166, 60]]),
  createPlot("E05", "E05", "available", 1600, "North", 4800000, [[182, 36], [198, 36], [198, 60], [182, 60]]),
  createPlot("E06", "E06", "available", 1600, "North", 4800000, [[198, 36], [214, 36], [214, 60], [198, 60]]),

  createPlot("E07", "E07", "available", 1600, "South", 4800000, [[118, 12], [134, 12], [134, 36], [118, 36]]),
  createPlot("E08", "E08", "available", 1600, "South", 4800000, [[134, 12], [150, 12], [150, 36], [134, 36]]),
  createPlot("E09", "E09", "available", 1600, "South", 4800000, [[150, 12], [166, 12], [166, 36], [150, 36]]),
  createPlot("E10", "E10", "available", 1600, "South", 4800000, [[182, 12], [182, 36], [166, 36], [166, 12]]),
  createPlot("E11", "E11", "available", 1600, "South", 4800000, [[198, 12], [198, 36], [182, 36], [182, 12]]),
  createPlot("E12", "E12", "available", 1600, "South", 4800000, [[214, 12], [214, 36], [198, 36], [198, 12]])
];

export const INITIAL_PLOTS_DATA = PLOTS;
