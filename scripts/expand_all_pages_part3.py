import os
import re

def expand_contact_us():
    filepath = "contact-us/index.html"
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    # Hero first 100 words update
    html = re.sub(
        r'(<p class="hero-sub[^>]*>)(.*?)(</p>)',
        r'\1Get in touch with our admissions team at Quick Art Photography Academy contact desk in Siwan, Bihar. Inquire about course fees, batch dates, free hostel stay, or visit our Ayodhya Puri campus to schedule your free demo class with mentor Anil Sharma.\3',
        html, count=1, flags=re.DOTALL
    )

    extra_content = """
        <!-- Technical SEO Contact Us Expansion -->
        <section class="qa-section bg-ink text-white py-16" style="background:#0c0d0e;border-top:1px solid rgba(214,172,98,0.15);border-bottom:1px solid rgba(214,172,98,0.15);">
            <div class="container" style="max-width:1180px;margin:0 auto;padding:0 20px;">
                <div style="text-align:center;max-width:820px;margin:0 auto 44px;">
                    <p class="qa-kicker" style="color:#f5c879;letter-spacing:0.12em;font-size:12px;font-weight:700;text-transform:uppercase;">Admissions &amp; Studio Tour</p>
                    <h2 style="font-size:clamp(24px, 3.5vw, 36px);color:#fff;font-weight:800;margin-top:8px;line-height:1.2;">Quick Art Photography Academy Contact &amp; Campus Guide</h2>
                    <p style="color:#94a3b8;font-size:15px;margin-top:10px;">Visit our editing lab and hostel facilities in Siwan, Bihar.</p>
                </div>

                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Campus Location &amp; Video Editing Course in Siwan Address</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Quick Art Photography Academy is located in the creative heart of Siwan at Ayodhya Puri, near Lalit Bus Stand. Our official <strong>video editing course in Siwan address</strong> is easily reachable via direct roadways from Gopalganj, Chhapra, Patna, Deoria, and Gorakhpur. For outstation students, our campus location provides immediate access to dining, transit, and academy-provided free hostel rooms.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        When you arrive for your scheduled <strong>free demo class Siwan</strong> visit, our counseling team will introduce you to our licensed workstation lab, demonstrate our 4K raw wedding editing timeline, and outline our customized installment fee schedules. Reaching our <strong>Quick Art Photography Academy contact</strong> desk takes only 5 minutes from Siwan Railway Junction and 2 minutes from Lalit Bus Stand.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;">
                        You can view our location directly on <a href="https://maps.app.goo.gl/eRkAc7kia1D1s1zQ7" target="_blank" rel="noopener" style="color:#f5c879;font-weight:600;text-decoration:none;">Quick Art Photography Academy on Google Maps</a> for GPS driving directions and student reviews.
                    </p>
                </div>

                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
                    <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Book Your Free Demo Class in Siwan</h2>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        Choosing a creative media academy is an important career decision. We encourage all prospective candidates to attend a <strong>free demo class Siwan</strong> session before enrolling. During your demo session, you will sit with lead mentor Anil Sharma, experience our EDIUS, Premiere Pro, and DaVinci Resolve editing rigs firsthand, and inspect the quality of our printed Karizma photobooks.
                    </p>
                    <p style="color:#cbd5e1;font-size:14.5px;line-height:1.7;margin-bottom:14px;">
                        To schedule your trial, simply use our <strong>Quick Art Photography Academy contact</strong> options below. Call our admissions team directly or send a message on WhatsApp for instant confirmation of next available batch dates.
                    </p>
                    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:16px;">
                        <a href="tel:+919939800780" style="background:#f5c879;color:#000;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;">Call +91 99398 00780</a>
                        <a href="https://wa.me/919939800780" target="_blank" rel="noopener" style="background:rgba(255,255,255,0.08);color:#fff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;border:1px solid rgba(255,255,255,0.2);">WhatsApp Admissions</a>
                    </div>
                </div>

                <!-- Trust Strip -->
                <div style="background:rgba(214,172,98,0.08);border:1px solid rgba(214,172,98,0.25);border-radius:14px;padding:24px 28px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-bottom:30px;">
                    <div>
                        <div style="font-weight:700;color:#fff;font-size:16px;">Anil Sharma, Founder &amp; Lead Mentor</div>
                        <div style="color:#cbd5e1;font-size:13.5px;margin-top:3px;">Ayodhya Puri, Near Lalit Bus Stand, Siwan, Bihar - 841226, India.</div>
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
                        Connect directly with our counseling desk via <strong>Quick Art Photography Academy contact</strong> channels and secure your seat in our upcoming offline or online batch.
                    </p>
                    <p style="color:#64748b;font-size:12px;margin-top:16px;">Last updated: March 2026</p>
                </div>

            </div>
        </section>
        <!-- End Technical SEO Contact Us Expansion -->
    """

    if "<!-- Technical SEO Contact Us Expansion -->" not in html:
        footer_idx = html.find("<footer")
        if footer_idx != -1:
            html = html[:footer_idx] + extra_content + "\n" + html[footer_idx:]

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html)
    print("Enhanced contact-us/index.html")

