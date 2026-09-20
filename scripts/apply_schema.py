import os
import re
import json
import glob

BASE_ORG = {
    "@type": [
        "EducationalOrganization",
        "LocalBusiness"
    ],
    "@id": "https://quickartphotography.in/#academy",
    "name": "Quick Art Photography Academy",
    "alternateName": [
        "Quick Art Photography",
        "Quick Art Academy"
    ],
    "url": "https://quickartphotography.in/",
    "logo": {
        "@type": "ImageObject",
        "url": "https://quickartphotography.in/home-assets/ec55a6be3747a9.webp"
    },
    "image": "https://quickartphotography.in/assets/editing-timeline.jpg",
    "description": "Quick Art Photography Academy in Siwan, Bihar offers offline and online video editing, wedding filmmaking, album design, website design and digital marketing courses in Hindi.",
    "telephone": "+919939800780",
    "email": "support@quickartphotography.in",
    "priceRange": "₹₹",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "Ayodhya Puri, Near Lalit Bus Stand",
        "addressLocality": "Siwan",
        "addressRegion": "Bihar",
        "postalCode": "841226",
        "addressCountry": "IN"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": "REPLACE_EXACT_LAT_FROM_GOOGLE_MAPS",
        "longitude": "REPLACE_EXACT_LNG_FROM_GOOGLE_MAPS"
    },
    "hasMap": "https://maps.app.goo.gl/eRkAc7kia1D1s1zQ7",
    "openingHoursSpecification": [
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
            ],
            "opens": "09:00",
            "closes": "19:00"
        }
    ],
    "areaServed": [
        {"@type": "City", "name": "Siwan"},
        {"@type": "City", "name": "Gopalganj"},
        {"@type": "City", "name": "Chhapra"},
        {"@type": "City", "name": "Patna"},
        {"@type": "State", "name": "Bihar"},
        {"@type": "Country", "name": "India"}
    ],
    "founder": {
        "@type": "Person",
        "@id": "https://quickartphotography.in/#anil-sharma",
        "name": "Anil Sharma",
        "jobTitle": "Founder & Lead Mentor",
        "url": "https://quickartphotography.in/about-us/"
    },
    "sameAs": [
        "https://maps.app.goo.gl/eRkAc7kia1D1s1zQ7",
        "https://www.youtube.com/@QuickartPhotographyAcademy",
        "https://www.instagram.com/quick.art.photography.academy/",
        "https://www.facebook.com/Quick.art.Photography.Academy",
        "https://play.google.com/store/apps/details?id=com.lmwkkjh799.classes"
    ],
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "1800",
        "reviewCount": "1800",
        "bestRating": "5",
        "worstRating": "1"
    }
}

BASE_WEBSITE = {
    "@type": "WebSite",
    "@id": "https://quickartphotography.in/#website",
    "url": "https://quickartphotography.in/",
    "name": "Quick Art Photography Academy",
    "alternateName": "Quick Art Photography",
    "inLanguage": "en-IN",
    "publisher": {
        "@id": "https://quickartphotography.in/#academy"
    }
}

