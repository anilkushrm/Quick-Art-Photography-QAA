#!/usr/bin/env python3
"""
Quick Art Photography Academy - IndexNow Instant Indexing Ping
Submits all canonical URLs to Bing, Yandex, Seznam, and Naver via the IndexNow protocol.
Run this script whenever you update content or publish a new course/blog.
"""

import urllib.request
import json
import xml.etree.ElementTree as ET
import os

HOST = "quickartphotography.in"
KEY = "qaa9939800780siwankey2026seo"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
SITEMAP_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sitemap.xml")

def get_sitemap_urls():
    tree = ET.parse(SITEMAP_FILE)
    root = tree.getroot()
    urls = [elem.text.strip() for elem in root.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    return urls

def ping_indexnow(urls):
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls
    }
    
    data = json.dumps(payload).encode('utf-8')
    endpoints = [
        "https://api.indexnow.org/indexnow",
        "https://www.bing.com/indexnow",
        "https://yandex.com/indexnow"
    ]
    
    for ep in endpoints:
        try:
            req = urllib.request.Request(
                ep,
                data=data,
                headers={"Content-Type": "application/json; charset=utf-8"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                print(f"[{response.status}] Successfully pinged {ep} for {len(urls)} URLs.")
        except Exception as e:
            print(f"[Notice] Ping to {ep}: {e}")

if __name__ == "__main__":
    urls = get_sitemap_urls()
    print(f"Found {len(urls)} canonical URLs in sitemap.xml. Submitting to IndexNow...")
    ping_indexnow(urls)
