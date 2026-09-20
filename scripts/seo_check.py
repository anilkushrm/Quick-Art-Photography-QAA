import os
import re
import json
import glob
from html.parser import HTMLParser

PAGE_CONFIGS = {
    "index.html": {
        "url": "/",
        "min_words": 2400,
        "primary": "Quick Art Photography Academy",
        "secondaries": [
            "Quick Art Photography",
            "video editing course in Siwan",
            "photo and video editing course in Siwan",
            "best video editing course in Bihar",
            "best video editing course in Siwan"
        ]
    },
    "courses/video-editing/index.html": {
        "url": "/courses/video-editing/",
        "min_words": 1800,
        "primary": "video editing course",
        "secondaries": [
            "video editing course fees",
            "best video editing course in Bihar",
            "video editing classes near me",
            "video editing course in Hindi",
            "video editing classes",
            "wedding video editing course"
        ]
    },
    "courses/album-design/index.html": {
        "url": "/courses/album-design/",
        "min_words": 1500,
        "primary": "album design course",
        "secondaries": [
            "wedding album design course",
            "photo album design course",
            "wedding album design class"
        ]
    },
    "courses/ai-wedding-filmmaking/index.html": {
        "url": "/courses/ai-wedding-filmmaking/",
        "min_words": 1300,
        "primary": "AI video editing course",
        "secondaries": [
            "AI wedding filmmaking course",
            "AI photo editing for wedding"
        ]
    },
    "master-class/index.html": {
        "url": "/master-class/",
        "min_words": 1900,
        "primary": "wedding filmmaking course",
        "secondaries": [
            "wedding videography course",
            "wedding photography and videography course",
            "cinematic wedding editing course"
        ]
    },
    "online/album-design-course/index.html": {
        "url": "/online/album-design-course/",
        "min_words": 1900,
        "primary": "album designing course online",
        "secondaries": [
            "wedding album design course online",
            "album design course in Hindi",
            "photo album design course"
        ]
    },
    "online/premiere-pro-course/index.html": {
        "url": "/online/premiere-pro-course/",
        "min_words": 1900,
        "primary": "adobe premiere pro course",
        "secondaries": [
            "adobe premiere pro classes",
            "best premiere pro course in India",
            "adobe premiere course",
            "advance premiere pro course",
            "premiere pro online course",
            "best premiere pro online course",
            "premiere pro course",
            "wedding video editing course"
        ]
    },
    "online/davinci-resolve-course/index.html": {
        "url": "/online/davinci-resolve-course/",
        "min_words": 1900,
        "primary": "DaVinci Resolve course",
        "secondaries": [
            "best DaVinci Resolve online course",
            "DaVinci Resolve course in Hindi",
            "DaVinci Resolve wedding video editing course",
            "DaVinci Resolve color grading course",
            "DaVinci Resolve online course"
        ]
    },
    "online/edius-course/index.html": {
        "url": "/online/edius-course/",
        "min_words": 1900,
        "primary": "EDIUS course",
        "secondaries": [
            "best EDIUS online course",
            "wedding video editing training",
            "EDIUS video editing course"
        ]
    },
    "online/cinematic-editing-course/index.html": {
        "url": "/online/cinematic-editing-course/",
        "min_words": 1900,
        "primary": "cinematic wedding video editing course",
        "secondaries": [
            "wedding teaser editing course",
            "wedding highlight video editing",
            "Instagram reels editing course",
            "cinematic video editing course in Hindi"
        ]
    },
    "online/pre-wedding-shoot-course/index.html": {
        "url": "/online/pre-wedding-shoot-course/",
        "min_words": 1900,
        "primary": "pre wedding shoot course",
        "secondaries": [
            "pre wedding photography course",
            "pre wedding video course in Hindi",
            "cinematography course online",
            "wedding photography course"
        ]
    },
    "online/website-design-course/index.html": {
        "url": "/online/website-design-course/",
        "min_words": 1900,
        "primary": "website design course",
        "secondaries": [
            "web design course",
            "website design course in Hindi",
            "web design classes",
            "WordPress web designing",
            "web design for photographers"
        ]
    },
    "online/digital-marketing-course/index.html": {
        "url": "/online/digital-marketing-course/",
        "min_words": 1900,
        "primary": "digital marketing course in Hindi",
        "secondaries": [
            "digital marketing course for photographers",
            "Instagram marketing course",
            "Facebook ads course in Hindi",
            "social media marketing course in Hindi"
        ]
    },
    "online/automation-course/index.html": {
        "url": "/online/automation-course/",
        "min_words": 1900,
        "primary": "WhatsApp automation",
        "secondaries": [
            "WhatsApp automation for business",
            "WhatsApp business automation",
            "auto message WhatsApp",
            "photography studio CRM"
        ]
    },
    "online/index.html": {
        "url": "/online/",
        "min_words": 2200,
        "primary": "online video editing course",
        "secondaries": [
            "learn video editing online",
            "video editing classes online",
            "video editing course in Hindi"
        ]
    },
    "courses/index.html": {
        "url": "/courses/",
        "min_words": 1400,
        "primary": "photography and video editing courses in Siwan",
        "secondaries": [
            "video editing institute in Siwan",
            "editing courses in Bihar"
        ]
    },
    "contact-us/index.html": {
        "url": "/contact-us/",
        "min_words": 800,
        "primary": "Quick Art Photography Academy contact",
        "secondaries": [
            "video editing course in Siwan address",
            "free demo class Siwan"
        ]
    },
    "blog/best-video-editing-software-in-2026/index.html": {
        "url": "/blog/best-video-editing-software-in-2026/",
        "min_words": 1400,
        "primary": "best video editing software",
        "secondaries": [
            "video editing software for wedding",
            "Premiere Pro vs DaVinci Resolve"
        ]
    },
    "blog/freelance-video-editor-earn-in-bihar/index.html": {
        "url": "/blog/freelance-video-editor-earn-in-bihar/",
        "min_words": 1300,
        "primary": "freelance video editor in Bihar",
        "secondaries": [
            "video editor salary in India",
            "how to become a video editor"
        ]
    },
    "blog/how-ai-is-changing-wedding-filmmaking-2026/index.html": {
        "url": "/blog/how-ai-is-changing-wedding-filmmaking-2026/",
        "min_words": 1300,
        "primary": "AI in wedding filmmaking",
        "secondaries": [
            "AI video editing course",
            "AI wedding editing"
        ]
    }
}

class BodyTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_chunks = []
        self.ignore_stack = []

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'nav', 'footer', 'noscript', 'head'):
            self.ignore_stack.append(tag)

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'nav', 'footer', 'noscript', 'head'):
            if self.ignore_stack and self.ignore_stack[-1] == tag:
                self.ignore_stack.pop()

    def handle_data(self, data):
        if not self.ignore_stack:
            self.text_chunks.append(data)

    def get_text(self):
        return ' '.join(self.text_chunks)

def count_phrase(text, phrase):
    # case insensitive phrase matching with word boundaries
    pattern = r'\b' + re.escape(phrase.strip()) + r'\b'
    return len(re.findall(pattern, text, re.IGNORECASE))

def check_placement(html, primary):
    p_lower = primary.lower()

    # in title
    t_match = re.search(r'<title>(.*?)</title>', html, re.DOTALL | re.IGNORECASE)
    in_title = bool(t_match and p_lower in t_match.group(1).lower())

    # in meta description
    d_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html, re.DOTALL | re.IGNORECASE)
    in_desc = bool(d_match and p_lower in d_match.group(1).lower())

    # in H1
    h1_match = re.search(r'<h1\b[^>]*>(.*?)</h1>', html, re.DOTALL | re.IGNORECASE)
    in_h1 = bool(h1_match and p_lower in h1_match.group(1).lower())

    # in first 100 words of body
    parser = BodyTextExtractor()
    parser.feed(html)
    full_text = parser.get_text()
    words = full_text.split()
    first_100 = ' '.join(words[:120]).lower()
    in_first_100 = p_lower in first_100

    # in H2
    h2s = re.findall(r'<h2\b[^>]*>(.*?)</h2>', html, re.DOTALL | re.IGNORECASE)
    in_h2 = any(p_lower in h2.lower() for h2 in h2s)

    # in last paragraph / section (last 150 words)
    last_150 = ' '.join(words[-180:]).lower() if len(words) > 180 else full_text.lower()
    in_last = p_lower in last_150

    # images with keyword alt
    imgs = re.findall(r'<img\b[^>]*alt=["\']([^"\']*)["\']', html, re.IGNORECASE)
    img_kw_alts = sum(1 for alt in imgs if p_lower in alt.lower())

    return {
        "title": in_title,
        "desc": in_desc,
        "h1": in_h1,
        "first_100": in_first_100,
        "h2": in_h2,
        "last": in_last,
        "img_kw_alts": img_kw_alts,
        "total_words": len(words)
    }

def audit_all():
    print("=" * 110)
    print("SEO AUDIT REPORT (Visible Body Text, Excluding Nav/Footer/Scripts)")
    print("=" * 110)
    print(f"{'Page':<35} | {'Words':<7} | {'Primary Keyword':<30} | {'Count':<5} | {'Density':<8} | {'Status'}")
    print("-" * 110)

    flagged_pages = []

    for rel_path, cfg in PAGE_CONFIGS.items():
        if not os.path.exists(rel_path):
            print(f"MISSING FILE: {rel_path}")
            continue

        with open(rel_path, "r", encoding="utf-8") as f:
            html = f.read()

        parser = BodyTextExtractor()
        parser.feed(html)
        body_text = parser.get_text()
        total_words = len(re.findall(r'\b\w+\b', body_text))

        prim = cfg["primary"]
        p_count = count_phrase(body_text, prim)
        density = (p_count / max(total_words, 1)) * 100 if total_words else 0.0

        status = "OK"
        if total_words < cfg["min_words"]:
            status = f"LOW WORDS (<{cfg['min_words']})"
            flagged_pages.append((rel_path, status))
        elif density < 0.8:
            status = f"LOW DENSITY ({density:.2f}% < 0.8%)"
            flagged_pages.append((rel_path, status))
        elif density > 1.5:
            status = f"HIGH DENSITY ({density:.2f}% > 1.5%)"
            flagged_pages.append((rel_path, status))

        print(f"{rel_path:<35} | {total_words:<7} | {prim:<30} | {p_count:<5} | {density:.2f}%   | {status}")

    print("=" * 110)
    print(f"Total Configured Pages: {len(PAGE_CONFIGS)}. Flagged: {len(flagged_pages)}")
    return flagged_pages

if __name__ == "__main__":
    audit_all()
