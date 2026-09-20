import os
import re

def enhance_ai_wedding_filmmaking():
    path = "courses/ai-wedding-filmmaking/index.html"
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    # Hero first 100 words
    hero_pattern = re.compile(r'(<p class="hero-sub[^>]*>)(.*?)(</p>)', re.DOTALL)
    if hero_pattern.search(html):
        html = hero_pattern.sub(
            r'\1Master future-ready production in our advanced AI video editing course at Quick Art Photography Academy in Siwan, Bihar. Discover how artificial intelligence accelerates dialogue clean-up, automated color matching, smart music re-timing, and wedding highlight curation with 100% practical studio training.\3',
            html, count=1
        )

    ai_content = """
        <!-- Technical SEO AI Wedding Filmmaking Expansion -->
        <section class="qa-section bg-ink text-white py-16" style="background:#0c0d0e;border-top:1px solid rgba(214,172,98,0.15);border-bottom:1px solid rgba(214,172,98,0.15);">
            <div class="container" style="max-width:1180px;margin:0 auto;padding:0 20px;">
                <div style="text-align:center;max-width:820px;margin:0 auto 44px;">
                    <p class="qa-kicker" style="color:#f5c879;letter-spacing:0.12em;font-size:12px;font-weight:700;text-transform:uppercase;">AI-Powered Creative Workflows</p>
                    <h2 style="font-size:clamp(24px, 3.5vw, 36px);color:#fff;font-weight:800;margin-top:8px;line-height:1.2;">Advanced AI Video Editing Course in Siwan</h2>
                    <p style="color:#94a3b8;font-size:15px;margin-top:10px;">Accelerating wedding post-production, color grading, and client delivery with smart AI tools.</p>
                </div>

                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">AI Video Editing Course Curriculum &amp; Tools</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Artificial intelligence is revolutionizing the wedding media industry. Our dedicated <strong>AI video editing course</strong> teaches creative editors how to eliminate repetitive timeline tasks and speed up client turnarounds by up to 500%. Rather than replacing human artistry, this <strong>AI video editing course</strong> empowers filmmakers to focus on emotional storytelling and cinematic framing.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        In this comprehensive <strong>AI wedding filmmaking course</strong>, students learn how to leverage AI tools inside Adobe Premiere Pro, DaVinci Resolve Neural Engine, Topaz Video AI, and Descript. You will master text-based rough cutting, automated speech-to-caption generation, AI dialogue isolation from noisy wedding banquet halls, and neural face retouching in 4K resolution.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;">
                        Enrolling in our <strong>AI video editing course</strong> gives you hands-on studio experience on high-performance RTX GPU workstations in Siwan, guiding you through automated scene detection, voice enhancement, and neural smart reframing for Instagram reels and YouTube shorts.
                    </p>
                </div>

                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">AI Photo Editing for Wedding Albums &amp; Portraits</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Post-processing thousands of raw wedding photographs manually can take weeks. In our specialized module on <strong>AI photo editing for wedding</strong> shoots, you will master cutting-edge neural tools in Adobe Lightroom and Photoshop CC. We teach automated skin tone smoothing, subject masking, background clean-up, eye sharpening, and intelligent sky replacement.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        This <strong>AI video editing course</strong> curriculum ensures wedding photographers and editors can batch process entire wedding folders in minutes while maintaining pristine natural color fidelity. You will learn how to create custom AI presets that reflect your signature studio style across candid ceremonies, receptions, and pre-wedding portraits.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;">
                        Combining smart photo automation with video workflows makes this <strong>AI wedding filmmaking course</strong> the most modern, career-defining curriculum in Bihar.
                    </p>
                </div>

                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:20px;">Frequently Asked Questions: AI Video Editing</h2>
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;" open>
                            <summary style="font-weight:700;color:#fff;font-size:16px;cursor:pointer;">Do I need coding or machine learning knowledge to take this AI video editing course?</summary>
                            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;">
                                No coding or technical programming is required. The <strong>AI video editing course</strong> focuses entirely on creative application tools integrated directly into industry-standard editing software like Premiere Pro and DaVinci Resolve.
                            </p>
                        </details>
                        <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;">
                            <summary style="font-weight:700;color:#fff;font-size:16px;cursor:pointer;">How does AI assist in wedding filmmaking?</summary>
                            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;">
                                In an <strong>AI wedding filmmaking course</strong>, AI accelerates multi-camera audio alignment, cuts out unwanted background noise, isolates vocals, stabilizes handheld gimbal shots, and assists in generating creative color lookups.
                            </p>
                        </details>
                        <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;">
                            <summary style="font-weight:700;color:#fff;font-size:16px;cursor:pointer;">Is AI photo editing for wedding ceremonies covered in detail?</summary>
                            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;">
                                Yes. <strong>AI photo editing for wedding</strong> ceremonies is taught comprehensively, covering facial recognition batch tagging, generative fills in Photoshop, and smart noise reduction for low-light wedding receptions.
                            </p>
                        </details>
                        <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;">
                            <summary style="font-weight:700;color:#fff;font-size:16px;cursor:pointer;">Is this course available as part of the 14-Week Master Class?</summary>
                            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;">
                                Yes, all modules of this <strong>AI video editing course</strong> are fully integrated into our flagship <a href="/master-class/" style="color:#f5c879;text-decoration:none;">14-Week Wedding Filmmaking Master Class</a> in Siwan.
                            </p>
                        </details>
                    </div>
                </div>

                <!-- Trust Strip / Mentor Block -->
                <div style="background:rgba(214,172,98,0.08);border:1px solid rgba(214,172,98,0.25);border-radius:14px;padding:24px 28px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;">
                    <div>
                        <div style="font-weight:700;color:#fff;font-size:16px;">Anil Sharma, Founder &amp; Lead Mentor</div>
                        <div style="color:#cbd5e1;font-size:13.5px;margin-top:3px;">Pioneering AI-driven post-production and cinematography training in Bihar.</div>
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
                        Stay ahead of industry trends and boost your studio productivity. Register for our hands-on <strong>AI video editing course</strong> at Quick Art Photography Academy in Siwan today.
                    </p>
                    <div style="display:inline-flex;gap:14px;flex-wrap:wrap;justify-content:center;">
                        <a href="/contact-us/" style="background:#f5c879;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">Book Free Demo Class</a>
                        <a href="tel:+919939800780" style="background:rgba(255,255,255,0.08);color:#fff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;border:1px solid rgba(255,255,255,0.2);">Call +91 99398 00780</a>
                    </div>
                    <p style="color:#64748b;font-size:12px;margin-top:16px;">Last updated: March 2026</p>
                </div>

            </div>
        </section>
        <!-- End Technical SEO AI Wedding Filmmaking Expansion -->
    """

    if "<!-- Technical SEO AI Wedding Filmmaking Expansion -->" not in html:
        footer_idx = html.find("<footer")
        if footer_idx != -1:
            html = html[:footer_idx] + ai_content + "\n" + html[footer_idx:]

    # Update image alts for keyword alt checklist:
    html = re.sub(r'alt=\"[^\"]*ai[^\"]*\"', 'alt=\"AI video editing course - neural color grading and speech isolation in Siwan lab\"', html, count=1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("Enhanced courses/ai-wedding-filmmaking/index.html")

if __name__ == "__main__":
    enhance_ai_wedding_filmmaking()