ONLINE_COURSES = {
    "online/premiere-pro-course/index.html": {
        "id": "https://quickartphotography.in/online/premiere-pro-course/#course",
        "name": "Adobe Premiere Pro Course in Hindi",
        "description": "Online Adobe Premiere Pro course in Hindi: wedding editing, AI workflow, multicam sync and Lumetri colour grading with mentor Anil Sharma.",
        "url": "https://quickartphotography.in/online/premiere-pro-course/",
        "price": "4999",
        "duration": "PT18H",
        "teaches": ["Adobe Premiere Pro", "Video editing", "Multicam editing", "Lumetri colour grading"]
    },
    "online/edius-course/index.html": {
        "id": "https://quickartphotography.in/online/edius-course/#course",
        "name": "EDIUS Pro Fast Wedding Editing Course",
        "description": "EDIUS video editing course in Hindi: fast wedding editing, multicam sync, titles, colour correction and client delivery with mentor Anil Sharma.",
        "url": "https://quickartphotography.in/online/edius-course/",
        "price": "3999",
        "duration": "PT14H",
        "teaches": ["EDIUS Pro", "Wedding video editing", "Multicam timeline editing", "Export and client delivery"]
    },
    "online/davinci-resolve-course/index.html": {
        "id": "https://quickartphotography.in/online/davinci-resolve-course/#course",
        "name": "DaVinci Resolve Course in Hindi – Color Grading",
        "description": "DaVinci Resolve course in Hindi: node-based colour grading, skin-tone matching and cinematic wedding looks with mentor Anil Sharma.",
        "url": "https://quickartphotography.in/online/davinci-resolve-course/",
        "price": "4999",
        "duration": "PT16H",
        "teaches": ["DaVinci Resolve", "Color grading", "Node tree workflow", "Cinematic wedding grading"]
    },
    "online/cinematic-editing-course/index.html": {
        "id": "https://quickartphotography.in/online/cinematic-editing-course/#course",
        "name": "Cinematic Wedding Video Editing Masterclass",
        "description": "Learn cinematic wedding video editing in Hindi: teasers, highlight films, reels, sound design and colour finishing with mentor Anil Sharma.",
        "url": "https://quickartphotography.in/online/cinematic-editing-course/",
        "price": "5999",
        "duration": "PT20H",
        "teaches": ["Cinematic wedding editing", "Teaser creation", "Sound design", "Story pacing"]
    },
    "online/album-design-course/index.html": {
        "id": "https://quickartphotography.in/online/album-design-course/#course",
        "name": "Wedding Album Design Course in Photoshop",
        "description": "Album designing course online in Hindi: wedding & photo album design in Photoshop, Karizma and Canvera layouts, retouching and print-ready export.",
        "url": "https://quickartphotography.in/online/album-design-course/",
        "price": "3499",
        "duration": "PT12H",
        "teaches": ["Adobe Photoshop", "Wedding album design", "Photo retouching", "Karizma and Canvera layout"]
    },
    "online/pre-wedding-shoot-course/index.html": {
        "id": "https://quickartphotography.in/online/pre-wedding-shoot-course/#course",
        "name": "Pre-Wedding Shoot & Filmmaking Masterclass",
        "description": "Pre-wedding shoot course in Hindi: couple posing, golden-hour light, gimbal moves and teaser editing with mentor Anil Sharma.",
        "url": "https://quickartphotography.in/online/pre-wedding-shoot-course/",
        "price": "3999",
        "duration": "PT14H",
        "teaches": ["Pre-wedding photography", "Cinematography", "Couple posing", "Gimbal movement"]
    },
    "online/website-design-course/index.html": {
        "id": "https://quickartphotography.in/online/website-design-course/#course",
        "name": "Website Design Course in Hindi",
        "description": "Website design course in Hindi with no coding: WordPress, Elementor, portfolio galleries and Google SEO for photographers.",
        "url": "https://quickartphotography.in/online/website-design-course/",
        "price": "2999",
        "duration": "PT10H",
        "teaches": ["WordPress", "Elementor", "Photography portfolio design", "Local SEO"]
    },
    "online/digital-marketing-course/index.html": {
        "id": "https://quickartphotography.in/online/digital-marketing-course/#course",
        "name": "Digital Marketing for Photographers & Studios",
        "description": "Digital marketing course in Hindi for photographers: Facebook & Instagram ads, Google local SEO and WhatsApp funnels to get wedding enquiries.",
        "url": "https://quickartphotography.in/online/digital-marketing-course/",
        "price": "3499",
        "duration": "PT12H",
        "teaches": ["Facebook Ads", "Instagram marketing", "Lead generation", "Local business SEO"]
    },
    "online/automation-course/index.html": {
        "id": "https://quickartphotography.in/online/automation-course/#course",
        "name": "Studio Automation & AI CRM Masterclass",
        "description": "WhatsApp automation course in Hindi for studios: auto replies, instant quotes, follow-ups, payment reminders and AI CRM with mentor Anil Sharma.",
        "url": "https://quickartphotography.in/online/automation-course/",
        "price": "2999",
        "duration": "PT8H",
        "teaches": ["WhatsApp automation", "Studio CRM", "Automated quotations", "Client follow-ups"]
    }
}

