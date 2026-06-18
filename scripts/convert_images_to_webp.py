#!/usr/bin/env python3
"""Convert referenced site images to WebP and update HTML paths."""

from __future__ import annotations

import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGE_RE = re.compile(
	r"(wp-content/uploads/[^\"'\s>)]+?)\.(png|jpe?g)",
	re.IGNORECASE,
)
HTML_FILES = [
	ROOT / "index.html",
	ROOT / "thank-you/index.html",
	ROOT / "privacy-policy/index.html",
]
QUALITY = 82


def convert_image(path: Path) -> Path:
	webp_path = path.with_suffix(".webp")
	if webp_path.exists() and webp_path.stat().st_mtime >= path.stat().st_mtime:
		return webp_path

	with Image.open(path) as img:
		if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
			img = img.convert("RGBA")
			img.save(webp_path, "WEBP", quality=QUALITY, method=6, lossless=False)
		else:
			img.convert("RGB").save(webp_path, "WEBP", quality=QUALITY, method=6)

	return webp_path


def collect_references() -> set[Path]:
	references: set[Path] = set()
	for html_path in HTML_FILES:
		text = html_path.read_text(encoding="utf-8")
		for match in IMAGE_RE.finditer(text):
			references.add(ROOT / f"{match.group(1)}.{match.group(2).lower()}")
	return references


def update_html_text(text: str) -> str:
	return IMAGE_RE.sub(lambda m: f"{m.group(1)}.webp", text)


def main() -> int:
	references = sorted(collect_references())
	if not references:
		print("No image references found.")
		return 1

	converted = 0
	saved = 0
	missing = []

	for source in references:
		if not source.exists():
			missing.append(source)
			continue

		webp = convert_image(source)
		converted += 1
		saved += source.stat().st_size - webp.stat().st_size

	for html_path in HTML_FILES:
		original = html_path.read_text(encoding="utf-8")
		updated = update_html_text(original)
		if updated != original:
			html_path.write_text(updated, encoding="utf-8")
			print(f"updated {html_path.relative_to(ROOT)}")

	print(f"converted {converted} images")
	print(f"saved {saved / 1024 / 1024:.2f} MB compared with original referenced PNG/JPG files")
	if missing:
		print(f"missing {len(missing)} referenced files")
		for path in missing[:10]:
			print(f"  - {path.relative_to(ROOT)}")

	return 0


if __name__ == "__main__":
	raise SystemExit(main())
