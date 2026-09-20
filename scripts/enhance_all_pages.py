import os
import re

def enhance_home():
    path = "index.html"
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    # Ensure hero has primary
    hero_pattern = re.compile(r'(<p class="hero-sub font-light leading-relaxed[^>]*>)(.*?)(</p>)', re.DOTALL)
    if hero_pattern.search(html):
        html = hero_pattern.sub(
            r'\1Welcome to Quick Art Photography Academy, the premier media institute offering the best video editing course in Siwan and Bihar. Master industry-standard editing workflows in EDIUS, Adobe Premiere Pro and DaVinci Resolve with 100% practical studio training and free hostel accommodation.\3',
            html, count=1
        )

    # Let's ensure Quick Art Photography Academy appears ~20 times across index.html naturally
    # Replace single instances of "Quick Art" in body text with "Quick Art Photography Academy" where appropriate
    # Check current count
    # Also add studio lab details section if not present
    lab_block = """
        <!-- Technical SEO Home Lab Block -->
        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:32px;margin-top:28px;">
            <h2 style="font-size:22px;color:#f5c879;font-weight:700;margin-bottom:14px;line-height:1.3;">Studio Facilities &amp; Practical Training Infrastructure</h2>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                At <strong>Quick Art Photography Academy</strong>, professional editing education is delivered on dedicated workstation suites equipped with multi-core processors, minimum 32GB RAM, dedicated NVIDIA RTX graphics cards, and high-speed NVMe storage. Students at <strong>Quick Art Photography Academy</strong> receive individual workstation access during daily editing lab sessions.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                Our studio campus provides outstation students from Gopalganj, Chhapra, and Patna with 100% free hostel accommodation. Under the direct mentorship of Anil Sharma at <strong>Quick Art Photography Academy</strong>, students master multi-camera synchronization, timeline trimming, color grading, and commercial wedding delivery. Every graduate leaves <strong>Quick Art Photography Academy</strong> with a verified project portfolio and client-ready confidence.
            </p>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin:0;">
                Whether your goal is starting an independent wedding photography studio or working as a lead video editor, <strong>Quick Art Photography Academy</strong> provides the practical foundation needed for sustainable creative success in Bihar.
            </p>
        </div>
        <!-- End Technical SEO Home Lab Block -->
    """
    if "<!-- Technical SEO Home Lab Block -->" not in html:
        html = html.replace("<!-- End Technical SEO Content Expansion -->", lab_block + "\n        <!-- End Technical SEO Content Expansion -->")

    # Add extra natural brand mentions if count < 20
    # Let's check how many currently in body
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("Enhanced Home")

def enhance_video_editing():
    path = "courses/video-editing/index.html"
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    # Add curriculum deep-dive block to bring words to 1,820 and ensure exact primary keyword count ~20 (1.10%)
    curriculum_block = """
        <!-- Technical SEO Video Editing Curriculum Deep Dive -->
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
            <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Week-by-Week Video Editing Course Syllabus</h2>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                Our 6-week offline <strong>video editing course</strong> is structured around sequential mastery of post-production workflows. Trainees progress from foundational timeline cuts to broadcast-quality finishing under daily studio supervision:
            </p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:20px;margin-bottom:20px;">
                <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;">
                    <h3 style="color:#fff;font-size:16px;font-weight:700;margin-bottom:8px;">Week 1–2: Ingest, Trimming &amp; EDIUS</h3>
                    <p style="color:#94a3b8;font-size:13.5px;line-height:1.6;margin:0;">Media organization, proxy generation, multi-camera audio sync, fast ritual cutting, and keyboard shortcut proficiency in our <strong>video editing course</strong>.</p>
                </div>
                <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;">
                    <h3 style="color:#fff;font-size:16px;font-weight:700;margin-bottom:8px;">Week 3–4: Premiere Pro &amp; Teaser Craft</h3>
                    <p style="color:#94a3b8;font-size:13.5px;line-height:1.6;margin:0;">Cinematic montage pacing, speed ramping, beat-matched transitions, sound design, and title typography in our <strong>video editing course</strong>.</p>
                </div>
                <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;">
                    <h3 style="color:#fff;font-size:16px;font-weight:700;margin-bottom:8px;">Week 5–6: DaVinci Resolve &amp; Showreel</h3>
                    <p style="color:#94a3b8;font-size:13.5px;line-height:1.6;margin:0;">Node-based primary and secondary color correction, skin-tone matching, LUT management, final wedding film export, and client review in our <strong>video editing course</strong>.</p>
                </div>
            </div>
            <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin:0;">
                Trainees also learn storage management, backup protocols, and export presets tailored for YouTube 4K and Instagram vertical reels, ensuring their <strong>video editing course</strong> prepares them for real market demands.
            </p>
        </div>
        <!-- End Technical SEO Video Editing Curriculum Deep Dive -->
    """
    if "<!-- Technical SEO Video Editing Curriculum Deep Dive -->" not in html:
        html = html.replace("<!-- Section 3: Wedding Video Editing Course -->", curriculum_block + "\n                <!-- Section 3: Wedding Video Editing Course -->")

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("Enhanced courses/video-editing/index.html")

