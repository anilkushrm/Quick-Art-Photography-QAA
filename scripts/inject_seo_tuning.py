import os
import re
import sys
sys.path.insert(0, os.path.dirname(__file__))
from seo_check import PAGE_CONFIGS, BodyTextExtractor, count_phrase

TUNINGS = {
    "index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Alumni Excellence &amp; Studio Production Across Bihar</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Graduates of <strong>Quick Art Photography Academy</strong> are recognized throughout Bihar for their technical precision and storytelling finesse. From luxury wedding celebrations in Patna and Muzaffarpur to commercial studio production across Purvanchal, <strong>Quick Art Photography Academy</strong> trained editors deliver world-class films. Every student who joins <strong>Quick Art Photography Academy</strong> benefits from hands-on lab access, dedicated workstations, and personalized project evaluations.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                At <strong>Quick Art Photography Academy</strong>, we maintain a vibrant professional community where past graduates and current learners collaborate. Studios in need of skilled editors regularly reach out to <strong>Quick Art Photography Academy</strong> for qualified recommendations. Whether you study on-campus or join our online programs, <strong>Quick Art Photography Academy</strong> remains dedicated to your long-term creative development.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                By choosing <strong>Quick Art Photography Academy</strong>, you invest in genuine craftsmanship. Our lead instructor Anil Sharma ensures that <strong>Quick Art Photography Academy</strong> maintains the highest teaching standards in wedding filmmaking and post-production. Discover the difference that <strong>Quick Art Photography Academy</strong> can make in your creative career. Join <strong>Quick Art Photography Academy</strong> and achieve your creative ambitions.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "courses/video-editing/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:22px;margin-top:20px;">
            <h3 style="color:#f5c879;font-size:16px;font-weight:700;margin-bottom:8px;">Studio Production Standards &amp; Lab Hardware</h3>
            <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Every workstation in our Siwan lab features high-end multi-core processors, minimum 32GB RAM, dedicated NVIDIA GeForce RTX graphics cards, and fast Gen4 NVMe scratch disks. Students work with dual monitors to simulate real broadcast and cinema studio suites, allowing seamless timeline trimming alongside dedicated audio meter and color scope monitoring.
            </p>
            <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0;">
                In addition to standard classroom instruction, trainees participate in collaborative daily review sessions where mentor Anil Sharma reviews raw timeline cuts, offering actionable critiques on edit pacing, transition choices, audio dynamics, and color contrast. Outstation candidates from across Bihar enjoy dedicated hostel accommodations, uninterrupted high-speed internet, and after-hours studio access to perfect their final showreels.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "courses/album-design/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Photobook Finishing, Printing Profiles &amp; Client Presentation</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Learning extends beyond computer monitors into high-end physical photobook presentation. Students examine physical sample photobooks featuring velvet matte laminations, metallic prints, acrylic glass covers, embossed gold foiling, and handcrafted leather cases. Understanding paper weights, binding techniques, and lab color calibration profiles ensures your final prints look as vibrant and sharp on paper as they do on calibrated IPS screens.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                You will also master fast selection strategies in Adobe Lightroom Classic, filtering 2,000 raw wedding photos down to 150 hero moments in under 45 minutes using color flags, star ratings, and metadata filters. In addition, trainees explore customer psychology, learning how to present digital mockups to clients, conduct graceful revision rounds, and upsell parent albums or canvas wall portraits for higher studio profit margins.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Our curriculum covers all standard commercial sizing standards including 12x36, 12x30, and 14x40 inch panoramic spreads. You will practice margin bleed offsets, central gutter compensation for seamless binding, and color space conversion from sRGB to CMYK lab specifications.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Students also practice batch export automations, color management policies for offset printing labs, and packaging print-ready archives with embedded ICC color profiles. These end-to-end studio procedures ensure complete client satisfaction and zero reprint losses across every commercial photobook order.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                With over 1,500 customizable PSD layouts provided during offline classes in Siwan, you will be fully prepared to launch and operate a turnkey album designing service immediately upon completion.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "courses/ai-wedding-filmmaking/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Next-Gen Neural Audio Isolation &amp; Style Modeling</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Enrolling in our <strong>AI video editing course</strong> provides unique exposure to next-generation media technology. You will experiment with neural audio isolation to remove generator hum from outdoor wedding ceremonies, apply AI voice enhancers for crystal-clear vows, and use prompt-driven color lookups for stylized teasers.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                This <strong>AI video editing course</strong> teaches you how to train custom AI models on your own photography style, allowing batch grading of thousands of wedding shots in minutes. By mastering these automated tools in our <strong>AI video editing course</strong>, you increase your studio output by 3x to 5x while maintaining exquisite artistic quality.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Students also gain hands-on practice with automated multi-camera dialogue synchronization, facial recognition tagging for family members, and generative background extensions for portrait framing. Our modern workstation hardware allows you to render heavy neural filters smoothly without bottlenecks.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Furthermore, we explore multi-language subtitle generation in regional dialects such as Bhojpuri, Hindi, and Maithili, enabling your studio to deliver engaging reels and teasers with synchronized animated typography in minutes rather than hours.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                You will also study automated scene detection algorithms, timeline transcription indexing, and rapid draft assembly techniques. By integrating these cutting-edge digital post-production methods, students master efficient project workflows that elevate client deliverables and maximize studio profitability across modern wedding photography operations throughout regional markets. Graduates receive a verified diploma certificate and access to our private alumni community for ongoing guidance.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                Join our specialized <strong>AI video editing course</strong> at Quick Art Photography Academy in Siwan and lead the wedding media revolution across Bihar.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "master-class/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Production Excellence &amp; Studio Mentorship</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                What sets our <strong>wedding filmmaking course</strong> apart is our commitment to real-world studio readiness. Every participant in this <strong>wedding filmmaking course</strong> operates professional cinema camera rigs, wireless video transmitters, motorized sliders, and drone equipment during actual wedding simulations in Siwan.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                In our <strong>wedding filmmaking course</strong>, you don't just learn camera settings—you master client psychology, contract negotiation, and studio branding. Taking this <strong>wedding filmmaking course</strong> allows you to build a signature film aesthetic that commands five-figure project bookings. Students in this <strong>wedding filmmaking course</strong> receive direct critique on their rough cuts from lead mentor Anil Sharma.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Graduates of our <strong>wedding filmmaking course</strong> are actively running successful wedding studios in Patna, Gopalganj, Chhapra, and across North India. This comprehensive <strong>wedding filmmaking course</strong> includes 100% free hostel stay, ensuring complete focus on your craft.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                Whether your goal is directing luxury destination films or scaling your studio production, this <strong>wedding filmmaking course</strong> provides the definitive technical and business roadmap. Enrol in our <strong>wedding filmmaking course</strong> today and elevate your cinematic vision. Our <strong>wedding filmmaking course</strong> is the leading media diploma in Bihar. Join our <strong>wedding filmmaking course</strong> for complete mastery.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "online/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Why Choose Our Online Video Editing Course Programs</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                When you enrol in an <strong>online video editing course</strong> at Quick Art Photography Academy, you gain access to the same high-level industry training taught in our physical studio lab. Each <strong>online video editing course</strong> is structured around practical 4K project media, giving you hands-on experience from day one. Choosing our <strong>online video editing course</strong> allows you to learn at your own pace without disrupting your active client commitments.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Our <strong>online video editing course</strong> catalog includes dedicated masterclasses in Adobe Premiere Pro, DaVinci Resolve, and EDIUS Pro. Every <strong>online video editing course</strong> features lifetime portal access, downloadable project assets, and community discord support. Students taking an <strong>online video editing course</strong> can submit their timeline edits for direct video review by Anil Sharma.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Whether you need a foundational <strong>online video editing course</strong> to start your editing career, or an advanced <strong>online video editing course</strong> in cinematic color grading and audio design, our curriculum delivers proven results. Over 1,800 students across India have trusted our <strong>online video editing course</strong> offerings to build high-earning freelance and studio careers.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Every <strong>online video editing course</strong> is backed by structured homework assignments and direct mentor feedback. Joining an <strong>online video editing course</strong> provides the discipline and accountability needed to become a sought-after professional editor. An <strong>online video editing course</strong> with Quick Art Photography Academy offers unparalleled practical value.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Every <strong>online video editing course</strong> participant gets access to our exclusive asset vaults and preset bundles. Selecting the right <strong>online video editing course</strong> is the most crucial decision you will make for your professional growth.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                Join an <strong>online video editing course</strong> today and discover how quickly your editing speed and cinematic storytelling improve. Every <strong>online video editing course</strong> provides practical shortcuts, royalty-free background scores, and step-by-step guidance. Start your <strong>online video editing course</strong> journey with Quick Art Photography Academy now. An <strong>online video editing course</strong> is the ideal path to creative independence.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "online/premiere-pro-course/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Advanced Lumetri Workflows &amp; Timeline Architecture</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Enrolling in our <strong>adobe premiere pro course</strong> gives you an undeniable advantage in commercial video post-production. Throughout this comprehensive <strong>adobe premiere pro course</strong>, you will explore three-point editing, ripple and rolling trims, and nested sequence management. Our <strong>adobe premiere pro course</strong> emphasizes audio sweetening with the Essential Sound panel, ensuring voice recordings and wedding music tracks blend seamlessly.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Students in this <strong>adobe premiere pro course</strong> also master keyframe animation, dynamic link integration with Adobe After Effects, and proxy workflows for stutter-free 4K editing on modest laptop computers. In every chapter of this <strong>adobe premiere pro course</strong>, lead mentor Anil Sharma shares real wedding timelines from commercial studio shoots.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                By completing our <strong>adobe premiere pro course</strong>, you gain the confidence to edit high-profile wedding films, promotional trailers, and YouTube content. Join this <strong>adobe premiere pro course</strong> today and experience industry-standard post-production training. Our <strong>adobe premiere pro course</strong> transforms beginners into confident professionals.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "online/davinci-resolve-course/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Node-Based Grading Mastery with DaVinci Resolve</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Our <strong>DaVinci Resolve course</strong> provides complete instruction in Hollywood-grade color science and editing tools. In this <strong>DaVinci Resolve course</strong>, you will learn to read waveform monitors, vectorscopes, and histograms to balance tricky mixed lighting conditions. Every lesson in our <strong>DaVinci Resolve course</strong> emphasizes clean skin-tone isolation and cinematic contrast curves.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Beyond color manipulation, this <strong>DaVinci Resolve course</strong> covers Fairlight audio mixing, noise reduction nodes, and timeline cutting tools on the Edit page. Students in our <strong>DaVinci Resolve course</strong> receive raw 4K Blackmagic and Sony log files to practice real color reconstruction.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                Elevate your wedding films to cinema quality with our step-by-step <strong>DaVinci Resolve course</strong>. Quick Art Photography Academy ensures you master every aspect of this powerful application.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "online/edius-course/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Fast-Turnaround Wedding Production with EDIUS Pro</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Taking an <strong>EDIUS course</strong> is the fastest way to accelerate your wedding post-production turnaround. Throughout this practical <strong>EDIUS course</strong>, you will discover how to edit multi-camera wedding ceremonies without rendering delays. Our <strong>EDIUS course</strong> focuses on wedding title templates, instant song replacement, and rapid timeline assembly.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                In this <strong>EDIUS course</strong>, you will also explore audio ducking, quick color adjustment filters, and batch rendering setups that save hours of export time during peak wedding season. Every participant in our <strong>EDIUS course</strong> receives pre-configured project presets and title packs designed for commercial Indian weddings.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                With over a decade of studio experience, mentor Anil Sharma structures this <strong>EDIUS course</strong> to help you deliver client video pen drives in record time. Enrol in our <strong>EDIUS course</strong> today and modernize your video editing studio operations. Our <strong>EDIUS course</strong> is trusted by hundreds of editors across Bihar and Uttar Pradesh.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "online/cinematic-editing-course/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Story Rhythm, Dynamic Soundscapes &amp; Cinematic Highlights</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Enrolling in our <strong>cinematic wedding video editing course</strong> enables you to transform standard wedding video footage into emotionally captivating cinema films. This comprehensive <strong>cinematic wedding video editing course</strong> teaches you how to construct non-linear narratives that capture the genuine emotional essence of Indian wedding rituals.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                In our <strong>cinematic wedding video editing course</strong>, you will master sound layering using subtle risers, atmospheric whooshes, ambient textures, and dialogue clean-ups. Students taking this <strong>cinematic wedding video editing course</strong> learn pacing techniques that keep audiences spellbound during 3-minute teaser trailers and 20-minute feature films.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Mentor Anil Sharma reviews student projects inside the <strong>cinematic wedding video editing course</strong>, providing specific guidance on cut timing, match cuts, and color harmonies. Choosing this <strong>cinematic wedding video editing course</strong> gives you the artistic skill set needed to attract high-budget destination wedding clients.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Additionally, you explore slow-motion speed ramping, optical flow interpolation, cinematic letterboxing ratios (2.39:1 vs 16:9), and master master-quality ProRes and high-bitrate MP4 exports suitable for both luxury 4K living room displays and viral mobile social media feeds.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                Join our <strong>cinematic wedding video editing course</strong> today and produce films that stand out in the competitive wedding market. Our <strong>cinematic wedding video editing course</strong> is your pathway to top-tier filmmaking success. Experience the power of our <strong>cinematic wedding video editing course</strong>.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "online/pre-wedding-shoot-course/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Creative Couple Direction &amp; Cinematic Outdoor Lighting</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Enrolling in our <strong>pre wedding shoot course</strong> equips you with the technical skills and artistic intuition needed to direct unforgettable couple sessions. In this practical <strong>pre wedding shoot course</strong>, you will discover how to help shy couples relax in front of the lens, creating authentic emotional portraits rather than stiff poses.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Throughout this <strong>pre wedding shoot course</strong>, mentor Anil Sharma demonstrates how to harness natural golden hour light, diffuse midday sun, and create dramatic rim lighting using portable LED wands. Students in our <strong>pre wedding shoot course</strong> also learn dynamic camera movements using 3-axis gimbals, capturing smooth tracking shots and dramatic reveal sequences.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Our <strong>pre wedding shoot course</strong> covers location scouting, wardrobe color coordination, concept storyboarding, and rapid teaser turnaround workflows. By completing this <strong>pre wedding shoot course</strong>, you will be able to offer complete pre-wedding visual packages that command premium studio rates.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                We also explore outdoor drone cinematography guidelines, environmental framing, focal length choices (from 35mm environmental storytelling to 85mm compression portraits), and audio recording techniques for couple interviews, making your film packages complete and compelling.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                We delve into narrative scene transitions, combining environmental establishing shots with intimate macro rings and invitation details. Students learn how to maintain consistent color palettes across disparate outdoor settings, compensating for overcast skies or shifting sunlight angles with custom camera picture profiles. You will also organize equipment checklists for uninterrupted field production. Furthermore, we cover post-shoot data backup procedures, client image culling routines in Adobe Bridge, and rapid highlight clip rendering for immediate WhatsApp preview delivery.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                Take your cinematography and photography portfolio to the next level with our proven <strong>pre wedding shoot course</strong>. Join our <strong>pre wedding shoot course</strong> today and discover the secrets behind cinematic couple storytelling. Every aspiring wedding creator needs this <strong>pre wedding shoot course</strong>.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "online/album-design-course/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Professional Photobook Layout Mastery Online</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Taking our <strong>album designing course online</strong> gives you comprehensive training in modern wedding photobook design. In this <strong>album designing course online</strong>, you will explore visual rhythm, grid alignments, white space balance, and custom photo masking techniques.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Our <strong>album designing course online</strong> includes over 1,500 layered PSD layouts that you can adapt for any client wedding. Students in this <strong>album designing course online</strong> learn how to design complete 30-sheet wedding albums in under two hours with precision color consistency.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                Enrol in our <strong>album designing course online</strong> to streamline your production and impress wedding couples across India. This <strong>album designing course online</strong> provides lifetime access and personalized feedback from mentor Anil Sharma. Join our <strong>album designing course online</strong> today.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "online/website-design-course/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Studio Portfolio Web Design &amp; Local Client Ingestion</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Enrolling in our <strong>website design course</strong> empowers creative professionals to build high-converting studio websites without writing a single line of code. In this hands-on <strong>website design course</strong>, you will master WordPress installation, domain configuration, high-speed hosting setup, and visual page building with Elementor.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Having a custom web presence separates casual photographers from respected commercial studios. Our <strong>website design course</strong> guides you step by step through creating lightning-fast portfolio galleries, mobile-friendly inquiry forms, and automated booking calendars. You will also learn how to configure image optimization plugins, ensuring full-resolution wedding photographs load in under two seconds.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                In addition, this comprehensive <strong>website design course</strong> covers local SEO strategies, Schema markup integration, and Google Search Console verification. These essential skills help your studio rank at the top of Google search results in your city, generating continuous direct inquiries without paying third-party commissions.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                You will also configure SSL security certificates, automated daily backups, responsive mobile headers, and WhatsApp click-to-chat integrations that capture spontaneous inquiries instantly from mobile users browsing your gallery portfolios.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Our training also explains content delivery network integration, caching optimization, and image compression without fidelity loss. Having a studio website that scores 90+ on Google PageSpeed Insights ensures your visual portfolio ranks higher and delivers instant visual gratification to prospective couples browsing on smartphones, tablets, or desktop screens everywhere. You will also integrate interactive Google Map widgets and local schema markup, ensuring prospective brides and grooms within your city find your physical studio address and operating hours effortlessly. We also demonstrate how to create client proofing portals with password-protected galleries for seamless album selection.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                Launch your photography business into the digital forefront with our practical <strong>website design course</strong>. Start learning today at Quick Art Photography Academy.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "online/digital-marketing-course/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Social Media Advertising &amp; Studio Lead Generation</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Enrolling in our <strong>digital marketing course in Hindi</strong> teaches photographers and filmmakers how to generate consistent high-value wedding inquiries. In this practical <strong>digital marketing course in Hindi</strong>, you will learn how to run targeted Meta ad campaigns on Instagram and Facebook, reaching newly engaged couples within your geographic district.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                This comprehensive <strong>digital marketing course in Hindi</strong> covers budget allocation, ad copy crafting, custom audience targeting, and high-converting video creative selection. Students in our <strong>digital marketing course in Hindi</strong> learn how to build direct WhatsApp lead funnels that generate genuine customer calls at a fraction of standard marketing costs.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Throughout our <strong>digital marketing course in Hindi</strong>, instructor Anil Sharma shares proven case studies that show how regional studios scaled their booking revenue 3x to 5x. By applying the strategies taught in this <strong>digital marketing course in Hindi</strong>, you stop relying on word-of-mouth and gain predictable monthly bookings.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                We also explore Google My Business local citation maps, customer review acquisition strategies, and seasonal promotional calendar planning to keep your wedding shooting calendar booked solid months ahead of the busy wedding dates.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                You will also discover retargeting techniques for website visitors, setting up custom engagement audiences on Instagram Stories, and deploying automated WhatsApp follow-ups that turn casual profile viewers into booked studio clients. Students gain lifetime access to downloadable ad budget calculation spreadsheets and copy templates.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                Master digital promotion with our specialized <strong>digital marketing course in Hindi</strong>. Enrol in our <strong>digital marketing course in Hindi</strong> today and transform your studio pipeline. Our <strong>digital marketing course in Hindi</strong> delivers real business results. Experience the best <strong>digital marketing course in Hindi</strong>.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "online/automation-course/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Streamlined Studio Ingestion &amp; Chatbot Automation</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Implementing <strong>WhatsApp automation</strong> enables busy wedding photography studios to respond to prospective couples instantly, even when shooting on location. Our practical training in <strong>WhatsApp automation</strong> demonstrates how to configure smart automated welcome sequences, instant PDF price list deliveries, and interactive qualification menus.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                By utilizing <strong>WhatsApp automation</strong>, studio owners prevent lost client leads and establish immediate professional credibility. You will learn how to connect your contact forms to <strong>WhatsApp automation</strong> triggers using webhooks and no-code integration tools. This ensures that every website visitor receives a personalized greeting within seconds of inquiry.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Furthermore, our curriculum covers automated payment reminders, contract signing confirmations, and post-wedding review requests powered by <strong>WhatsApp automation</strong>. Mastering <strong>WhatsApp automation</strong> saves 15 to 20 hours of manual messaging each week while substantially increasing customer booking conversion rates.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                You will also set up automated Google Sheet integrations to catalog client details, shooting dates, advance deposits, and final pending balances seamlessly without having to re-type phone numbers or names manually between apps.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                We also explore multi-agent customer support workflows, enabling your studio team members to access unified chat inboxes, assign conversations, and monitor customer satisfaction scores. Integrating webhook triggers with digital calendar apps prevents double-booking wedding shoot dates, giving your studio unmatched operational agility and peace of mind during hectic seasonal peaks.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                You will also configure automated appointment reminders for client pre-wedding consultations, ensuring couples arrive fully prepared and on schedule for their studio briefing sessions. In addition, students explore broadcast messaging guidelines, conversational flowcharts for wedding packages, automated review generation workflows, and client retention funnels that bring repeat business across multiple generations. You will also integrate automated feedback surveys and digital satisfaction questionnaires that gather verified student and client testimonials effortlessly. These automated communication pipelines establish unmatched client trust and elevate your studio profile above regional competitors.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                Elevate your studio operational efficiency with modern <strong>WhatsApp automation</strong> workflows taught by Anil Sharma. Join Quick Art Photography Academy to master <strong>WhatsApp automation</strong> today.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "courses/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Premier Offline Diploma Training Center in North India</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                Looking for the top <strong>photography and video editing courses in Siwan</strong>? Quick Art Photography Academy provides an immersive studio learning environment tailored for career-focused students. Our <strong>photography and video editing courses in Siwan</strong> combine hands-on equipment handling with cutting-edge post-production software mastery.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                When you choose our <strong>photography and video editing courses in Siwan</strong>, you gain direct mentorship from industry veteran Anil Sharma. Trainees in our <strong>photography and video editing courses in Siwan</strong> work with cinema cameras, pro lighting, and individual editing workstations. We welcome candidates from across Bihar seeking practical <strong>photography and video editing courses in Siwan</strong>.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                Discover why creative professionals recommend our <strong>photography and video editing courses in Siwan</strong> for complete wedding media mastery. Enrol in our <strong>photography and video editing courses in Siwan</strong> today. Our <strong>photography and video editing courses in Siwan</strong> guarantee exceptional portfolio growth. Join our <strong>photography and video editing courses in Siwan</strong> to launch your studio career.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "contact-us/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Visit Quick Art Photography Academy in Siwan</h2>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:12px;">
                For official inquiries, batch schedules, or demo classes, reach out via our <strong>Quick Art Photography Academy contact</strong> channels. Our studio academy is conveniently located near Lalit Bus Stand in Ayodhya Puri, Siwan. Using our official <strong>Quick Art Photography Academy contact</strong> phone line at +91 9939800780 connects you directly with our admissions counselor.
            </p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0;">
                Students visiting from neighboring districts like Gopalganj, Chhapra, and Patna can use our <strong>Quick Art Photography Academy contact</strong> desk to schedule campus tours and confirm free hostel accommodation details. Keep our <strong>Quick Art Photography Academy contact</strong> information handy for prompt admission assistance. We welcome your <strong>Quick Art Photography Academy contact</strong> today.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "blog/best-video-editing-software-in-2026/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Choosing the Best Video Editing Software for Commercial Studios</h2>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Deciding on the <strong>best video editing software</strong> depends directly on your daily project requirements and turnaround expectations. For high-speed wedding edits where timeline efficiency is paramount, EDIUS Pro remains an unbeatable tool. However, editors crafting luxury cinematic highlight reels consistently rank DaVinci Resolve as the <strong>best video editing software</strong> for delicate color grading and node-based grading.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Meanwhile, Adobe Premiere Pro maintains its place as the <strong>best video editing software</strong> for general multimedia studios needing seamless integration with Photoshop, After Effects, and dynamic motion graphics templates. Exploring each option helps you understand why there is no single answer to what constitutes the <strong>best video editing software</strong>.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin:0;">
                At Quick Art Photography Academy, our training covers all three industry leaders, ensuring you master the <strong>best video editing software</strong> for every commercial editing scenario. Discover the <strong>best video editing software</strong> that matches your creative workflow. Finding the <strong>best video editing software</strong> will transform your studio output.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "blog/freelance-video-editor-earn-in-bihar/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Commercial Opportunities for Every Freelance Video Editor in Bihar</h2>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Operating as a successful <strong>freelance video editor in Bihar</strong> is more achievable now than ever before. As high-speed fiber internet and mobile broadband expand across Tier-2 and Tier-3 towns, a skilled <strong>freelance video editor in Bihar</strong> can effortlessly deliver 4K projects to clients in Mumbai, Delhi, Bengaluru, and international markets.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Local wedding production studios also rely heavily on external talent. A dedicated <strong>freelance video editor in Bihar</strong> who can handle fast multi-camera synchronization and clean color grading can charge between Rs 4,000 and Rs 8,000 per wedding teaser. By managing four to five projects every month, an ambitious <strong>freelance video editor in Bihar</strong> easily earns a respectable, growing income.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                To maximize your revenue as a <strong>freelance video editor in Bihar</strong>, you must invest in professional skills and establish strong client communication. Rather than competing purely on low rates, a reputable <strong>freelance video editor in Bihar</strong> focuses on reliable delivery deadlines and top-tier visual polish.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Establishing strict contract terms protects your business growth. Professional editors always mandate a 50% upfront deposit before commencing raw footage ingestion, with the remaining balance due prior to delivering un-watermarked high-definition deliverables. Creating standardized scope-of-work agreements prevents endless revision cycles and clarifies turnaround expectations.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Furthermore, adopting secure cloud asset management solutions such as Google Drive Workspace, Dropbox, or Frame.io simplifies time-coded feedback from distant directors. Maintaining redundant offline hard drives ensures you never lose irreplaceable client ceremony media.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Overcoming seasonal market fluctuations is a vital skill for every <strong>freelance video editor in Bihar</strong>. By diversifying into corporate promotional reels, local educational institute documentaries, and social media brand content during non-wedding months, a dedicated <strong>freelance video editor in Bihar</strong> ensures a steady cash flow year-round. Maintaining a professional attitude, delivering projects on time, and continuously upskilling are the three pillars that define a thriving media career.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Investing in reliable hardware forms the backbone of sustained freelance productivity. Equipping your editing rig with high-speed external NVMe SSDs ensures smooth 4K scrubbing and instantaneous project rendering. Furthermore, having a color-accurate IPS monitor calibrated to standard sRGB specifications guarantees that wedding highlight reels display consistent skin tones across mobile displays, smart TVs, and projection screens alike. Cultivating direct professional relationships with regional wedding event planners, sound engineers, and commercial cinematographers further expands your recurring referral pipeline. Building a stellar reputation takes consistent effort, clear client communication, and persistent dedication to the craft. By treating every editing project with utmost care, editors in Bihar establish flourishing businesses that command respect across the Indian creative landscape.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin:0;">
                Quick Art Photography Academy in Siwan provides comprehensive hands-on training to help you launch your career as an independent <strong>freelance video editor in Bihar</strong>. Becoming a respected <strong>freelance video editor in Bihar</strong> starts with proper technical guidance. Start your journey as a <strong>freelance video editor in Bihar</strong> today.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """,

    "blog/how-ai-is-changing-wedding-filmmaking-2026/index.html": """
        <!-- Technical SEO Tuning Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:28px;margin-top:24px;">
            <h2 style="font-size:20px;color:#f5c879;font-weight:700;margin-bottom:12px;">Practical Applications of AI in Wedding Filmmaking Workflows</h2>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Understanding the role of <strong>AI in wedding filmmaking</strong> allows modern studios to reduce manual editing hours without compromising emotional storytelling. Using smart tools for automated speech transcription lets editors search through hours of raw video footage by simply typing dialogue keywords into the search bar.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Furthermore, applying automated color matching algorithms balances multicam clips captured on mixed camera bodies under inconsistent reception lights. Studios leveraging these automated enhancements can deliver 4K wedding teasers within 48 hours of the event, thrilling couples and earning glowing referrals.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                By incorporating computational assistance into their post-production pipeline, editors spend less time synchronizing tracks and more time refining cinematic pacing. As artificial intelligence advances, thoughtful adoption will separate thriving studios from those struggling with backlogs.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Additionally, neural audio cleanup tools isolate bride and groom vows from loud background generator hums, ensuring pristine audio quality in the final mix. Modern directors gain a competitive edge in both creative output and studio turnaround speed while preserving the genuine human warmth of the sacred celebration.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Equally critical is respecting client data privacy when utilizing cloud-based machine learning models. Reputable wedding cinematographers ensure that private family portraits and intimate banquet clips remain strictly secured on local workstations or encrypted servers without unauthorized third-party model training ingestion.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                As the industry matures, the thoughtful application of <strong>AI in wedding filmmaking</strong> will distinguish visionary directors from conventional operators. Emphasizing human emotion while leveraging <strong>AI in wedding filmmaking</strong> allows cinematographers to focus on storytelling rather than tedious administrative tasks.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Wedding filmmakers should also consider client transparency regarding the use of <strong>AI in wedding filmmaking</strong>. Highlighting how modern algorithms enhance speech clarity and color harmony can reassure couples while demonstrating cutting-edge technical sophistication. Adopting <strong>AI in wedding filmmaking</strong> represents an exciting evolution in visual narrative art.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Technological advancements also bring automated timeline indexing, allowing editors to locate emotional climax moments, laughter bursts, and traditional rituals in seconds. Integrating <strong>AI in wedding filmmaking</strong> frees creative teams to focus on nuanced directorial choices, such as dynamic sound design and subtle pacing rhythms that evoke genuine tears of joy from families watching their films decades later. Embracing ongoing education and mastering new digital tools ensures long-term artistic vitality.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:12px;">
                Ultimately, technology serves as an enabler rather than a replacement for human creativity. The most memorable wedding films resonate because they capture authentic human connections, heartfelt glances, and familial joy. When used judiciously, automated workflows empower filmmakers to spend more time listening to couples, understanding their unique romance, and weaving visual poetry that will be cherished across generations. By embracing continuous technological evolution, videographers secure their creative relevance while delivering timeless visual masterpieces that endure. Investing in structured mentorship ensures that editors stay ahead of industry curves, producing inspiring films that honor traditional sentiments with modern artistic panache and unwavering emotional truth.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin:0;">
                Learn how to integrate <strong>AI in wedding filmmaking</strong> into your daily studio practice at Quick Art Photography Academy in Siwan. The future of visual storytelling is here. Master modern creative techniques with our expert mentorship.
            </p>
        </div>
        <!-- End Technical SEO Tuning Block -->
    """
}

def inject():
    all_ok = True
    results = []

    for rel_path, block in TUNINGS.items():
        if not os.path.exists(rel_path):
            print(f"Error: {rel_path} does not exist!")
            all_ok = False
            continue

        with open(rel_path, "r", encoding="utf-8") as f:
            html = f.read()

        # Check if already tuned
        if "<!-- Technical SEO Tuning Block -->" in html:
            pattern = re.compile(r'<!-- Technical SEO Tuning Block -->.*?<!-- End Technical SEO Tuning Block -->', re.DOTALL)
            new_html = pattern.sub(block.strip(), html)
        else:
            # Find End Technical SEO comment
            m = re.search(r'<!-- End Technical SEO[^>]*-->', html)
            if m:
                end_tag = m.group(0)
                new_html = html.replace(end_tag, block.strip() + "\n        " + end_tag)
            else:
                footer_idx = html.find("<footer")
                if footer_idx != -1:
                    new_html = html[:footer_idx] + f"\n{block.strip()}\n" + html[footer_idx:]
                else:
                    new_html = html + f"\n{block.strip()}\n"

        # Special check for index.html closing tags
        if rel_path == "index.html" and "</div>\n</div>\n</section>\n    \n<section id=\"faq\"" not in new_html and "<section id=\"faq\"" in new_html:
            # check if closed properly
            if "<!-- End Technical SEO Content Expansion -->\n    \n<section id=\"faq\"" in new_html:
                new_html = new_html.replace(
                    "<!-- End Technical SEO Content Expansion -->\n    \n<section id=\"faq\"",
                    "<!-- End Technical SEO Content Expansion -->\n    </div>\n    </div>\n</section>\n    \n<section id=\"faq\""
                )

        cfg = PAGE_CONFIGS[rel_path]
        parser = BodyTextExtractor()
        parser.feed(new_html)
        text = parser.get_text()
        words = len(re.findall(r'\b\w+\b', text))
        count = count_phrase(text, cfg['primary'])
        density = (count / max(words, 1)) * 100

        min_w = cfg['min_words']
        status = "OK"
        if words < min_w:
            status = f"LOW WORDS ({words} < {min_w})"
            all_ok = False
        elif density < 0.8:
            status = f"LOW DENSITY ({density:.2f}% < 0.8%)"
            all_ok = False
        elif density > 1.2:
            status = f"HIGH DENSITY ({density:.2f}% > 1.2%)"
            all_ok = False

        results.append((rel_path, words, min_w, count, density, status, new_html))

    print(f"{'Page':<45} | {'Words':<7} | {'Min':<5} | {'Count':<5} | {'Density':<8} | {'Status'}")
    print("-" * 100)
    for rel_path, words, min_w, count, density, status, _ in results:
        print(f"{rel_path:<45} | {words:<7} | {min_w:<5} | {count:<5} | {density:5.2f}%  | {status}")

    if all_ok:
        print("\nAll 20 pages pass! Writing to disk...")
        for rel_path, _, _, _, _, _, new_html in results:
            with open(rel_path, "w", encoding="utf-8") as f:
                f.write(new_html)
        print("Successfully written all 20 pages!")
    else:
        print("\nValidation failed. Not writing to disk. Please calibrate failing blocks.")

if __name__ == "__main__":
    inject()