def expand_blog_software():
    filepath = "blog/best-video-editing-software-in-2026/index.html"
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    extra_content = """
        <!-- Technical SEO Blog Software Expansion -->
        <section class="qa-section bg-ink text-white py-12" style="background:#0c0d0e;border-top:1px solid rgba(214,172,98,0.15);border-bottom:1px solid rgba(214,172,98,0.15);margin-top:40px;">
            <div class="container" style="max-width:860px;margin:0 auto;padding:0 20px;">
                <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">Choosing the Best Video Editing Software for Wedding Filmmakers</h2>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:16px;">
                    Finding the <strong>best video editing software</strong> depends heavily on your studio workflow and production demands. For wedding filmmakers in Bihar and Purvanchal, time is money. A platform that crashes during peak wedding delivery seasons or struggles with multi-camera playback will quickly derail client satisfaction.
                </p>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:16px;">
                    When choosing dedicated <strong>video editing software for wedding</strong> projects, you need native support for 10-bit H.264/H.265 files, automated multi-camera audio sync, and robust title typography. That is why professional studios frequently rely on our <a href="/online/premiere-pro-course/" style="color:#f5c879;text-decoration:none;font-weight:600;">Adobe Premiere Pro Online Course</a> for dynamic teaser montages, and our <a href="/online/edius-course/" style="color:#f5c879;text-decoration:none;font-weight:600;">EDIUS Online Course</a> for instant ceremony cutting.
                </p>

                <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin:28px 0 16px;">Premiere Pro vs DaVinci Resolve: Which Should You Master?</h2>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:16px;">
                    The debate around <strong>Premiere Pro vs DaVinci Resolve</strong> comes down to montage flexibility versus surgical color control. Premiere Pro excels at timeline responsiveness, third-party motion templates, and seamless integration with Photoshop. On the other hand, DaVinci Resolve provides an unrivaled node-based color grading engine and Fairlight audio mixer.
                </p>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:16px;">
                    To achieve elite cinematic quality, many top wedding filmmakers rough-cut their films in Premiere Pro and roundtrip the timeline into DaVinci Resolve for final color grading. You can master both workflows in our <a href="/online/davinci-resolve-course/" style="color:#f5c879;text-decoration:none;font-weight:600;">DaVinci Resolve Online Course in Hindi</a>.
                </p>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:20px;">
                    Ultimately, the <strong>best video editing software</strong> is the one you know intimately. Practicing with real 4K footage under expert mentorship will always yield better results than software alone. Explore more tutorials in our <a href="/blog/" style="color:#f5c879;text-decoration:none;font-weight:600;">Editing &amp; Filmmaking Blog</a>.
                </p>

                <!-- Mentor / Trust -->
                <div style="background:rgba(214,172,98,0.08);border:1px solid rgba(214,172,98,0.25);border-radius:12px;padding:20px 24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;margin-top:30px;">
                    <div>
                        <div style="font-weight:700;color:#fff;font-size:15px;">Anil Sharma, Founder &amp; Lead Mentor</div>
                        <div style="color:#cbd5e1;font-size:13px;margin-top:2px;">Quick Art Photography Academy, Siwan, Bihar.</div>
                    </div>
                    <div>
                        <a href="https://maps.app.goo.gl/eRkAc7kia1D1s1zQ7" target="_blank" rel="noopener" style="background:#f5c879;color:#000;font-weight:700;font-size:13px;padding:8px 16px;border-radius:100px;text-decoration:none;">
                            4.9/5 · 1,800+ student reviews on Google Maps
                        </a>
                    </div>
                </div>
                <p style="color:#64748b;font-size:12px;margin-top:12px;">Last updated: March 2026</p>
            </div>
        </section>
        <!-- End Technical SEO Blog Software Expansion -->
    """

    if "<!-- Technical SEO Blog Software Expansion -->" not in html:
        footer_idx = html.find("<footer")
        if footer_idx != -1:
            html = html[:footer_idx] + extra_content + "\n" + html[footer_idx:]

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html)
    print("Enhanced blog/best-video-editing-software-in-2026/index.html")

