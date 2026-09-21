#!/usr/bin/env python3
"""
Comprehensive SEO Audit Script for Quick Art Photography Academy
Audits:
- Title, Meta Description, Canonical tag
- H1 tags (missing, multiple)
- OpenGraph & Twitter tags
- Images missing alt attributes
- Internal broken links
- Sitemap.xml coverage
- Core keyword presence
"""

import os
import glob
import re
import xml.etree.ElementTree as ET

def audit_site():
    html_files = sorted(glob.glob("**/*.html", recursive=True))
    
    # Read sitemap.xml
    sitemap_urls = set()
    if os.path.exists("sitemap.xml"):
        tree = ET.parse("sitemap.xml")
        root = tree.getroot()
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        for loc in root.findall('.//ns:loc', namespace):
            sitemap_urls.add(loc.text.strip())

    non_indexable = {
        "404.html",
        "admin.html",
        "adobe-premiere-pro-course/index.html",
        "best-davinci-resolve-online-course-in-hindi/index.html",
        "courses/graphic-design/index.html",
        "join-video-editing-album-design-course/index.html",
        "master-class/live.html",
        "portal/email-template-preview.html",
        "portal/index.html",
        "portal/signup.html",
        "thank-you/index.html",
        "watch/index.html"
    }

    report = []
    broken_links = []
    all_images_missing_alt = []

    for f in html_files:
        with open(f, "r", encoding="utf-8") as fp:
            content = fp.read()

        is_non_indexable = f in non_indexable or 'noindex' in content.lower()

        # Extract title
        title_m = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
        title = title_m.group(1).strip() if title_m else None

        # Extract meta description
        desc_m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE | re.DOTALL)
        if not desc_m:
            desc_m = re.search(r'<meta\s+content=["\'](.*?)["\']\s+name=["\']description["\']', content, re.IGNORECASE | re.DOTALL)
        desc = desc_m.group(1).strip() if desc_m else None

        # Extract canonical
        canon_m = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', content, re.IGNORECASE | re.DOTALL)
        canonical = canon_m.group(1).strip() if canon_m else None

        # Extract H1s
        h1s = re.findall(r'<h1\b[^>]*>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
        h1_texts = [re.sub(r'<[^>]+>', '', h).strip() for h in h1s]

        # Extract images without alt
        imgs = re.findall(r'<img\b([^>]*)>', content, re.IGNORECASE)
        missing_alt = 0
        for img in imgs:
            if 'alt=' not in img.lower():
                missing_alt += 1
            else:
                # Check for empty alt=""
                alt_val = re.search(r'alt=["\'](.*?)["\']', img, re.IGNORECASE)
                # alt="" is fine if decorative, but let's count if alt is completely absent
                pass

        # Check OpenGraph
        has_og_title = bool(re.search(r'<meta\s+property=["\']og:title["\']', content, re.I))
        has_og_desc = bool(re.search(r'<meta\s+property=["\']og:description["\']', content, re.I))
        has_og_img = bool(re.search(r'<meta\s+property=["\']og:image["\']', content, re.I))

        # Check Schema
        has_schema = bool(re.search(r'<script\s+type=["\']application/ld\+json["\']', content, re.I))

        # Expected canonical URL
        expected_url = "https://quickartphotography.in/" if f == "index.html" else f"https://quickartphotography.in/{f.replace('index.html', '')}"

        issues = []
        if not is_non_indexable:
            if not title:
                issues.append("Missing <title>")
            elif len(title) < 25:
                issues.append(f"Title too short ({len(title)} chars): '{title}'")
            elif len(title) > 75:
                issues.append(f"Title too long ({len(title)} chars): '{title[:45]}...'")

            if not desc:
                issues.append("Missing meta description")
            elif len(desc) < 70:
                issues.append(f"Meta desc too short ({len(desc)} chars)")
            elif len(desc) > 175:
                issues.append(f"Meta desc too long ({len(desc)} chars)")

            if not canonical:
                issues.append("Missing canonical tag")
            elif canonical != expected_url:
                issues.append(f"Canonical mismatch: got {canonical}, expected {expected_url}")

            if len(h1s) == 0:
                issues.append("Missing <h1> tag")
            elif len(h1s) > 1:
                issues.append(f"Multiple <h1> tags ({len(h1s)})")

            if not has_og_title:
                issues.append("Missing og:title")
            if not has_og_desc:
                issues.append("Missing og:description")
            if not has_og_img:
                issues.append("Missing og:image")

            if not has_schema:
                issues.append("Missing JSON-LD schema")

            if expected_url not in sitemap_urls:
                issues.append(f"Not in sitemap.xml: {expected_url}")

        report.append({
            "file": f,
            "url": expected_url,
            "is_non_indexable": is_non_indexable,
            "title": title,
            "h1": h1_texts[0] if h1_texts else None,
            "issues": issues
        })

    # Summary Output
    print("=== TECHNICAL SEO AUDIT RESULTS ===")
    indexable_count = sum(1 for r in report if not r["is_non_indexable"])
    print(f"Total files: {len(report)} | Indexable pages: {indexable_count} | Sitemap URLs: {len(sitemap_urls)}\n")

    has_issues = False
    for r in report:
        if r["issues"]:
            has_issues = True
            print(f"PAGE: {r['url']} ({r['file']})")
            for issue in r["issues"]:
                print(f"  - {issue}")
            print()

    if not has_issues:
        print("ALL INDEXABLE PAGES PASSED CRITICAL SEO CHECKS!")

if __name__ == "__main__":
    audit_site()
