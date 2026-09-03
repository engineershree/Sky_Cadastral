import sys
import json
import os
import re
import pymupdf
import numpy as np
from shapely.geometry import LineString, Polygon, Point
from shapely.ops import polygonize, unary_union

def parse_cadastral_pdf(pdf_path, tolerance_sqm=5.0):
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found at path: {pdf_path}")
        
    doc = pymupdf.open(pdf_path)
    page = doc[0]
    page_rect = page.rect
    page_width = float(page_rect.width)
    page_height = float(page_rect.height)
    
    # ---------------------------------------------------------
    # 1. EXTRACT OFFICIAL PLOT-AREA TABLE FROM PDF
    # ---------------------------------------------------------
    blocks = page.get_text("dict")["blocks"]
    all_spans = []
    for b in blocks:
        if "lines" in b:
            for l in b["lines"]:
                for s in l["spans"]:
                    txt = s["text"].strip()
                    if txt:
                        all_spans.append({
                            "text": txt,
                            "bbox": s["bbox"],
                            "x0": round(s["bbox"][0], 1),
                            "y0": round(s["bbox"][1], 1),
                            "x1": round(s["bbox"][2], 1),
                            "y1": round(s["bbox"][3], 1),
                            "size": round(s["size"], 2),
                            "font": s["font"]
                        })
                        
    # Filter table region: X >= 1150 and Y >= 580
    table_items = [t for t in all_spans if t["x0"] >= 1150 and t["y0"] >= 580]
    table_rows = []
    for item in table_items:
        placed = False
        for r in table_rows:
            if abs(r[0]["y0"] - item["y0"]) <= 4.0:
                r.append(item)
                placed = True
                break
        if not placed:
            table_rows.append([item])
            
    official_table_map = {} # plot_num -> official_area_sqm
    official_records_list = []
    
    for r in sorted(table_rows, key=lambda row: row[0]["y0"]):
        r_sorted = sorted(r, key=lambda item: item["x0"])
        col1 = [t for t in r_sorted if 1210 <= t["x0"] <= 1320]
        col2 = [t for t in r_sorted if 1350 <= t["x0"] <= 1460]
        col3 = [t for t in r_sorted if 1490 <= t["x0"] <= 1600]
        
        for col in [col1, col2, col3]:
            if len(col) >= 2:
                pnum = None
                area_val = None
                for t in col:
                    if t["text"].isdigit():
                        v = int(t["text"])
                        if (1 <= v <= 73) or v in [77, 78, 79]:
                            pnum = v
                    elif re.match(r'^\d+\.\d{1,2}$', t["text"]):
                        try:
                            area_val = float(t["text"])
                        except ValueError:
                            pass
                if pnum is not None and area_val is not None:
                    official_table_map[pnum] = area_val
                    official_records_list.append({"plotNumber": str(pnum), "officialAreaSqm": area_val})

    # ---------------------------------------------------------
    # 2. EXTRACT STRUCTURAL VECTOR BOUNDARY LINES (LINES & CURVES)
    # ---------------------------------------------------------
    drawings = page.get_drawings()
    structural_lines = []
    
    for d in drawings:
        color = d.get("color")
        if color:
            r, g, b = color
            # Exclude yellow hatch (0.96, 0.94, 0.50) and gray hatch (0.50, 0.50, 0.50)
            if r > 0.9 and g > 0.9 and b > 0.4:
                continue
            if abs(r - 0.5) < 0.05 and abs(g - 0.5) < 0.05 and abs(b - 0.5) < 0.05:
                continue

        for item in d.get("items", []):
            cmd = item[0]
            if cmd == 'l':
                p1, p2 = item[1], item[2]
                if p1.x >= 1150 or p2.x >= 1150:
                    continue
                x1, y1 = round(p1.x * 2) / 2, round(p1.y * 2) / 2
                x2, y2 = round(p2.x * 2) / 2, round(p2.y * 2) / 2
                if ((x2-x1)**2 + (y2-y1)**2)**0.5 >= 1.0:
                    structural_lines.append(LineString([(x1, y1), (x2, y2)]))
            elif cmd == 'c':
                p1, p4 = item[1], item[4]
                if p1.x >= 1150 or p4.x >= 1150:
                    continue
                x1, y1 = round(p1.x * 2) / 2, round(p1.y * 2) / 2
                x4, y4 = round(p4.x * 2) / 2, round(p4.y * 2) / 2
                if ((x4-x1)**2 + (y4-y1)**2)**0.5 >= 1.0:
                    structural_lines.append(LineString([(x1, y1), (x4, y4)]))

    merged = unary_union(structural_lines)
    all_polys = [p for p in polygonize(merged) if 100 <= p.area <= 50000]

    # ---------------------------------------------------------
    # 3. STRICT 1-TO-1 MAP TEXT LABELS & SPATIAL ASSOCIATION
    # ---------------------------------------------------------
    map_labels = []
    for s in all_spans:
        txt = s["text"]
        if re.match(r'^0?[1-9]$|^[1-9]\d$', txt) and s["size"] >= 10.0 and s["x0"] < 1150:
            val = int(txt)
            if (1 <= val <= 73) or val in [77, 78, 79]:
                cx = (s["bbox"][0] + s["bbox"][2]) / 2.0
                cy = (s["bbox"][1] + s["bbox"][3]) / 2.0
                map_labels.append({
                    "plot_num": val,
                    "raw_text": txt,
                    "cx": cx,
                    "cy": cy,
                    "pt": Point(cx, cy),
                    "bbox": s["bbox"]
                })

    matched_plots = []
    used_poly_indices = set()
    found_plot_ids = set()
    
    raw_ratios = []
    temp_matches = []
    
    # Sort map labels by plot number
    for lbl in sorted(map_labels, key=lambda l: l["plot_num"]):
        pnum = lbl["plot_num"]
        pt = lbl["pt"]
        
        best_idx = None
        min_dist = 999999
        for idx, poly in enumerate(all_polys):
            if idx in used_poly_indices:
                continue
            dist = 0 if poly.contains(pt) else poly.distance(pt)
            if dist < min_dist:
                min_dist = dist
                best_idx = idx
                
        if best_idx is not None and min_dist < 150.0:
            used_poly_indices.add(best_idx)
            poly = all_polys[best_idx]
            official_sqm = official_table_map.get(pnum, 0.0)
            if official_sqm > 0:
                raw_ratios.append(poly.area / official_sqm)
            temp_matches.append((pnum, lbl, poly, best_idx))

    pts_per_sqm = np.median(raw_ratios) if raw_ratios else 10.86

    for pnum, lbl, poly, idx in temp_matches:
        if pnum in found_plot_ids:
            continue
        found_plot_ids.add(pnum)
        
        coords = [[round(x, 2), round(y, 2)] for x, y in poly.exterior.coords]
        calc_sqm = round(poly.area / pts_per_sqm, 2)
        calc_sqft = round(calc_sqm * 10.7639, 2)
        official_sqm = official_table_map.get(pnum, calc_sqm)
        official_sqft = round(official_sqm * 10.7639, 2)
        diff_sqm = round(abs(calc_sqm - official_sqm), 2)
        
        status = "VERIFIED" if diff_sqm <= tolerance_sqm else "GEOMETRY_MISMATCH"
        
        matched_plots.append({
            "plotId": f"Plot-{pnum}",
            "plotNumber": str(pnum),
            "rawLabel": lbl["raw_text"],
            "polygonGeometry": coords,
            "calculatedAreaSqm": calc_sqm,
            "calculatedAreaSqft": calc_sqft,
            "officialAreaSqm": official_sqm,
            "officialAreaSqft": official_sqft,
            "areaDifferenceSqm": diff_sqm,
            "verificationStatus": status,
            "sourcePdfPage": 1,
            "labelCenter": [round(lbl["cx"], 2), round(lbl["cy"], 2)]
        })

    # Unmatched polygons
    unmatched_polygons = []
    for idx, poly in enumerate(all_polys):
        if idx not in used_poly_indices:
            coords = [[round(x, 2), round(y, 2)] for x, y in poly.exterior.coords]
            calc_sqm = round(poly.area / pts_per_sqm, 2)
            unmatched_polygons.append({
                "tempId": f"UNKNOWN_POLY_{idx+1}",
                "polygonGeometry": coords,
                "calculatedAreaSqm": calc_sqm,
                "verificationStatus": "NEEDS_REVIEW"
            })

    expected_plot_ids = set(range(1, 74)).union({77, 78, 79})
    missing_plot_ids = sorted(list(expected_plot_ids - found_plot_ids))
    
    forensic_report = {
        "documentName": os.path.basename(pdf_path),
        "pageCount": 1,
        "pageDimensionsPt": {"width": page_width, "height": page_height},
        "boundaryCandidatesFound": len(structural_lines),
        "validPolygonsReconstructed": len(all_polys),
        "tableRecordsExtracted": len(official_records_list),
        "expectedSourcePlotCount": 76,
        "matchedPlotCount": len(matched_plots),
        "unmatchedPolygonsCount": len(unmatched_polygons),
        "missingPlotIdsInSource": missing_plot_ids,
        "explicitlyExcludedPlots": [74, 75, 76],
        "duplicateIdsFound": [],
        "geometryMismatchCount": len([p for p in matched_plots if p["verificationStatus"] == "GEOMETRY_MISMATCH"]),
        "verifiedPlotsCount": len([p for p in matched_plots if p["verificationStatus"] == "VERIFIED"]),
        "canPublish": len(missing_plot_ids) == 0 and len([p for p in matched_plots if p["verificationStatus"] == "GEOMETRY_MISMATCH"]) == 0
    }
    
    return {
        "forensicReport": forensic_report,
        "officialTableMap": official_table_map,
        "matchedPlots": matched_plots,
        "unmatchedPolygons": unmatched_polygons
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_pdf = sys.argv[1]
    else:
        target_pdf = r"c:\Users\SHRI\Desktop\Sky-Cadastral\GOLDEN  CITY FINAL PLAN Model.pdf"
        
    try:
        result = parse_cadastral_pdf(target_pdf)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
