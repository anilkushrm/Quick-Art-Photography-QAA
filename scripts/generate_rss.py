#!/usr/bin/env python3
"""
Generate RSS 2.0 feed (feed.xml) for Quick Art Photography Academy Blog
"""

import os
import glob
import re
import html
from datetime import datetime, timezone, timedelta

def get_post_meta(html_path):
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Title
    t_match = re.search(r'<title>(.*?)</title>', content, re.DOTALL)
    title = html.unescape(t_match.group(1).strip()) if t_match else "Quick Art Academy Blog"

    # Meta description
    d_match = re.search(r'<meta\s+name=[\"\']description[\"\']\s+content=[\"\'](.*?)[\"\']', content, re.DOTALL)
    if not d_match:
        d_match = re.search(r'<meta\s+content=[\"\'](.*?)[\"\']\s+name=[\"\']description[\"\']', content, re.DOTALL)
    desc = html.unescape(d_match.group(1).strip()) if d_match else ""

    # Canonical URL
    c_match = re.search(r'<link\s+rel=[\"\']canonical[\"\']\s+href=[\"\'](.*?)[\"\']', content, re.DOTALL)
    canonical = c_match.group(1).strip() if c_match else ""
    if not canonical:
        slug = html_path.split("/")[1]
        canonical = f"https://quickartphotography.in/blog/{slug}/"

    # Date Published from Schema or fallback
    date_match = re.search(r'[\"\']datePublished[\"\']\s*:\s*[\"\']([^\"\']+)[\"\']', content)
    if date_match:
        raw_date = date_match.group(1).strip()
        # Parse date
        try:
            if "T" in raw_date:
                # e.g. 2026-09-30T00:00:00+05:30
                dt = datetime.fromisoformat(raw_date)
            else:
                # e.g. 2026-10-01
                dt = datetime.strptime(raw_date, "%Y-%m-%d").replace(tzinfo=timezone(timedelta(hours=5, minutes=30)))
        except Exception:
            dt = datetime(2026, 9, 25, 10, 0, 0, tzinfo=timezone(timedelta(hours=5, minutes=30)))
    else:
        # Fallback date based on file slug or default
        dt = datetime(2026, 9, 25, 10, 0, 0, tzinfo=timezone(timedelta(hours=5, minutes=30)))

    return {
        "title": title,
        "link": canonical,
        "description": desc,
        "pubDate": dt
    }

def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    blog_pattern = os.path.join(repo_root, "blog", "*", "index.html")
    files = glob.glob(blog_pattern)

    items = []
    for f in files:
        items.append(get_post_meta(f))

    # Sort descending by date
    items.sort(key=lambda x: x["pubDate"], reverse=True)

    build_date = datetime.now(timezone(timedelta(hours=5, minutes=30))).strftime("%a, %d %b %Y %H:%M:%S +0530")

    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        '  <channel>',
        '    <title>Quick Art Photography Academy Blog</title>',
        '    <link>https://quickartphotography.in/blog/</link>',
        '    <description>Master Adobe Premiere Pro, EDIUS X, DaVinci Resolve, Wedding Album Design, and AI filmmaking tools with practical Hindi tutorials by Anil Sharma.</description>',
        '    <language>hi-IN</language>',
        '    <copyright>Copyright 2026 Quick Art Photography Academy</copyright>',
        f'    <lastBuildDate>{build_date}</lastBuildDate>',
        '    <atom:link href="https://quickartphotography.in/feed.xml" rel="self" type="application/rss+xml" />',
        '    <image>',
        '      <url>https://quickartphotography.in/home-assets/ec55a6be3747a9.webp</url>',
        '      <title>Quick Art Photography Academy Blog</title>',
        '      <link>https://quickartphotography.in/blog/</link>',
        '    </image>'
    ]

    for item in items:
        pub_str = item["pubDate"].strftime("%a, %d %b %Y %H:%M:%S +0530")
        clean_title = item["title"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        xml_lines.extend([
            '    <item>',
            f'      <title>{clean_title}</title>',
            f'      <link>{item["link"]}</link>',
            f'      <guid isPermaLink="true">{item["link"]}</guid>',
            f'      <description><![CDATA[{item["description"]}]]></description>',
            f'      <pubDate>{pub_str}</pubDate>',
            '      <author>info@quickartphotography.in (Anil Sharma)</author>',
            '    </item>'
        ])

    xml_lines.extend([
        '  </channel>',
        '</rss>'
    ])

    out_path = os.path.join(repo_root, "feed.xml")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(xml_lines) + "\n")

    print(f"Generated {out_path} with {len(items)} blog posts.")

if __name__ == "__main__":
    main()