OFFLINE_COURSES = {
    "courses/video-editing/index.html": {
        "id": "https://quickartphotography.in/courses/video-editing/#course",
        "name": "Video Editing Course in Siwan (6-Week Offline)",
        "description": "Six-week offline video editing course in Siwan covering EDIUS, Premiere Pro, DaVinci Resolve, cinematic wedding storytelling, audio and a final wedding film.",
        "url": "https://quickartphotography.in/courses/video-editing/",
        "duration": "P6W",
        "teaches": ["Video editing", "EDIUS", "Adobe Premiere Pro", "DaVinci Resolve", "Wedding video editing"]
    },
    "courses/album-design/index.html": {
        "id": "https://quickartphotography.in/courses/album-design/#course",
        "name": "Wedding Album Design Course in Siwan (4-Week Offline)",
        "description": "Four-week hands-on photo album design course in Siwan covering Photoshop retouching, Karizma layouts, Canvera sizing and print-ready export.",
        "url": "https://quickartphotography.in/courses/album-design/",
        "duration": "P4W",
        "teaches": ["Photo album design", "Photoshop retouching", "Karizma layout design", "Print color management"]
    },
    "courses/ai-wedding-filmmaking/index.html": {
        "id": "https://quickartphotography.in/courses/ai-wedding-filmmaking/#course",
        "name": "AI Wedding Filmmaking Course in Siwan",
        "description": "Comprehensive practical course in AI-assisted video editing, prompt-driven color grading, dialogue enhancement and wedding cinematography in Siwan.",
        "url": "https://quickartphotography.in/courses/ai-wedding-filmmaking/",
        "duration": "P14W",
        "teaches": ["AI video editing", "Wedding filmmaking", "Dialogue clean-up", "AI color grading"]
    },
    "master-class/index.html": {
        "id": "https://quickartphotography.in/master-class/#course",
        "name": "14-Week Wedding Filmmaking Master Class in Siwan",
        "description": "Fourteen-week complete offline master class in Siwan covering cinematography, camera operation, video editing, album design, color grading and studio business.",
        "url": "https://quickartphotography.in/master-class/",
        "duration": "P14W",
        "teaches": ["Cinematography", "Video editing", "Album design", "Color grading", "Studio business"]
    }
}

def extract_existing_faqs(html):
    faqs = []
    # Try finding FAQPage in existing script
    script_match = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
    if script_match:
        try:
            data = json.loads(script_match.group(1))
            nodes = data.get("@graph", [data]) if isinstance(data, dict) else []
            for n in nodes:
                if isinstance(n, dict) and n.get("@type") == "FAQPage":
                    faqs = n.get("mainEntity", [])
                    break
        except Exception:
            pass

    # If no faqs found in schema, extract from HTML details
    if not faqs:
        items = re.findall(r'<details\b[^>]*class=["\'][^"\']*faq[^"\']*["\'][^>]*>.*?<summary[^>]*>(.*?)</summary>.*?<div class=["\'][^"\']*faq-ans[^"\']*["\'][^>]*>(.*?)</div>', html, re.DOTALL | re.IGNORECASE)
        for q_raw, a_raw in items:
            q_clean = re.sub(r'<[^>]+>', '', q_raw).replace('+', '').strip()
            a_clean = re.sub(r'<[^>]+>', '', a_raw).strip()
            if q_clean and a_clean:
                faqs.append({
                    "@type": "Question",
                    "name": q_clean,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": a_clean
                    }
                })
    return faqs

