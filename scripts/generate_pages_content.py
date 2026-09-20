import os
import re

def ensure_hero_keyword(content, primary_kw, replacement_intro):
    # If primary keyword not in first 150 words of body, update hero-sub or first p
    hero_pattern = re.compile(r'(<p class=["\'](?:hero-sub|lp-hero-desc)[^"\']*["\'][^>]*>)(.*?)(</p>)', re.DOTALL)
    if hero_pattern.search(content):
        return hero_pattern.sub(rf'\1{replacement_intro}\3', content, count=1)
    return content

def add_image_alt_keywords(content, primary_kw, alt_suffix):
    # Ensure at least 2 images have alt with primary keyword
    count = 0
    def replace_alt(m):
        nonlocal count
        if count < 2 and primary_kw.lower() not in m.group(1).lower():
            count += 1
            return f'alt="{primary_kw} - {alt_suffix} ({count})"'
        return m.group(0)
    return re.sub(r'alt=["\']([^"\']*)["\']', replace_alt, content)

def append_seo_section(filepath, primary_kw, hero_intro, extra_sections_html, alt_suffix):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update hero intro
    content = ensure_hero_keyword(content, primary_kw, hero_intro)

    # Update image alts
    content = add_image_alt_keywords(content, primary_kw, alt_suffix)

    marker = f"<!-- Technical SEO Expansion: {primary_kw} -->"
    end_marker = f"<!-- End Technical SEO Expansion: {primary_kw} -->"

    full_block = f"""
{marker}
<section class="qa-section bg-ink text-white py-16" style="background:#0c0d0e;border-top:1px solid rgba(214,172,98,0.15);border-bottom:1px solid rgba(214,172,98,0.15);">
    <div class="container" style="max-width:1180px;margin:0 auto;padding:0 20px;">
{extra_sections_html}
    </div>
</section>
{end_marker}
"""

    if marker in content:
        pattern = re.compile(rf'{re.escape(marker)}.*?{re.escape(end_marker)}', re.DOTALL)
        content = pattern.sub(full_block.strip(), content)
    else:
        footer_idx = content.find('<footer')
        if footer_idx != -1:
            content = content[:footer_idx] + full_block + '\n' + content[footer_idx:]
        else:
            content = content.replace('</body>', full_block + '\n</body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")
    return True

print("Base expansion engine loaded.")
