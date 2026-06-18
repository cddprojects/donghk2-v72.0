#!/usr/bin/env python3
"""Apply shared frontend performance optimizations to exported HTML pages."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FONT_URL = (
	"https://fonts.googleapis.com/css2?"
	"family=Noto+Sans+TC:wght@400;500;600;700&display=swap"
)

ANIMATION_STYLESHEETS = {
	"e-animation-fadeInLeft-css",
	"e-animation-fadeIn-css",
	"e-animation-fadeInUp-css",
	"e-animation-float-css",
	"e-animation-fadeInRight-css",
	"e-animation-grow-css",
	"e-animation-fadeInDown-css",
}

REMOVALS = [
	r'\n<link rel="alternate" type="application/rss\+xml"[^>]+>',
	r'\n<link rel="alternate" title="oEmbed \(JSON\)"[^>]+>',
	r'\n<link rel="alternate" title="oEmbed \(XML\)"[^>]+>',
	r'\n<link rel="https://api\.w\.org/"[^>]+>',
	r'\n<link rel="alternate" title="JSON" type="application/json"[^>]+>',
	r'\n<link rel="EditURI" type="application/rsd\+xml"[^>]+>',
	r'\n<style id="wp-emoji-styles-inline-css">.*?</style>',
	r'\n<script type="speculationrules">.*?</script>',
	r'\n<script id="wp-emoji-settings" type="application/json">.*?</script>',
	r'\n<script type="module">\n/\*! This file is auto-generated \*/\n.*?</script>',
]


def defer_stylesheet(match: re.Match[str]) -> str:
	tag = match.group(0)
	id_match = re.search(r'id="([^"]+)"', tag)
	if not id_match or id_match.group(1) not in ANIMATION_STYLESHEETS:
		return tag
	if 'media="print"' in tag:
		return tag
	return tag.replace('media="all"', 'media="print" onload="this.media=\'all\'"')


def optimize_html(html: str, *, preload_logo: bool = False) -> str:
	for pattern in REMOVALS:
		html = re.sub(pattern, "", html, flags=re.S)

	html = html.replace(
		"https://fonts.googleapis.com/css?family=Noto+Sans+TC:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic&amp;display=swap&amp;ver=7.0",
		FONT_URL,
	)

	if 'href="https://fonts.googleapis.com"' not in html:
		html = html.replace(
			'<link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin>',
			'<link rel="preconnect" href="https://fonts.googleapis.com">\n'
			'<link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin>',
		)

	if 'performance.css' not in html:
		html = html.replace(
			'<link rel="stylesheet" id="site-css" href="assets/site.css" media="all">',
			'<link rel="stylesheet" id="site-css" href="assets/site.css" media="all">\n'
			'<link rel="stylesheet" id="performance-css" href="assets/performance.css" media="all">',
		)
		html = html.replace(
			'<link rel="stylesheet" id="site-css" href="/assets/site.css" media="all">',
			'<link rel="stylesheet" id="site-css" href="/assets/site.css" media="all">\n'
			'<link rel="stylesheet" id="performance-css" href="/assets/performance.css" media="all">',
		)

	html = re.sub(r'<link rel="stylesheet"[^>]+>', defer_stylesheet, html)

	jquery_tags = []
	for script_id in ("jquery-core-js", "jquery-migrate-js"):
		match = re.search(
			rf'<script id="{script_id}" src="[^"]+"></script>\s*',
			html,
		)
		if match:
			jquery_tags.append(match.group(0).strip())
			html = html.replace(match.group(0), "")

	for tag in jquery_tags:
		defer_tag = tag.replace("<script ", '<script defer ')
		if defer_tag not in html:
			html = html.replace(
				'<script id="hello-theme-frontend-js"',
				f"{defer_tag}\n<script id=\"hello-theme-frontend-js\"",
				1,
			)

	html = re.sub(
		r'<script(?![^>]*\bdefer\b)([^>]*\ssrc="[^"]+")',
		r'<script defer\1',
		html,
	)

	html = html.replace(" elementor-invisible", "")
	html = html.replace("elementor-invisible ", "")

	html = re.sub(
		r'(<img[^>]*class="swiper-slide-image"[^>]*)(>)',
		lambda m: m.group(1)
		if "loading=" in m.group(1)
		else f'{m.group(1)} loading="lazy"{m.group(2)}',
		html,
	)

	if preload_logo and 'rel="preload" as="image" href="wp-content/uploads/2025/03/5.png"' not in html:
		html = html.replace(
			"<link rel=\"canonical\"",
			'<link rel="preload" as="image" href="wp-content/uploads/2025/03/5.png" fetchpriority="high">\n<link rel="canonical"',
			1,
		)
		html = html.replace(
			'src="wp-content/uploads/2025/03/3d-render-person-working-desk-with-laptop-clock-books-plants-desk-organizer-1024x1024.png"',
			'src="wp-content/uploads/2025/03/3d-render-person-working-desk-with-laptop-clock-books-plants-desk-organizer-768x768.png"',
			1,
		)

	return html


def main() -> int:
	targets = sys.argv[1:] or [
		"index.html",
		"thank-you/index.html",
		"privacy-policy/index.html",
	]

	for relative in targets:
		path = ROOT / relative
		original = path.read_text(encoding="utf-8")
		optimized = optimize_html(original, preload_logo=relative == "index.html")
		path.write_text(optimized, encoding="utf-8")
		print(f"optimized {relative}")

	return 0


if __name__ == "__main__":
	raise SystemExit(main())