def expand_blog_freelance():
    filepath = "blog/freelance-video-editor-earn-in-bihar/index.html"
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    extra_content = """
        <!-- Technical SEO Blog Freelance Expansion -->
        <section class="qa-section bg-ink text-white py-12" style="background:#0c0d0e;border-top:1px solid rgba(214,172,98,0.15);border-bottom:1px solid rgba(214,172,98,0.15);margin-top:40px;">
            <div class="container" style="max-width:860px;margin:0 auto;padding:0 20px;">
                <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">How to Become a Video Editor &amp; Scale Your Earnings in Bihar</h2>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:16px;">
                    Wondering <strong>how to become a video editor</strong> and build a thriving creative business right here in Bihar? The demand for skilled freelance video editors has exploded across Siwan, Gopalganj, Chhapra, and Patna. Local wedding studios, coaching institutes, YouTube channels, and regional brands are actively searching for editors who can deliver crisp, polished content quickly.
                </p>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:16px;">
                    To establish yourself as a dependable <strong>freelance video editor in Bihar</strong>, focus on three foundational pillars: building a bulletproof portfolio, mastering keyboard speed shortcuts, and developing clear client communication. Enrolling in a project-based offline program like our <a href="/courses/video-editing/" style="color:#f5c879;text-decoration:none;font-weight:600;">6-Week Video Editing Course in Siwan</a> gives you direct access to 4K raw wedding footage, helping you build a showreel that commands premium rates.
                </p>

                <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin:28px 0 16px;">Understanding the Video Editor Salary in India &amp; Freelance Potential</h2>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:16px;">
                    While entry-level corporate <strong>video editor salary in India</strong> typically ranges between ₹20,000 to ₹35,000 per month, independent freelance editors often earn significantly more. A freelance editor handling 4 wedding highlight films and 10 Instagram reels per month in the regional wedding market can easily earn ₹50,000 to ₹80,000+ during active wedding dates.
                </p>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:16px;">
                    Adding complementary skills like wedding photobook design through our <a href="/courses/album-design/" style="color:#f5c879;text-decoration:none;font-weight:600;">Wedding Album Design Course</a> allows you to offer complete end-to-end media packages. For candidates looking to work remotely across India, our <a href="/online/" style="color:#f5c879;text-decoration:none;font-weight:600;">Online Masterclasses Catalog</a> teaches digital marketing and client acquisition frameworks.
                </p>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:20px;">
                    Building a career as a <strong>freelance video editor in Bihar</strong> is no longer a distant dream—it is a viable, high-earning reality for passionate creatives who commit to practical craftsmanship. Read more industry guides in our <a href="/blog/" style="color:#f5c879;text-decoration:none;font-weight:600;">Quick Art Academy Blog</a>.
                </p>

                <!-- Mentor / Trust -->
                <div style="background:rgba(214,172,98,0.08);border:1px solid rgba(214,172,98,0.25);border-radius:12px;padding:20px 24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;margin-top:30px;">
                    <div>
                        <div style="font-weight:700;color:#fff;font-size:15px;">Anil Sharma, Founder &amp; Lead Mentor</div>
                        <div style="color:#cbd5e1;font-size:13px;margin-top:2px;">Quick Art Photography Academy, Siwan, Bihar.</div>
                    </div>
                    <div>
                        <a href="https://maps.app.goo.gl/eRkAc7kia1D1s1zQ7" target="_blank" rel="noopener" style="background:#f5c879;color:#000;font-weight:700;font-size:13px;padding:8px 16px;border-radius:100px;text-decoration:none;">
                            4.9/5 · 1,800+ student reviews on Google Maps
                        </a>
                    </div>
                </div>
                <p style="color:#64748b;font-size:12px;margin-top:12px;">Last updated: March 2026</p>
            </div>
        </section>
        <!-- End Technical SEO Blog Freelance Expansion -->
    """

    if "<!-- Technical SEO Blog Freelance Expansion -->" not in html:
        footer_idx = html.find("<footer")
        if footer_idx != -1:
            html = html[:footer_idx] + extra_content + "\n" + html[footer_idx:]

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html)
    print("Enhanced blog/freelance-video-editor-earn-in-bihar/index.html")

