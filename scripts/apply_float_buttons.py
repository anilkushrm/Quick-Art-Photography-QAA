import glob
import re

FLOAT_HTML = """<div class="fixed bottom-5 right-5 z-40 flex flex-col gap-2.5 items-end qa-float-stack"><a
        href="https://wa.me/919939800780?text=Hi%2C%20I%20want%20to%20know%20about%20the%20Video%20Editing%20Course"
        target="_blank" rel="noreferrer"
        class="h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-float qa-float-whatsapp"
        aria-label="Chat on WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="lucide lucide-message-circle h-6 w-6" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
        </svg></a><a href="tel:+919939800780"
        class="h-14 w-14 rounded-full bg-white text-ink flex items-center justify-center shadow-2xl border border-black/5 hover:bg-gold-500 hover:text-black transition qa-float-call"
        aria-label="Call Us"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="lucide lucide-phone h-6 w-6" aria-hidden="true" viewBox="0 0 24 24">
            <path
                d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384">
            </path>
        </svg></a></div>"""

files = glob.glob('**/*.html', recursive=True)
files = [f for f in files if 'node_modules' not in f and 'portal/email-template' not in f]

updated = 0
for filepath in sorted(files):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern for existing fixed bottom container
    pattern = r'<div class="fixed bottom-5 right-5[^"]*">.*?</div>\s*'
    
    if re.search(pattern, content, flags=re.DOTALL):
        # Replace existing float container
        new_content = re.sub(pattern, FLOAT_HTML + '\n        ', content, flags=re.DOTALL)
    elif '</main>' in content:
        # Insert before </main>
        new_content = content.replace('</main>', FLOAT_HTML + '\n    </main>', 1)
    elif '<footer' in content:
        # Insert before <footer
        new_content = content.replace('<footer', FLOAT_HTML + '\n    <footer', 1)
    else:
        # Insert before </body>
        new_content = content.replace('</body>', FLOAT_HTML + '\n</body>', 1)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        updated += 1
        print(f"Updated float buttons in: {filepath}")

print(f"Total HTML files updated with static float buttons: {updated}")
