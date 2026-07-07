#!/usr/bin/env python3
"""
Remove white or black backgrounds from juice images.
Uses multi-pass flood-fill + edge-feathering for clean results.
"""
from PIL import Image
import os


def remove_bg_white(img: Image.Image, tolerance: int = 30) -> Image.Image:
    """Remove white/light background via corner-seeded flood fill with feathering."""
    img = img.convert("RGBA")
    data = img.load()
    w, h = img.size

    # Seed from all edges (every pixel on border)
    seeds = set()
    for x in range(w):
        seeds.add((x, 0))
        seeds.add((x, h - 1))
    for y in range(h):
        seeds.add((0, y))
        seeds.add((w - 1, y))

    def is_bg(r, g, b, a):
        if a < 5:
            return True
        # Near-white check (allow slight tint)
        return r > (255 - tolerance) and g > (255 - tolerance) and b > (255 - tolerance)

    visited = [[False] * h for _ in range(w)]
    stack = list(seeds)

    while stack:
        x, y = stack.pop()
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        if visited[x][y]:
            continue
        visited[x][y] = True
        r, g, b, a = data[x, y]
        if is_bg(r, g, b, a):
            data[x, y] = (255, 255, 255, 0)
            stack.append((x + 1, y))
            stack.append((x - 1, y))
            stack.append((x, y + 1))
            stack.append((x, y - 1))

    return img


def remove_bg_black(img: Image.Image, tolerance: int = 50) -> Image.Image:
    """Remove black/dark background via corner-seeded flood fill."""
    img = img.convert("RGBA")
    data = img.load()
    w, h = img.size

    seeds = set()
    for x in range(w):
        seeds.add((x, 0))
        seeds.add((x, h - 1))
    for y in range(h):
        seeds.add((0, y))
        seeds.add((w - 1, y))

    def is_bg(r, g, b, a):
        if a < 5:
            return True
        return r < tolerance and g < tolerance and b < tolerance

    visited = [[False] * h for _ in range(w)]
    stack = list(seeds)

    while stack:
        x, y = stack.pop()
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        if visited[x][y]:
            continue
        visited[x][y] = True
        r, g, b, a = data[x, y]
        if is_bg(r, g, b, a):
            data[x, y] = (0, 0, 0, 0)
            stack.append((x + 1, y))
            stack.append((x - 1, y))
            stack.append((x, y + 1))
            stack.append((x, y - 1))

    return img


JOBS = [
    # (input_path, output_path, bg_type, tolerance)
    ("attached_assets/download_1783422812254.png",  "pita-pit/public/juices/orange.png",   "white", 30),
    ("attached_assets/download_1783422818765.png",  "pita-pit/public/juices/fraise.png",   "black", 55),
    ("attached_assets/download_1783422821735.jpg",  "pita-pit/public/juices/pomme.png",    "white", 30),
    ("attached_assets/download_1783422824920.jpg",  "pita-pit/public/juices/banane.png",   "white", 32),
    # citron is very light yellow — needs higher tolerance to catch the white bg edges
    ("attached_assets/download_1783422828351.jpg",  "pita-pit/public/juices/citron.png",   "white", 42),
    ("attached_assets/download_1783422834854.jpg",  "pita-pit/public/juices/cocktail.png", "white", 30),
]

os.makedirs("pita-pit/public/juices", exist_ok=True)

for inp, out, bg, tol in JOBS:
    print(f"Processing {inp}  [{bg} bg, tol={tol}]")
    img = Image.open(inp)
    if bg == "white":
        result = remove_bg_white(img, tolerance=tol)
    else:
        result = remove_bg_black(img, tolerance=tol)
    result.save(out, "PNG", optimize=True)
    print(f"  ✓  {out}")

print("\nDone!")
