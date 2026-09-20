import os
import re
import glob

META_PIXEL_CODE = """<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '28399880462937454');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=28399880462937454&ev=PageView&noscript=1"/></noscript>
<!-- End Meta Pixel Code -->"""

GTM_NOSCRIPT = """<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WNW4XH72" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->"""

META_EVENTS_SCRIPT = """<script defer src="/meta-events.js"></script>"""

GTM_HEAD_SNIPPET = """<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WNW4XH72');</script>
<!-- End Google Tag Manager -->"""

def update_tracking(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    orig_content = content

    # 1. Update <html ...> to <html lang="en-IN" ...>
    def replace_html(match):
        attrs = match.group(1)
        if 'lang=' in attrs:
            attrs = re.sub(r'lang=["\'][^"\']*["\']', 'lang="en-IN"', attrs)
        else:
            attrs = ' lang="en-IN"' + attrs
        return f'<html{attrs}>'
    content = re.sub(r'<html\b([^>]*)>', replace_html, content, count=1, flags=re.IGNORECASE)

    # 2. Delete gtag('config', 'AW-17875865403');
    content = re.sub(r"[ \t]*gtag\s*\(\s*['\"]config['\"]\s*,\s*['\"]AW-17875865403['\"]\s*\)\s*;?\s*\n?", '', content)

    # 3. Ensure GTM head snippet is present
    if 'GTM-WNW4XH72' not in content:
        # Place before Meta pixel or in head
        if '28399880462937454' in content:
            content = content.replace('<!-- Meta Pixel Code -->', GTM_HEAD_SNIPPET + '\n<!-- Meta Pixel Code -->')
        else:
            content = re.sub(r'(<head\b[^>]*>)', '\\1\n' + GTM_HEAD_SNIPPET, content, count=1, flags=re.IGNORECASE)

    # 4. Add Meta Pixel in <head> after GTM snippet if not present
    if '28399880462937454' not in content:
        gtm_pattern = re.compile(r"(\(window,\s*document,\s*['\"]script['\"],\s*['\"]dataLayer['\"],\s*['\"]GTM-WNW4XH72['\"]\);\s*</script>(?:\s*<!-- End Google Tag Manager -->)?)", re.DOTALL)
        if gtm_pattern.search(content):
            content = gtm_pattern.sub(r"\1\n" + META_PIXEL_CODE, content, count=1)
        else:
            content = re.sub(r'(</head>)', META_PIXEL_CODE + '\n\\1', content, count=1, flags=re.IGNORECASE)

    # 5. GTM noscript immediately after opening <body ...>
    if 'googletagmanager.com/ns.html?id=GTM-WNW4XH72' not in content:
        body_pattern = re.compile(r'(<body\b[^>]*>)', re.IGNORECASE)
        content = body_pattern.sub(r"\1\n" + GTM_NOSCRIPT, content, count=1)

    # 5. Add <script defer src="/meta-events.js"></script> just before </body>
    if 'meta-events.js' not in content:
        body_close_pattern = re.compile(r'(</body>)', re.IGNORECASE)
        content = body_close_pattern.sub(META_EVENTS_SCRIPT + '\n\\1', content, count=1)

    # 6. F4: For /portal/* and sitemap.html, set <meta name="robots" content="noindex,follow">
    rel_path = os.path.relpath(file_path).replace('\\', '/')
    if rel_path.startswith('portal/') or rel_path == 'sitemap.html':
        if '<meta name="robots"' in content:
            content = re.sub(r'<meta\s+name=["\']robots["\'][^>]*>', '<meta name="robots" content="noindex,follow">', content, flags=re.IGNORECASE)
        else:
            content = re.sub(r'(<head\b[^>]*>)', '\\1\n    <meta name="robots" content="noindex,follow">', content, count=1, flags=re.IGNORECASE)

    if content != orig_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

if __name__ == '__main__':
    files = sorted(glob.glob('**/*.html', recursive=True))
    modified = 0
    for f in files:
        if update_tracking(f):
            print(f"Updated tracking in {f}")
            modified += 1
    print(f"Tracking update complete. Modified {modified}/{len(files)} files.")
