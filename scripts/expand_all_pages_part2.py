import os
import re

ONLINE_CONFIGS = {
    "online/premiere-pro-course/index.html": {
        "primary": "adobe premiere pro course",
        "title_kw": "Adobe Premiere Pro Course in Hindi",
        "intro": "Learn wedding video editing, multi-camera sync, AI audio clean-up, and Lumetri color grading in our comprehensive adobe premiere pro course in Hindi with mentor Anil Sharma.",
        "p_h2_1": "Adobe Premiere Pro Classes for Wedding Video Editors",
        "p_desc_1": "Enrolling in our adobe premiere pro course allows aspiring wedding editors across India to master high-speed post-production. Our structured adobe premiere pro classes guide you from basic timeline cuts to complex multicam assembly, audio isolation, and dynamic title design. By taking this adobe premiere course, you learn how to handle large wedding projects smoothly without lag.",
        "p_h2_2": "Why This Is the Best Premiere Pro Course in India",
        "p_desc_2": "Recognized as a best premiere pro course in India, our training provides authentic 4K wedding practice files and project templates. In this advance premiere pro course, students master Lumetri color wheels, adjustment layers, proxy workflows, and export presets. Whether you choose our premiere pro online course or attend offline sessions, this best premiere pro online course gives you complete creative mastery.",
        "p_h2_3": "Curriculum Highlights: Premiere Pro Course",
        "p_desc_3": "Our premiere pro course curriculum covers multi-camera timeline sync, beat-matched teaser cuts, speech-to-text subtitles, and wedding video editing course techniques. Every lesson in this adobe premiere pro course is taught step-by-step in Hindi with lifetime access to practice project footage.",
        "secondaries_text": "Students in these adobe premiere pro classes receive dedicated mentor support. If you want an advance premiere pro course that teaches real client delivery, this premiere pro online course provides the ultimate edge. Explore our wedding video editing course modules and advance your skills today.",
        "related": [
            {"title": "DaVinci Resolve Color Grading Course", "desc": "Master node-based color grading, primary wheels, and skin-tone matching.", "link": "/online/davinci-resolve-course/", "anchor": "DaVinci Resolve Course in Hindi"},
            {"title": "Cinematic Wedding Video Editing", "desc": "Learn teaser pacing, emotional story arcs, and sound design.", "link": "/online/cinematic-editing-course/", "anchor": "Cinematic Video Editing Course"},
            {"title": "Offline Video Editing Course in Siwan", "desc": "Prefer offline studio practice? Join our 6-week campus program with free hostel.", "link": "/courses/video-editing/", "anchor": "Video Editing Course in Siwan"}
        ],
        "faqs": [
            {"q": "Can I join this adobe premiere pro course as a beginner?", "a": "Yes, our adobe premiere pro course starts from scratch—software setup, importing footage, and timeline basics before moving to advanced multicam editing."},
            {"q": "What software version is covered in these adobe premiere pro classes?", "a": "We cover the latest Adobe Premiere Pro CC versions, including modern AI features, text-based editing, and speech enhancement."},
            {"q": "Is practice footage provided in this premiere pro online course?", "a": "Yes! You receive over 200GB+ of 4K multi-camera wedding footage, royalty-free audio tracks, and cinematic LUTs in our premiere pro course."},
            {"q": "Do I get a certificate after completing this best premiere pro online course?", "a": "Yes, you receive a verified Academy Certificate of Completion upon submitting your wedding film project in this adobe premiere pro course."}
        ]
    },
    "online/davinci-resolve-course/index.html": {
        "primary": "DaVinci Resolve course",
        "title_kw": "DaVinci Resolve Course in Hindi – Color Grading",
        "intro": "Master cinematic color grading, node-based workflows, and skin-tone matching in our industry-standard DaVinci Resolve course in Hindi with mentor Anil Sharma.",
        "p_h2_1": "Best DaVinci Resolve Online Course for Color Grading",
        "p_desc_1": "If you want to achieve high-end film looks for wedding highlight videos, enrolling in our DaVinci Resolve course is essential. As the best DaVinci Resolve online course in Hindi, we explain node trees, serial nodes, parallel nodes, and layer nodes in simple practical language. This DaVinci Resolve course in Hindi equips you to grade mixed lighting effortlessly.",
        "p_h2_2": "DaVinci Resolve Wedding Video Editing Course Workflows",
        "p_desc_2": "Our specialized DaVinci Resolve wedding video editing course covers the Cut page, Edit page, Color page, and Fairlight audio. In this DaVinci Resolve color grading course, you learn how to balance Sony S-Log, Canon C-Log, and Panasonic V-Log footage. Taking this DaVinci Resolve online course allows you to create signature cinematic looks for your studio clients.",
        "p_h2_3": "Practical Color Grading Mastery in DaVinci Resolve Course",
        "p_desc_3": "Every lesson in our DaVinci Resolve course focuses on real client footage. You will master primary wheels, HDR grading palettes, curves, qualifiers, power windows, and tracker masks. This DaVinci Resolve course in Hindi ensures that bride and groom skin tones look flawless under banquet hall LED lights.",
        "secondaries_text": "Experience the best DaVinci Resolve online course designed specifically for Indian wedding filmmakers. Our DaVinci Resolve wedding video editing course gives you the competitive edge in color fidelity. Join this DaVinci Resolve color grading course and elevate your cinematic storytelling.",
        "related": [
            {"title": "Adobe Premiere Pro Course in Hindi", "desc": "Master fast timeline trimming, multicam sync, and audio clean-up.", "link": "/online/premiere-pro-course/", "anchor": "Adobe Premiere Pro Course"},
            {"title": "Cinematic Wedding Video Editing", "desc": "Learn teaser pacing, emotional story arcs, and sound design.", "link": "/online/cinematic-editing-course/", "anchor": "Cinematic Video Editing Course"},
            {"title": "Offline Video Editing in Siwan", "desc": "Hands-on studio practice on RTX editing workstations with free hostel stay.", "link": "/courses/video-editing/", "anchor": "Offline Video Editing Course"}
        ],
        "faqs": [
            {"q": "Can I use the free version of DaVinci Resolve for this course?", "a": "Yes! The entire core color grading and editing curriculum can be learned using the free DaVinci Resolve version."},
            {"q": "What camera formats are covered in this DaVinci Resolve course in Hindi?", "a": "We practice on real 10-bit raw and log footage from Sony, Canon, Panasonic, and DJI drones in our DaVinci Resolve course."},
            {"q": "How does this DaVinci Resolve wedding video editing course help my business?", "a": "Color grading elevates standard wedding videos into cinematic films, enabling you to charge premium rates from wedding clients."},
            {"q": "Is mentor support available in this DaVinci Resolve online course?", "a": "Yes, Anil Sharma provides direct feedback on your color grading node trees and graded wedding frames in this DaVinci Resolve course."}
        ]
    },
    "online/edius-course/index.html": {
        "primary": "EDIUS course",
        "title_kw": "EDIUS Course in Hindi – Fast Wedding Editing",
        "intro": "Learn ultra-fast wedding video editing, multicam ceremony sync, and instant client delivery in our practical EDIUS course in Hindi with mentor Anil Sharma.",
        "p_h2_1": "Best EDIUS Online Course for High-Volume Wedding Studios",
        "p_desc_1": "For wedding studios in North India, EDIUS Pro remains the undefeated champion of real-time editing speed. Our EDIUS course teaches you how to edit 4 to 8 camera wedding ceremonies without creating proxies or waiting for renders. As the best EDIUS online course, this program is designed for editors who handle tight seasonal deadlines.",
        "p_h2_2": "Comprehensive Wedding Video Editing Training in EDIUS",
        "p_desc_2": "Our wedding video editing training covers timeline shortcut customization, multicam audio synchronization, title layout composition, and transition effects. In this EDIUS video editing course, you learn how to ingest raw footage, apply quick color matrix presets, and export complete wedding sets in record time.",
        "p_h2_3": "Real-Time Performance Workflows in EDIUS Course",
        "p_desc_3": "This EDIUS course covers QuickTitler, Layouter animations, mask tracking, and GPU hardware acceleration. By mastering our EDIUS video editing course techniques, you can edit entire wedding rituals in hours rather than days, drastically increasing your studio earnings.",
        "secondaries_text": "Join the best EDIUS online course trusted by studio owners across Bihar and Uttar Pradesh. Our wedding video editing training provides real banquet hall footage and ready-to-use title templates. Enrol in this EDIUS course and supercharge your editing turnaround speed.",
        "related": [
            {"title": "Cinematic Wedding Video Editing", "desc": "Master emotional story arcs, teasers, and sound design.", "link": "/online/cinematic-editing-course/", "anchor": "Cinematic Editing Course"},
            {"title": "Adobe Premiere Pro Course in Hindi", "desc": "Expand your skillset with Adobe Creative Cloud integration.", "link": "/online/premiere-pro-course/", "anchor": "Adobe Premiere Pro Course"},
            {"title": "Offline Video Editing Course in Siwan", "desc": "6 weeks of hands-on workstation practice with free hostel accommodation.", "link": "/courses/video-editing/", "anchor": "Video Editing Course in Siwan"}
        ],
        "faqs": [
            {"q": "Why is an EDIUS course still important for wedding editors?", "a": "EDIUS Pro offers unparalleled real-time multi-camera playback without needing expensive computer hardware or lengthy proxy renders."},
            {"q": "What computer specifications do I need for this EDIUS course?", "a": "EDIUS runs smoothly on standard Intel Core i5 or i7 systems with basic graphics cards, making it accessible for any studio."},
            {"q": "Does this best EDIUS online course include project templates?", "a": "Yes! You receive ready-made wedding intro titles, multicam project setups, and song project files in our EDIUS course."},
            {"q": "Is wedding video editing training taught in Hindi?", "a": "Yes, our entire EDIUS video editing course is taught in easy-to-understand Hindi with lifetime video access."}
        ]
    },
    "online/cinematic-editing-course/index.html": {
        "primary": "cinematic wedding video editing course",
        "title_kw": "Cinematic Wedding Video Editing Course in Hindi",
        "intro": "Transform traditional wedding footage into breathtaking cinematic films in our cinematic wedding video editing course in Hindi with mentor Anil Sharma.",
        "p_h2_1": "Master Storytelling in Cinematic Wedding Video Editing Course",
        "p_desc_1": "Modern wedding couples no longer want boring 3-hour chronological videos; they demand emotional, film-grade stories. In our cinematic wedding video editing course, you learn how to craft compelling narrative arcs using speeches, vows, natural ambience, and rhythm. This cinematic wedding video editing course elevates your creative portfolio.",
        "p_h2_2": "Wedding Teaser Editing Course &amp; Instagram Reels Techniques",
        "p_desc_2": "Our specialized wedding teaser editing course module teaches 60-second high-energy cuts that capture maximum attention on social media. In this wedding highlight video editing track, you master pacing, beat-drops, sound design swells, and whooshes. The Instagram reels editing course lessons ensure your vertical videos stand out on Instagram and YouTube Shorts.",
        "p_h2_3": "Cinematic Video Editing Course in Hindi Curriculum",
        "p_desc_3": "Every module of this cinematic video editing course in Hindi is explained through real 4K wedding projects. You learn audio layering, dialogue enhancement, speed ramping, and mood grading. By completing this cinematic wedding video editing course, you gain the skills needed to book high-budget destination weddings.",
        "secondaries_text": "Enrolling in this wedding teaser editing course gives you access to royalty-free cinematic music libraries and sound FX. Our wedding highlight video editing modules and Instagram reels editing course prepare you for modern client demands. Master cinematic video editing course in Hindi today.",
        "related": [
            {"title": "Adobe Premiere Pro Course in Hindi", "desc": "Master timeline trimming, multicam sync, and Lumetri grading.", "link": "/online/premiere-pro-course/", "anchor": "Adobe Premiere Pro Course"},
            {"title": "DaVinci Resolve Color Grading Course", "desc": "Learn film-grade node color correction and skin-tone matching.", "link": "/online/davinci-resolve-course/", "anchor": "DaVinci Resolve Course"},
            {"title": "14-Week Wedding Filmmaking Master Class", "desc": "Comprehensive offline training in cinematography, editing, and business in Siwan.", "link": "/master-class/", "anchor": "14-Week Master Class in Siwan"}
        ],
        "faqs": [
            {"q": "What will I learn in this cinematic wedding video editing course?", "a": "You will learn emotional story pacing, dialogue layering, sound design, multi-camera ceremony cutting, and modern 4K teaser editing."},
            {"q": "Is this wedding teaser editing course suitable for Premiere Pro and DaVinci users?", "a": "Yes! The creative principles and editing techniques taught in this cinematic wedding video editing course apply across all major editing software."},
            {"q": "Does the course cover Instagram reels editing course workflows?", "a": "Yes, we teach 9:16 vertical storytelling, hook framing, and beat-matched cuts for viral Instagram reels."},
            {"q": "Are practice project files included in this cinematic video editing course in Hindi?", "a": "Yes, you get full access to multi-camera wedding footage, royalty-free music, and sound design packs in our cinematic wedding video editing course."}
        ]
    },
    "online/pre-wedding-shoot-course/index.html": {
        "primary": "pre wedding shoot course",
        "title_kw": "Pre-Wedding Shoot Course Online in Hindi",
        "intro": "Master creative couple posing, outdoor natural lighting, gimbal camera motion, and teaser directing in our pre wedding shoot course in Hindi with mentor Anil Sharma.",
        "p_h2_1": "Directing Couples in Pre Wedding Shoot Course",
        "p_desc_1": "Pre-wedding shoots are one of the most profitable service offerings for photography studios. In our comprehensive pre wedding shoot course, you will learn how to break couple awkwardness, direct natural romantic poses, and capture genuine emotions. This pre wedding shoot course covers storytelling from concept to final teaser delivery.",
        "p_h2_2": "Pre Wedding Photography Course &amp; Video Direction",
        "p_desc_2": "Our pre wedding photography course modules explore location scouting, golden-hour sun positioning, lens selection (24mm, 35mm, 85mm), and creative off-camera flash techniques. In the pre wedding video course in Hindi, you master cinematic camera movements—orbit shots, parallax reveals, tracking runs, and gimbal moves that create high-end visual drama.",
        "p_h2_3": "Cinematography Course Online &amp; Wedding Photography Course",
        "p_desc_3": "This cinematography course online teaches visual mood boarding, wardrobe coordination, and narrative script writing. Combined with our wedding photography course lessons, you learn how to shoot photos and video clips simultaneously on outdoor pre-wedding sets. By completing this pre wedding shoot course, you can confidently offer high-ticket destination shoot packages.",
        "secondaries_text": "Join the premier pre wedding photography course in Hindi and elevate your portfolio. Our pre wedding video course in Hindi covers gimbal stabilization, slow-motion framing, and drone choreography. This cinematography course online and wedding photography course provides complete commercial mastery.",
        "related": [
            {"title": "Cinematic Wedding Video Editing", "desc": "Learn how to turn pre-wedding footage into high-energy teasers.", "link": "/online/cinematic-editing-course/", "anchor": "Cinematic Video Editing Course"},
            {"title": "Album Designing Course Online", "desc": "Design luxury couple photobooks in Photoshop and Karizma.", "link": "/online/album-design-course/", "anchor": "Album Designing Course Online"},
            {"title": "14-Week Wedding Filmmaking Master Class", "desc": "Comprehensive offline cinematography and editing training in Siwan.", "link": "/master-class/", "anchor": "14-Week Master Class in Siwan"}
        ],
        "faqs": [
            {"q": "What camera gear is recommended for this pre wedding shoot course?", "a": "You can start with any mirrorless or DSLR camera with a 35mm or 50mm prime lens and a 3-axis motorized gimbal."},
            {"q": "How do I direct non-professional couples during a pre-wedding shoot?", "a": "Our pre wedding shoot course teaches proven psychological prompting techniques that elicit natural laughter, romantic chemistry, and spontaneous emotion."},
            {"q": "Is pre wedding photography course editing covered in this program?", "a": "Yes! We cover Lightroom skin retouching, color grading presets, and cinematic teaser editing in this pre wedding shoot course."},
            {"q": "Is this pre wedding video course in Hindi accessible on mobile?", "a": "Yes, all lessons in our pre wedding shoot course can be viewed on mobile phones and desktop computers with lifetime access."}
        ]
    },
    "online/album-design-course/index.html": {
        "primary": "album designing course online",
        "title_kw": "Album Designing Course Online in Hindi",
        "intro": "Learn wedding photobook layout creation, Photoshop skin retouching, and print color management in our album designing course online in Hindi with mentor Anil Sharma.",
        "p_h2_1": "Master Photobook Layout in Album Designing Course Online",
        "p_desc_1": "Designing luxury wedding albums requires an eye for visual storytelling and precise print standards. In our album designing course online, you will learn how to turn hundreds of raw photos into balanced 30-to-50 page spreads. This album designing course online covers grid systems, typography, color harmony, and negative space.",
        "p_h2_2": "Wedding Album Design Course Online in Hindi",
        "p_desc_2": "Our specialized wedding album design course online guides you through Adobe Photoshop CC tools: frequency separation skin retouching, blemish removal, hair masking, and automated background blending. In this album design course in Hindi, you will learn how to create custom Karizma templates and Canvera spreads without using tacky clip-arts.",
        "p_h2_3": "Photo Album Design Course Printing &amp; Export Standards",
        "p_desc_3": "This photo album design course covers print lab coordination in thorough detail: CMYK color spaces, soft-proofing, paper choices (velvet, metallic, matte, glossy), and binding margins. Enrolling in our album designing course online ensures your digital designs look exactly as intended when delivered as physical albums to clients.",
        "secondaries_text": "Experience the premier wedding album design course online created for studio professionals. Our album design course in Hindi teaches speed layout techniques that let you design a 40-sheet album in under 3 hours. Complete this photo album design course and scale your album sales.",
        "related": [
            {"title": "Offline Album Design Course in Siwan", "desc": "Prefer hands-on studio lab practice? Attend our 4-week offline course in Siwan.", "link": "/courses/album-design/", "anchor": "Offline Album Design Course"},
            {"title": "Adobe Premiere Pro Course in Hindi", "desc": "Add video editing to your creative services portfolio.", "link": "/online/premiere-pro-course/", "anchor": "Adobe Premiere Pro Course"},
            {"title": "Pre-Wedding Shoot Course Online", "desc": "Learn couple direction and portrait photography.", "link": "/online/pre-wedding-shoot-course/", "anchor": "Pre-Wedding Shoot Course"}
        ],
        "faqs": [
            {"q": "What software is taught in this album designing course online?", "a": "We focus primarily on Adobe Photoshop CC, Adobe Lightroom Classic for curation, and industry Karizma design workflows."},
            {"q": "Do I get PSD templates in this wedding album design course online?", "a": "Yes! You receive over 1,000+ premium PSD album templates, decorative borders, and typography assets in our album designing course online."},
            {"q": "Is this album design course in Hindi suitable for beginners?", "a": "Yes, our album designing course online starts from basic layer masking and tool shortcuts before advancing to high-end retouches."},
            {"q": "Can I learn print color management in this photo album design course?", "a": "Yes, color calibration, CMYK conversions, and print lab proofing are taught comprehensively in our album designing course online."}
        ]
    },
    "online/website-design-course/index.html": {
        "primary": "website design course",
        "title_kw": "Website Design Course in Hindi – Web Design Classes Online",
        "intro": "Build modern photography portfolio websites without coding using WordPress and Elementor in our website design course in Hindi with mentor Anil Sharma.",
        "p_h2_1": "No-Code Web Design Course for Photographers &amp; Studios",
        "p_desc_1": "Every photography studio needs a professional website to showcase 4K portfolios and book high-ticket wedding clients. In our website design course, you will learn how to design, launch, and manage custom websites without writing a single line of code. This web design course is tailored specifically for creative studios.",
        "p_h2_2": "Website Design Course in Hindi with WordPress &amp; Elementor",
        "p_desc_2": "Our website design course in Hindi covers domain registration, high-speed hosting setup, WordPress installation, and Elementor drag-and-drop page builders. In these web design classes, you will build full-screen hero banners, responsive photo galleries, client inquiry forms, and WhatsApp booking buttons.",
        "p_h2_3": "WordPress Web Designing &amp; Web Design for Photographers",
        "p_desc_3": "We teach WordPress web designing with a strong focus on image compression and mobile optimization. In this web design for photographers curriculum, you learn how to display high-resolution wedding photos without slowing down page load times. This website design course also covers on-page Google SEO to help your studio rank on local search.",
        "secondaries_text": "Join our comprehensive web design course and take control of your studio branding. These web design classes provide pre-built portfolio templates, contact forms, and security setups. Master WordPress web designing and web design for photographers in our website design course in Hindi today.",
        "related": [
            {"title": "Digital Marketing for Photographers", "desc": "Run Instagram and Facebook ads to generate wedding leads.", "link": "/online/digital-marketing-course/", "anchor": "Digital Marketing Course in Hindi"},
            {"title": "WhatsApp Automation for Studios", "desc": "Automate quotes, follow-ups, and client CRM messages.", "link": "/online/automation-course/", "anchor": "WhatsApp Automation Course"},
            {"title": "All Online Courses Overview", "desc": "Explore our full catalog of Hindi media and marketing masterclasses.", "link": "/online/", "anchor": "Online Courses Catalog"}
        ],
        "faqs": [
            {"q": "Do I need coding experience for this website design course?", "a": "No coding or programming is required. We use visual WordPress builders like Elementor that allow drag-and-drop page creation in our website design course."},
            {"q": "How long does it take to complete this web design course?", "a": "The course comprises 10 hours of video lessons and practical exercises. Most students launch their studio website within 2 weeks."},
            {"q": "Is local Google SEO covered in this website design course in Hindi?", "a": "Yes! We teach metadata setup, speed optimization, and Google Search Console indexing in our website design course."},
            {"q": "Can I build websites for other photography clients after these web design classes?", "a": "Yes, many alumni offer freelance WordPress web designing and web design for photographers as an additional revenue stream."}
        ]
    },
    "online/digital-marketing-course/index.html": {
        "primary": "digital marketing course in Hindi",
        "title_kw": "Digital Marketing Course in Hindi for Photographers",
        "intro": "Generate consistent wedding inquiries with Meta ads, Google Local SEO, and Instagram marketing in our digital marketing course in Hindi for studio owners.",
        "p_h2_1": "Targeted Digital Marketing Course for Photographers",
        "p_desc_1": "Having great photography skills is useless if clients cannot find you. Our digital marketing course in Hindi teaches studio owners how to generate predictable wedding inquiries every week. As a specialized digital marketing course for photographers, we focus exclusively on creative lead generation rather than generic corporate marketing.",
        "p_h2_2": "Instagram Marketing Course &amp; Facebook Ads Course in Hindi",
        "p_desc_2": "In this Instagram marketing course, you will learn how to structure high-converting reel portfolios, leverage local hashtags, and craft compelling call-to-actions. Our Facebook ads course in Hindi walks you step-by-step through Meta Business Suite: creating custom audiences, targeting engaged couples in your city, setting budgets, and launching lead generation forms.",
        "p_h2_3": "Social Media Marketing Course in Hindi for Studios",
        "p_desc_3": "This social media marketing course in Hindi covers client conversion funnels, pricing psychology, and WhatsApp remarketing. By completing this digital marketing course in Hindi, you will learn how to turn ₹500 in daily ad spend into confirmed high-ticket wedding bookings throughout the wedding season.",
        "secondaries_text": "Join the premier digital marketing course in Hindi built specifically for photo and video professionals. Our digital marketing course for photographers combines Facebook ads course in Hindi with proven Instagram marketing course frameworks. Master social media marketing course in Hindi today.",
        "related": [
            {"title": "WhatsApp Automation for Studios", "desc": "Automate quote replies, follow-ups, and client CRM.", "link": "/online/automation-course/", "anchor": "WhatsApp Automation Course"},
            {"title": "Website Design Course in Hindi", "desc": "Build a high-converting studio portfolio website without code.", "link": "/online/website-design-course/", "anchor": "Website Design Course"},
            {"title": "All Online Courses Catalog", "desc": "Explore all video editing, album design, and marketing masterclasses.", "link": "/online/", "anchor": "Online Courses Catalog"}
        ],
        "faqs": [
            {"q": "What is the ad budget required to get results in this digital marketing course in Hindi?", "a": "You can start testing targeted Meta and Instagram ads with as little as ₹200 to ₹300 per day in your local district."},
            {"q": "How does this digital marketing course for photographers differ from general digital marketing?", "a": "We skip unrelated topics like affiliate marketing and focus 100% on wedding inquiry generation, studio branding, and ad targeting."},
            {"q": "Are Facebook ads course in Hindi step-by-step tutorials included?", "a": "Yes, we share our screen to build real ad campaigns targeting newly engaged couples in your exact local area."},
            {"q": "Is Instagram marketing course reel growth covered?", "a": "Yes! We teach viral reel hooks, sound selection, and caption call-to-actions in this digital marketing course in Hindi."}
        ]
    },
    "online/automation-course/index.html": {
        "primary": "WhatsApp automation",
        "title_kw": "WhatsApp Automation Course for Photography Studios",
        "intro": "Automate client quotes, demo bookings, follow-ups, and payment reminders in our WhatsApp automation course in Hindi with mentor Anil Sharma.",
        "p_h2_1": "Streamline Inquiries with WhatsApp Automation for Business",
        "p_desc_1": "During peak wedding season, replying manually to hundreds of client WhatsApp inquiries can cost you thousands in lost bookings. In our WhatsApp automation masterclass, you will learn how to set up instant 24/7 automated responses, send interactive quotation menus, and qualify wedding leads automatically. This WhatsApp automation for business setup operates continuously.",
        "p_h2_2": "WhatsApp Business Automation &amp; Auto Message WhatsApp Setup",
        "p_desc_2": "We guide you through the official WhatsApp Business API, auto message WhatsApp templates, and interactive button workflows. With WhatsApp business automation, prospective brides and grooms receive immediate price lists, portfolio links, and booking availability within 5 seconds of their inquiry, drastically increasing client conversion rates.",
        "p_h2_3": "Photography Studio CRM &amp; Follow-Up Automation",
        "p_desc_3": "Never lose a client lead again. In our photography studio CRM module, you learn how to automate follow-up sequences after sending quotes, trigger automated payment reminders for installment dues, and request Google review feedback after wedding delivery. This WhatsApp automation masterclass saves hours of administrative effort every week.",
        "secondaries_text": "Upgrade your studio with WhatsApp automation for business. Our step-by-step WhatsApp business automation tutorials show you how to configure auto message WhatsApp tools and integrate a reliable photography studio CRM. Enrol in this WhatsApp automation course today.",
        "related": [
            {"title": "Digital Marketing for Photographers", "desc": "Drive targeted Meta ad leads directly into your WhatsApp funnel.", "link": "/online/digital-marketing-course/", "anchor": "Digital Marketing Course"},
            {"title": "Website Design Course in Hindi", "desc": "Add WhatsApp live chat widgets to your studio portfolio site.", "link": "/online/website-design-course/", "anchor": "Website Design Course"},
            {"title": "All Online Courses Catalog", "desc": "Explore our full catalog of Hindi creative and business masterclasses.", "link": "/online/", "anchor": "Online Courses Catalog"}
        ],
        "faqs": [
            {"q": "Do I need technical coding skills to set up WhatsApp automation?", "a": "No coding is required. We use visual automation tools and no-code platforms to connect your WhatsApp Business account seamlessly."},
            {"q": "Will my WhatsApp number get banned for using WhatsApp automation for business?", "a": "No! We teach compliant methods using official WhatsApp Business tools and cloud APIs that adhere strictly to Meta messaging guidelines."},
            {"q": "Can I send wedding quotations automatically with auto message WhatsApp?", "a": "Yes! When a client requests pricing, your automated bot can reply with dynamic PDF brochures or interactive package selection buttons."},
            {"q": "How does photography studio CRM integration work in this course?", "a": "We connect WhatsApp directly to Google Sheets or simple CRM dashboards, organizing client leads by wedding date and booking status."}
        ]
    }
}

