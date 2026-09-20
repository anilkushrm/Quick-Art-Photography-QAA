import os
import re

# Common styles used across enhancements to guarantee responsive obsidian theme consistency
BOX_STYLE = 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:24px;'
GOLD_H2 = 'font-size:22px;color:#f5c879;font-weight:700;margin-bottom:14px;line-height:1.3;'
P_STYLE = 'color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;'

def enhance_courses_video_editing():
    path = "courses/video-editing/index.html"
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    # 1. First 100 words: Ensure primary keyword "video editing course" is right in the hero description
    hero_pattern = re.compile(r'(<p class="hero-sub[^>]*>)(.*?)(</p>)', re.DOTALL)
    if hero_pattern.search(html):
        html = hero_pattern.sub(
            r'\1Master professional wedding storytelling in our intensive 6-week offline video editing course at Quick Art Photography Academy in Siwan, Bihar. Learn EDIUS, Adobe Premiere Pro, and DaVinci Resolve on dedicated studio workstations with 100% practical training and free hostel accommodation.\3',
            html, count=1
        )

    # 2. Add E2 H2 Sections:
    # "Video Editing Course Fees in Siwan" (fees table - REPLACE_WITH_REAL_FEE),
    # "Video Editing Classes Near Me – Siwan, Gopalganj, Chhapra, Patna",
    # "Wedding Video Editing Course", "Video Editing Course in Hindi",
    # "Why This Is the Best Video Editing Course in Bihar", and an FAQ (fees, duration, beginners, certificate)
    e2_content = """
        <!-- Technical SEO Content Expansion: E2 Comprehensive Modules & Local SEO -->
        <section class="qa-section bg-ink text-white py-16" style="background:#0c0d0e;border-top:1px solid rgba(214,172,98,0.15);border-bottom:1px solid rgba(214,172,98,0.15);">
            <div class="container" style="max-width:1180px;margin:0 auto;padding:0 20px;">
                <div style="text-align:center;max-width:820px;margin:0 auto 44px;">
                    <p class="qa-kicker" style="color:#f5c879;letter-spacing:0.12em;font-size:12px;font-weight:700;text-transform:uppercase;">6-Week Studio Immersion in Bihar</p>
                    <h2 style="font-size:clamp(24px, 3.5vw, 36px);color:#fff;font-weight:800;margin-top:8px;line-height:1.2;">Everything You Need to Know About Our Video Editing Course</h2>
                    <p style="color:#94a3b8;font-size:15px;margin-top:10px;">Hands-on offline training in Siwan covering EDIUS Pro, Adobe Premiere Pro, and DaVinci Resolve.</p>
                </div>

                <!-- Section 1: Video Editing Course Fees in Siwan -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Video Editing Course Fees in Siwan</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:16px;">
                        When planning your creative education, understanding the <strong>video editing course fees</strong> and what is included in the package is critical. At Quick Art Photography Academy, our transparent fee structure covers complete practical studio lab access, licensed editing suites, raw footage project assets, and free hostel accommodation for outstation students.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:20px;">
                        Below is a detailed overview of our 6-week offline <strong>video editing course</strong> specifications. We offer flexible installment options and special early-registration benefits for upcoming batches:
                    </p>

                    <div style="overflow-x:auto;margin-bottom:20px;">
                        <table style="width:100%;border-collapse:collapse;color:#cbd5e1;font-size:14px;text-align:left;">
                            <thead>
                                <tr style="background:rgba(214,172,98,0.12);color:#f5c879;border-bottom:1px solid rgba(214,172,98,0.3);">
                                    <th style="padding:14px 16px;">Course Component</th>
                                    <th style="padding:14px 16px;">Details &amp; Inclusions</th>
                                    <th style="padding:14px 16px;">Course Fees</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                                    <td style="padding:14px 16px;font-weight:600;color:#fff;">6-Week Video Editing Course (Offline)</td>
                                    <td style="padding:14px 16px;">EDIUS Pro, Adobe Premiere Pro, DaVinci Resolve, Multicam Sync, Color Grading</td>
                                    <td style="padding:14px 16px;font-weight:700;color:#f5c879;">REPLACE_WITH_REAL_FEE</td>
                                </tr>
                                <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                                    <td style="padding:14px 16px;font-weight:600;color:#fff;">Hostel &amp; Accommodation</td>
                                    <td style="padding:14px 16px;">Clean student stay facility near campus for Gopalganj, Chhapra &amp; Patna students</td>
                                    <td style="padding:14px 16px;font-weight:700;color:#4ade80;">100% Free Included</td>
                                </tr>
                                <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                                    <td style="padding:14px 16px;font-weight:600;color:#fff;">Project Files &amp; LUTs Package</td>
                                    <td style="padding:14px 16px;">Over 500GB+ 4K wedding footage, cinematic sound effects, title templates</td>
                                    <td style="padding:14px 16px;font-weight:700;color:#4ade80;">Free Lifetime Access</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;font-weight:600;color:#fff;">Certification &amp; Demo Class</td>
                                    <td style="padding:14px 16px;">ISO 9001:2015 aligned Academy Completion Certificate + 1-on-1 trial session</td>
                                    <td style="padding:14px 16px;font-weight:700;color:#4ade80;">Free Demo Available</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p style="color:#94a3b8;font-size:13px;line-height:1.6;">
                        * To confirm exact <strong>video editing course fees</strong>, installment options, and scholarship criteria for this month's batch, <a href="/contact-us/" style="color:#f5c879;text-decoration:none;">contact our admissions desk</a> or call +91 9939800780.
                    </p>
                </div>

                <!-- Section 2: Video Editing Classes Near Me -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Video Editing Classes Near Me – Siwan, Gopalganj, Chhapra, Patna</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Students across Bihar frequently search for professional <strong>video editing classes near me</strong> that provide physical workstation practice instead of recorded video lectures. Quick Art Photography Academy is conveniently located at Ayodhya Puri near Lalit Bus Stand in Siwan, making it accessible for candidates travelling daily or weekly from neighbouring districts.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Whether you are traveling from Gopalganj (35 km), Chhapra (65 km), Patna, Deoria, or Gorakhpur, our offline campus offers the ideal creative environment. Having free hostel accommodation on campus eliminates daily commuting stress, enabling students to edit late into the evening during intensive multi-camera wedding projects.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;">
                        If you are looking for top-rated <strong>video editing classes</strong> with dedicated mentor support in North Bihar, our Siwan academy provides a direct highway and railway link from all major regional junctions.
                    </p>
                </div>

                <!-- Section 3: Wedding Video Editing Course -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Wedding Video Editing Course</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Wedding videography represents the largest and most lucrative commercial segment for editors in Bihar and Purvanchal. Our specialized <strong>wedding video editing course</strong> is structured around real client expectations: high-energy teasers, cinematic highlights, emotional speeches, traditional ceremony rituals, and modern Instagram reels.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        You will learn the entire post-production pipeline: ingesting multicam footage from Sony, Canon, and Panasonic cameras, auto-syncing audio tracks from lapels and DJ mixers, beat-matching edits to modern royalty-free wedding soundtracks, and color grading skin tones under mixed venue lights.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;">
                        By the end of this <strong>wedding video editing course</strong>, every student edits a complete 3-to-5 minute cinematic wedding film under mentor supervision, providing a ready-to-pitch showreel for local studios and international freelance clients.
                    </p>
                </div>

                <!-- Section 4: Video Editing Course in Hindi -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Video Editing Course in Hindi</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Learning complex non-linear editing software can feel intimidating when tutorials are taught in English or rely on dense jargon. That is why our <strong>video editing course in Hindi</strong> explains every concept in simple, everyday language that any passionate beginner can immediately grasp.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Mentor Anil Sharma breaks down advanced editing theory—such as J-cuts, L-cuts, proxy creation, color wheels, node graphs, and bitrate exports—using practical analogies and keyboard shortcuts. Students can ask questions freely in Hindi and Bhojpuri, ensuring no one is left behind.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;">
                        Prefer to study from home? Explore our specialized online masterclasses: <a href="/online/premiere-pro-course/" style="color:#f5c879;text-decoration:none;font-weight:600;">Adobe Premiere Pro Course in Hindi</a>, <a href="/online/davinci-resolve-course/" style="color:#f5c879;text-decoration:none;font-weight:600;">DaVinci Resolve Online Course</a>, and <a href="/online/edius-course/" style="color:#f5c879;text-decoration:none;font-weight:600;">EDIUS Fast Wedding Editing Course</a>.
                    </p>
                </div>

                <!-- Section 5: Why This Is the Best Video Editing Course in Bihar -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Why This Is the Best Video Editing Course in Bihar</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        What sets Quick Art Photography Academy apart as the <strong>best video editing course in Bihar</strong> is our uncompromised focus on practical, portfolio-driven education. Unlike traditional computer coaching centres that teach outdated software from books, our students work on dedicated high-performance editing rigs equipped with high-refresh monitors, NVMe storage, and dedicated GPUs.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Our <strong>video editing course</strong> emphasizes real market skills: handling tight wedding turnaround deadlines, batch exporting for WhatsApp preview, mastering keyboard shortcuts for 3x editing speed, and building professional client pitch decks. For aspiring studio owners, we also offer the comprehensive <a href="/master-class/" style="color:#f5c879;text-decoration:none;font-weight:600;">14-Week Wedding Filmmaking Master Class</a> combining cinematography, editing, and business growth.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;">
                        With over 1,800 trained alumni working across studios in Bihar, Jharkhand, Uttar Pradesh, and Delhi NCR, our reputation for genuine creative craftsmanship is unmatched in the state.
                    </p>
                </div>

                <!-- Section 6: Comprehensive FAQ Section -->
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:20px;">Frequently Asked Questions About Our Video Editing Course</h2>
                    
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;" open>
                            <summary style="font-weight:700;color:#fff;font-size:16px;cursor:pointer;">What is the duration and daily schedule of this video editing course?</summary>
                            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;">
                                The course duration is 6 weeks of intensive offline studio training. Daily classes include 2 hours of direct mentor-led instruction followed by unlimited practical lab practice on dedicated academy editing workstations.
                            </p>
                        </details>

                        <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;">
                            <summary style="font-weight:700;color:#fff;font-size:16px;cursor:pointer;">Can a complete beginner join these video editing classes?</summary>
                            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;">
                                Yes! No prior video editing or computer programming experience is required. We start from basic computer handling, folder management, and timeline navigation before advancing to complex multi-cam editing and color grading.
                            </p>
                        </details>

                        <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;">
                            <summary style="font-weight:700;color:#fff;font-size:16px;cursor:pointer;">How do the video editing course fees compare to institutes in Patna or Delhi?</summary>
                            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;">
                                Our video editing course fees are highly affordable and include 100% free hostel stay for outstation students. Metropolitan institutes charge 3x to 5x higher while excluding living costs. Contact us for the complete fee schedule and installment plans.
                            </p>
                        </details>

                        <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;">
                            <summary style="font-weight:700;color:#fff;font-size:16px;cursor:pointer;">Will I receive an accredited certificate upon course completion?</summary>
                            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;">
                                Yes. After submitting your final wedding film and showreel project, you receive a verified Certificate of Completion from Quick Art Photography Academy aligned with ISO 9001:2015 educational standards.
                            </p>
                        </details>

                        <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;">
                            <summary style="font-weight:700;color:#fff;font-size:16px;cursor:pointer;">Does the academy guarantee a job or specific freelance earnings?</summary>
                            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;">
                                We do not make false job or income guarantees. Instead, we equip students with real-world practical skills, client pitch strategies, and a strong portfolio showreel that enables graduates to secure freelance clients and studio roles independently.
                            </p>
                        </details>
                    </div>
                </div>

                <!-- Trust Strip / Mentor Block -->
                <div style="background:rgba(214,172,98,0.08);border:1px solid rgba(214,172,98,0.25);border-radius:14px;padding:24px 28px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;">
                    <div>
                        <div style="font-weight:700;color:#fff;font-size:16px;">Anil Sharma, Founder &amp; Lead Mentor</div>
                        <div style="color:#cbd5e1;font-size:13.5px;margin-top:3px;">Personalized mentorship with over a decade of high-end wedding editing experience in Bihar.</div>
                    </div>
                    <div>
                        <a href="https://maps.app.goo.gl/eRkAc7kia1D1s1zQ7" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#f5c879;color:#000;font-weight:700;font-size:13.5px;padding:10px 20px;border-radius:100px;text-decoration:none;">
                            4.9/5 · 1,800+ student reviews on Google Maps
                        </a>
                    </div>
                </div>

                <!-- Final CTA Section Paragraph -->
                <div style="text-align:center;margin-top:40px;padding-top:20px;">
                    <p style="color:#cbd5e1;font-size:15px;max-width:700px;margin:0 auto 20px;line-height:1.7;">
                        Take the first step towards a professional post-production career. Enrol in our 6-week offline <strong>video editing course</strong> in Siwan, attend a free trial class, and experience our studio lab firsthand.
                    </p>
                    <div style="display:inline-flex;gap:14px;flex-wrap:wrap;justify-content:center;">
                        <a href="/contact-us/" style="background:#f5c879;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">Book Free Demo Class</a>
                        <a href="tel:+919939800780" style="background:rgba(255,255,255,0.08);color:#fff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;border:1px solid rgba(255,255,255,0.2);">Call +91 99398 00780</a>
                    </div>
                    <p style="color:#64748b;font-size:12px;margin-top:16px;">Last updated: March 2026</p>
                </div>

            </div>
        </section>
        <!-- End Technical SEO Content Expansion -->
    """

    if "<!-- Technical SEO Content Expansion: E2 Comprehensive Modules" not in html:
        # Insert before footer
        footer_idx = html.find("<footer")
        if footer_idx != -1:
            html = html[:footer_idx] + e2_content + "\n" + html[footer_idx:]

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("Enhanced courses/video-editing/index.html")

if __name__ == "__main__":
    enhance_courses_video_editing()
