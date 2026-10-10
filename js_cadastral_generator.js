/**
 * Pure JavaScript Cadastral Layout Generator
 * Generates topologically clean cadastral land layouts, plot polygons,
 * edge dimensions, facing directions, valuations, and layout infrastructure
 * (roads and open green spaces) programmatically without relying on any PDF file.
 */

export function generatePureCadastralLayout(options = {}) {
  const {
    layoutName = 'Pure JS Demarcation Plan',
    projectName = 'Sky Cadastral JS Phase 1',
    totalPlots = 30,
    plotsPerRow = 6,
    plotLengthFt = 50,
    plotWidthFt = 30,
    roadWidthFt = 40,
    pricePerSqFt = 2500
  } = options;

  const layoutId = `LAYOUT-JS-${Date.now()}`;
  const scale = 1.8; // pixels per foot in SVG canvas coordinate space

  const pWidthPx = plotWidthFt * scale;
  const pLengthPx = plotLengthFt * scale;
  const roadWidthPx = roadWidthFt * scale;
  const marginPx = 60;

  const rows = Math.ceil(totalPlots / plotsPerRow);

  const matchedPlots = [];
  const infrastructureRoads = [];
  const infrastructureOpenSpaces = [];

  let currentPlotNum = 1;

  // 1. Generate Plots Grid in Sectors separated by Roads
  for (let r = 0; r < rows; r++) {
    const extraRoadY = Math.floor(r / 2) * roadWidthPx;

    for (let c = 0; c < plotsPerRow; c++) {
      if (currentPlotNum > totalPlots) break;

      const extraRoadX = Math.floor(c / 3) * roadWidthPx;

      const startX = marginPx + c * pWidthPx + extraRoadX;
      const startY = marginPx + r * pLengthPx + extraRoadY;

      // Closed polygon ring coordinates: Top-Left -> Top-Right -> Bottom-Right -> Bottom-Left -> Top-Left
      const polygonGeometry = [
        [Math.round(startX), Math.round(startY)],
        [Math.round(startX + pWidthPx), Math.round(startY)],
        [Math.round(startX + pWidthPx), Math.round(startY + pLengthPx)],
        [Math.round(startX), Math.round(startY + pLengthPx)],
        [Math.round(startX), Math.round(startY)]
      ];

      // Edge dimensions array (top, right, bottom, left)
      const edgeDimensions = [
        {
          edgeIndex: 0,
          start: [Math.round(startX), Math.round(startY)],
          end: [Math.round(startX + pWidthPx), Math.round(startY)],
          calculatedLengthFt: plotWidthFt,
          annotatedLengthFt: plotWidthFt
        },
        {
          edgeIndex: 1,
          start: [Math.round(startX + pWidthPx), Math.round(startY)],
          end: [Math.round(startX + pWidthPx), Math.round(startY + pLengthPx)],
          calculatedLengthFt: plotLengthFt,
          annotatedLengthFt: plotLengthFt
        },
        {
          edgeIndex: 2,
          start: [Math.round(startX + pWidthPx), Math.round(startY + pLengthPx)],
          end: [Math.round(startX), Math.round(startY + pLengthPx)],
          calculatedLengthFt: plotWidthFt,
          annotatedLengthFt: plotWidthFt
        },
        {
          edgeIndex: 3,
          start: [Math.round(startX), Math.round(startY + pLengthPx)],
          end: [Math.round(startX), Math.round(startY)],
          calculatedLengthFt: plotLengthFt,
          annotatedLengthFt: plotLengthFt
        }
      ];

      const areaSqFt = plotWidthFt * plotLengthFt;
      const areaSqm = Math.round((areaSqFt / 10.7639) * 100) / 100;
      const facing = r % 2 === 0 ? 'North' : 'South';
      const plotPrice = Math.round(areaSqFt * (pricePerSqFt + (currentPlotNum % 5) * 100));

      matchedPlots.push({
        plotId: `Plot-${currentPlotNum}`,
        plotNumber: String(currentPlotNum),
        rawLabel: `Plot ${currentPlotNum}`,
        polygonGeometry,
        edgeDimensions,
        length: plotLengthFt,
        width: plotWidthFt,
        calculatedAreaSqft: areaSqFt,
        officialAreaSqft: areaSqFt,
        calculatedAreaSqm: areaSqm,
        officialAreaSqm: areaSqm,
        areaDifferenceSqm: 0,
        facing,
        facingRoadWidth: roadWidthFt,
        pricePerSqFt: pricePerSqFt + (currentPlotNum % 5) * 100,
        valuation: plotPrice,
        status: 'Available',
        verificationStatus: 'VERIFIED',
        labelCenter: [Math.round(startX + pWidthPx / 2), Math.round(startY + pLengthPx / 2)]
      });

      currentPlotNum++;
    }
  }

  // 2. Generate Layout Infrastructure Roads
  const totalWidthPx = marginPx * 2 + plotsPerRow * pWidthPx + Math.floor((plotsPerRow - 1) / 3) * roadWidthPx;
  const totalHeightPx = marginPx * 2 + rows * pLengthPx + Math.floor((rows - 1) / 2) * roadWidthPx;

  // Main Sector Road
  const road1Y = marginPx + 2 * pLengthPx;
  if (rows > 2) {
    infrastructureRoads.push({
      id: 'road-js-1',
      name: 'Main 40ft Sector Road',
      coordinates: [
        [marginPx - 20, Math.round(road1Y)],
        [Math.round(totalWidthPx + 20), Math.round(road1Y)],
        [Math.round(totalWidthPx + 20), Math.round(road1Y + roadWidthPx)],
        [marginPx - 20, Math.round(road1Y + roadWidthPx)],
        [marginPx - 20, Math.round(road1Y)]
      ]
    });
  }

  // Central Green Open Space / Park
  const greenParkY = totalHeightPx + 10;
  infrastructureOpenSpaces.push({
    id: 'green-js-1',
    name: 'Central Garden & Children Play Area',
    coordinates: [
      [Math.round(marginPx), Math.round(greenParkY)],
      [Math.round(totalWidthPx), Math.round(greenParkY)],
      [Math.round(totalWidthPx), Math.round(greenParkY + 120)],
      [Math.round(marginPx), Math.round(greenParkY + 120)],
      [Math.round(marginPx), Math.round(greenParkY)]
    ]
  });

  const boundingWidth = Math.ceil(totalWidthPx + 40);
  const boundingHeight = Math.ceil(totalHeightPx + 160);

  const forensicReport = {
    documentName: 'Pure JS Generated Plan (No PDF Required)',
    pageCount: 1,
    pageDimensionsPt: { width: boundingWidth, height: boundingHeight },
    boundaryCandidatesFound: matchedPlots.length * 4,
    validPolygonsReconstructed: matchedPlots.length + infrastructureRoads.length + infrastructureOpenSpaces.length,
    tableRecordsExtracted: matchedPlots.length,
    expectedSourcePlotCount: matchedPlots.length,
    matchedPlotCount: matchedPlots.length,
    unmatchedPolygonsCount: 0,
    missingPlotIdsInSource: [],
    duplicateIdsFound: [],
    geometryMismatchCount: 0,
    verifiedPlotsCount: matchedPlots.length,
    overlapCount: 0,
    totalOverlapAreaSqft: 0,
    overlapPairs: [],
    canPublish: true
  };

  return {
    layoutId,
    layoutName,
    projectName,
    forensicReport,
    matchedPlots,
    officialTableMap: Object.fromEntries(matchedPlots.map(p => [p.plotNumber, p.officialAreaSqm])),
    infrastructureGeometry: {
      roads: infrastructureRoads,
      openSpaces: infrastructureOpenSpaces
    },
    bounds: {
      minX: 0,
      minY: 0,
      maxX: boundingWidth,
      maxY: boundingHeight,
      width: boundingWidth,
      height: boundingHeight
    },
    viewCenter: [boundingWidth / 2, boundingHeight / 2]
  };
}
