import os
import re

METADATA = {
    "index.html": {
        "title": "Quick Art Photography Academy – Video Editing Course Siwan",
        "description": "Quick Art Photography Academy, Siwan: best video editing course in Bihar. Photo & video editing, Premiere Pro, DaVinci, EDIUS. Rated 4.9/5 by 1,800+ students.",
        "h1": '<h1 id="home-title">Quick Art Photography Academy – <br><span>Best Video Editing Course in Siwan, Bihar</span></h1>'
    },
    "courses/video-editing/index.html": {
        "title": "Video Editing Course in Siwan, Bihar – Fees & Classes",
        "description": "Best video editing course in Siwan: 6-week offline video editing classes in EDIUS, Premiere Pro & DaVinci Resolve. See course fees, syllabus & book a free demo.",
        "h1": '<h1 class="mt-5 font-heading font-extrabold text-5xl md:text-6xl lg:text-7xl leading-[0.98] tracking-[-0.03em]">Video Editing Course in Siwan, Bihar <span>(6-Week Offline Classes)</span></h1>'
    },
    "courses/album-design/index.html": {
        "title": "Wedding Album Design Course in Siwan – 4-Week Classes",
        "description": "Join our wedding album design course in Siwan: 4-week hands-on photo album design classes with Photoshop retouching, Karizma layouts & print-ready export.",
        "h1": '<h1 class="mt-5 font-heading font-extrabold text-5xl md:text-6xl lg:text-7xl leading-[0.98] tracking-[-0.03em]">Wedding Album <span>Design Course in Siwan</span></h1>'
    },
    "courses/ai-wedding-filmmaking/index.html": {
        "title": "AI Wedding Filmmaking Course in Siwan | AI Video Editing",
        "description": "Learn AI video editing and cinematic wedding filmmaking in Siwan: AI-assisted photo and video workflows, colour, sound and delivery at Quick Art Academy."
    },
    "master-class/index.html": {
        "title": "14-Week Wedding Filmmaking Master Class in Siwan",
        "description": "14-week offline wedding filmmaking course in Siwan: cinematography, wedding video editing, album design, colour grading, business and AI growth.",
        "h1": '<h1 class="mt-5 font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.98] tracking-[-0.03em]" style="opacity:1;"><span class="mc-ai-heading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 3 2.5 6.5L19 12l-6.5 2.5L10 21l-2.5-6.5L1 12l6.5-2.5Z"/><path d="M20 2v6m-3-3h6"/></svg>AI-Powered</span> Master <span class="qa-heading-gradient">Cinematic Wedding Editing Course</span></h1>'
    },
    "online/premiere-pro-course/index.html": {
        "title": "Adobe Premiere Pro Course in Hindi – Online Classes",
        "description": "Best Adobe Premiere Pro online course in Hindi: wedding editing, multicam sync, AI workflow & Lumetri colour grading with mentor Anil Sharma. Rated 4.9/5.",
        "h1": '<h1 class="lp-hero-title">Adobe Premiere Pro Course in Hindi <br><span class="gold">(Online Classes)</span></h1>'
    },
    "online/davinci-resolve-course/index.html": {
        "title": "Best DaVinci Resolve Online Course in Hindi | Color Grading",
        "description": "DaVinci Resolve course in Hindi: node-based colour grading, skin-tone matching and cinematic wedding looks. Online lessons with mentor Anil Sharma.",
        "h1": '<h1 class="lp-hero-title">Best DaVinci Resolve <br><span class="gold">Online Course in Hindi</span></h1>'
    },
    "online/edius-course/index.html": {
        "title": "Best EDIUS Online Course in Hindi – Wedding Video Editing",
        "description": "EDIUS video editing course in Hindi: fast wedding editing, multicam sync, titles, colour correction and client delivery. Wedding video editing training online.",
        "h1": '<h1 class="lp-hero-title">Best EDIUS <br><span class="gold">Online Course in Hindi</span></h1>'
    },
    "online/cinematic-editing-course/index.html": {
        "title": "Cinematic Wedding Video Editing Course in Hindi (Online)",
        "description": "Learn cinematic wedding video editing in Hindi: teasers, highlight films, reels, sound design and colour finishing. Online wedding video editing course."
    },
    "online/pre-wedding-shoot-course/index.html": {
        "title": "Pre-Wedding Shoot Course Online in Hindi | Photo & Film",
        "description": "Pre-wedding shoot course in Hindi: couple posing, golden-hour light, gimbal moves and teaser editing. Online pre wedding photography & videography training."
    },
    "online/album-design-course/index.html": {
        "title": "Album Designing Course Online in Hindi | Wedding Album",
        "description": "Album designing course online in Hindi: wedding & photo album design in Photoshop, Karizma and Canvera layouts, retouching and print-ready export.",
        "h1": '<h1 class="lp-hero-title">Album Designing Course Online <span class="lp-gold-text">in Hindi</span></h1>'
    },
    "online/website-design-course/index.html": {
        "title": "Website Design Course in Hindi – Web Design Classes Online",
        "description": "Website design course in Hindi with no coding: WordPress, Elementor, portfolio galleries and Google SEO. Online web design classes for photographers.",
        "h1": '<h1 class="lp-hero-title">Website Design Course <br><span class="gold">in Hindi</span></h1>'
    },
    "online/digital-marketing-course/index.html": {
        "title": "Digital Marketing Course in Hindi for Photographers",
        "description": "Digital marketing course in Hindi for photographers: Facebook & Instagram ads, Google local SEO and WhatsApp funnels to get wedding enquiries."
    },
    "online/automation-course/index.html": {
        "title": "WhatsApp Automation Course for Photography Studios",
        "description": "WhatsApp automation course in Hindi for studios: auto replies, instant quotes, follow-ups, payment reminders and AI CRM with mentor Anil Sharma."
    },
    "online/index.html": {
        "title": "Online Video Editing Course in Hindi – All Masterclasses",
        "description": "Learn video editing online in Hindi: Premiere Pro, DaVinci Resolve, EDIUS, cinematic editing, album design and marketing. 4K project files and certificate."
    },
    "courses/index.html": {
        "title": "Photography & Video Editing Courses in Siwan | Quick Art",
        "description": "Explore video editing, album design, AI wedding filmmaking and the 14-week Master Class at Quick Art Photography Academy in Siwan, Bihar."
    },
    "contact-us/index.html": {
        "title": "Contact Quick Art Photography Academy | Siwan – Free Demo",
        "description": "Call +91 9939800780 or visit Quick Art Photography Academy, Ayodhya Puri, Siwan for course details, fees, a free demo class and batch dates."
    },
    "about-us/index.html": {
        "title": "About Quick Art Photography Academy | Anil Sharma, Siwan",
        "description": "Meet founder Anil Sharma and Quick Art Photography Academy: practical filmmaking, video editing and album design training in Siwan, Bihar."
    },
    "blog/best-video-editing-software-in-2026/index.html": {
        "title": "Best Video Editing Software in 2026 | Quick Art Academy",
        "description": "Best video editing software in 2026: Premiere Pro, DaVinci Resolve, FCP & CapCut reviewed for creators and wedding editors by Quick Art Photography Academy."
    },
    "blog/freelance-video-editor-earn-in-bihar/index.html": {
        "title": "Freelance Video Editor in Bihar: Earn Guide | Quick Art",
        "description": "Roadmap to becoming a freelance video editor in Bihar: skills, showreel, rates and client growth from Quick Art Photography Academy in Siwan."
    },
    "blog/how-ai-is-changing-wedding-filmmaking-2026/index.html": {
        "title": "AI in Wedding Filmmaking 2026: Practical Guide | Quick Art",
        "description": "Explore AI in wedding filmmaking: photo editing, dialogue enhancement and production workflows at Quick Art Photography Academy in Siwan, Bihar."
    },
    "blog/index.html": {
        "title": "Video Editing & Filmmaking Guides | Quick Art Blog",
        "description": "Read practical guides to video editing workflows, AI-assisted wedding production and freelance portfolio development from Quick Art Photography Academy."
    },
    "blog/top-10-photography-studios-in-chapra/index.html": {
        "title": "Top 10 Photography Studios in Chapra | Quick Art",
        "description": "Top 10 photography studios in Chapra for cinematic wedding films and event shoots. Explore professional photographers and video editing services."
    },
    "blog/top-5-editing-course-academies-in-patna/index.html": {
        "title": "Top 5 Editing Course Academies in Patna | Quick Art",
        "description": "Explore top 5 editing course academies in Patna: practical training, latest software and hands-on projects at Quick Art Photography Academy in Bihar."
    }
}