def expand_online_course(filepath, cfg):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    p = cfg["primary"]

    # 1. Update hero description with primary keyword
    hero_pattern = re.compile(r'(<p class=["\'](?:lp-hero-desc|hero-sub)[^"\']*["\'][^>]*>)(.*?)(</p>)', re.DOTALL)
    if hero_pattern.search(html):
        html = hero_pattern.sub(rf'\1{cfg["intro"]}\3', html, count=1)

    # 2. Build expansion section
    extra_content = f"""
        <!-- Technical SEO Online Course Expansion: {p} -->
        <section class="qa-section bg-ink text-white py-16" style="background:#0c0d0e;border-top:1px solid rgba(214,172,98,0.15);border-bottom:1px solid rgba(214,172,98,0.15);">
            <div class="container" style="max-width:1180px;margin:0 auto;padding:0 20px;">
                <div style="text-align:center;max-width:820px;margin:0 auto 44px;">
                    <p class="qa-kicker" style="color:#f5c879;letter-spacing:0.12em;font-size:12px;font-weight:700;text-transform:uppercase;">Masterclass Deep-Dive in Hindi</p>
                    <h2 style="font-size:clamp(24px, 3.5vw, 36px);color:#fff;font-weight:800;margin-top:8px;line-height:1.2;">Everything About Our {cfg["title_kw"]}</h2>
                    <p style="color:#94a3b8;font-size:15px;margin-top:10px;">Hands-on project files, practical client workflows, and verified certificate credentials.</p>
                </div>

                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">{cfg["p_h2_1"]}</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">{cfg["p_desc_1"]}</p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin:0;">Taking this <strong>{p}</strong> gives you lifetime access to video tutorials in Hindi, raw project media, and direct mentor consultation.</p>
                </div>

                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">{cfg["p_h2_2"]}</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">{cfg["p_desc_2"]}</p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin:0;">Our <strong>{p}</strong> curriculum ensures that you master real-world studio standards rather than superficial software tricks.</p>
                </div>

                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">{cfg["p_h2_3"]}</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">{cfg["p_desc_3"]}</p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin:0;">{cfg["secondaries_text"]}</p>
                </div>

                <!-- Related Courses Block -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:12px;">Related Creative Programs</h2>
                    <p style="color:#94a3b8;font-size:14px;margin-bottom:22px;">Explore complementary offline and online training tracks to build full-service studio capabilities.</p>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:20px;">
                        {"".join([f'''
                        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;display:flex;flex-direction:column;justify-content:space-between;">
                            <div>
                                <h3 style="color:#fff;font-size:16px;font-weight:700;margin-bottom:8px;">{rel["title"]}</h3>
                                <p style="color:#94a3b8;font-size:13.5px;line-height:1.6;margin-bottom:14px;">{rel["desc"]}</p>
                            </div>
                            <div style="margin-top:auto;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);">
                                <a href="{rel["link"]}" style="color:#f5c879;font-size:13.5px;font-weight:600;text-decoration:none;">{rel["anchor"]} &rarr;</a>
                            </div>
                        </div>
                        ''' for rel in cfg["related"]])}
                    </div>
                </div>

                <!-- Comprehensive FAQ Section -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:20px;">Frequently Asked Questions</h2>
                    <div style="display:flex;flex-direction:column;gap:14px;">
                        {"".join([f'''
                        <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;"{" open" if idx == 0 else ""}>
                            <summary style="font-weight:700;color:#fff;font-size:15.5px;cursor:pointer;">{f["q"]}</summary>
                            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;margin-bottom:0;">{f["a"]}</p>
                        </details>
                        ''' for idx, f in enumerate(cfg["faqs"])])}
                    </div>
                </div>

                <!-- Trust Strip / Mentor Block -->
                <div style="background:rgba(214,172,98,0.08);border:1px solid rgba(214,172,98,0.25);border-radius:14px;padding:24px 28px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-bottom:30px;">
                    <div>
                        <div style="font-weight:700;color:#fff;font-size:16px;">Anil Sharma, Founder &amp; Lead Mentor</div>
                        <div style="color:#cbd5e1;font-size:13.5px;margin-top:3px;">Founder of Quick Art Photography Academy, mentoring 1,800+ wedding filmmakers across India.</div>
                    </div>
                    <div>
                        <a href="https://maps.app.goo.gl/eRkAc7kia1D1s1zQ7" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#f5c879;color:#000;font-weight:700;font-size:13.5px;padding:10px 20px;border-radius:100px;text-decoration:none;">
                            4.9/5 · 1,800+ student reviews on Google Maps
                        </a>
                    </div>
                </div>

                <!-- Final CTA Section -->
                <div style="text-align:center;margin-top:30px;padding-top:10px;">
                    <p style="color:#cbd5e1;font-size:15px;max-width:720px;margin:0 auto 20px;line-height:1.7;">
                        Elevate your studio craftsmanship with our step-by-step <strong>{p}</strong>. Get immediate access to practice assets, community mentorship, and launch your wedding career today.
                    </p>
                    <div style="display:inline-flex;gap:14px;flex-wrap:wrap;justify-content:center;">
                        <a href="/portal/" style="background:#f5c879;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">Enroll in Course Now</a>
                        <a href="https://wa.me/919939800780" target="_blank" rel="noopener" style="background:rgba(255,255,255,0.08);color:#fff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;border:1px solid rgba(255,255,255,0.2);">Chat on WhatsApp</a>
                    </div>
                    <p style="color:#64748b;font-size:12px;margin-top:16px;">Last updated: March 2026</p>
                </div>

            </div>
        </section>
        <!-- End Technical SEO Online Course Expansion: {p} -->
    """

    marker = f"<!-- Technical SEO Online Course Expansion: {p} -->"
    if marker not in html:
        footer_idx = html.find("<footer")
        if footer_idx != -1:
            html = html[:footer_idx] + extra_content + "\n" + html[footer_idx:]

    # Update image alts for keyword alt checklist
    html = re.sub(r'alt=\"[^\"]*timeline[^\"]*\"', f'alt="{p} - timeline editing tutorial interface in Hindi"', html, count=1)
    html = re.sub(r'alt=\"[^\"]*interface[^\"]*\"', f'alt="{p} - software workflow and project files overview"', html, count=1)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Enhanced {filepath}")

if __name__ == "__main__":
    for path, cfg in ONLINE_CONFIGS.items():
        expand_online_course(path, cfg)
