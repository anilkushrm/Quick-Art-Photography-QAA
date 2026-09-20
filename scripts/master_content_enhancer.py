import os
import re

def create_card_grid(cards):
    items = []
    for c in cards:
        items.append(f"""
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:24px;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                    <h3 style="color:#f5c879;font-size:18px;font-weight:700;margin-bottom:10px;line-height:1.3;">{c['title']}</h3>
                    <p style="color:#cbd5e1;font-size:14px;line-height:1.65;margin-bottom:14px;">{c['desc']}</p>
                </div>
                {f'<div style="margin-top:auto;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);"><a href="{c["link"]}" style="color:#f5c879;font-weight:600;font-size:13.5px;text-decoration:none;">{c["link_text"]} &rarr;</a></div>' if 'link' in c else ''}
            </div>
        """)
    return f"""
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:20px;margin-bottom:28px;">
            {''.join(items)}
        </div>
    """

def create_faq_accordion(faqs):
    items = []
    for idx, f in enumerate(faqs):
        open_attr = " open" if idx == 0 else ""
        items.append(f"""
            <details style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px 20px;"{open_attr}>
                <summary style="font-weight:700;color:#fff;font-size:15.5px;cursor:pointer;">{f['q']}</summary>
                <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin-top:10px;margin-bottom:0;">{f['a']}</p>
            </details>
        """)
    return f"""
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
            <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:20px;">Frequently Asked Questions</h2>
            <div style="display:flex;flex-direction:column;gap:14px;">
                {''.join(items)}
            </div>
        </div>
    """

def create_related_courses_block(courses):
    items = []
    for c in courses:
        items.append(f"""
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:22px;display:flex;flex-direction:column;justify:space-between;">
                <div>
                    <span style="font-size:11px;font-weight:700;color:#f5c879;text-transform:uppercase;letter-spacing:0.08em;">{c.get('badge', 'Recommended')}</span>
                    <h3 style="color:#fff;font-size:17px;font-weight:700;margin:8px 0 10px;line-height:1.3;">{c['title']}</h3>
                    <p style="color:#94a3b8;font-size:13.5px;line-height:1.6;margin-bottom:14px;">{c['desc']}</p>
                </div>
                <div style="margin-top:auto;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);">
                    <a href="{c['link']}" style="color:#f5c879;font-weight:600;font-size:13.5px;text-decoration:none;">{c['anchor']} &rarr;</a>
                </div>
            </div>
        """)
    return f"""
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;margin-bottom:30px;">
            <h2 style="font-size:24px;color:#f5c879;font-weight:700;margin-bottom:10px;">Related Creative Masterclasses</h2>
            <p style="color:#94a3b8;font-size:14px;margin-bottom:22px;">Explore complementary offline and online training programs to expand your studio skillset.</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:20px;">
                {''.join(items)}
            </div>
        </div>
    """

def create_trust_and_cta(primary, cta_text):
    return f"""
        <!-- Trust Strip & Author Block -->
        <div style="background:rgba(214,172,98,0.08);border:1px solid rgba(214,172,98,0.25);border-radius:14px;padding:24px 28px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-bottom:30px;">
            <div>
                <div style="font-weight:700;color:#fff;font-size:16px;">Anil Sharma, Founder &amp; Lead Mentor</div>
                <div style="color:#cbd5e1;font-size:13.5px;margin-top:3px;">Personalized mentorship with over a decade of high-end wedding editing and cinematography experience.</div>
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
                {cta_text}
            </p>
            <div style="display:inline-flex;gap:14px;flex-wrap:wrap;justify-content:center;">
                <a href="/contact-us/" style="background:#f5c879;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">Book Free Demo Class</a>
                <a href="tel:+919939800780" style="background:rgba(255,255,255,0.08);color:#fff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;border:1px solid rgba(255,255,255,0.2);">Call +91 99398 00780</a>
            </div>
            <p style="color:#64748b;font-size:12px;margin-top:16px;">Last updated: March 2026</p>
        </div>
    """

print("Loaded master builder base components.")