def update_file_metadata(rel_path, data):
    if not os.path.exists(rel_path):
        print(f"File not found: {rel_path}")
        return

    with open(rel_path, "r", encoding="utf-8") as f:
        content = f.read()

    orig_content = content
    title = data["title"]
    description = data["description"]

    # 1. Update <title>
    content = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', content, flags=re.DOTALL)

    # 2. Update <meta name="description" content="...">
    if re.search(r'<meta\s+name=["\']description["\'][^>]*>', content, flags=re.IGNORECASE):
        content = re.sub(
            r'<meta\s+name=["\']description["\'][^>]*>',
            f'<meta name="description" content="{description}">',
            content,
            flags=re.IGNORECASE
        )
    else:
        content = re.sub(r'(<title>.*?</title>)', f'\\1\n    <meta name="description" content="{description}">', content, flags=re.DOTALL)

    # 3. Update og:title
    if re.search(r'<meta\s+property=["\']og:title["\'][^>]*>', content, flags=re.IGNORECASE):
        content = re.sub(
            r'<meta\s+property=["\']og:title["\'][^>]*>',
            f'<meta property="og:title" content="{title}">',
            content,
            flags=re.IGNORECASE
        )
    else:
        content = re.sub(r'(<title>.*?</title>)', f'\\1\n    <meta property="og:title" content="{title}">', content, flags=re.DOTALL)

    # 4. Update og:description
    if re.search(r'<meta\s+property=["\']og:description["\'][^>]*>', content, flags=re.IGNORECASE):
        content = re.sub(
            r'<meta\s+property=["\']og:description["\'][^>]*>',
            f'<meta property="og:description" content="{description}">',
            content,
            flags=re.IGNORECASE
        )
    else:
        content = re.sub(r'(<meta\s+property=["\']og:title["\'][^>]*>)', f'\\1\n    <meta property="og:description" content="{description}">', content, flags=re.IGNORECASE)

    # 5. Update twitter:title
    if re.search(r'<meta\s+name=["\']twitter:title["\'][^>]*>', content, flags=re.IGNORECASE):
        content = re.sub(
            r'<meta\s+name=["\']twitter:title["\'][^>]*>',
            f'<meta name="twitter:title" content="{title}">',
            content,
            flags=re.IGNORECASE
        )
    elif re.search(r'<meta\s+property=["\']twitter:title["\'][^>]*>', content, flags=re.IGNORECASE):
        content = re.sub(
            r'<meta\s+property=["\']twitter:title["\'][^>]*>',
            f'<meta property="twitter:title" content="{title}">',
            content,
            flags=re.IGNORECASE
        )

    # 6. Update twitter:description
    if re.search(r'<meta\s+name=["\']twitter:description["\'][^>]*>', content, flags=re.IGNORECASE):
        content = re.sub(
            r'<meta\s+name=["\']twitter:description["\'][^>]*>',
            f'<meta name="twitter:description" content="{description}">',
            content,
            flags=re.IGNORECASE
        )
    elif re.search(r'<meta\s+property=["\']twitter:description["\'][^>]*>', content, flags=re.IGNORECASE):
        content = re.sub(
            r'<meta\s+property=["\']twitter:description["\'][^>]*>',
            f'<meta property="twitter:description" content="{description}">',
            content,
            flags=re.IGNORECASE
        )

    # 7. Update H1 if specified
    if "h1" in data:
        content = re.sub(r'<h1\b[^>]*>.*?</h1>', data["h1"], content, count=1, flags=re.DOTALL)

    if content != orig_content:
        with open(rel_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated metadata & H1 in {rel_path}")

def fix_portal_h1():
    portal_path = "portal/index.html"
    if os.path.exists(portal_path):
        with open(portal_path, "r", encoding="utf-8") as f:
            c = f.read()
        # replace <h1 class="checkout-course-title" id="view-checkout-title"> -> <h2
        c = re.sub(r'<h1\s+class="checkout-course-title"\s+id="view-checkout-title">(.*?)</h1>',
                   r'<h2 class="checkout-course-title" id="view-checkout-title">\1</h2>', c)
        # replace <h1 id="dash-greeting" class="mycourses-greeting"> -> <h2
        c = re.sub(r'<h1\s+id="dash-greeting"\s+class="mycourses-greeting">(.*?)</h1>',
                   r'<h2 id="dash-greeting" class="mycourses-greeting">\1</h2>', c)
        with open(portal_path, "w", encoding="utf-8") as f:
            f.write(c)
        print("Fixed multiple H1s in portal/index.html")

def fix_redirect_h1s():
    redirects = [
        ("adobe-premiere-pro-course/index.html", "Adobe Premiere Pro Course in Hindi"),
        ("best-davinci-resolve-online-course-in-hindi/index.html", "Best DaVinci Resolve Online Course in Hindi"),
        ("join-video-editing-album-design-course/index.html", "Join Video Editing & Album Design Course")
    ]
    for p, title in redirects:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                c = f.read()
            if "<h1" not in c:
                c = c.replace('<body style="font-family:sans-serif;text-align:center;padding:50px 20px;">',
                              f'<body style="font-family:sans-serif;text-align:center;padding:50px 20px;">\n    <h1 style="font-size:1.25rem;">Redirecting to {title}...</h1>')
                with open(p, "w", encoding="utf-8") as f:
                    f.write(c)
                print(f"Added H1 to {p}")

if __name__ == "__main__":
    for path, data in METADATA.items():
        update_file_metadata(path, data)
    fix_portal_h1()
    fix_redirect_h1s()