def generate_schema_for_page(rel_path, html):
    graph = [BASE_ORG, BASE_WEBSITE]

    # 1. Homepage
    if rel_path == "index.html":
        graph.append({
            "@type": "WebPage",
            "@id": "https://quickartphotography.in/#webpage",
            "url": "https://quickartphotography.in/",
            "name": "Quick Art Photography Academy – Video Editing Course Siwan",
            "description": "Quick Art Photography Academy, Siwan: best video editing course in Bihar. Photo & video editing, Premiere Pro, DaVinci, EDIUS. Rated 4.9/5 by 1,800+ students.",
            "inLanguage": "en-IN",
            "isPartOf": {"@id": "https://quickartphotography.in/#website"},
            "about": {"@id": "https://quickartphotography.in/#academy"},
            "primaryImageOfPage": {
                "@type": "ImageObject",
                "url": "https://quickartphotography.in/assets/editing-timeline.jpg"
            }
        })
        # Add 3 FAQs from E1
        home_faqs = [
            {
                "@type": "Question",
                "name": "Siwan me video editing course ki fees kitni hai?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Quick Art Photography Academy me video editing course ki complete fee details, batch timing aur hostel facility ki jankari ke liye aap hume call (+91 9939800780) karein ya campus visit karke free demo class attend karein."
                }
            },
            {
                "@type": "Question",
                "name": "Kya Patna, Chhapra aur Gopalganj ke students aa sakte hain?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Haan, hamare offline classes me Siwan ke alawa Gopalganj, Chhapra, Patna aur pure Bihar se students aate hain. Outstation students ke liye 100% free hostel aur rehne ki suvidha uplabdh hai."
                }
            },
            {
                "@type": "Question",
                "name": "Kya photo aur video editing dono ek course me sikhaye jate hain?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Haan, hamare comprehensive offline programs (jaise 14-Week Master Class aur editing modules) me Photoshop photo retouching, album design ke sath-sath EDIUS, Premiere Pro aur DaVinci Resolve par video editing sikhayi jati hai."
                }
            }
        ]
        graph.append({
            "@type": "FAQPage",
            "mainEntity": home_faqs
        })

    # 2. Offline Course Pages
    elif rel_path in OFFLINE_COURSES:
        cfg = OFFLINE_COURSES[rel_path]
        course_node = {
            "@type": "Course",
            "@id": cfg["id"],
            "name": cfg["name"],
            "description": cfg["description"],
            "url": cfg["url"],
            "provider": {"@id": "https://quickartphotography.in/#academy"},
            "inLanguage": "hi",
            "educationalLevel": "Beginner to Advanced",
            "teaches": cfg["teaches"],
            "timeRequired": cfg["duration"],
            "offers": {
                "@type": "Offer",
                "category": "Paid",
                "priceCurrency": "INR",
                "price": "REPLACE_WITH_REAL_FEE",
                "availability": "https://schema.org/InStock",
                "url": cfg["url"]
            },
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "onsite",
                "courseWorkload": cfg["duration"],
                "location": {"@id": "https://quickartphotography.in/#academy"},
                "instructor": {"@id": "https://quickartphotography.in/#anil-sharma"}
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1800",
                "reviewCount": "1800",
                "bestRating": "5",
                "worstRating": "1"
            }
        }
        graph.append(course_node)

        breadcrumb = {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://quickartphotography.in/"},
                {"@type": "ListItem", "position": 2, "name": "Courses", "item": "https://quickartphotography.in/courses/"},
                {"@type": "ListItem", "position": 3, "name": cfg["name"], "item": cfg["url"]}
            ]
        }
        graph.append(breadcrumb)

        # check for existing or page faqs
        faqs = extract_existing_faqs(html)
        if faqs:
            graph.append({"@type": "FAQPage", "mainEntity": faqs})

    # 3. Online Course Pages
    elif rel_path in ONLINE_COURSES:
        cfg = ONLINE_COURSES[rel_path]
        course_node = {
            "@type": "Course",
            "@id": cfg["id"],
            "name": cfg["name"],
            "description": cfg["description"],
            "url": cfg["url"],
            "provider": {"@id": "https://quickartphotography.in/#academy"},
            "inLanguage": "hi",
            "educationalLevel": "Beginner to Advanced",
            "teaches": cfg["teaches"],
            "educationalCredentialAwarded": "Certificate of Completion",
            "timeRequired": cfg["duration"],
            "offers": {
                "@type": "Offer",
                "category": "Paid",
                "price": cfg["price"],
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock",
                "url": cfg["url"]
            },
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "courseWorkload": cfg["duration"],
                "instructor": {"@id": "https://quickartphotography.in/#anil-sharma"}
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1800",
                "reviewCount": "1800",
                "bestRating": "5",
                "worstRating": "1"
            }
        }
        graph.append(course_node)

        # C3 BUG FIX: breadcrumb 2 is https://quickartphotography.in/online/
        breadcrumb = {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://quickartphotography.in/"},
                {"@type": "ListItem", "position": 2, "name": "Online Courses", "item": "https://quickartphotography.in/online/"},
                {"@type": "ListItem", "position": 3, "name": cfg["name"], "item": cfg["url"]}
            ]
        }
        graph.append(breadcrumb)

        faqs = extract_existing_faqs(html)
        if faqs:
            graph.append({"@type": "FAQPage", "mainEntity": faqs})

    # 4. /online/ Hub Page
    elif rel_path == "online/index.html":
        # Keep ItemList + Breadcrumb
        items = []
        for idx, (c_path, c_info) in enumerate(ONLINE_COURSES.items(), 1):
            items.append({
                "@type": "ListItem",
                "position": idx,
                "item": {
                    "@type": "Course",
                    "name": c_info["name"],
                    "description": c_info["description"],
                    "url": c_info["url"]
                }
            })
        graph.append({
            "@type": "ItemList",
            "itemListElement": items
        })
        graph.append({
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://quickartphotography.in/"},
                {"@type": "ListItem", "position": 2, "name": "Online Courses", "item": "https://quickartphotography.in/online/"}
            ]
        })

    # 5. /courses/ Hub Page
    elif rel_path == "courses/index.html":
        graph.append({
            "@type": "CollectionPage",
            "@id": "https://quickartphotography.in/courses/#webpage",
            "url": "https://quickartphotography.in/courses/",
            "name": "Photography & Video Editing Courses in Siwan | Quick Art",
            "description": "Explore video editing, album design, AI wedding filmmaking and the 14-week Master Class at Quick Art Photography Academy in Siwan, Bihar.",
            "isPartOf": {"@id": "https://quickartphotography.in/#website"}
        })
        graph.append({
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://quickartphotography.in/"},
                {"@type": "ListItem", "position": 2, "name": "Courses", "item": "https://quickartphotography.in/courses/"}
            ]
        })

    # 6. /about-us/
    elif rel_path == "about-us/index.html":
        graph.append({
            "@type": "AboutPage",
            "@id": "https://quickartphotography.in/about-us/#webpage",
            "url": "https://quickartphotography.in/about-us/",
            "name": "About Quick Art Photography Academy | Anil Sharma, Siwan",
            "description": "Meet founder Anil Sharma and Quick Art Photography Academy: practical filmmaking, video editing and album design training in Siwan, Bihar.",
            "mainEntity": {"@id": "https://quickartphotography.in/#academy"},
            "isPartOf": {"@id": "https://quickartphotography.in/#website"}
        })
        graph.append({
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://quickartphotography.in/"},
                {"@type": "ListItem", "position": 2, "name": "About Us", "item": "https://quickartphotography.in/about-us/"}
            ]
        })

    # 7. /contact-us/
    elif rel_path == "contact-us/index.html":
        graph.append({
            "@type": "ContactPage",
            "@id": "https://quickartphotography.in/contact-us/#webpage",
            "url": "https://quickartphotography.in/contact-us/",
            "name": "Contact Quick Art Photography Academy | Siwan – Free Demo",
            "description": "Call +91 9939800780 or visit Quick Art Photography Academy, Ayodhya Puri, Siwan for course details, fees, a free demo class and batch dates.",
            "mainEntity": {"@id": "https://quickartphotography.in/#academy"},
            "isPartOf": {"@id": "https://quickartphotography.in/#website"}
        })
        graph.append({
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://quickartphotography.in/"},
                {"@type": "ListItem", "position": 2, "name": "Contact Us", "item": "https://quickartphotography.in/contact-us/"}
            ]
        })

    # 8. /blog/ Index
    elif rel_path == "blog/index.html":
        graph.append({
            "@type": "CollectionPage",
            "@id": "https://quickartphotography.in/blog/#webpage",
            "url": "https://quickartphotography.in/blog/",
            "name": "Video Editing & Filmmaking Guides | Quick Art Blog",
            "description": "Read practical guides to video editing workflows, AI-assisted wedding production and freelance portfolio development from Quick Art Photography Academy.",
            "isPartOf": {"@id": "https://quickartphotography.in/#website"}
        })
        graph.append({
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://quickartphotography.in/"},
                {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://quickartphotography.in/blog/"}
            ]
        })

    # 9. Blog Post Pages
    elif rel_path.startswith("blog/") and rel_path != "blog/index.html":
        slug = rel_path.split("/")[1]
        t_match = re.search(r'<title>(.*?)</title>', html, re.DOTALL)
        d_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html, re.DOTALL)
        h1_match = re.search(r'<h1\b[^>]*>(.*?)</h1>', html, re.DOTALL)
        headline = re.sub(r'<[^>]+>', '', h1_match.group(1)).strip() if h1_match else (t_match.group(1).strip() if t_match else "Blog Post")
        desc = d_match.group(1).strip() if d_match else ""

        # Extract dates if present
        date_pub = "REPLACE_YYYY-MM-DD"
        date_mod = "REPLACE_YYYY-MM-DD"
        date_match = re.search(r'"datePublished":\s*"([^"]+)"', html)
        if date_match:
            date_pub = date_match.group(1)
        date_m_match = re.search(r'"dateModified":\s*"([^"]+)"', html)
        if date_m_match:
            date_mod = date_m_match.group(1)

        graph.append({
            "@type": "BlogPosting",
            "headline": headline[:110],
            "description": desc,
            "image": "https://quickartphotography.in/assets/editing-timeline.jpg",
            "datePublished": date_pub,
            "dateModified": date_mod,
            "author": {"@id": "https://quickartphotography.in/#anil-sharma"},
            "publisher": {"@id": "https://quickartphotography.in/#academy"},
            "mainEntityOfPage": f"https://quickartphotography.in/blog/{slug}/"
        })
        graph.append({
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://quickartphotography.in/"},
                {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://quickartphotography.in/blog/"},
                {"@type": "ListItem", "position": 3, "name": headline[:60], "item": f"https://quickartphotography.in/blog/{slug}/"}
            ]
        })

    # 10. Policy & other pages
    else:
        page_name = rel_path.replace("/index.html", "").replace(".html", "").replace("-", " ").title()
        graph.append({
            "@type": "WebPage",
            "url": f"https://quickartphotography.in/{rel_path.replace('index.html', '')}",
            "name": page_name,
            "isPartOf": {"@id": "https://quickartphotography.in/#website"}
        })

    return {
        "@context": "https://schema.org",
        "@graph": graph
    }

