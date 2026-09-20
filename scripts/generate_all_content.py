import os
import re

def append_section_before_footer(filepath, section_html, marker):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if marker in content:
        # replace existing marker block
        pattern = re.compile(rf'{re.escape(marker)}.*?<!-- End {re.escape(marker.replace("<!--", "").replace("-->", "").strip())} -->', re.DOTALL)
        content = pattern.sub(section_html, content)
    else:
        # find footer or closing main/body
        footer_idx = content.find('<footer')
        if footer_idx != -1:
            content = content[:footer_idx] + section_html + '\n' + content[footer_idx:]
        else:
            content = content.replace('</body>', section_html + '\n</body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Appended/Updated section in {filepath}")

print("Helper ready.")
