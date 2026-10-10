import pymupdf

doc = pymupdf.open("GOLDEN_CITY_FINAL_PLAN.pdf")
page = doc[0]
blocks = page.get_text("dict")["blocks"]
for b in blocks:
    if "lines" in b:
        for l in b["lines"]:
            for s in l["spans"]:
                txt = s["text"].strip()
                if "74" in txt or "75" in txt or "76" in txt:
                    print(f"Text: '{txt}' | BBox: {s['bbox']}")