def apply_schema_to_file(rel_path):
    if not os.path.exists(rel_path):
        return False
    with open(rel_path, "r", encoding="utf-8") as f:
        html = f.read()

    orig_html = html
    # Generate schema
    schema_dict = generate_schema_for_page(rel_path, html)
    schema_json = json.dumps(schema_dict, indent=2, ensure_ascii=False)
    schema_tag = f'<script type="application/ld+json">\n{schema_json}\n</script>'

    # Remove all existing <script type="application/ld+json">...</script>
    html = re.sub(r'<script\s+type=["\']application/ld\+json["\'][^>]*>.*?</script>', '', html, flags=re.DOTALL)

    # Insert exactly ONE schema before </head>
    html = re.sub(r'(</head>)', f'{schema_tag}\n\\1', html, count=1, flags=re.IGNORECASE)

    if html != orig_html:
        with open(rel_path, "w", encoding="utf-8") as f:
            f.write(html)
        return True
    return False

if __name__ == "__main__":
    files = sorted(glob.glob("**/*.html", recursive=True))
    # Exclude non-indexable admin and redirect stubs from schema
    exclude = {
        "admin.html",
        "adobe-premiere-pro-course/index.html",
        "best-davinci-resolve-online-course-in-hindi/index.html",
        "join-video-editing-album-design-course/index.html",
        "portal/signup.html",
        "portal/email-template-preview.html"
    }
    updated = 0
    for f in files:
        if f in exclude:
            continue
        if apply_schema_to_file(f):
            print(f"Applied unified @graph schema to {f}")
            updated += 1
    print(f"Schema application complete. Updated {updated} files.")
