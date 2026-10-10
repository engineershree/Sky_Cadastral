import pymupdf
import re
import os

pdf_path = "GOLDEN_CITY_FINAL_PLAN.pdf"
doc = pymupdf.open(pdf_path)
page = doc[0]

print("=== DEEP FORENSIC PDF AUDIT OF GOLDEN CITY FINAL PLAN ===")
print("File:", pdf_path)
print("Page rect:", page.rect)
print("Drawings:", len(page.get_drawings()))

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
                        "x0": round(s["bbox"][0], 2),
                        "y0": round(s["bbox"][1], 2),
                        "x1": round(s["bbox"][2], 2),
                        "y1": round(s["bbox"][3], 2),
                        "cx": round((s["bbox"][0] + s["bbox"][2]) / 2.0, 2),
                        "cy": round((s["bbox"][1] + s["bbox"][3]) / 2.0, 2),
                        "size": round(s["size"], 2)
                    })

print("Total non-empty text spans:", len(all_spans))

# 1. Group spans into rows (horizontal alignment)
rows = {}
for s in sorted(all_spans, key=lambda item: item["y0"]):
    y_key = round(s["y0"] / 3.0) * 3
    if y_key not in rows:
        rows[y_key] = []
    rows[y_key].append(s)

table_records = {}
for y_key, row in sorted(rows.items()):
    row_sorted = sorted(row, key=lambda item: item["x0"])
    for i in range(len(row_sorted) - 1):
        t1 = row_sorted[i]["text"]
        t2 = row_sorted[i+1]["text"]
        if re.match(r'^\d{1,3}$', t1) and re.match(r'^\d+\.\d{1,2}$', t2):
            pnum = int(t1)
            area = float(t2)
            if 30.0 <= area <= 50000.0:
                table_records[pnum] = {
                    "officialAreaSqm": area,
                    "x0": row_sorted[i]["x0"],
                    "y0": row_sorted[i]["y0"]
                }

print("\n--- 1. OFFICIAL SCHEDULE TABLE RECTIFICATION ---")
print(f"Total schedule table rows extracted: {len(table_records)}")
table_nums = sorted(list(table_records.keys()))
print("Table Plot Numbers:", table_nums)

# Find missing numbers in contiguous sequence 1..max
if table_nums:
    min_num, max_num = min(table_nums), max(table_nums)
    all_seq = set(range(min_num, max_num + 1))
    missing_in_table = sorted(list(all_seq - set(table_nums)))
    print(f"Sequence range: Plot {min_num} to Plot {max_num}")
    print(f"Plot numbers missing from schedule table: {missing_in_table}")

# 2. Extract map plot labels
print("\n--- 2. VECTOR MAP LABELS ANALYSIS ---")
map_plot_candidates = []
for s in all_spans:
    txt = s["text"]
    m = re.match(r'^(?:PLOT|P)?\s*[-#]?\s*(\d{1,3})$', txt, re.IGNORECASE)
    if m:
        pnum = int(m.group(1))
        map_plot_candidates.append({
            "plot_num": pnum,
            "text": txt,
            "cx": s["cx"],
            "cy": s["cy"],
            "x0": s["x0"]
        })

map_nums = sorted(list(set([c["plot_num"] for c in map_plot_candidates])))
print(f"Distinct plot number labels found on vector map: {len(map_nums)}")
print("Map Plot Numbers:", map_nums)

print("\n--- 3. COMPARISON & DETERMINATION OF EXPECTED ACTUAL PLOTS ---")
all_discovered_plots = sorted(list(set(table_nums) | set(map_nums)))
print(f"Total Union of Discovered Plots (Table + Map): {len(all_discovered_plots)}")
print("All Discovered Plot Numbers:", all_discovered_plots)

missing_from_map = sorted(list(set(table_nums) - set(map_nums)))
missing_from_table = sorted(list(set(map_nums) - set(table_nums)))

print(f"Plots in Table but NOT on Map: {missing_from_map}")
print(f"Plots on Map but NOT in Table: {missing_from_table}")