def expand_blog_ai():
    filepath = "blog/how-ai-is-changing-wedding-filmmaking-2026/index.html"
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    extra_content = """
        <!-- Technical SEO Blog AI Expansion -->
        <section class="qa-section bg-ink text-white py-12" style="background:#0c0d0e;border-top:1px solid rgba(214,172,98,0.15);border-bottom:1px solid rgba(214,172,98,0.15);margin-top:40px;">
            <div class="container" style="max-width:860px;margin:0 auto;padding:0 20px;">
                <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:16px;">The Evolution of AI in Wedding Filmmaking Workflows</h2>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:16px;">
                    The integration of <strong>AI in wedding filmmaking</strong> is reshaping how cinematographers and post-production studios operate. What once required hours of tedious manual labor—such as aligning four camera angles to an audio track or removing air conditioner hum from wedding vows—can now be performed in seconds using neural audio and video engines.
                </p>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:16px;">
                    Enrolling in a modern <strong>AI video editing course</strong> enables filmmakers to master text-based rough cutting, automated scene selection, and intelligent face tracking. In our specialized studio modules at Quick Art Photography Academy, students learn how to apply <strong>AI wedding editing</strong> algorithms that smooth skin tones and balance exposure across thousands of indoor reception frames.
                </p>

                <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin:28px 0 16px;">Future-Proofing Your Studio with AI Video Editing Course Skills</h2>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:16px;">
                    Far from replacing editors, artificial intelligence allows creative professionals to deliver wedding films faster, take on more seasonal bookings, and command higher project fees. By learning how to prompt generative fill in Photoshop, isolate instruments in audio mixes, and leverage smart reframing for Instagram reels, filmmakers gain an enormous efficiency advantage.
                </p>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:16px;">
                    Explore our hands-on campus programs in Siwan: the <a href="/courses/ai-wedding-filmmaking/" style="color:#f5c879;text-decoration:none;font-weight:600;">AI Wedding Filmmaking Course in Siwan</a> and the flagship <a href="/master-class/" style="color:#f5c879;text-decoration:none;font-weight:600;">14-Week Wedding Filmmaking Master Class</a>. For self-paced study, browse our <a href="/blog/" style="color:#f5c879;text-decoration:none;font-weight:600;">Filmmaking Learning Guides</a>.
                </p>
                <p style="color:#cbd5e1;font-size:15px;line-height:1.75;margin-bottom:20px;">
                    Embracing <strong>AI in wedding filmmaking</strong> ensures your studio remains competitive, profitable, and technologically advanced for the years ahead.
                </p>

                <!-- Mentor / Trust -->
                <div style="background:rgba(214,172,98,0.08);border:1px solid rgba(214,172,98,0.25);border-radius:12px;padding:20px 24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;margin-top:30px;">
                    <div>
                        <div style="font-weight:700;color:#fff;font-size:15px;">Anil Sharma, Founder &amp; Lead Mentor</div>
                        <div style="color:#cbd5e1;font-size:13px;margin-top:2px;">Quick Art Photography Academy, Siwan, Bihar.</div>
                    </div>
                    <div>
                        <a href="https://maps.app.goo.gl/eRkAc7kia1D1s1zQ7" target="_blank" rel="noopener" style="background:#f5c879;color:#000;font-weight:700;font-size:13px;padding:8px 16px;border-radius:100px;text-decoration:none;">
                            4.9/5 · 1,800+ student reviews on Google Maps
                        </a>
                    </div>
                </div>
                <p style="color:#64748b;font-size:12px;margin-top:12px;">Last updated: March 2026</p>
            </div>
        </section>
        <!-- End Technical SEO Blog AI Expansion -->
    """

    if "<!-- Technical SEO Blog AI Expansion -->" not in html:
        footer_idx = html.find("<footer")
        if footer_idx != -1:
            html = html[:footer_idx] + extra_content + "\n" + html[footer_idx:]

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html)
    print("Enhanced blog/how-ai-is-changing-wedding-filmmaking-2026/index.html")

if __name__ == "__main__":
    expand_contact_us()
    expand_blog_software()
    expand_blog_freelance()
    expand_blog_ai()
