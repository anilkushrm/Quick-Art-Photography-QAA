# Quick Art Photography Academy — HTML Website

## VS Code में खोलना

1. ZIP extract करें और `quickart-website` folder को VS Code में खोलें।
2. `index.html` को Live Server से खोलें। Pages को सीधे browser में भी खोल सकते हैं।
3. किसी npm install या build की जरूरत नहीं है। Images और fonts local हैं।

## Pages

| Page | File |
|---|---|
| Home / नया hero | `index.html` |
| About Us | `about-us/index.html` |
| Contact Us | `contact-us/index.html` |
| 14-week Master Class | `master-class/index.html` |
| All courses | `courses/index.html` |
| 6-week Video Editing | `courses/video-editing/index.html` |
| 4-week Album Design | `courses/album-design/index.html` |
| AI Wedding Filmmaking | `courses/ai-wedding-filmmaking/index.html` |
| Blog + three articles | `blog/` |
| Thank You | `thank-you/index.html` |
| Admin / leads dashboard | `admin.html` |
| Sitemap | `sitemap.html`, `sitemap.xml` |
| Course brochure | `downloads/course-details.pdf` |

Old `/courses/graphic-design/` URL redirects to Album Design on Apache hosting. A local HTML redirect is also provided.

## Design and editing

The original website's compiled CSS and local fonts are retained in `home-assets/`. The shared black/gold header, mega-menu, buttons, hover effects, new Home hero and additional page styles are in `site.css`. About-specific styles are in `about.css`. Functionality is in `site.js`.

Every public page contains its full HTML content, header and footer. SEO does not depend on JavaScript rendering. Edit a page's HTML for content. When editing shared navigation later, apply the same change to each public HTML page. The legacy redirect intentionally contains only a destination link.

The separate white statistics section below the Home hero has been removed, as requested.

The Home hero uses your supplied two-column design with the original gold/black palette and the same editing-timeline photo from your supplied hero code and screenshot. The supplied editing-timeline photograph is bundled locally. External Tailwind/Lucide scripts are not required. The Master Class action leads to the complete course page; no intro video was supplied.

## Forms and hosting

The public website is HTML/CSS/JS. Saving real enquiries and running the existing admin dashboard require the included PHP backend on PHP-enabled hosting, such as the existing Hostinger setup. VS Code Live Server serves HTML only; it does not run PHP.

On a PHP server, the form sends JSON to `api/leads.php`. It only opens the Thank You page after the server confirms that the lead was saved. On a local static preview, or if confirmation fails, the form gives the visitor call/email alternatives. No fake confirmation is shown. Without JavaScript, call/email contact details remain available.

The existing supplied PHP API and admin dashboard are retained. Backend runtime and live webhook delivery were not tested in this environment because PHP is unavailable. No test lead was sent to the live academy system.

### Updating the existing hosting

- Back up the existing website first.
- Upload this folder's CONTENTS into the site's document root so `index.html`, `api/` and `home-assets/` sit together.
- Preserve the existing `data/` JSON files, admin settings and leads. This package deliberately includes NO original customer records, sessions, password hashes or webhook credentials. It includes only `data/.htaccess` to protect that directory.
- Preserve/configure your existing webhook settings in the admin dashboard. On a new installation, complete the admin setup before taking enquiries. The existing PHP server needs write access to its data directory and cURL for webhook delivery.
- After deployment, verify one controlled enquiry through to the admin dashboard and Thank You page, and verify the actual webhook destination if used.
- The public Login button still points to the existing external academy learning app; this does not create a replacement LMS.

## Confirmed content

- Album Design: **4 weeks** (your explicit correction).
- Video Editing: **6 weeks** (your explicit correction).
- Complete Master Class: **14 weeks**, consisting of **12 core weeks + 2 free business/marketing/AI weeks** (new supplied PDF).
- Complete Master Class fee: **₹35,000 regular / ₹31,500 one-time payment offer**. Six-month EMI facility and three-instalment total of ₹35,000 are described in the brochure; individual instalment amounts are not invented.
- Separate 4-week/6-week course fees were not specified in the supplied PDF, so those pages request an enquiry instead of using the full Master Class price as their fee.
- The 4-week Album Design syllabus is an editorial organisation of relevant PDF topics into the duration you confirmed. The 6-week Video Editing syllabus uses the six video-training weeks from the PDF.
- AI Wedding Filmmaking is described as a learning area of the complete programme; a separate AI-only course duration/fee is not asserted.
- **1,800+ students**, **support@quickartphotography.in**, **+91 9939800780**.
- The downloadable brochure is the latest file you supplied from your Course Structure folder.
- Conflicting experience counts, unsupported ratings, guaranteed income, old EMI amounts and expiring seat/countdown claims were removed or replaced with grounded copy. Existing student video links are retained.

## SEO

Unique titles/descriptions, canonical URLs, Open Graph and Twitter metadata, semantic headings, image alt text/dimensions, local internal links, breadcrumbs, JSON-LD, XML sitemap and robots.txt are included. Appropriate public pages have EducationalOrganization, WebPage/AboutPage/ContactPage, Course, BreadcrumbList, BlogPosting or visible FAQ structured data. No fabricated review schema is used.

Canonical URLs assume `https://quickartphotography.in/`. If deploying to a different domain, update metadata, structured data, robots.txt and sitemap.xml together. Keep staging copies out of search. On the production domain, submit `https://quickartphotography.in/sitemap.xml` in your Search Console account. SEO implementation does not guarantee ranking or rich results.

## Validation

Checked: all local page links, fragment anchors, CSS/image/font references, unique IDs, one H1 on public content pages, unique titles and JSON-LD parsing. JavaScript syntax and simulated menu/form success/error/fallback paths passed. No real customer data was sent. Live-browser visual testing and PHP/server integration testing were not performed.
