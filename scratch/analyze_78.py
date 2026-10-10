import pymupdf
import json
import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from shapely.geometry import Polygon, Point
import cadastral_extractor

pdf_path = "GOLDEN_CITY_FINAL_PLAN.pdf"
result = cadastral_extractor.parse_cadastral_pdf(pdf_path)

plots = result['matchedPlots']
print(f"Total Extracted Plots: {len(plots)}")

print("=== DETAILED MATRIX OF ALL EXTRACTED PLOTS ===")
print(f"{'#':<3} | {'Plot Number':<12} | {'Raw Label':<15} | {'Centroid (X,Y)':<20} | {'Area (Sqm)':<10} | {'Label Pos (X,Y)':<20}")
print("-" * 90)

for i, p in enumerate(plots, 1):
    poly = Polygon(p['polygonGeometry'])
    centroid_x = round(poly.centroid.x, 2)
    centroid_y = round(poly.centroid.y, 2)
    lbl_cx, lbl_cy = p.get('labelCenter', [0, 0])
    area_sqm = p.get('calculatedAreaSqm', 0)
    print(f"{i:<3} | {p['plotNumber']:<12} | {p['rawLabel']:<15} | ({centroid_x}, {centroid_y}):<20 | {area_sqm:<10} | ({lbl_cx}, {lbl_cy}):<20")

# Analyze duplicates or special prefix labels like 'E 1', 'E 2'
print("\n=== SPECIAL LABELS ANALYSIS ===")
pnums = [p['plotNumber'] for p in plots]
print("Plot Numbers:", pnums)

# Check for duplicate numbers or prefix variations
for p in plots:
    if p['plotNumber'] in ['E 1', 'E 2', '1', '2', 'E 216', 'E 220']:
        print(f"Plot {p['plotNumber']}: RawLabel='{p['rawLabel']}', AreaSqm={p['calculatedAreaSqm']}, Centroid=({round(Polygon(p['polygonGeometry']).centroid.x, 2)}, {round(Polygon(p['polygonGeometry']).centroid.y, 2)}), LabelPos={p.get('labelCenter')}")

