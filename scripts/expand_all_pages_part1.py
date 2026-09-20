import os
import re

def expand_master_class():
    filepath = "master-class/index.html"
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    # Hero text update for primary keyword
    html = re.sub(
        r'(<p class="hero-sub[^>]*>)(.*?)(</p>)',
        r'\1Join the most prestigious 14-week wedding filmmaking course at Quick Art Photography Academy in Siwan, Bihar. Master cinematography, wedding video editing, album design, and color grading on studio gear with 100% practical training and free hostel accommodation.\3',
        html, count=1, flags=re.DOTALL
    )

    extra_content = """
        <!-- Technical SEO Expansion: wedding filmmaking course -->
        <section class="qa-section bg-ink text-white py-16" style="background:#0c0d0e;border-top:1px solid rgba(214,172,98,0.15);border-bottom:1px solid rgba(214,172,98,0.15);">
            <div class="container" style="max-width:1180px;margin:0 auto;padding:0 20px;">
                <div style="text-align:center;max-width:820px;margin:0 auto 44px;">
                    <p class="qa-kicker" style="color:#f5c879;letter-spacing:0.12em;font-size:12px;font-weight:700;text-transform:uppercase;">14-Week Comprehensive Diploma</p>
                    <h2 style="font-size:clamp(24px, 3.5vw, 36px);color:#fff;font-weight:800;margin-top:8px;line-height:1.2;">Why Our Wedding Filmmaking Course Sets the Standard in Bihar</h2>
                    <p style="color:#94a3b8;font-size:15px;margin-top:10px;">End-to-end cinematography, editing, album creation, and studio business mentorship in Siwan.</p>
                </div>

                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Complete Wedding Videography Course Modules</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        The flagship 14-week <strong>wedding filmmaking course</strong> is engineered to transform passionate beginners into studio directors. Unlike short theoretical crash courses, our <strong>wedding videography course</strong> curriculum immerses you in live camera rigs, gimbal balance, drone cinematography, three-point lighting, and on-set audio capture under real wedding simulations.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Trainees in this <strong>wedding filmmaking course</strong> spend over 200 hours handling professional cinema cameras from Sony and Canon. You will practice golden-hour couple direction, candid ceremony framing, and multi-camera ritual documentation alongside lead mentor Anil Sharma.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;">
                        Whether you are traveling from Gopalganj, Chhapra, or Patna, this <strong>wedding filmmaking course</strong> includes 100% free hostel stay in Siwan, providing continuous access to studio gear and editing lab suites.
                    </p>
                </div>

                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Integrated Wedding Photography and Videography Course</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        High-value wedding clients expect a single production team to deliver stunning photo albums alongside cinematic highlight films. This all-in-one <strong>wedding photography and videography course</strong> covers high-fashion portraiture, creative flash lighting, Photoshop retouching, and Karizma photobook layout design.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        In the post-production phase of our <strong>wedding filmmaking course</strong>, you will master our specialized <strong>cinematic wedding editing course</strong> workflows. We teach multi-cam ceremony assembly in EDIUS, dynamic teaser montages in Adobe Premiere Pro, and cinematic node-based color grading in DaVinci Resolve.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;">
                        By participating in this <strong>wedding filmmaking course</strong>, students graduate with two complete wedding film portfolios, three Instagram reels, and a 40-sheet printed wedding album proof ready to present to prospective clients.
                    </p>
                </div>

                <!-- Related Courses Block -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:12px;">Complementary Training &amp; Specializations</h2>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:20px;">
                        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;">
                            <h3 style="color:#fff;font-size:16px;font-weight:700;margin-bottom:8px;">6-Week Video Editing Course</h3>
                            <p style="color:#94a3b8;font-size:13.5px;line-height:1.6;margin-bottom:12px;">Focus exclusively on post-production software, multicam timeline sync, and color grading in Siwan.</p>
                            <a href="/courses/video-editing/" style="color:#f5c879;font-size:13.5px;font-weight:600;text-decoration:none;">View Offline Editing &rarr;</a>
                        </div>
                        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;">
                            <h3 style="color:#fff;font-size:16px;font-weight:700;margin-bottom:8px;">Wedding Album Design Course</h3>
                            <p style="color:#94a3b8;font-size:13.5px;line-height:1.6;margin-bottom:12px;">Master Photoshop skin retouching and Karizma print layouts in our 4-week studio class.</p>
                            <a href="/courses/album-design/" style="color:#f5c879;font-size:13.5px;font-weight:600;text-decoration:none;">View Album Design &rarr;</a>
                        </div>
                        <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;">
                            <h3 style="color:#fff;font-size:16px;font-weight:700;margin-bottom:8px;">Online Video Editing Masterclasses</h3>
                            <p style="color:#94a3b8;font-size:13.5px;line-height:1.6;margin-bottom:12px;">Prefer remote self-paced learning? Explore our full catalog of Hindi online programs.</p>
                            <a href="/online/" style="color:#f5c879;font-size:13.5px;font-weight:600;text-decoration:none;">Browse Online Catalog &rarr;</a>
                        </div>
                    </div>
                </div>

                <!-- Trust Strip -->
                <div style="background:rgba(214,172,98,0.08);border:1px solid rgba(214,172,98,0.25);border-radius:14px;padding:24px 28px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-bottom:30px;">
                    <div>
                        <div style="font-weight:700;color:#fff;font-size:16px;">Anil Sharma, Founder &amp; Lead Mentor</div>
                        <div style="color:#cbd5e1;font-size:13.5px;margin-top:3px;">Founder of Quick Art Photography Academy with over a decade of wedding cinema experience.</div>
                    </div>
                    <div>
                        <a href="https://maps.app.goo.gl/eRkAc7kia1D1s1zQ7" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#f5c879;color:#000;font-weight:700;font-size:13.5px;padding:10px 20px;border-radius:100px;text-decoration:none;">
                            4.9/5 · 1,800+ student reviews on Google Maps
                        </a>
                    </div>
                </div>

                <!-- Final CTA -->
                <div style="text-align:center;margin-top:30px;padding-top:10px;">
                    <p style="color:#cbd5e1;font-size:15px;max-width:720px;margin:0 auto 20px;line-height:1.7;">
                        Take your creative vision to the cinema screen. Enrol in our 14-week <strong>wedding filmmaking course</strong> in Siwan, attend a personalized studio orientation, and build a career that lasts.
                    </p>
                    <div style="display:inline-flex;gap:14px;flex-wrap:wrap;justify-content:center;">
                        <a href="/contact-us/" style="background:#f5c879;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">Book Studio Demo</a>
                        <a href="tel:+919939800780" style="background:rgba(255,255,255,0.08);color:#fff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;border:1px solid rgba(255,255,255,0.2);">Call +91 99398 00780</a>
                    </div>
                    <p style="color:#64748b;font-size:12px;margin-top:16px;">Last updated: March 2026</p>
                </div>

            </div>
        </section>
        <!-- End Technical SEO Expansion: wedding filmmaking course -->
    """

    if "<!-- Technical SEO Expansion: wedding filmmaking course -->" not in html:
        footer_idx = html.find("<footer")
        if footer_idx != -1:
            html = html[:footer_idx] + extra_content + "\n" + html[footer_idx:]

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html)
    print("Enhanced master-class/index.html")

