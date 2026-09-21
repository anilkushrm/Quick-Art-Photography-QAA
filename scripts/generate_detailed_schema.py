#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Detailed, Complete Technical SEO Schema Engine for quickartphotography.in
Implements the exact full specifications requested:
- 1 Unified @graph per page
- EducationalOrganization + LocalBusiness (@id https://quickartphotography.in/#academy)
- Full Person node (@id https://quickartphotography.in/#anil-sharma)
- WebSite node (@id https://quickartphotography.in/#website)
- Detailed WebPage / AboutPage / ContactPage / CollectionPage (@id url + #webpage)
- Detailed BreadcrumbList (@id url + #breadcrumb)
- Detailed Course (+ CourseInstance, Location, Offers, Credential, Reviews) (@id url + #course)
- Detailed FAQPage (@id url + #faq)
- Detailed Blog & BlogPosting (@id url + #article)
- VideoObject x4 with verified durations & uploadDates
- MobileApplication node for Google Play App
- Zero placeholders, zero invented data, zero syntax errors
"""

import os
import re
import json
import glob
import html

SITE = "https://quickartphotography.in"
ORG_ID = SITE + "/#academy"
PERSON_ID = SITE + "/#anil-sharma"
WEBSITE_ID = SITE + "/#website"

POSTAL_CODE = "841226"
LAT, LNG = 26.2289734, 84.3347944
MAPS_URL = "https://maps.app.goo.gl/xqTVepVohTsi1mAs6"
PHONE = "+919939800780"
EMAIL = "support@quickartphotography.in"

YT_CHANNEL = "https://www.youtube.com/@QuickartPhotographyAcademy"
YT_CHANNEL_ID = "https://www.youtube.com/channel/UC0vO4XSniOSkqobyGDc5kfA"
FB = "https://www.facebook.com/Quick.art.Photography.Academy"
IG = "https://www.instagram.com/quick.art.photography.academy/"
PLAY = "https://play.google.com/store/apps/details?id=com.lmwkkjh799.classes"

LOGO = SITE + "/home-assets/ec55a6be3747a9.webp"
DEFAULT_IMG = SITE + "/assets/editing-timeline.jpg"
ANIL_IMG = SITE + "/assets/anil-sharma.webp"

ADDRESS = {
    "@type": "PostalAddress",
    "streetAddress": "Ayodhya Puri, Near Lalit Bus Stand",
    "addressLocality": "Siwan",
    "addressRegion": "Bihar",
    "postalCode": POSTAL_CODE,
    "addressCountry": "IN"
}

def img(path):
    if not path:
        return LOGO
    return path if path.startswith("http") else SITE + path

def org(with_rating=False, with_catalog=False):
    o = {
        "@type": ["EducationalOrganization", "LocalBusiness"],
        "@id": ORG_ID,
        "name": "Quick Art Photography Academy",
        "alternateName": ["Quick Art Photography", "Quick Art Academy", "QAA"],
        "url": SITE + "/",
        "logo": {
            "@type": "ImageObject",
            "@id": SITE + "/#logo",
            "url": LOGO,
            "width": 798,
            "height": 795
        },
        "image": [LOGO, DEFAULT_IMG],
        "description": "Quick Art Photography Academy in Siwan, Bihar offers offline and online video editing, wedding filmmaking, album design, website design and digital marketing courses in Hindi.",
        "telephone": PHONE,
        "email": EMAIL,
        "priceRange": "₹₹",
        "address": ADDRESS,
        "geo": {"@type": "GeoCoordinates", "latitude": LAT, "longitude": LNG},
        "hasMap": MAPS_URL,
        "openingHoursSpecification": [{
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "opens": "10:00",
            "closes": "19:00"
        }],
        "contactPoint": [{
            "@type": "ContactPoint",
            "telephone": PHONE,
            "contactType": "admissions",
            "email": EMAIL,
            "areaServed": "IN",
            "availableLanguage": ["Hindi", "English"]
        }],
        "areaServed": [
            {"@type": "City", "name": "Siwan"},
            {"@type": "City", "name": "Gopalganj"},
            {"@type": "City", "name": "Chhapra"},
            {"@type": "City", "name": "Patna"},
            {"@type": "State", "name": "Bihar"},
            {"@type": "Country", "name": "India"}
        ],
        "knowsLanguage": ["hi", "en"],
        "knowsAbout": [
            "Video editing",
            "Wedding filmmaking",
            "Wedding album design",
            "Adobe Premiere Pro",
            "DaVinci Resolve",
            "EDIUS",
            "Photoshop",
            "Digital marketing for photographers"
        ],
        "founder": {"@id": PERSON_ID},
        "sameAs": [MAPS_URL, YT_CHANNEL, YT_CHANNEL_ID, IG, FB, PLAY]
    }
    if with_rating:
        o["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "1800",
            "reviewCount": "1800",
            "bestRating": "5",
            "worstRating": "1"
        }
    if with_catalog:
        items = []
        for c in ALL_COURSES:
            items.append({
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Course",
                    "name": c["name"],
                    "url": SITE + c["path"]
                }
            })
        o["hasOfferCatalog"] = {
            "@type": "OfferCatalog",
            "name": "Courses at Quick Art Photography Academy",
            "itemListElement": items
        }
    return o

def person():
    return {
        "@type": "Person",
        "@id": PERSON_ID,
        "name": "Anil Sharma",
        "jobTitle": "Founder & Lead Mentor",
        "url": SITE + "/about-us/",
        "image": ANIL_IMG,
        "worksFor": {"@id": ORG_ID},
        "knowsAbout": [
            "Video editing",
            "Wedding filmmaking",
            "Wedding album design",
            "DaVinci Resolve",
            "Adobe Premiere Pro"
        ],
        "sameAs": [
            MAPS_URL,
            YT_CHANNEL,
            IG,
            FB
        ]
    }

def website():
    return {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        "url": SITE + "/",
        "name": "Quick Art Photography Academy",
        "alternateName": "Quick Art Photography",
        "inLanguage": "en-IN",
        "publisher": {"@id": ORG_ID}
    }

def webpage(path, ptype, name, desc, image, extra=None, has_breadcrumb=True):
    url = SITE + path
    w = {
        "@type": ptype,
        "@id": url + "#webpage",
        "url": url,
        "name": html.unescape(name),
        "isPartOf": {"@id": WEBSITE_ID},
        "about": {"@id": ORG_ID},
        "inLanguage": "en-IN"
    }
    if desc:
        w["description"] = desc
    w["primaryImageOfPage"] = {"@type": "ImageObject", "url": img(image)}
    if has_breadcrumb:
        w["breadcrumb"] = {"@id": url + "#breadcrumb"}
    if extra:
        w.update(extra)
    return w

def breadcrumb(path, crumbs):
    items = [{"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(crumbs)]
    return {
        "@type": "BreadcrumbList",
        "@id": SITE + path + "#breadcrumb",
        "itemListElement": items
    }

def faq(path, qa):
    return {
        "@type": "FAQPage",
        "@id": SITE + path + "#faq",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a}
            } for q, a in qa
        ]
    }

def course(c):
    url = SITE + c["path"]
    online = c["mode"] == "online"
    node = {
        "@type": "Course",
        "@id": url + "#course",
        "name": c["name"],
        "description": c["desc"],
        "url": url,
        "image": img(c["img"]),
        "provider": {
            "@type": "EducationalOrganization",
            "@id": ORG_ID,
            "name": "Quick Art Photography Academy",
            "url": SITE + "/"
        },
        "inLanguage": "hi",
        "educationalLevel": "Beginner to Advanced",
        "teaches": c["teaches"],
        "timeRequired": c["time"],
        "isAccessibleForFree": False
    }
    inst = {
        "@type": "CourseInstance",
        "courseMode": "online" if online else "onsite",
        "courseWorkload": c["time"],
        "instructor": {"@id": PERSON_ID}
    }
    if not online:
        inst["location"] = {
            "@type": "Place",
            "name": "Quick Art Photography Academy, Siwan",
            "address": ADDRESS,
            "geo": {"@type": "GeoCoordinates", "latitude": LAT, "longitude": LNG}
        }
    node["hasCourseInstance"] = inst
    if c.get("price"):
        node["offers"] = {
            "@type": "Offer",
            "category": "Paid",
            "price": c["price"],
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock",
            "url": url
        }
    if online:
        node["educationalCredentialAwarded"] = {
            "@type": "EducationalOccupationalCredential",
            "name": "Certificate of Completion",
            "credentialCategory": "certificate"
        }
    if "reviews" in c and c["reviews"]:
        node["review"] = c["reviews"]
    return node

# Data sets
ONLINE = [
    dict(slug="premiere-pro-course", name="Adobe Premiere Pro Course in Hindi", price="4999", time="PT18H",
         teaches=["Adobe Premiere Pro", "Video editing", "Multicam editing", "Lumetri colour grading"],
         desc="Online Adobe Premiere Pro course in Hindi: wedding editing, AI workflow, multicam sync and Lumetri colour grading with mentor Anil Sharma.",
         img="/assets/course-premiere-pro-hindi.webp"),
    dict(slug="album-design-course", name="Wedding Album Design Course in Photoshop", price="3499", time="PT12H",
         teaches=["Adobe Photoshop", "Wedding album design", "Photo retouching", "Karizma and Canvera layout"],
         desc="Album designing course online in Hindi: wedding & photo album design in Photoshop, Karizma and Canvera layouts, retouching and print-ready export.",
         img="/home-assets/4d4bc0f95c0b96.webp"),
    dict(slug="edius-course", name="EDIUS Pro Fast Wedding Editing Course", price="3999", time="PT14H",
         teaches=["EDIUS Pro", "Wedding video editing", "Multicam timeline editing", "Export and client delivery"],
         desc="EDIUS video editing course in Hindi: fast wedding editing, multicam sync, titles, colour correction and client delivery with mentor Anil Sharma.",
         img="/assets/course-edius-pro-hindi.webp"),
    dict(slug="davinci-resolve-course", name="DaVinci Resolve Course in Hindi – Color Grading", price="4999", time="PT16H",
         teaches=["DaVinci Resolve", "Color grading", "Node tree workflow", "Cinematic wedding grading"],
         desc="DaVinci Resolve course in Hindi: node-based colour grading, skin-tone matching and cinematic wedding looks with mentor Anil Sharma.",
         img="/assets/course-davinci-resolve-hindi.webp"),
    dict(slug="cinematic-editing-course", name="Cinematic Wedding Video Editing Masterclass", price="5999", time="PT20H",
         teaches=["Cinematic wedding editing", "Teaser creation", "Sound design", "Story pacing"],
         desc="Learn cinematic wedding video editing in Hindi: teasers, highlight films, reels, sound design and colour finishing with mentor Anil Sharma.",
         img="/assets/cinematic-editing-workspace.webp"),
    dict(slug="pre-wedding-shoot-course", name="Pre-Wedding Shoot & Filmmaking Masterclass", price="3999", time="PT14H",
         teaches=["Pre-wedding photography", "Cinematography", "Couple posing", "Gimbal movement"],
         desc="Pre-wedding shoot course in Hindi: couple posing, golden-hour light, gimbal moves and teaser editing with mentor Anil Sharma.",
         img="/assets/editing-timeline.jpg"),
    dict(slug="website-design-course", name="Website Design Course in Hindi", price="2999", time="PT10H",
         teaches=["WordPress", "Elementor", "Photography portfolio design", "Local SEO"],
         desc="Website design course in Hindi with no coding: WordPress, Elementor, portfolio galleries and Google SEO for photographers.",
         img="/assets/course-website-design-hindi.webp"),
    dict(slug="digital-marketing-course", name="Digital Marketing for Photographers & Studios", price="3499", time="PT12H",
         teaches=["Facebook Ads", "Instagram marketing", "Lead generation", "Local business SEO"],
         desc="Digital marketing course in Hindi for photographers: Facebook & Instagram ads, Google local SEO and WhatsApp funnels to get wedding enquiries.",
         img="/assets/course-digital-marketing-hindi.webp"),
    dict(slug="automation-course", name="Studio Automation & AI CRM Masterclass", price="2999", time="PT8H",
         teaches=["WhatsApp automation", "Studio CRM", "Automated quotations", "Client follow-ups"],
         desc="WhatsApp automation course in Hindi for studios: auto replies, instant quotes, follow-ups, payment reminders and AI CRM with mentor Anil Sharma.",
         img="/assets/course-studio-automation.webp"),
]
for c in ONLINE:
    c["mode"] = "online"
    c["path"] = "/online/%s/" % c["slug"]

OFFLINE = [
    dict(slug="video-editing", path="/courses/video-editing/", name="Video Editing Course in Siwan (6-Week Offline)", time="P6W",
         teaches=["Video editing", "EDIUS", "Adobe Premiere Pro", "DaVinci Resolve", "Wedding video editing"],
         desc="Six-week offline video editing course in Siwan covering EDIUS, Premiere Pro, DaVinci Resolve, cinematic wedding storytelling, audio and a final wedding film.",
         img="/assets/editing-timeline.jpg"),
    dict(slug="album-design", path="/courses/album-design/", name="Wedding Album Design Course in Siwan (4-Week Offline)", time="P4W",
         teaches=["Photo album design", "Photoshop retouching", "Karizma layout design", "Print color management"],
         desc="Four-week hands-on photo album design course in Siwan covering Photoshop retouching, Karizma layouts, Canvera sizing and print-ready export.",
         img="/assets/editing-timeline.jpg"),
    dict(slug="ai-wedding-filmmaking", path="/courses/ai-wedding-filmmaking/", name="AI Wedding Filmmaking Course in Siwan", time="P14W",
         teaches=["AI video editing", "Wedding filmmaking", "Dialogue clean-up", "AI color grading"],
         desc="Comprehensive practical course in AI-assisted video editing, prompt-driven color grading, dialogue enhancement and wedding cinematography in Siwan.",
         img="/assets/course-ai-wedding-filmmaking.webp"),
    dict(slug="master-class", path="/master-class/", name="14-Week Wedding Filmmaking Master Class in Siwan", price="35000", time="P14W",
         teaches=["Cinematography", "Video editing", "Album design", "Color grading", "Studio business"],
         desc="Fourteen-week complete offline master class in Siwan covering cinematography, camera operation, video editing, album design, color grading and studio business.",
         img="/assets/editing-timeline.jpg"),
]
for c in OFFLINE:
    c["mode"] = "onsite"

ALL_COURSES = OFFLINE + ONLINE

# FAQs
FAQ = {
 "/": [
  ["Siwan me video editing course ki fees kitni hai?", "Quick Art Photography Academy me video editing course ki complete fee details, batch timing aur hostel facility ki jankari ke liye aap hume call (+91 9939800780) karein ya campus visit karke free demo class attend karein."],
  ["Kya Patna, Chhapra aur Gopalganj ke students aa sakte hain?", "Haan, hamare offline classes me Siwan ke alawa Gopalganj, Chhapra, Patna aur pure Bihar se students aate hain. Outstation students ke liye 100% free hostel aur rehne ki suvidha uplabdh hai."],
  ["Kya photo aur video editing dono ek course me sikhaye jate hain?", "Haan, hamare comprehensive offline programs (jaise 14-Week Master Class aur editing modules) me Photoshop photo retouching, album design ke sath-sath EDIUS, Premiere Pro aur DaVinci Resolve par video editing sikhayi jati hai."],
 ],
 "/master-class/": [
  ["Who is the 14-week Master Class designed for?", "This program is designed for aspiring wedding cinematographers, video editors, and studio owners in Purvanchal and Bihar seeking complete mastery from camera handling to client delivery."],
  ["Is hostel stay provided for outstation students?", "Yes, 100% free hostel accommodation and living facilities are provided to outstation candidates traveling from Patna, Chhapra, Gopalganj, Gorakhpur, and other cities."],
  ["Which software suites are covered during the course?", "Students train hands-on with Adobe Premiere Pro, EDIUS Pro, DaVinci Resolve Studio, and Adobe Photoshop for album design."],
  ["Are project files and wedding footage provided?", "Yes, trainees receive over 500GB+ of 4K multi-cam wedding footage, sound effects, signature LUTs, and project templates for lifetime practice."],
  ["Will I receive an industry-recognized certificate?", "Yes, upon submitting your final wedding film portfolio, you receive a verified Certificate of Completion accredited to ISO 9001:2015 educational standards."],
  ["How do I book a free 1-on-1 demo class?", "You can call us directly at +91 9939800780, message on WhatsApp, or submit the booking form on this page to reserve your free demo seat."]
 ],
 "/courses/video-editing/": [
  ["What is the duration and daily schedule of this video editing course?", "The course duration is 6 weeks of intensive offline studio training. Daily classes include 2 hours of direct mentor-led instruction followed by unlimited practical lab practice on dedicated academy editing workstations."],
  ["Can a complete beginner join these video editing classes?", "Yes! No prior video editing or computer programming experience is required. We start from basic computer handling, folder management, and timeline navigation before advancing to complex multi-cam editing and color grading."],
  ["How do the video editing course fees compare to institutes in Patna or Delhi?", "Our video editing course fees are highly affordable and include 100% free hostel stay for outstation students. Metropolitan institutes charge 3x to 5x higher while excluding living costs. Contact us for the complete fee schedule and installment plans."],
  ["Will I receive an accredited certificate upon course completion?", "Yes. After submitting your final wedding film and showreel project, you receive a verified Certificate of Completion from Quick Art Photography Academy aligned with ISO 9001:2015 educational standards."],
  ["Does the academy guarantee a job or specific freelance earnings?", "We do not make false job or income guarantees. Instead, we equip students with real-world practical skills, client pitch strategies, and a strong portfolio showreel that enables graduates to secure freelance clients and studio roles independently."]
 ],
 "/courses/album-design/": [
  ["What software tools are taught in this album design course?", "The curriculum focuses on Adobe Photoshop CC, Lightroom, frequency separation actions, automated batch retouching, and layout tools for Karizma, Canvera, and Photobook printing formats."],
  ["Do I need graphic design or drawing background to join?", "No previous design background is required. We teach design aesthetics, color harmony, typography, grid alignment, and image balance from ground zero."],
  ["Are ready-made wedding album templates included?", "Yes, students receive a massive library of 500+ customizable wedding album PSD templates, high-resolution decorative cliparts, borders, and cinematic fonts for lifelong commercial use."],
  ["Is accommodation provided for candidates from other districts?", "Yes, 100% free hostel accommodation is provided for all students coming from outside Siwan across Bihar and Uttar Pradesh."],
  ["Will I learn how to coordinate with commercial print labs?", "Yes, you learn complete pre-press setup: color profile calibration (sRGB vs CMYK), cover embossing, UV gloss finishing, and export sizing required by major printing labs across India."]
 ],
 "/courses/ai-wedding-filmmaking/": [
  ["What is covered in the AI Wedding Filmmaking course?", "The course covers AI-assisted rough cuts, speech-to-text automated subtitle generation, AI vocal isolation and background noise cleanup, neural skin retouching, prompt-guided color grading, and automated multi-cam synchronization."],
  ["Do I need an expensive AI computer to learn this course?", "No. All hands-on practical training is conducted on our high-performance RTX GPU workstations at the academy in Siwan. We also teach you how to choose budget-friendly hardware and cloud AI workflows for your own setup."],
  ["Will AI tools replace wedding videographers and editors?", "AI does not replace human storytelling or emotion. Instead, it eliminates tedious tasks like syncing audio, searching through hours of raw footage, and manual mask tracking, allowing you to edit faster and take on more high-paying clients."],
  ["Is hostel accommodation available for students outside Siwan?", "Yes, 100% free hostel stay and living accommodation are provided to all outstation students coming from Gopalganj, Chhapra, Patna, Gorakhpur, and other parts of Bihar and UP."],
  ["What certificate do I receive upon completion?", "Upon completing your practical project film, you receive a verified Certificate of Completion from Quick Art Photography Academy accredited to ISO 9001:2015 educational standards."]
 ],
 "/online/premiere-pro-course/": [
  ["Is this Adobe Premiere Pro course suitable for complete beginners?", "Yes! The course starts from scratch: software setup, workspace overview, basic cutting, and gradually moves to advanced cinematic editing, multicam sync, and Lumetri color grading."],
  ["Can I watch the classes on mobile and laptop?", "Yes, you get instant access through the Quick Art LMS portal. You can watch anytime on Android, iPhone, Windows PC, or Mac."],
  ["Do I get practice project files and LUTs?", "Yes, you receive 4K raw wedding footage, Quick Art signature LUTs (.cube files), sound effects pack, and shortcut cheatsheets."],
  ["Will I receive a verified certificate upon completion?", "Yes, after completing the lessons and module quizzes, you will receive an official verifiable Certificate of Completion from Quick Art Photography Academy."],
 ],
 "/online/album-design-course/": [
  ["क्या मुझे पहले से फोटोशॉप आना जरूरी है?", "नहीं, यह कोर्स एकदम बेसिक टूल्स और शॉर्टकट्स से शुरू होता है और आपको प्रो-लेवल एल्बम डिज़ाइनर बनाता है।"],
  ["क्या कोर्स में रेडीमेड PSD टेम्पलेट्स मिलेंगे?", "हाँ! एनरोलमेंट के साथ 50+ प्रीमियम 12x36 वेडिंग स्प्रेड PSD टेम्पलेट्स और स्किन एक्शन पैक बिल्कुल फ्री मिलते हैं।"],
  ["क्या प्रिंटिंग लैब्स जैसे Canvera और Karizma की सेटिंग्स सिखाई जाएगी?", "बिल्कुल! लैब कलर प्रोफाइल, CMYK vs RGB, सेफ मार्जिन्स और कवर डिज़ाइनिंग की पूरी प्रैक्टिकल ट्रेनिंग दी गई है।"],
  ["कोर्स की वैलिडिटी कितनी है?", "आपको लाइफटाइम एक्सेस मिलता है। आप मोबाइल और लैपटॉप दोनों पर कभी भी रिवीजन कर सकते हैं।"],
 ],
 "/online/edius-course/": [
  ["Why is EDIUS Pro popular for wedding video editing?", "EDIUS Pro is famous for its unmatched real-time rendering speed, stability, and fast multicam handling even on budget PC hardware without proxy files."],
  ["Do I get downloadable wedding project templates?", "Yes, you get wedding project presets, title animations, transition templates, and shortcut sheets to speed up your daily studio output."],
  ["Can I watch the lessons on phone and laptop?", "Yes, you get 24/7 lifetime access on mobile and PC through our secure student LMS portal."],
 ],
 "/online/davinci-resolve-course/": [
  ["Is this DaVinci Resolve course for free version or Studio version?", "The entire core color grading workflow taught in this course works 100% on the FREE version of DaVinci Resolve as well as DaVinci Resolve Studio."],
  ["Does the course teach skin tone protection?", "Yes! Indian wedding skin tones can be tricky due to colored stage lights. We dedicate entire modules to vectorscope skin line targeting, qualifiers, and HSL curves."],
 ],
 "/online/cinematic-editing-course/": [
  ["क्या यह कोर्स सिर्फ वीडियो एडिटर के लिए है या शूट करने वाले भी सीख सकते हैं?", "यह कैमरामैन और एडिटर दोनों के लिए है—शूटिंग के एंगल्स, कैमरा सेटिंग्स और एडिटिंग दोनों को गहराई से कवर किया गया है।"],
  ["क्या रील्स और यूट्यूब दोनों का फॉर्मेट सिखाया जाएगा?", "हाँ, 16:9 4K यूट्यूब मास्टर और 9:16 वर्टिकल इंस्टाग्राम रील्स दोनों के प्रोजेक्ट्स शामिल हैं।"],
  ["ऑडियो और बैकग्राउंड म्यूजिक कैसे मैनेज करें?", "रॉयल्टी-फ्री म्यूजिक खोजने, डायलॉग्स और बीट्स को परफेक्ट सिंक करने की पूरी विधि समझाई गई है।"],
  ["क्या मुझे प्रैक्टिस के लिए रॉ वीडियो मिलेगी?", "हाँ, 10 से ज्यादा शादियों की असली 4K रॉ क्लिप्स डाउनलोड के लिए दी जाएंगी।"],
  ["क्या कोर्स की कोई समय सीमा है?", "नहीं, लाइफटाइम एक्सेस मिलता है। आप कभी भी, कितनी भी बार मोबाइल या लैपटॉप पर देख सकते हैं।"],
 ],
 "/online/pre-wedding-shoot-course/": [
  ["क्या महंगी लोकेशन होना जरूरी है?", "नहीं! साधारण पार्क, खेत, नदी किनारे या शहर की पुरानी इमारतों में भी कैसे सिनेमाई शूट करें, वह बारीकी से सिखाया गया है।"],
  ["अगर कपल कैमरा-शर्मीला (camera shy) हो तो?", "उन्हें नैचुरल और हँसते-खेलते फ्रेम में लाने की पूरी साइकोलॉजी और फ्रेंडली डायरेक्शन तकनीक समझाई गई है।"],
  ["कौन से कैमरा और लेंस चाहिए?", "शुरुआती स्तर के DSLR या मिररलेस और 50mm f/1.8 जैसे बेसिक लेंस से भी शानदार रिजल्ट लेने के तरीके शामिल हैं।"],
  ["क्या ड्रोन चलाना जरूरी है?", "ड्रोन एक अतिरिक्त फायदा है, लेकिन बिना ड्रोन के भी केवल कैमरे और गिम्बल से जादुई प्री-वेडिंग फिल्म बनाई जा सकती है।"],
  ["क्या कोर्स के बाद सर्टिफिकेट मिलेगा?", "हाँ, कोर्स पूरा करने पर Quick Art Photography Academy की ओर से ऑनलाइन वेरिफ़िएबल सर्टिफिकेट मिलेगा।"],
 ],
 "/online/website-design-course/": [
  ["क्या कोडिंग या प्रोग्रामिंग की जरूरत है?", "बिल्कुल नहीं! 100% नो-कोड और ड्रैग-एंड-ड्रॉप सिखाया गया है। कोई भी नॉन-टेक्निकल व्यक्ति अपनी वेबसाइट आसानी से बना सकता है।"],
  ["क्या वेबसाइट मोबाइल पर सही चलेगी?", "हाँ, 90% क्लाइंट्स मोबाइल से आते हैं, इसलिए मोबाइल-फर्स्ट डिज़ाइन सिखाया गया है जो फोन पर सुपरफास्ट खुलता है।"],
  ["क्या हर साल बहुत खर्चा होगा?", "नहीं, सबसे किफ़ायती और तेज़ होस्टिंग ऑप्शन्स की जानकारी दी गई है जो बहुत कम खर्च में साल भर चलती है।"],
  ["क्या मैं खुद फोटो और वीडियो अपडेट कर पाऊँगा?", "हाँ, 5 मिनट में नए शादी के एल्बम और वीडियो अपलोड करने की विधि सिखाई गई है।"],
  ["क्या मेंटर सपोर्ट उपलब्ध है?", "हाँ, वेबसाइट बनाते समय कोई दिक्कत आने पर अनिल सर से सीधे व्हाट्सएप पर सहायता पा सकते हैं।"],
 ],
 "/online/digital-marketing-course/": [
  ["विज्ञापन के लिए रोज़ाना कितना बजट चाहिए?", "शुरुआत सिर्फ ₹150 - ₹200 प्रतिदिन से की जा सकती है। जब परिणाम दिखने लगें तब बजट बढ़ाया जा सकता है।"],
  ["क्या मेरे पास सिर्फ फोन हो तो भी ऐड चला सकता हूँ?", "हाँ, मोबाइल से ऐड सेटअप और लीड मैनेज करने का पूरा तरीका इस कोर्स में शामिल है।"],
  ["क्या अनचाहे/फर्जी नंबरों से बचा जा सकता है?", "हाँ, फ़िल्टरिंग और हाई-इंटेंट टारगेटिंग की सटीक सेटिंग्स सिखाई गई हैं जिससे सिर्फ गंभीर खरीदार ही मैसेज करते हैं।"],
  ["क्या यह कोर्स सिर्फ शादी के फोटोग्राफरों के लिए है?", "यह शादी, प्री-वेडिंग, मैटरनिटी और इवेंट फोटोग्राफर्स सभी के लिए अत्यंत लाभकारी है।"],
  ["कोर्स की एक्सेस कब तक रहेगी?", "लाइफटाइम एक्सेस है। भविष्य में आने वाले नए मार्केटिंग अपडेट्स भी आपको बिल्कुल मुफ्त मिलेंगे।"],
 ],
 "/online/automation-course/": [
  ["क्या ऑटोमेशन से व्हाट्सएप नंबर बैन हो सकता है?", "नहीं, यह 100% ऑफिशियल Meta Cloud API पर काम करता है, कोई थर्ड-पार्टी अनऑफिशियल टूल नहीं। आपका नंबर पूरी तरह सुरक्षित रहेगा।"],
  ["क्या इसे किसी टेक्निकल टीम की जरूरत है?", "नहीं, एक बार 1 घंटे में सेट करने के बाद यह हमेशा अपने आप चलता रहता है। कोई कोडिंग या सर्वर ज्ञान नहीं चाहिए।"],
  ["क्या यह मेरे पुराने फोन नंबर पर चल जाएगा?", "हाँ, आप अपने मौजूदा नंबर या नए नंबर पर इसे आसानी से एक्टिवेट कर सकते हैं।"],
  ["क्या इसके लिए महंगा सॉफ्टवेयर खरीदना होगा?", "नहीं, फ्री और बेहद सस्ते टूल्स का उपयोग करके पूरा सिस्टम बनाना सिखाया गया है।"],
  ["क्या मेंटर सपोर्ट उपलब्ध है?", "हाँ, कोई भी समस्या आने पर सीधे अनिल सर से व्हाट्सएप पर समाधान पा सकते हैं।"],
 ],
}

def video(vid, name, desc, date, dur):
    return {
        "@type": "VideoObject",
        "@id": "https://www.youtube.com/watch?v=%s#video" % vid,
        "name": name,
        "description": desc,
        "thumbnailUrl": "https://i.ytimg.com/vi/%s/maxresdefault.jpg" % vid,
        "uploadDate": date,
        "duration": dur,
        "contentUrl": "https://www.youtube.com/watch?v=%s" % vid,
        "embedUrl": "https://www.youtube.com/embed/%s" % vid,
        "publisher": {"@id": ORG_ID}
    }

TESTIMONIALS = [
    video("FKtK5dPFilg", "Suraj from Raxaul – Student Testimonial | Quick Art Photography Academy",
          "Video testimonial from Suraj (Raxaul) about learning at Quick Art Photography Academy, Siwan.", "2025-07-17T09:41:58-07:00", "PT46S"),
    video("MrZycOa2ltU", "Ravi from Gaya – Student Testimonial | Quick Art Photography Academy",
          "Video testimonial from Ravi (Gaya) about learning at Quick Art Photography Academy, Siwan.", "2025-07-17T09:45:48-07:00", "PT1M8S"),
    video("FCjaO7LmM6o", "Ashish from Chapra – Student Testimonial | Quick Art Photography Academy",
          "Video testimonial from Ashish (Chapra) about learning at Quick Art Photography Academy, Siwan.", "2025-07-17T09:43:53-07:00", "PT54S"),
    video("CqMTAN3crS4", "Vikash from Baliya, UP – Student Testimonial | Quick Art Photography Academy",
          "Video testimonial from Vikash (Baliya, Uttar Pradesh) about learning at Quick Art Photography Academy, Siwan.", "2025-07-17T09:45:41-07:00", "PT43S"),
]

APP = {
    "@type": "MobileApplication",
    "@id": SITE + "/#app",
    "name": "Quick Art Photography - QAA",
    "description": "Learning app of Quick Art Photography Academy for course videos and student lessons.",
    "operatingSystem": "ANDROID",
    "applicationCategory": "EducationalApplication",
    "url": PLAY,
    "installUrl": PLAY,
    "image": "https://play-lh.googleusercontent.com/sCIZT33sZ5m4ymH5yZo-xCHtVsTQrGWgYLZuKnPYmIc8_r8pltt8OPii1MHVAUSp70isQ8mI0vjL2WlbregPIJk",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock"
    },
    "publisher": {"@id": ORG_ID}
}

META = {
 "/": ("Video Editing Course in Siwan | Quick Art Photography Academy", "Best video editing course in Siwan & Bihar. Master Premiere Pro, DaVinci & EDIUS with practical studio training & free hostel. Rated 4.9/5 by 1,800+ students.", DEFAULT_IMG),
 "/about-us/": ("About Quick Art Photography Academy | Anil Sharma, Siwan", "Meet founder Anil Sharma and Quick Art Photography Academy: practical filmmaking, video editing and album design training in Siwan, Bihar.", ANIL_IMG),
 "/contact-us/": ("Contact Quick Art Photography Academy | Siwan – Free Demo", "Call +91 9939800780 or visit Quick Art Photography Academy, Ayodhya Puri, Siwan for course details, fees, a free demo class and batch dates.", DEFAULT_IMG),
 "/online/": ("Online Video Editing Course in Hindi – All Masterclasses", "Learn video editing online in Hindi: Premiere Pro, DaVinci Resolve, EDIUS, cinematic editing, album design and marketing. 4K project files and certificate.", SITE + "/assets/premiere-pro-hero-1200.webp"),
 "/courses/": ("Photography & Video Editing Courses in Siwan | Quick Art", "Explore video editing, album design, AI wedding filmmaking and the 14-week Master Class at Quick Art Photography Academy in Siwan, Bihar.", DEFAULT_IMG),
 "/blog/": ("Video Editing & Filmmaking Guides | Quick Art Blog", "Read practical guides to video editing workflows, AI-assisted wedding production and freelance portfolio development from Quick Art Photography Academy.", DEFAULT_IMG),
 "/privacy-policy/": ("Privacy Policy | Quick Art Photography Academy", "Privacy Policy of Quick Art Photography Academy. Learn how we collect, use, and protect your personal data including payment information.", LOGO),
 "/terms-and-conditions/": ("Terms & Conditions | Quick Art Photography Academy", "Terms and Conditions for Quick Art Photography Academy. Read our service terms, course enrollment policy, and user agreements.", LOGO),
 "/refund-policy/": ("Refund & Cancellation Policy | Quick Art Photography Academy", "Refund and Cancellation Policy for Quick Art Photography Academy. Learn about our 7-day refund window for digital courses and campus course cancellation terms.", LOGO),
 "/shipping-policy/": ("Shipping & Delivery Policy | Quick Art Photography Academy", "Shipping and Delivery Policy for Quick Art Photography Academy. Online courses are delivered digitally with instant access via our Student Portal.", LOGO),
 "/sitemap.html": ("Website Sitemap | Quick Art Photography Academy", "Explore Quick Art Photography Academy courses, wedding filmmaking masterclasses, studio information, and offline campus details in Siwan, Bihar.", LOGO),
}

COURSE_META = {
 "/master-class/": ("14-Week Wedding Filmmaking Master Class in Siwan", "14-week offline wedding filmmaking course in Siwan: cinematography, wedding video editing, album design, colour grading, business and AI growth."),
 "/courses/video-editing/": ("Video Editing Course in Siwan, Bihar – Fees & Classes", "Best video editing course in Siwan: 6-week offline video editing classes in EDIUS, Premiere Pro & DaVinci Resolve. See course fees, syllabus & book a free demo."),
 "/courses/album-design/": ("Wedding Album Design Course in Siwan – 4-Week Classes", "Join our wedding album design course in Siwan: 4-week hands-on photo album design classes with Photoshop retouching, Karizma layouts & print-ready export."),
 "/courses/ai-wedding-filmmaking/": ("AI Wedding Filmmaking Course in Siwan | AI Video Editing", "Learn AI video editing and cinematic wedding filmmaking in Siwan: AI-assisted photo and video workflows, colour, sound and delivery at Quick Art Academy."),
 "/online/premiere-pro-course/": ("Adobe Premiere Pro Course in Hindi – Online Classes", "Best Adobe Premiere Pro online course in Hindi: wedding editing, multicam sync, AI workflow & Lumetri colour grading with mentor Anil Sharma. Rated 4.9/5."),
 "/online/album-design-course/": ("Album Designing Course Online in Hindi | Wedding Album", "Album designing course online in Hindi: wedding & photo album design in Photoshop, Karizma and Canvera layouts, retouching and print-ready export."),
 "/online/edius-course/": ("Best EDIUS Online Course in Hindi – Wedding Video Editing", "EDIUS video editing course in Hindi: fast wedding editing, multicam sync, titles, colour correction and client delivery. Wedding video editing training online."),
 "/online/davinci-resolve-course/": ("Best DaVinci Resolve Online Course in Hindi | Color Grading", "DaVinci Resolve course in Hindi: node-based colour grading, skin-tone matching and cinematic wedding looks. Online lessons with mentor Anil Sharma."),
 "/online/cinematic-editing-course/": ("Cinematic Wedding Video Editing Course in Hindi (Online)", "Learn cinematic wedding video editing in Hindi: teasers, highlight films, reels, sound design and colour finishing. Online wedding video editing course."),
 "/online/pre-wedding-shoot-course/": ("Pre-Wedding Shoot Course Online in Hindi | Photo & Film", "Pre-wedding shoot course in Hindi: couple posing, golden-hour light, gimbal moves and teaser editing. Online pre wedding photography & videography training."),
 "/online/website-design-course/": ("Website Design Course in Hindi – Web Design Classes Online", "Website design course in Hindi with no coding: WordPress, Elementor, portfolio galleries and Google SEO. Online web design classes for photographers."),
 "/online/digital-marketing-course/": ("Digital Marketing Course in Hindi for Photographers", "Digital marketing course in Hindi for photographers: Facebook & Instagram ads, Google local SEO and WhatsApp funnels to get wedding enquiries."),
 "/online/automation-course/": ("WhatsApp Automation Course for Photography Studios", "WhatsApp automation course in Hindi for studios: auto replies, instant quotes, follow-ups, payment reminders and AI CRM with mentor Anil Sharma."),
}

BLOG = [
 dict(slug="best-video-editing-software-in-2026", headline="Best Video Editing Software in 2026", pub="2026-04-30", img="/home-assets/7205ed1f9ab838.jpeg",
      title="Best Video Editing Software in 2026 | Quick Art Academy", desc="Best video editing software in 2026: Premiere Pro, DaVinci Resolve, FCP & CapCut reviewed for creators and wedding editors by Quick Art Photography Academy."),
 dict(slug="freelance-video-editor-earn-in-bihar", headline="Building a High-Paying Freelance Video Editing Career in Bihar", pub="2026-05-25", img="/home-assets/063569f6448203.jpeg",
      title="Freelance Video Editor in Bihar: Earn Guide | Quick Art", desc="Roadmap to becoming a freelance video editor in Bihar: skills, showreel, rates and client growth from Quick Art Photography Academy in Siwan."),
 dict(slug="how-ai-is-changing-wedding-filmmaking-2026", headline="AI in Wedding Filmmaking: A Practical Production Guide", pub="2026-05-12", img="/home-assets/398bbffe508624.jpeg",
      title="AI in Wedding Filmmaking 2026: Practical Guide | Quick Art", desc="Explore AI in wedding filmmaking: photo editing, dialogue enhancement and production workflows at Quick Art Photography Academy in Siwan, Bihar."),
 dict(slug="top-10-photography-studios-in-chapra", headline="Top 10 Photography Studios in Chapra – Best Wedding Photographer 2025", pub="2026-09-20", img="/assets/blog-chapra-photography-studios-hero.jpg",
      title="Top 10 Photography Studios in Chapra | Quick Art", desc="Top 10 photography studios in Chapra for cinematic wedding films and event shoots. Explore professional photographers and video editing services."),
 dict(slug="top-5-editing-course-academies-in-patna", headline="Top 5 Editing Course Academies in Patna – Best Institutes for Video Editing Career", pub="2026-09-20", img="/assets/blog-top-5-editing-course-patna-hero.jpg",
      title="Top 5 Editing Course Academies in Patna | Quick Art", desc="Explore top 5 editing course academies in Patna: practical training, latest software and hands-on projects at Quick Art Photography Academy in Bihar."),
 dict(slug="video-editing-course-in-gaya", headline="Video Editing Course in Gaya: Complete Guide to Fees, Syllabus & Academy Options", pub="2026-09-20", img="/assets/blog-video-editing-course-gaya-hero.jpg",
      title="Video Editing Course in Gaya, Bihar | Quick Art", desc="Best video editing course in Gaya with 100% practical training in Premiere Pro & DaVinci Resolve. Free hostel in Siwan. Call +91 9939800780.")
]

def extract_online_reviews(html_content):
    reviews = []
    pattern = (
        r'<div class=["\']lp-review-card["\'].*?<p class=["\']lp-review-text["\']>\s*(.*?)\s*</p>.*?<div class=["\']lp-author-name["\']>\s*(.*?)\s*</div>'
    )
    for text, author in re.findall(pattern, html_content, re.DOTALL):
        text_clean = re.sub(r'<[^>]+>', '', text).strip().strip('"').strip("'").strip()
        author_clean = re.sub(r'<[^>]+>', '', author).strip()
        if text_clean and author_clean:
            reviews.append({
                "@type": "Review",
                "author": {"@type": "Person", "name": author_clean},
                "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
                "reviewBody": text_clean
            })
    return reviews

def extract_masterclass_reviews():
    return [
        {
            "@type": "Review",
            "author": {"@type": "Person", "name": "Divakar Kumar"},
            "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
            "reviewBody": "Best video editing class in Siwan, Bihar."
        },
        {
            "@type": "Review",
            "author": {"@type": "Person", "name": "Sahila Ansari"},
            "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
            "reviewBody": "The wedding studio here captured our special day with such artistry. The team’s attention to detail and creative eye were evident in every shot. Final prints are stunning — truly exceeding our expectations."
        },
        {
            "@type": "Review",
            "author": {"@type": "Person", "name": "Rahul Kumar"},
            "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
            "reviewBody": "The wedding studio at Quick Art Photography Academy captured our special day beautifully. Team’s patience and skill resulted in stunning portraits."
        },
        {
            "@type": "Review",
            "author": {"@type": "Person", "name": "Khushboo Raj"},
            "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
            "reviewBody": "Solid video editing course. Learned practical skills that are really useful. Instructors were knowledgeable and the atmosphere was conducive to learning."
        },
        {
            "@type": "Review",
            "author": {"@type": "Person", "name": "Radhika Devi"},
            "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
            "reviewBody": "Learned so much in their video editing course! Instructors were patient and clearly explained every step. Hands-on practice sessions were incredibly beneficial."
        },
        {
            "@type": "Review",
            "author": {"@type": "Person", "name": "Siddharth Kumar"},
            "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
            "reviewBody": "Very informative course. Instructors were very supportive, breaking down complex concepts clearly. Practical sessions gave real hands-on experience."
        }
    ]

def generate_schema_for_url(rel_path, html_content):
    # Determine rating
    has_rating = rel_path in [
        "index.html",
        "about-us/index.html",
        "contact-us/index.html",
        "courses/video-editing/index.html",
        "courses/album-design/index.html",
        "courses/ai-wedding-filmmaking/index.html",
        "master-class/index.html"
    ]

    # Clean path representation (e.g. "/" or "/about-us/")
    p = "/" if rel_path == "index.html" else "/" + rel_path.replace("index.html", "")

    nodes = []

    # 1. Homepage
    if rel_path == "index.html":
        t, d, im = META["/"]
        wp = webpage("/", "WebPage", t, d, im, has_breadcrumb=False, extra={"mainEntity": {"@id": ORG_ID}})
        nodes.append(wp)
        nodes.append(faq("/", FAQ["/"]))
        nodes.extend(TESTIMONIALS)
        nodes.append(APP)
        # Raju Gupta visible review
        nodes.append({
            "@type": "Review",
            "itemReviewed": {"@id": ORG_ID},
            "author": {"@type": "Person", "name": "Raju Gupta"},
            "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
            "reviewBody": "Quick Art Photography Academy completely changed my approach to lighting and post-processing. The courses are incredibly detailed and the feedback from instructors is invaluable. My portfolio has never looked better and I have started booking paid clients!"
        })
        base_org = org(with_rating=True, with_catalog=True)

    # 2. About Us
    elif rel_path == "about-us/index.html":
        t, d, im = META["/about-us/"]
        crumbs = [("Home", SITE + "/"), ("About Us", SITE + "/about-us/")]
        wp = webpage("/about-us/", "AboutPage", t, d, im, extra={"mainEntity": {"@id": PERSON_ID}})
        nodes.extend([wp, breadcrumb("/about-us/", crumbs)])
        base_org = org(with_rating=True)

    # 3. Contact Us
    elif rel_path == "contact-us/index.html":
        t, d, im = META["/contact-us/"]
        crumbs = [("Home", SITE + "/"), ("Contact Us", SITE + "/contact-us/")]
        wp = webpage("/contact-us/", "ContactPage", t, d, im, extra={"mainEntity": {"@id": ORG_ID}})
        place = {
            "@type": "Place",
            "@id": SITE + "/contact-us/#campus",
            "name": "Quick Art Photography Academy Campus",
            "address": ADDRESS,
            "geo": {"@type": "GeoCoordinates", "latitude": LAT, "longitude": LNG},
            "hasMap": MAPS_URL
        }
        nodes.extend([wp, place, breadcrumb("/contact-us/", crumbs)])
        base_org = org(with_rating=True)

    # 4. Online Hub
    elif rel_path == "online/index.html":
        t, d, im = META["/online/"]
        crumbs = [("Home", SITE + "/"), ("Online Courses", SITE + "/online/")]
        il = {
            "@type": "ItemList",
            "@id": SITE + "/online/#courses",
            "name": "Online courses in Hindi",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": SITE + c["path"], "name": c["name"]} for i, c in enumerate(ONLINE)]
        }
        wp = webpage("/online/", "CollectionPage", t, d, im, extra={"mainEntity": {"@id": SITE + "/online/#courses"}})
        nodes.extend([wp, breadcrumb("/online/", crumbs), il])
        base_org = org(with_rating=False)

    # 5. Courses Hub
    elif rel_path == "courses/index.html":
        t, d, im = META["/courses/"]
        crumbs = [("Home", SITE + "/"), ("Courses", SITE + "/courses/")]
        il = {
            "@type": "ItemList",
            "@id": SITE + "/courses/#courses",
            "name": "Offline courses in Siwan",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": SITE + c["path"], "name": c["name"]} for i, c in enumerate(OFFLINE)]
        }
        wp = webpage("/courses/", "CollectionPage", t, d, im, extra={"mainEntity": {"@id": SITE + "/courses/#courses"}})
        nodes.extend([wp, breadcrumb("/courses/", crumbs), il])
        base_org = org(with_rating=False)

    # 6. Course Pages (9 Online + 4 Offline)
    elif p in [c["path"] for c in ALL_COURSES]:
        c = next(item for item in ALL_COURSES if item["path"] == p)
        t, d = COURSE_META[p]
        parent = ("Online Courses", SITE + "/online/") if c["mode"] == "online" else ("Courses", SITE + "/courses/")
        crumbs = [("Home", SITE + "/"), parent, (c["name"], SITE + p)]
        
        # Attach reviews
        if c["slug"] == "master-class":
            c["reviews"] = extract_masterclass_reviews()
        elif c["mode"] == "online":
            c["reviews"] = extract_online_reviews(html_content)

        c_node = course(c)
        wp = webpage(p, "WebPage", t, d, img(c["img"]), extra={"mainEntity": {"@id": SITE + p + "#course"}})
        nodes.extend([wp, breadcrumb(p, crumbs), c_node])
        
        if p in FAQ:
            nodes.append(faq(p, FAQ[p]))

        base_org = org(with_rating=has_rating)

    # 7. Blog Hub
    elif rel_path == "blog/index.html":
        t, d, im = META["/blog/"]
        crumbs = [("Home", SITE + "/"), ("Blog", SITE + "/blog/")]
        blog_node = {
            "@type": "Blog",
            "@id": SITE + "/blog/#blog",
            "url": SITE + "/blog/",
            "name": "Quick Art Blog",
            "inLanguage": "en-IN",
            "publisher": {"@id": ORG_ID},
            "blogPost": [{
                "@type": "BlogPosting",
                "@id": SITE + "/blog/%s/#article" % b["slug"],
                "headline": b["headline"],
                "url": SITE + "/blog/%s/" % b["slug"],
                "datePublished": b["pub"]
            } for b in BLOG]
        }
        wp = webpage("/blog/", "CollectionPage", t, d, im, extra={"mainEntity": {"@id": SITE + "/blog/#blog"}})
        nodes.extend([wp, breadcrumb("/blog/", crumbs), blog_node])
        base_org = org(with_rating=False)

    # 8. Individual Blog Posts
    elif rel_path.startswith("blog/") and rel_path != "blog/index.html":
        slug = rel_path.split("/")[1]
        b = next((item for item in BLOG if item["slug"] == slug), None)
        if b:
            crumbs = [("Home", SITE + "/"), ("Blog", SITE + "/blog/"), (b["headline"], SITE + p)]
            art = {
                "@type": "BlogPosting",
                "@id": SITE + p + "#article",
                "headline": b["headline"],
                "description": b["desc"],
                "image": {
                    "@type": "ImageObject",
                    "url": img(b["img"]),
                    "width": 1200,
                    "height": 675
                },
                "datePublished": b["pub"],
                "dateModified": b["pub"],
                "author": {"@id": PERSON_ID},
                "publisher": {"@id": ORG_ID},
                "mainEntityOfPage": {"@id": SITE + p + "#webpage"},
                "isPartOf": {
                    "@type": "Blog",
                    "@id": SITE + "/blog/#blog",
                    "name": "Quick Art Blog",
                    "url": SITE + "/blog/"
                },
                "inLanguage": "en-IN"
            }
            wp = webpage(p, "WebPage", b["title"], b["desc"], img(b["img"]), extra={"mainEntity": {"@id": SITE + p + "#article"}})
            nodes.extend([wp, breadcrumb(p, crumbs), art])
        base_org = org(with_rating=False)

    # 9. Legal & Policy Pages + sitemap.html
    elif rel_path in [
        "privacy-policy/index.html",
        "terms-and-conditions/index.html",
        "refund-policy/index.html",
        "shipping-policy/index.html",
        "sitemap.html"
    ]:
        page_names = {
            "privacy-policy/index.html": ("Privacy Policy", "/privacy-policy/"),
            "terms-and-conditions/index.html": ("Terms & Conditions", "/terms-and-conditions/"),
            "refund-policy/index.html": ("Refund & Cancellation Policy", "/refund-policy/"),
            "shipping-policy/index.html": ("Shipping & Delivery Policy", "/shipping-policy/"),
            "sitemap.html": ("Sitemap", "/sitemap.html")
        }
        nm, path_key = page_names[rel_path]
        t, d, im = META[path_key]
        crumbs = [("Home", SITE + "/"), (nm, SITE + path_key)]
        ptype = "CollectionPage" if rel_path == "sitemap.html" else "WebPage"
        wp = webpage(path_key, ptype, t, d, im)
        nodes.extend([wp, breadcrumb(path_key, crumbs)])
        base_org = org(with_rating=False)

    # Assemble Graph
    g = [base_org, person(), website()] + nodes
    return {
        "@context": "https://schema.org",
        "@graph": g
    }

def apply_to_all():
    files = sorted(glob.glob("**/*.html", recursive=True))
    exclude = {
        "404.html",
        "admin.html",
        "adobe-premiere-pro-course/index.html",
        "best-davinci-resolve-online-course-in-hindi/index.html",
        "courses/graphic-design/index.html",
        "join-video-editing-album-design-course/index.html",
        "master-class/live.html",
        "portal/email-template-preview.html",
        "portal/index.html",
        "portal/signup.html",
        "thank-you/index.html",
        "watch/index.html"
    }

    # Ensure excluded files have 0 schema
    for ef in exclude:
        if os.path.exists(ef):
            with open(ef, "r", encoding="utf-8") as f:
                content = f.read()
            cleaned = re.sub(r'<script\s+type=["\']application/ld\+json["\'][^>]*>.*?</script>\s*', '', content, flags=re.DOTALL)
            if cleaned != content:
                with open(ef, "w", encoding="utf-8") as f:
                    f.write(cleaned)

    updated_count = 0
    for f in files:
        if f in exclude:
            continue
        with open(f, "r", encoding="utf-8") as fp:
            orig = fp.read()

        schema_dict = generate_schema_for_url(f, orig)
        schema_json = json.dumps(schema_dict, ensure_ascii=False, indent=2)
        schema_block = f'<script type="application/ld+json">\n{schema_json}\n</script>'

        # Remove existing schema blocks
        content = re.sub(r'<script\s+type=["\']application/ld\+json["\'][^>]*>.*?</script>\s*', '', orig, flags=re.DOTALL)
        # Inject before </head>
        content = re.sub(r'(</head>)', f'{schema_block}\n\\1', content, count=1, flags=re.IGNORECASE)

        if content != orig:
            with open(f, "w", encoding="utf-8") as fp:
                fp.write(content)
            print(f"Applied detailed schema to {f}")
            updated_count += 1

    print(f"\nDone! Detailed schema successfully applied to {updated_count} files.")

if __name__ == "__main__":
    apply_to_all()
