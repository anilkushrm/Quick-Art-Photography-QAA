import os, re

workspace = "/Users/anilsharma/Documents/Quick art Photography Academy (Website)/Quick-Art-Photography-QAA"

geo_pages = [
    "index.html",
    "about-us/index.html",
    "contact-us/index.html",
    "courses/index.html",
    "courses/video-editing/index.html",
    "courses/album-design/index.html",
    "courses/ai-wedding-filmmaking/index.html",
    "master-class/index.html",
    "online/index.html"
]

all_indexable_pages = [
    "index.html", "about-us/index.html", "contact-us/index.html", "sitemap.html",
    "privacy-policy/index.html", "refund-policy/index.html", "shipping-policy/index.html", "terms-and-conditions/index.html",
    "courses/index.html", "courses/video-editing/index.html", "courses/album-design/index.html", "courses/ai-wedding-filmmaking/index.html",
    "master-class/index.html", "online/index.html",
    "online/premiere-pro-course/index.html", "online/davinci-resolve-course/index.html", "online/edius-course/index.html",
    "online/album-design-course/index.html", "online/pre-wedding-shoot-course/index.html", "online/cinematic-editing-course/index.html",
    "online/automation-course/index.html", "online/website-design-course/index.html", "online/digital-marketing-course/index.html",
    "blog/index.html", "blog/best-video-editing-software-in-2026/index.html", "blog/freelance-video-editor-earn-in-bihar/index.html",
    "blog/how-ai-is-changing-wedding-filmmaking-2026/index.html", "blog/top-10-photography-studios-in-chapra/index.html",
    "blog/top-5-editing-course-academies-in-patna/index.html", "blog/video-editing-course-in-gaya/index.html"
]

geo_tags_template = """    <meta name="geo.region" content="IN-BR">
    <meta name="geo.placename" content="Siwan, Bihar, India">
    <meta name="geo.position" content="26.2289734;84.3347944">
    <meta name="ICBM" content="26.2289734, 84.3347944">
"""

def get_rel_manifest(rel_path):
    parts = rel_path.split("/")
    depth = len(parts) - 1
    if depth == 0:
        return "site.webmanifest"
    elif depth == 1:
        return "../site.webmanifest"
    elif depth == 2:
        return "../../site.webmanifest"
    else:
        return "/site.webmanifest"

updated_geo = 0
updated_manifest = 0
updated_lcp = 0

for rel in all_indexable_pages:
    path = os.path.join(workspace, rel)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    changed = False

    # 1. Geo Tags
    if rel in geo_pages and "geo.position" not in content:
        # Insert before canonical or after description
        if '<link rel="canonical"' in content:
            content = content.replace('<link rel="canonical"', geo_tags_template + '    <link rel="canonical"', 1)
            changed = True
            updated_geo += 1
        elif '<meta name="description"' in content:
            # Find end of description tag
            content = re.sub(r'(<meta name="description"[^>]*>)', r'\1\n' + geo_tags_template, content, count=1)
            changed = True
            updated_geo += 1

    # 2. Manifest
    manifest_href = get_rel_manifest(rel)
    manifest_tag = f'    <link rel="manifest" href="{manifest_href}">\n'
    if 'rel="manifest"' not in content:
        if '<link rel="icon"' in content:
            content = content.replace('<link rel="icon"', manifest_tag + '    <link rel="icon"', 1)
            changed = True
            updated_manifest += 1
        elif '</head>' in content:
            content = content.replace('</head>', manifest_tag + '</head>', 1)
            changed = True
            updated_manifest += 1

    # 3. LCP Preload on index.html
    if rel == "index.html" and 'rel="preload" as="image"' not in content:
        lcp_tag = '    <link rel="preload" as="image" href="assets/editing-timeline.jpg" fetchpriority="high">\n'
        if '<link rel="canonical"' in content:
            content = content.replace('<link rel="canonical"', lcp_tag + '    <link rel="canonical"', 1)
            changed = True
            updated_lcp += 1

    if changed:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

print(f"Geo tags added to {updated_geo} pages.")
print(f"Manifest links added to {updated_manifest} pages.")
print(f"LCP preload added to {updated_lcp} pages.")
