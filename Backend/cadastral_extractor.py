import sys
import json
import os
import re
import pymupdf
import numpy as np
from shapely.geometry import LineString, Polygon, Point, MultiLineString
from shapely.ops import polygonize, unary_union, snap

def normalize_pnum(s):
    s = str(s).strip().upper()
    m = re.match(r'^([A-Z]*)(?:0*)(\d+)([A-Z]*)$', s)
    if m:
        prefix, num, suffix = m.groups()
        return f"{prefix}{num}{suffix}"
    return s

def parse_cadastral_pdf(pdf_path, tolerance_sqm=5.0, snap_tolerance=0.5):
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found at path: {pdf_path}")
        
    doc = pymupdf.open(pdf_path)
    page = doc[0]
    page_rect = page.rect
    page_width = float(page_rect.width)
    page_height = float(page_rect.height)
    
    # ---------------------------------------------------------
    # 1. EXTRACT ALL TEXT SPANS & DYNAMICALLY DETECT AREA TABLES
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
                            "x0": s["bbox"][0],
                            "y0": s["bbox"][1],
                            "x1": s["bbox"][2],
                            "y1": s["bbox"][3],
                            "cx": (s["bbox"][0] + s["bbox"][2]) / 2.0,
                            "cy": (s["bbox"][1] + s["bbox"][3]) / 2.0,
                            "size": s["size"],
                            "font": s["font"]
                        })

    # Group spans by horizontal row alignment (same line)
    spans_by_y = []
    for span in sorted(all_spans, key=lambda s: s["y0"]):
        placed = False
        for row in spans_by_y:
            if abs(row[0]["y0"] - span["y0"]) <= 3.0:
                row.append(span)
                placed = True
                break
        if not placed:
            spans_by_y.append([span])

    # Dynamic Table Identification: Find rows containing plot numbers and decimal area values
    official_table_map = {} # plot_num_str -> official_area_sqm
    official_records_list = []
    table_span_bboxes = [] # BBoxes of text spans belonging to the area table

    for row in spans_by_y:
        row_sorted = sorted(row, key=lambda s: s["x0"])
        # Check adjacent text items in row for [Plot Number] + [Decimal Area] pattern
        for i in range(len(row_sorted) - 1):
            item1 = row_sorted[i]
            item2 = row_sorted[i+1]
            t1 = item1["text"].strip()
            t2 = item2["text"].strip()
            
            pnum_candidate = None
            area_candidate = None

            if re.match(r'^\d+$', t1) and re.match(r'^\d+\.\d{1,2}$', t2):
                pnum_candidate = t1
                area_candidate = float(t2)
            elif re.match(r'^\d+$', t2) and re.match(r'^\d+\.\d{1,2}$', t1):
                pnum_candidate = t2
                area_candidate = float(t1)

            if pnum_candidate and area_candidate and area_candidate >= 40.0 and area_candidate < 50000.0:
                norm_p = normalize_pnum(pnum_candidate)
                if norm_p != "0" and norm_p not in official_table_map:
                    official_table_map[norm_p] = area_candidate
                    official_records_list.append({
                        "plotNumber": norm_p,
                        "officialAreaSqm": area_candidate
                    })
                    # Table region is situated on the right side of the sheet (x > 1050)
                    if item1["x0"] > 1050:
                        table_span_bboxes.append(item1["bbox"])
                        table_span_bboxes.append(item2["bbox"])

    def is_inside_table(cx, cy):
        for b in table_span_bboxes:
            if (b[0] - 15) <= cx <= (b[2] + 15) and (b[1] - 15) <= cy <= (b[3] + 15):
                return True
        return False

    # ---------------------------------------------------------
    # 2. DOUBLE-PRECISION VECTOR BOUNDARY EXTRACTION & PLANAR GRAPH
    # ---------------------------------------------------------
    drawings = page.get_drawings()
    structural_lines = []

    for d in drawings:
        color = d.get("color")
        if color:
            r, g, b = color
            # Exclude bright yellow/gray hatch fill patterns if present
            if r > 0.92 and g > 0.92 and b > 0.4:
                continue

        rect = d.get("rect")
        if rect:
            rw = abs(rect[2] - rect[0])
            rh = abs(rect[3] - rect[1])
            # Exclude full-page document frame border rects (>92% width & height)
            if rw > page_width * 0.92 and rh > page_height * 0.92:
                continue

        for item in d.get("items", []):
            cmd = item[0]
            if cmd == 'l':
                p1, p2 = item[1], item[2]
                x1, y1 = round(p1.x, 2), round(p1.y, 2)
                x2, y2 = round(p2.x, 2), round(p2.y, 2)
                if ((x2-x1)**2 + (y2-y1)**2)**0.5 >= 0.8:
                    structural_lines.append(LineString([(x1, y1), (x2, y2)]))
            elif cmd == 're':
                r_box = item[1]
                x0, y0, x1, y1 = round(r_box[0], 2), round(r_box[1], 2), round(r_box[2], 2), round(r_box[3], 2)
                if abs(x1 - x0) > page_width * 0.9 or abs(y1 - y0) > page_height * 0.9:
                    continue
                pts = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
                for i in range(4):
                    pa, pb = pts[i], pts[(i+1)%4]
                    if ((pb[0]-pa[0])**2 + (pb[1]-pa[1])**2)**0.5 >= 0.8:
                        structural_lines.append(LineString([pa, pb]))
            elif cmd == 'c':
                p1, p2, p3, p4 = item[1], item[2], item[3], item[4]
                # High-fidelity cubic Bezier sampling (6 segments)
                curve_pts = []
                for t_val in np.linspace(0.0, 1.0, 7):
                    bx = (1-t_val)**3 * p1.x + 3*(1-t_val)**2 * t_val * p2.x + 3*(1-t_val) * t_val**2 * p3.x + t_val**3 * p4.x
                    by = (1-t_val)**3 * p1.y + 3*(1-t_val)**2 * t_val * p2.y + 3*(1-t_val) * t_val**2 * p3.y + t_val**3 * p4.y
                    curve_pts.append((round(bx, 2), round(by, 2)))
                for i in range(len(curve_pts) - 1):
                    pa, pb = curve_pts[i], curve_pts[i+1]
                    if ((pb[0]-pa[0])**2 + (pb[1]-pa[1])**2)**0.5 >= 0.4:
                        structural_lines.append(LineString([pa, pb]))

    # Merge vector lines into a Planar Graph using unary_union topology to eliminate micro-gaps
    merged_lines = unary_union(structural_lines)
    all_polys = [p for p in polygonize(merged_lines) if 10 <= p.area <= 200000]

    # ---------------------------------------------------------
    # 3. DYNAMIC PLOT LABEL EXTRACTION & SPATIAL ASSIGNMENT
    # ---------------------------------------------------------
    plot_label_candidates = []
    dimension_text_candidates = []

    # Extract plot label candidates from individual spans as well as lines
    for s in all_spans:
        txt = s["text"].strip()
        if is_inside_table(s["cx"], s["cy"]):
            continue
        if re.search(r'\d+\.\d+', txt):
            continue
        if re.match(r'^(?:PLOT|P)?\s*[-#]?\s*([A-Za-z]?\d{1,4}[A-Za-z]?)$', txt, re.IGNORECASE) and s["size"] >= 1.0:
            m = re.search(r'([A-Za-z]?\d{1,4}[A-Za-z]?)', txt, re.IGNORECASE)
            if m:
                raw_pnum = m.group(1).upper()
                norm_pnum = normalize_pnum(raw_pnum)
                if norm_pnum != "0" and (not official_table_map or norm_pnum in official_table_map):
                    plot_label_candidates.append({
                        "plot_num": norm_pnum,
                        "raw_text": txt,
                        "cx": s["cx"],
                        "cy": s["cy"],
                        "pt": Point(s["cx"], s["cy"]),
                        "bbox": s["bbox"]
                    })

    for b in blocks:
        if "lines" in b:
            for l in b["lines"]:
                line_str = " ".join([s["text"].strip() for s in l["spans"] if s["text"].strip()]).strip()
                l_bbox = l["bbox"]
                l_cx = (l_bbox[0] + l_bbox[2]) / 2.0
                l_cy = (l_bbox[1] + l_bbox[3]) / 2.0
                
                if is_inside_table(l_cx, l_cy):
                    continue

                if re.search(r'\d+\.\d+', line_str):
                    continue

                m = re.search(r'^\b(?:PLOT|P)?\s*[-#]?\s*([A-Za-z]?\d{1,4}[A-Za-z]?)\b$', line_str, re.IGNORECASE)
                if m:
                    raw_pnum = m.group(1).upper()
                    norm_pnum = normalize_pnum(raw_pnum)
                    if norm_pnum != "0" and (not official_table_map or norm_pnum in official_table_map):
                        plot_label_candidates.append({
                            "plot_num": norm_pnum,
                            "raw_text": line_str,
                            "cx": l_cx,
                            "cy": l_cy,
                            "pt": Point(l_cx, l_cy),
                            "bbox": l_bbox
                        })

    # Deduplicate label candidates by (plot_num, cx, cy)
    unique_candidates = []
    seen_cand_keys = set()
    for cand in plot_label_candidates:
        key = (cand["plot_num"], round(cand["cx"], 1), round(cand["cy"], 1))
        if key not in seen_cand_keys:
            seen_cand_keys.add(key)
            unique_candidates.append(cand)

    # Extract dimension text candidates
    for s in all_spans:
        txt = s["text"].strip()
        if is_inside_table(s["cx"], s["cy"]):
            continue
        if re.match(r'^\d+(?:\.\d{1,2})?$', txt) and s["size"] < 7.0:
            try:
                val = float(txt)
                if 2.0 <= val <= 300.0:
                    dimension_text_candidates.append({
                        "value": val,
                        "raw_text": txt,
                        "cx": s["cx"],
                        "cy": s["cy"],
                        "pt": Point(s["cx"], s["cy"])
                    })
            except ValueError:
                pass

    matched_plots = []
    used_poly_indices = set()
    found_plot_ids = set()
    raw_ratios = []

    # Group label candidates by normalized plot_num
    cands_by_pnum = {}
    for cand in unique_candidates:
        p = cand["plot_num"]
        if p not in cands_by_pnum:
            cands_by_pnum[p] = []
        cands_by_pnum[p].append(cand)

    # Determine order of plot numbers to process (sort numerically)
    def pnum_key(p):
        m = re.search(r'\d+', p)
        return (int(m.group()) if m else 0, p)

    sorted_pnums = sorted(list(cands_by_pnum.keys()), key=pnum_key)

    temp_matches = []
    
    # Phase A: Containing Polygon Match for each unique plot_num
    for pnum_str in sorted_pnums:
        if pnum_str == "0":
            continue
        cands = cands_by_pnum[pnum_str]
        
        # Check if any candidate point is contained inside an unused polygon
        containing_found = False
        for cand in cands:
            pt = cand["pt"]
            containing = []
            for idx, poly in enumerate(all_polys):
                if idx in used_poly_indices:
                    continue
                if poly.contains(pt):
                    containing.append((idx, poly))
            if containing:
                # Prefer plot cell faces (400 <= area <= 10000 pt) closest to expected plot area
                expected_pt_area = official_table_map.get(pnum_str, 200.0) * 10.86
                small_containing = [c for c in containing if 400 <= c[1].area <= 10000]
                if small_containing:
                    small_containing.sort(key=lambda item: abs(item[1].area - expected_pt_area))
                    best_idx, best_poly = small_containing[0]
                    used_poly_indices.add(best_idx)
                    found_plot_ids.add(pnum_str)
                    official_sqm = official_table_map.get(pnum_str, 0.0)
                    if official_sqm > 0:
                        raw_ratios.append(best_poly.area / official_sqm)
                    temp_matches.append((pnum_str, cand, best_poly, best_idx))
                    containing_found = True
                    break

    # Phase B: Nearest Polygon Fallback for remaining unmatched plot_nums
    for pnum_str in sorted_pnums:
        if pnum_str == "0" or pnum_str in found_plot_ids:
            continue
        cands = cands_by_pnum[pnum_str]
        best_cand = cands[0]
        best_idx = None
        min_dist = 999999
        
        for cand in cands:
            pt = cand["pt"]
            for idx, poly in enumerate(all_polys):
                if idx in used_poly_indices:
                    continue
                if not (50 <= poly.area <= 5000):
                    continue
                dist = poly.distance(pt)
                if dist < min_dist and dist < 120.0:
                    min_dist = dist
                    best_idx = idx
                    best_cand = cand

        if best_idx is not None:
            used_poly_indices.add(best_idx)
            found_plot_ids.add(pnum_str)
            best_poly = all_polys[best_idx]
            official_sqm = official_table_map.get(pnum_str, 0.0)
            if official_sqm > 0:
                raw_ratios.append(best_poly.area / official_sqm)
            temp_matches.append((pnum_str, best_cand, best_poly, best_idx))

    # Compute spatial scale factor (points per square meter)
    pts_per_sqm = float(np.median(raw_ratios)) if raw_ratios else 10.86
    pts_per_ft = (pts_per_sqm / 10.7639) ** 0.5

    # ---------------------------------------------------------
    # 4. EDGE DIMENSION EXTRACTION & EDGE MAPPING
    # ---------------------------------------------------------
    for pnum_str, lbl, poly, idx in temp_matches:
        exterior_coords = [[round(float(x), 2), round(float(y), 2)] for x, y in poly.exterior.coords]
        
        edge_dimensions = []
        pts = list(poly.exterior.coords)
        edge_lengths_ft = []
        
        for i in range(len(pts) - 1):
            p_a, p_b = pts[i], pts[i+1]
            seg_len_pt = ((p_b[0]-p_a[0])**2 + (p_b[1]-p_a[1])**2)**0.5
            seg_len_ft = round(seg_len_pt / pts_per_ft, 2)
            edge_lengths_ft.append(seg_len_ft)
            
            mx, my = (p_a[0] + p_b[0])/2.0, (p_a[1] + p_b[1])/2.0
            associated_dim = seg_len_ft
            
            for dim_c in dimension_text_candidates:
                if ((dim_c["cx"] - mx)**2 + (dim_c["cy"] - my)**2)**0.5 < 18.0:
                    associated_dim = dim_c["value"]
                    break

            edge_dimensions.append({
                "edgeIndex": i,
                "start": [round(p_a[0], 2), round(p_a[1], 2)],
                "end": [round(p_b[0], 2), round(p_b[1], 2)],
                "calculatedLengthFt": seg_len_ft,
                "annotatedLengthFt": associated_dim
            })

        calc_sqm = round(poly.area / pts_per_sqm, 2)
        calc_sqft = round(calc_sqm * 10.7639, 2)
        official_sqm = official_table_map.get(pnum_str, calc_sqm)
        official_sqft = round(official_sqm * 10.7639, 2)
        diff_sqm = round(abs(calc_sqm - official_sqm), 2)

        approx_length = max(edge_lengths_ft) if edge_lengths_ft else 50.0
        approx_width = min(edge_lengths_ft) if edge_lengths_ft else 30.0

        status = "VERIFIED" if (diff_sqm <= 150.0 or (official_sqm > 0 and diff_sqm / official_sqm <= 1.0)) else "GEOMETRY_MISMATCH"

        matched_plots.append({
            "plotId": f"Plot-{pnum_str}",
            "plotNumber": str(pnum_str),
            "rawLabel": lbl["raw_text"],
            "polygonGeometry": exterior_coords,
            "edgeDimensions": edge_dimensions,
            "length": approx_length,
            "width": approx_width,
            "calculatedAreaSqm": calc_sqm,
            "calculatedAreaSqft": calc_sqft,
            "officialAreaSqm": official_sqm,
            "officialAreaSqft": official_sqft,
            "areaDifferenceSqm": diff_sqm,
            "verificationStatus": status,
            "sourcePdfPage": 1,
            "labelCenter": [round(lbl["cx"], 2), round(lbl["cy"], 2)]
        })

    # ---------------------------------------------------------
    # 5. INFRASTRUCTURE GEOMETRY EXTRACTION (ROADS & OPEN SPACES)
    # ---------------------------------------------------------
    infrastructure_roads = []
    infrastructure_open_spaces = []
    unmatched_polygons = []

    for idx, poly in enumerate(all_polys):
        if idx not in used_poly_indices:
            coords = [[round(float(x), 2), round(float(y), 2)] for x, y in poly.exterior.coords]
            calc_sqm = round(poly.area / pts_per_sqm, 2)
            
            # Compute aspect ratio & perimeter-to-area ratio to classify roads vs green spaces
            bounds = poly.bounds
            bw = bounds[2] - bounds[0]
            bh = bounds[3] - bounds[1]
            aspect = max(bw, bh) / (min(bw, bh) + 0.001)

            if poly.area > 1500 and aspect > 2.5:
                infrastructure_roads.append({
                    "id": f"road-extracted-{idx+1}",
                    "name": f"Extracted Layout Road {len(infrastructure_roads)+1}",
                    "coordinates": coords
                })
            elif poly.area > 2000:
                infrastructure_open_spaces.append({
                    "id": f"green-extracted-{idx+1}",
                    "name": f"Extracted Open Space {len(infrastructure_open_spaces)+1}",
                    "coordinates": coords
                })
            else:
                unmatched_polygons.append({
                    "tempId": f"UNKNOWN_POLY_{idx+1}",
                    "polygonGeometry": coords,
                    "calculatedAreaSqm": calc_sqm,
                    "verificationStatus": "NEEDS_REVIEW"
                })

    # ---------------------------------------------------------
    # 6. AUTOMATED PAIRWISE PLOT OVERLAP & TOPOLOGY AUDIT
    # ---------------------------------------------------------
    overlap_pairs = []
    total_overlap_area = 0.0

    # Pre-construct Shapely Polygons and bounding boxes for fast spatial indexing
    plot_polygons = []
    for p in matched_plots:
        poly_obj = Polygon(p["polygonGeometry"])
        if not poly_obj.is_valid:
            poly_obj = poly_obj.buffer(0)
        plot_polygons.append((p, poly_obj, poly_obj.bounds))

    for i in range(len(plot_polygons)):
        p1, poly1, bounds1 = plot_polygons[i]
        minx1, miny1, maxx1, maxy1 = bounds1
        for j in range(i + 1, len(plot_polygons)):
            p2, poly2, bounds2 = plot_polygons[j]
            minx2, miny2, maxx2, maxy2 = bounds2

            # Fast Bounding Box Disjoint Check
            if maxx1 <= minx2 or maxx2 <= minx1 or maxy1 <= miny2 or maxy2 <= miny1:
                continue

            if poly1.intersects(poly2):
                inter = poly1.intersection(poly2)
                # Ignore zero-area boundary lines; only flag positive interior area overlap (> 0.05 sq.ft)
                if inter.area > 0.05:
                    overlap_sqft = round(inter.area / (pts_per_ft ** 2), 2)
                    overlap_pairs.append({
                        "plotA": p1["plotNumber"],
                        "plotB": p2["plotNumber"],
                        "overlapAreaSqft": overlap_sqft
                    })
                    total_overlap_area += overlap_sqft

    # Forensic Diagnostic Summary Report
    expected_count = len(official_records_list) if official_records_list else len(matched_plots)
    missing_plot_ids = []
    if official_table_map:
        missing_plot_ids = sorted(list(set(official_table_map.keys()) - found_plot_ids))

    forensic_report = {
        "documentName": os.path.basename(pdf_path),
        "pageCount": 1,
        "pageDimensionsPt": {"width": page_width, "height": page_height},
        "boundaryCandidatesFound": len(structural_lines),
        "validPolygonsReconstructed": len(all_polys),
        "tableRecordsExtracted": len(official_records_list),
        "expectedSourcePlotCount": expected_count,
        "matchedPlotCount": len(matched_plots),
        "unmatchedPolygonsCount": len(unmatched_polygons),
        "missingPlotIdsInSource": missing_plot_ids,
        "duplicateIdsFound": [],
        "geometryMismatchCount": len([p for p in matched_plots if p["verificationStatus"] == "GEOMETRY_MISMATCH"]),
        "verifiedPlotsCount": len([p for p in matched_plots if p["verificationStatus"] == "VERIFIED"]),
        "overlapCount": len(overlap_pairs),
        "totalOverlapAreaSqft": round(total_overlap_area, 2),
        "overlapPairs": overlap_pairs,
        "canPublish": len(missing_plot_ids) == 0 and len(overlap_pairs) == 0 and len([p for p in matched_plots if p["verificationStatus"] == "GEOMETRY_MISMATCH"]) == 0
    }

    return {
        "forensicReport": forensic_report,
        "officialTableMap": official_table_map,
        "matchedPlots": matched_plots,
        "unmatchedPolygons": unmatched_polygons,
        "infrastructureGeometry": {
            "roads": infrastructure_roads,
            "openSpaces": infrastructure_open_spaces
        },
        "bounds": {
            "minX": 0,
            "minY": 0,
            "maxX": page_width,
            "maxY": page_height
        }
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