def expand_courses_hub():
    filepath = "courses/index.html"
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    # Hero first 100 words
    html = re.sub(
        r'(<p class="hero-sub[^>]*>)(.*?)(</p>)',
        r'\1Explore industry-leading photography and video editing courses in Siwan at Quick Art Photography Academy. Choose between our comprehensive 14-week Master Class, 6-week offline video editing classes, wedding album design training, and AI filmmaking with 100% practical lab practice and free hostel stay.\3',
        html, count=1, flags=re.DOTALL
    )

    extra_content = """
        <!-- Technical SEO Expansion: courses hub -->
        <section class="qa-section bg-ink text-white py-16" style="background:#0c0d0e;border-top:1px solid rgba(214,172,98,0.15);border-bottom:1px solid rgba(214,172,98,0.15);">
            <div class="container" style="max-width:1180px;margin:0 auto;padding:0 20px;">
                <div style="text-align:center;max-width:820px;margin:0 auto 44px;">
                    <p class="qa-kicker" style="color:#f5c879;letter-spacing:0.12em;font-size:12px;font-weight:700;text-transform:uppercase;">On-Campus Creative Hub in Bihar</p>
                    <h2 style="font-size:clamp(24px, 3.5vw, 36px);color:#fff;font-weight:800;margin-top:8px;line-height:1.2;">Premier Photography and Video Editing Courses in Siwan</h2>
                    <p style="color:#94a3b8;font-size:15px;margin-top:10px;">Practical studio training, licensed software workstations, and free hostel accommodation.</p>
                </div>

                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Leading Video Editing Institute in Siwan</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Quick Art Photography Academy has established itself as the foremost <strong>video editing institute in Siwan</strong>, providing hands-on studio courses for aspiring cinematographers, photo editors, and studio owners. Our campus features multi-monitor editing bays running EDIUS, Adobe Premiere Pro, DaVinci Resolve, and Photoshop CC.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Candidates enrolling in our <strong>photography and video editing courses in Siwan</strong> receive individual workstation access, extensive 4K raw wedding footage, and direct daily critique from founder Anil Sharma. For outstation students from Gopalganj, Chhapra, and Patna, we offer 100% free hostel stay.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;">
                        Comparing professional <strong>editing courses in Bihar</strong>, our project-oriented curriculum guarantees that students graduate with tangible portfolio showreels, certified diplomas, and high-earning market skills.
                    </p>
                </div>

                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Choosing Among Editing Courses in Bihar</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        When deciding between different <strong>editing courses in Bihar</strong>, the primary factor should always be practical equipment access. Rather than sitting in passive lecture halls, students in our <strong>photography and video editing courses in Siwan</strong> shoot in our professional studio lab, test lighting patterns, balance motorized gimbals, and edit client-standard films.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;">
                        Explore our specific offline tracks: <a href="/courses/video-editing/" style="color:#f5c879;font-weight:600;text-decoration:none;">6-Week Video Editing Course</a>, <a href="/courses/album-design/" style="color:#f5c879;font-weight:600;text-decoration:none;">Wedding Album Design Course</a>, <a href="/courses/ai-wedding-filmmaking/" style="color:#f5c879;font-weight:600;text-decoration:none;">AI Wedding Filmmaking Course</a>, and our flagship <a href="/master-class/" style="color:#f5c879;font-weight:600;text-decoration:none;">14-Week Master Class</a>. For home study, browse our <a href="/online/" style="color:#f5c879;font-weight:600;text-decoration:none;">Online Course Catalog</a>.
                    </p>
                </div>

                <!-- Trust Strip -->
                <div style="background:rgba(214,172,98,0.08);border:1px solid rgba(214,172,98,0.25);border-radius:14px;padding:24px 28px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-bottom:30px;">
                    <div>
                        <div style="font-weight:700;color:#fff;font-size:16px;">Anil Sharma, Founder &amp; Lead Mentor</div>
                        <div style="color:#cbd5e1;font-size:13.5px;margin-top:3px;">Over 10 years empowering wedding media creators across Siwan and Bihar.</div>
                    </div>
                    <div>
                        <a href="https://maps.app.goo.gl/eRkAc7kia1D1s1zQ7" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#f5c879;color:#000;font-weight:700;font-size:13.5px;padding:10px 20px;border-radius:100px;text-decoration:none;">
                            4.9/5 · 1,800+ student reviews on Google Maps
                        </a>
                    </div>
                </div>

                <!-- Final CTA -->
                <div style="text-align:center;margin-top:30px;padding-top:10px;">
                    <p style="color:#cbd5e1;font-size:15px;max-width:720px;margin:0 auto 20px;line-height:1.7;">
                        Find your creative path. Attend our <strong>photography and video editing courses in Siwan</strong>, book a free personal campus tour, and experience our studio lab today.
                    </p>
                    <div style="display:inline-flex;gap:14px;flex-wrap:wrap;justify-content:center;">
                        <a href="/contact-us/" style="background:#f5c879;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">Book Free Demo Class</a>
                        <a href="tel:+919939800780" style="background:rgba(255,255,255,0.08);color:#fff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;border:1px solid rgba(255,255,255,0.2);">Call +91 99398 00780</a>
                    </div>
                    <p style="color:#64748b;font-size:12px;margin-top:16px;">Last updated: March 2026</p>
                </div>

            </div>
        </section>
        <!-- End Technical SEO Expansion: courses hub -->
    """

    if "<!-- Technical SEO Expansion: courses hub -->" not in html:
        footer_idx = html.find("<footer")
        if footer_idx != -1:
            html = html[:footer_idx] + extra_content + "\n" + html[footer_idx:]

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html)
    print("Enhanced courses/index.html")

