import os
import re

def expand_file_with_block(rel_path, marker, block_html):
    if not os.path.exists(rel_path):
        print(f"File not found: {rel_path}")
        return False
    with open(rel_path, "r", encoding="utf-8") as f:
        html = f.read()

    if marker in html:
        # Replace existing marker block
        html = re.sub(rf'{re.escape(marker)}.*?<!-- End {re.escape(marker[4:].strip())} -->', block_html, html, flags=re.DOTALL)
    else:
        # Insert before <footer
        footer_idx = html.find("<footer")
        if footer_idx != -1:
            html = html[:footer_idx] + block_html + "\n" + html[footer_idx:]
        else:
            # Insert before </body>
            html = html.replace("</body>", block_html + "\n</body>")

    with open(rel_path, "w", encoding="utf-8") as f:
        f.write(html)
    return True

print("Expansion helper loaded.")