def enhance_album_design():
    path = "courses/album-design/index.html"
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    # Hero first 100 words
    hero_pattern = re.compile(r'(<p class="hero-sub[^>]*>)(.*?)(</p>)', re.DOTALL)
    if hero_pattern.search(html):
        html = hero_pattern.sub(
            r'\1Master professional wedding album layout design, advanced Photoshop skin retouching, and print color management in our 4-week offline album design course at Quick Art Photography Academy in Siwan, Bihar. Learn on dedicated workstations with 100% practical training and free hostel accommodation.\3',
            html, count=1
        )

    e3_content = """
        <!-- Technical SEO Content Expansion: E3 Album Design Offline -->
        <section class="qa-section bg-ink text-white py-16" style="background:#0c0d0e;border-top:1px solid rgba(214,172,98,0.15);border-bottom:1px solid rgba(214,172,98,0.15);">
            <div class="container" style="max-width:1180px;margin:0 auto;padding:0 20px;">
                <div style="text-align:center;max-width:820px;margin:0 auto 44px;">
                    <p class="qa-kicker" style="color:#f5c879;letter-spacing:0.12em;font-size:12px;font-weight:700;text-transform:uppercase;">4-Week Studio Specialization in Siwan</p>
                    <h2 style="font-size:clamp(24px, 3.5vw, 36px);color:#fff;font-weight:800;margin-top:8px;line-height:1.2;">Wedding Album Design Course in Siwan</h2>
                    <p style="color:#94a3b8;font-size:15px;margin-top:10px;">Hands-on photo album creation, Karizma templates, and print-ready export at Quick Art Photography Academy.</p>
                </div>

                <!-- Section 1: Wedding Album Design Course -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Wedding Album Design Course</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        A beautifully printed photobook is the emotional center of every Indian wedding. In our comprehensive <strong>wedding album design course</strong>, you will master the art of visual storytelling across 30 to 50 spread pages. We teach students how to select hero portraits, balance ceremony candid shots, and craft balanced negative space that elevates wedding memories into timeless family heirlooms.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        This <strong>album design course</strong> guides you step-by-step through raw photo curation, Lightroom batch grading, frequency separation retouching in Adobe Photoshop, and modern Karizma and Canvera layout composition. You will learn how to design customized typography, elegant borders, and clean backgrounds that highlight the couple without distracting clutter.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;">
                        By participating in our <strong>album design course</strong>, trainees work with over 10,000+ real wedding photographs, mastering speed techniques that allow professional designers to complete a 40-sheet album in under 3 hours.
                    </p>
                </div>

                <!-- Section 2: Photo Album Design Course -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Photo Album Design Course</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Enrolling in a professional <strong>photo album design course</strong> opens lucrative opportunities beyond traditional weddings, including pre-wedding photobooks, maternity shoots, baby folios, and corporate event catalogs. In this <strong>album design course</strong>, students explore grid systems, visual hierarchy, color harmony, and print-safe margin setups.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        We cover print lab coordination in thorough detail: CMYK versus RGB color profiles, soft proofing, paper textures (matte, glossy, metallic, velvet, feather-touch), binding types, and embossing finishes. Understanding how digital screens translate onto physical paper ensures your <strong>album design course</strong> projects print with exact color fidelity.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;">
                        Each student in our <strong>photo album design course</strong> completes multiple mock client assignments, learning how to present digital page proofs, incorporate client feedback, and prepare high-resolution PDF exports for leading print labs across India.
                    </p>
                </div>

                <!-- Section 3: Wedding Album Design Class in Siwan -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Wedding Album Design Class in Siwan</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Looking for a trusted <strong>wedding album design class in Siwan</strong>? Quick Art Photography Academy offers the only dedicated physical studio lab in Saran division featuring high-resolution color-calibrated monitors and individual design workstations. Candidates from Siwan, Gopalganj, Chhapra, and Patna join our <strong>album design course</strong> for intensive hands-on skill development.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Our 4-week offline <strong>album design course</strong> provides outstation students with 100% free hostel stay, enabling full-day practice in a creative community setting. Lead mentor Anil Sharma personally guides students through advanced portrait retouching, hair masking, blemish removal, and cinematic color toning.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:18px;">
                        Students in our <strong>wedding album design class in Siwan</strong> also gain access to our proprietary library of over 1,500+ PSD templates, textures, and typography packs, providing a powerful toolkit for starting an independent album design venture.
                    </p>
                    <!-- Cross Link required by E3 -->
                    <div style="background:rgba(214,172,98,0.1);border:1px solid rgba(214,172,98,0.3);border-radius:12px;padding:16px 20px;margin-top:16px;">
                        <p style="color:#f5c879;font-weight:600;font-size:14.5px;margin:0;">
                            Prefer learning from home? See our <a href="/online/album-design-course/" style="color:#fff;text-decoration:underline;font-weight:700;">Album Designing Course Online in Hindi</a> for self-paced remote video training.
                        </p>
                    </div>
                </div>

                <!-- Section 4: Comprehensive FAQ Section -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:20px;">Frequently Asked Questions About Album Design</h2>
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;" open>
                            <summary style="font-weight:700;color:#fff;font-size:16px;cursor:pointer;">What software is taught in this album design course?</summary>
                            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;">
                                We teach Adobe Photoshop CC extensively, along with Adobe Lightroom Classic for batch image selection and color grading, and industry Karizma design plug-ins for automated spread templates.
                            </p>
                        </details>
                        <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;">
                            <summary style="font-weight:700;color:#fff;font-size:16px;cursor:pointer;">What is the duration of this wedding album design class in Siwan?</summary>
                            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;">
                                The course duration is 4 weeks of hands-on daily studio training. Free hostel accommodation is provided for students traveling from Gopalganj, Chhapra, Patna, or other districts in Bihar.
                            </p>
                        </details>
                        <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;">
                            <summary style="font-weight:700;color:#fff;font-size:16px;cursor:pointer;">Do I need advanced drawing or artistic skills to join?</summary>
                            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;">
                                No prior artistic background is required. This <strong>album design course</strong> starts from basic computer tools, layers, masks, and alignment grids before moving to advanced retouching and page layout aesthetics.
                            </p>
                        </details>
                        <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;">
                            <summary style="font-weight:700;color:#fff;font-size:16px;cursor:pointer;">Can I also learn video editing at the same academy?</summary>
                            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;">
                                Yes! You can combine album design with our <a href="/courses/video-editing/" style="color:#f5c879;text-decoration:none;">6-Week Video Editing Course</a> or enroll in our flagship <a href="/master-class/" style="color:#f5c879;text-decoration:none;">14-Week Wedding Filmmaking Master Class</a> for complete photo and video mastery.
                            </p>
                        </details>
                    </div>
                </div>

                <!-- Trust Strip / Mentor Block -->
                <div style="background:rgba(214,172,98,0.08);border:1px solid rgba(214,172,98,0.25);border-radius:14px;padding:24px 28px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;">
                    <div>
                        <div style="font-weight:700;color:#fff;font-size:16px;">Anil Sharma, Founder &amp; Lead Mentor</div>
                        <div style="color:#cbd5e1;font-size:13.5px;margin-top:3px;">Renowned wedding photography educator with 1,800+ successful alumni across Bihar.</div>
                    </div>
                    <div>
                        <a href="https://maps.app.goo.gl/eRkAc7kia1D1s1zQ7" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#f5c879;color:#000;font-weight:700;font-size:13.5px;padding:10px 20px;border-radius:100px;text-decoration:none;">
                            4.9/5 · 1,800+ student reviews on Google Maps
                        </a>
                    </div>
                </div>

                <!-- Final CTA Section -->
                <div style="text-align:center;margin-top:40px;padding-top:20px;">
                    <p style="color:#cbd5e1;font-size:15px;max-width:700px;margin:0 auto 20px;line-height:1.7;">
                        Transform raw wedding photos into stunning premium albums. Join our 4-week <strong>album design course</strong> in Siwan and master professional layout artistry with mentor Anil Sharma.
                    </p>
                    <div style="display:inline-flex;gap:14px;flex-wrap:wrap;justify-content:center;">
                        <a href="/contact-us/" style="background:#f5c879;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">Book Free Trial Class</a>
                        <a href="tel:+919939800780" style="background:rgba(255,255,255,0.08);color:#fff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;border:1px solid rgba(255,255,255,0.2);">Call +91 99398 00780</a>
                    </div>
                    <p style="color:#64748b;font-size:12px;margin-top:16px;">Last updated: March 2026</p>
                </div>

            </div>
        </section>
        <!-- End Technical SEO Content Expansion -->
    """

    if "<!-- Technical SEO Content Expansion: E3 Album Design Offline -->" not in html:
        footer_idx = html.find("<footer")
        if footer_idx != -1:
            html = html[:footer_idx] + e3_content + "\n" + html[footer_idx:]

    # Update image alts for keyword alt checklist:
    html = re.sub(r'alt=\"[^\"]*album[^\"]*\"', 'alt=\"album design course - professional wedding album spread layouts at Quick Art Academy\"', html, count=1)
    html = re.sub(r'alt=\"[^\"]*photoshop[^\"]*\"', 'alt=\"album design course - student practicing skin retouching in Photoshop in Siwan lab\"', html, count=1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("Enhanced courses/album-design/index.html")

if __name__ == "__main__":
    enhance_home()
    enhance_video_editing()
    enhance_album_design()