def expand_online_hub():
    filepath = "online/index.html"
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    # Hero first 100 words
    html = re.sub(
        r'(<p class="hero-sub[^>]*>)(.*?)(</p>)',
        r'\1Learn professional video editing online in Hindi with structured masterclasses from Quick Art Photography Academy. Master Premiere Pro, DaVinci Resolve, EDIUS, cinematic wedding video editing, album design, and studio marketing with 4K practice project files and verified certificates.\3',
        html, count=1, flags=re.DOTALL
    )

    extra_content = """
        <!-- Technical SEO Expansion: online hub -->
        <section class="qa-section bg-ink text-white py-16" style="background:#0c0d0e;border-top:1px solid rgba(214,172,98,0.15);border-bottom:1px solid rgba(214,172,98,0.15);">
            <div class="container" style="max-width:1180px;margin:0 auto;padding:0 20px;">
                <div style="text-align:center;max-width:820px;margin:0 auto 44px;">
                    <p class="qa-kicker" style="color:#f5c879;letter-spacing:0.12em;font-size:12px;font-weight:700;text-transform:uppercase;">Self-Paced Remote Learning in Hindi</p>
                    <h2 style="font-size:clamp(24px, 3.5vw, 36px);color:#fff;font-weight:800;margin-top:8px;line-height:1.2;">Complete Online Video Editing Course Catalog in Hindi</h2>
                    <p style="color:#94a3b8;font-size:15px;margin-top:10px;">Master editing software, wedding color grading, album layouts, and studio marketing from home.</p>
                </div>

                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Learn Video Editing Online with Studio Practice Assets</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        When you choose to <strong>learn video editing online</strong> through Quick Art Photography Academy, you gain immediate access to high-bitrate 4K project media, custom cinematic LUTs, title templates, and royalty-free wedding audio packs. Every <strong>online video editing course</strong> is produced in crystal-clear 1080p and 4K resolution with professional audio narration by Anil Sharma.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Our <strong>video editing classes online</strong> are structured in logical, bite-sized lessons that fit around your active studio work. Whether you are cutting multi-cam ceremonies in EDIUS, editing high-energy wedding teasers in Premiere Pro, or mastering node trees in DaVinci Resolve, our step-by-step <strong>video editing course in Hindi</strong> ensures no question goes unanswered.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;">
                        Students receive lifetime portal access, community discord mentorship, periodic live Q&amp;A sessions, and verified Certificate of Completion upon submitting their showreel films.
                    </p>
                </div>

                <!-- Trust Strip -->
                <div style="background:rgba(214,172,98,0.08);border:1px solid rgba(214,172,98,0.25);border-radius:14px;padding:24px 28px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-bottom:30px;">
                    <div>
                        <div style="font-weight:700;color:#fff;font-size:16px;">Anil Sharma, Founder &amp; Lead Mentor</div>
                        <div style="color:#cbd5e1;font-size:13.5px;margin-top:3px;">Helping over 1,800 students across India build profitable wedding post-production careers.</div>
                    </div>
                    <div>
                        <a href="https://maps.app.goo.gl/eRkAc7kia1D1s1zQ7" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#f5c879;color:#000;font-weight:700;font-size:13.5px;padding:10px 20px;border-radius:100px;text-decoration:none;">
                            4.9/5 · 1,800+ student reviews on Google Maps
                        </a>
                    </div>
                </div>

                <!-- Final CTA -->
                <div style="text-align:center;margin-top:30px;padding-top:10px;">
                    <p style="color:#cbd5e1;font-size:15px;max-width:720px;margin:0 auto 20px;line-height:1.7;">
                        Start your post-production journey today. Enroll in an <strong>online video editing course</strong> at Quick Art Photography Academy and master real studio workflows from anywhere in India.
                    </p>
                    <div style="display:inline-flex;gap:14px;flex-wrap:wrap;justify-content:center;">
                        <a href="/portal/" style="background:#f5c879;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">Access Student Portal</a>
                        <a href="https://wa.me/919939800780" target="_blank" rel="noopener" style="background:rgba(255,255,255,0.08);color:#fff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;border:1px solid rgba(255,255,255,0.2);">Chat on WhatsApp</a>
                    </div>
                    <p style="color:#64748b;font-size:12px;margin-top:16px;">Last updated: March 2026</p>
                </div>

            </div>
        </section>
        <!-- End Technical SEO Expansion: online hub -->
    """

    if "<!-- Technical SEO Expansion: online hub -->" not in html:
        footer_idx = html.find("<footer")
        if footer_idx != -1:
            html = html[:footer_idx] + extra_content + "\n" + html[footer_idx:]

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html)
    print("Enhanced online/index.html")

if __name__ == "__main__":
    expand_master_class()
    expand_courses_hub()
    expand_online_hub()
