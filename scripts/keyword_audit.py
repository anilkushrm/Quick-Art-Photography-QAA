#!/usr/bin/env python3
"""
Keyword Audit Script for quickartphotography.in
Analyzes primary target keywords in:
- <title>
- <meta name="description">
- <h1>
- Body content
"""

import os
import glob
import re

TARGET_KEYWORDS = {
    "index.html": [
        "video editing course in siwan",
        "video editing course in bihar",
        "photo and video editing course in siwan"
    ],
    "courses/video-editing/index.html": [
        "video editing course in siwan",
        "video editing",
        "edius",
        "premiere pro"
    ],
    "courses/album-design/index.html": [
        "wedding album design course",
        "album design",
        "photoshop"
    ],
    "courses/ai-wedding-filmmaking/index.html": [
        "ai wedding filmmaking",
        "ai video editing course"
    ],
    "master-class/index.html": [
        "wedding filmmaking master class",
        "video editing",
        "siwan"
    ],
    "online/premiere-pro-course/index.html": [
        "adobe premiere pro course in hindi",
        "premiere pro",
        "video editing"
    ],
    "online/edius-course/index.html": [
        "edius",
        "wedding editing course"
    ],
    "online/davinci-resolve-course/index.html": [
        "davinci resolve course in hindi",
        "color grading"
    ],
    "online/cinematic-editing-course/index.html": [
        "cinematic wedding",
        "video editing"
    ],
    "online/album-design-course/index.html": [
        "album design",
        "photoshop"
    ],
    "online/pre-wedding-shoot-course/index.html": [
        "pre-wedding shoot",
        "filmmaking"
    ],
    "online/website-design-course/index.html": [
        "website design",
        "wordpress"
    ],
    "online/digital-marketing-course/index.html": [
        "digital marketing",
        "photographers"
    ],
    "online/automation-course/index.html": [
        "whatsapp automation",
        "crm"
    ],
    "blog/best-video-editing-software-in-2026/index.html": [
        "best video editing software",
        "premiere pro vs davinci"
    ],
    "blog/freelance-video-editor-earn-in-bihar/index.html": [
        "freelance video editor",
        "earn in bihar"
    ],
    "blog/how-ai-is-changing-wedding-filmmaking-2026/index.html": [
        "ai",
        "wedding filmmaking"
    ],
    "blog/top-10-photography-studios-in-chapra/index.html": [
        "photography studios in chapra",
        "chapra"
    ],
    "blog/top-5-editing-course-academies-in-patna/index.html": [
        "editing course academies in patna",
        "patna"
    ],
    "blog/video-editing-course-in-gaya/index.html": [
        "video editing course in gaya",
        "gaya"
    ]
}

def analyze_keywords():
    print(f"{'Page':<40} | {'Title Match':<12} | {'H1 Match':<10} | {'Meta Desc Match':<15} | Target Keywords")
    print("-" * 110)
    
    for file_path, keywords in TARGET_KEYWORDS.items():
        if not os.path.exists(file_path):
            continue
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().lower()

        title_m = re.search(r'<title>(.*?)</title>', content, re.DOTALL)
        title = title_m.group(1) if title_m else ""

        desc_m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', content, re.DOTALL)
        desc = desc_m.group(1) if desc_m else ""

        h1_m = re.search(r'<h1\b[^>]*>(.*?)</h1>', content, re.DOTALL)
        h1 = re.sub(r'<[^>]+>', '', h1_m.group(1)).strip() if h1_m else ""

        t_matches = sum(1 for kw in keywords if kw.lower() in title)
        h_matches = sum(1 for kw in keywords if kw.lower() in h1)
        d_matches = sum(1 for kw in keywords if kw.lower() in desc)

        t_status = f"{t_matches}/{len(keywords)}"
        h_status = f"{h_matches}/{len(keywords)}"
        d_status = f"{d_matches}/{len(keywords)}"

        print(f"{file_path:<40} | {t_status:<12} | {h_status:<10} | {d_status:<15} | {', '.join(keywords[:2])}")

if __name__ == "__main__":
    analyze_keywords()
