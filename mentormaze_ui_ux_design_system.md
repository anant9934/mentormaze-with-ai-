# MentorMaze --- UI/UX, Visual Design & Design System Specification

**Product:** MentorMaze\
**Document type:** Product design system and interface specification\
**Audience:** Product designers, UI/UX designers, frontend engineers,
QA, and content designers\
**Design direction:** Calm, premium, human, trustworthy, editorial, and
conversion-focused\
**Primary experience:** Responsive web application for students,
mentors, and administrators

------------------------------------------------------------------------

## 1. Design Vision

MentorMaze should feel like a trusted place where people find direction,
build relationships, and make measurable progress.

The interface must communicate three things immediately:

1.  **People:** Real mentors with credible experience.
2.  **Direction:** Clear guidance based on the student's goals.
3.  **Progress:** Visible movement from uncertainty to capability.

The visual identity should combine: - Warm, editorial presentation. -
Deep forest-green brand anchors. - Soft natural neutrals. - Strong
typographic hierarchy. - Human photography used with purpose. -
Structured application interfaces that prioritize clarity over
decoration.

### Design principle

> The marketing website should inspire confidence. The application
> should make the next action obvious.

Do not make every page look like a landing page. The landing page can be
expressive; booking, dashboards, forms, interviews, and admin screens
must be operationally clear.

------------------------------------------------------------------------

## 2. Brand Personality

  -----------------------------------------------------------------------
  Attribute               Desired expression      Avoid
  ----------------------- ----------------------- -----------------------
  Trustworthy             Clear facts, verified   Unsupported claims
                          status, transparent     
                          policies                

  Human                   Real mentor portraits,  Generic AI-looking
                          natural language        people everywhere

  Calm                    Warm neutrals,          Neon, visual noise
                          restrained motion       

  Premium                 Editorial typography,   Excessive gradients and
                          precise spacing         glass effects

  Encouraging             Progress-oriented       Infantilizing
                          language                gamification

  Intelligent             Relevant                Opaque AI scores
                          recommendations and     
                          explanations            

  Professional            Consistent components   Inconsistent card
                          and readable data       styles
  -----------------------------------------------------------------------

### Brand voice

-   Direct, clear, and respectful.
-   Encouraging without exaggerated promises.
-   Specific about what a feature does.
-   Short on marketing surfaces.
-   More explanatory inside workflows where users need to make
    decisions.

Examples:

  -----------------------------------------------------------------------
  Use                                 Preferred copy
  ----------------------------------- -----------------------------------
  Hero                                Find the Right Mentor. Grow Faster.

  Mentor discovery                    Mentors matched to your goals.

  Empty state                         No mentors match these filters yet.
                                      Try broadening your search.

  Booking                             Choose a time that works for you.

  Session complete                    Your session is complete. Review
                                      your next steps.

  Interview report                    See what went well and what to
                                      improve.

  Error                               We couldn't load availability. Try
                                      again.
  -----------------------------------------------------------------------

Avoid vague claims such as "Unlock your infinite potential" or
"AI-powered transformation."

------------------------------------------------------------------------

## 3. Core Visual Direction

### 3.1 Primary palette

Use the palette as a starting token system. Validate contrast in the
implemented interface before release.

  Token        Hex         Intended use
  ------------ ----------- ----------------------------------------
  Forest 900   `#123B2E`   Primary brand, dark footer, strong CTA
  Forest 800   `#174B39`   Hover / active brand surfaces
  Forest 700   `#21634A`   Links, icons, secondary emphasis
  Sage 200     `#DDE6D7`   Soft highlight panels
  Sage 100     `#EDF1E8`   Subtle backgrounds
  Cream 50     `#FBF8F1`   Main marketing background
  Cream 100    `#F4EFE4`   Warm section background
  Sand 200     `#DED2BF`   Borders, quiet panels
  Taupe 500    `#A99B87`   Secondary neutral elements
  Ink 950      `#17211E`   Primary text
  Ink 700      `#46514B`   Secondary text
  Ink 500      `#69736D`   Muted text
  White        `#FFFFFF`   Cards and form surfaces
  Border       `#E6E3DA`   Dividers and outlines
  Success      `#28734E`   Successful states
  Warning      `#A66B19`   Warning states
  Danger       `#B53C37`   Errors and destructive actions
  Info         `#315F85`   Informational states

### 3.2 Color usage ratios

For the public website: - 65--75% warm cream / white. - 15--20% forest
green and sage. - 5--10% warm beige / taupe. - Small amounts of semantic
colors only when needed.

For the application: - White and very light neutral surfaces should
dominate. - Forest green should identify primary actions and selected
states. - Sage should group related information. - Semantic colors
should retain consistent meanings.

### 3.3 Color rules

-   Use forest green for the primary CTA, not every button.
-   Use dark ink for body text; do not use green for long paragraphs.
-   Use sage as a background, not as a low-contrast text color.
-   Avoid gradients as a default treatment.
-   Do not use shadows to compensate for weak hierarchy.
-   Do not communicate status through color alone.
-   Keep error, warning, success, and informational colors consistent
    across all roles.

### 3.4 Dark surfaces

Dark forest-green surfaces are appropriate for: - Main footer. - Final
landing-page CTA. - Selected feature panels. - Occasional promotional
banners.

Do not make the entire application dark by default.

------------------------------------------------------------------------

## 4. Typography System

Use a deliberate two-family system: an editorial serif for selected
display moments and a highly readable sans-serif for interface content.

### 4.1 Recommended font pairing

**Display serif:** `DM Serif Display`\
Alternative: `Cormorant Garamond` for more editorial, less geometric
headings.

**Interface sans-serif:** `Inter`\
Alternative: `Manrope` for a slightly warmer product personality.

Use only two primary font families. Avoid mixing several decorative
fonts.

### 4.2 Typography roles

  Role               Desktop size   Mobile size     Weight Font
  ---------------- -------------- ------------- ---------- -------
  Display hero          64--76 px     38--46 px   600--700 Sans
  Display accent        52--64 px     34--40 px        400 Serif
  H1                    48--56 px     34--40 px   650--700 Sans
  H2                    36--42 px     28--32 px   600--700 Sans
  H3                    24--28 px     22--24 px        600 Sans
  H4                    18--20 px         18 px        600 Sans
  Body large            18--20 px     16--18 px        400 Sans
  Body                      16 px     15--16 px        400 Sans
  Small                     14 px     13--14 px        400 Sans
  Caption               12--13 px         12 px        400 Sans
  Button                14--16 px     14--16 px        600 Sans

These are ranges, not permission to use arbitrary values. Establish a
consistent type scale in code.

### 4.3 Typography rules

-   Use sentence case for most interface labels.
-   Use serif typography sparingly: hero accent, selected editorial
    headings, and testimonial section title.
-   Keep body line length around 55--75 characters.
-   Body line-height: approximately 1.5--1.65.
-   Heading line-height: approximately 1.05--1.2.
-   Avoid ultra-light weights for small text.
-   Avoid all-caps navigation except for small eyebrow labels.
-   Do not shrink text to fit a card; redesign the card or allow
    wrapping.

### 4.4 Example hero treatment

**REAL PEOPLE. REAL GUIDANCE.**

# Find the Right Mentor.

# Grow Faster.

Use dark ink for the first line and forest green for the emphasized
line.

------------------------------------------------------------------------

## 5. Layout Grid & Spacing

### 5.1 Grid

-   Desktop content max width: 1200--1320 px.
-   Wide editorial sections may extend to 1440 px.
-   Desktop grid: 12 columns.
-   Tablet grid: 8 columns.
-   Mobile grid: 4 columns.
-   Desktop gutters: 24--32 px.
-   Tablet gutters: 20--24 px.
-   Mobile gutters: 16--20 px.

### 5.2 Spacing scale

Use a 4 px base scale.

  Token          Value
  ------------ -------
  `space-1`       4 px
  `space-2`       8 px
  `space-3`      12 px
  `space-4`      16 px
  `space-5`      20 px
  `space-6`      24 px
  `space-8`      32 px
  `space-10`     40 px
  `space-12`     48 px
  `space-16`     64 px
  `space-20`     80 px
  `space-24`     96 px

### 5.3 Section spacing

-   Desktop: 88--120 px between major sections.
-   Tablet: 64--88 px.
-   Mobile: 48--64 px.
-   Card internal padding: 20--28 px desktop; 16--20 px mobile.

Use whitespace to create hierarchy. Do not fill every empty area with
decorative elements.

### 5.4 Radius system

  Component                       Radius
  -------------------------- -----------
  Small input / control        10--12 px
  Standard card                16--20 px
  Feature card                 20--28 px
  Hero image / large panel     24--32 px
  Pill button                     999 px
  Avatar                             50%

Avoid giving every element the same oversized radius.

------------------------------------------------------------------------

## 6. Photography & Image Art Direction

Images are a major part of MentorMaze's trust system. They must support
the information, not act as decoration.

### 6.1 Mentor portraits

Use: - Natural, professional head-and-shoulder portraits. - Consistent
crop and lighting within a carousel. - Neutral or softly colored
backgrounds. - Diverse, credible professionals. - Real mentor
photographs where available and authorized.

Avoid: - Inconsistent portrait sizes. - Overly polished
synthetic-looking faces. - Random stock photos that do not represent
actual mentors. - Reusing one face across multiple profiles. -
Presenting generated portraits as real verified mentors.

### 6.2 Feature images

  Feature             Appropriate image
  ------------------- ------------------------------------------------
  Live mentorship     Student speaking with mentor over a video call
  Flexible schedule   Desk calendar or scheduling interface
  Progress tracking   Clean progress visualization or upward chart
  Mock interview      Candidate in a structured video interview
  Mentor profile      Consistent professional portrait
  Student success     Authentic student / graduate portrait
  Campus community    Real campus or community photograph

### 6.3 Image treatment

-   Use natural lighting and warm color grading.
-   Preserve skin tones.
-   Prefer images with clear focal subjects.
-   Avoid text baked into images.
-   Use `object-fit: cover` for photography.
-   Define focal position per image; do not blindly center every crop.
-   Use responsive image sizes and modern formats.
-   Lazy-load below-the-fold images.
-   Reserve image dimensions to prevent layout shift.

### 6.4 Asset integrity

Never use a decorative image as a substitute for a functional UI
component. A dashboard preview must represent the actual product
direction. A real mentor card must display the correct person's approved
portrait and verified information.

------------------------------------------------------------------------

## 7. Motion & Interaction Design

Motion should clarify state, continuity, and hierarchy. It should not
distract from reading or block user control.

### 7.1 Hero mentor carousel

The hero may use an automatically advancing 3D-style mentor portrait
rail inspired by the reference.

Behavior: - Show a central featured mentor with adjacent cards. - Side
cards may be slightly smaller and lower emphasis. - Advance
approximately every 4--6 seconds. - Use a smooth 500--800 ms
transition. - Pause on hover and while keyboard focus is inside. - Pause
when the page is not visible. - Provide previous / next controls. -
Provide accessible slide labels and focus states. - Respect
`prefers-reduced-motion`. - Do not auto-advance if the user is
interacting with the carousel.

Mobile: - Keep the active card prominent. - Use horizontal swipe. -
Avoid clipping important profile information. - Keep controls reachable.

### 7.2 Testimonial carousel

-   Advance approximately every 6--8 seconds only if automatic movement
    adds value.
-   Provide visible previous / next buttons.
-   Pause on hover, focus, or touch interaction.
-   Do not move while the user is reading or interacting.
-   On mobile, use swipe with a visible partial next card only when it
    does not reduce readability.

### 7.3 General motion tokens

  Interaction            Duration
  ----------------- -------------
  Hover / focus       120--180 ms
  Button feedback     120--180 ms
  Card transition     200--300 ms
  Modal               180--240 ms
  Section reveal      350--500 ms
  Hero carousel       500--800 ms

Use restrained easing. Avoid parallax, constant floating, and excessive
scroll-triggered animation.

### 7.4 Scroll behavior

-   No forced auto-scroll of the page.
-   No hijacking of trackpad or touch scrolling.
-   Use sticky navigation only when it improves orientation.
-   Reveal content progressively without hiding essential information.
-   Keep anchor links and section navigation functional.
-   Avoid animation that causes layout shifts.

------------------------------------------------------------------------

## 8. Navigation System

### Desktop header

Left: - MentorMaze mark and wordmark.

Center: - Programs - Mentors - Resources

Right: - About - Contact - Get Started

Behavior: - Transparent / warm background at the top of the landing
page. - Optional subtle solid background after scrolling. - Keep the
header compact. - Primary CTA remains visually distinct. - Active
navigation state must be clear.

### Mobile header

-   Logo on the left.
-   Menu control on the right.
-   Use a full-screen or well-structured dropdown menu.
-   Include primary CTA.
-   Keep touch targets at least 44 × 44 px.
-   Do not squeeze the desktop navigation into a tiny row.

### Application navigation

Student, mentor, and admin interfaces must use role-specific navigation.
Do not expose irrelevant links to users.

------------------------------------------------------------------------

## 9. Landing Page --- Section-by-Section Specification

The landing page should tell one coherent story:

**Discover guidance → Understand the process → See the experience →
Trust the outcomes → Take action.**

Keep copy minimal. Use concise headings and let the images, product
preview, and layout carry the narrative.

### Section 1 --- Header

Purpose: Orientation and entry points.

-   Logo.
-   Programs.
-   Mentors.
-   Resources.
-   About.
-   Contact.
-   Get Started.

### Section 2 --- Hero

Eyebrow: `REAL PEOPLE. REAL GUIDANCE.`

Headline:

**Find the Right Mentor.**\
**Grow Faster.**

Supporting line:

`Guidance that moves you forward.`

Actions: - Explore Mentors. - Watch Demo.

Visual: - Large mentor portrait carousel. - One prominent central
profile. - Adjacent profiles with perspective / scale variation. -
Subtle background shapes in sage. - Four small slide indicators.

Do not place paragraphs, feature lists, or multiple competing CTAs in
the hero.

### Section 3 --- Trust / capability strip

Three concise items: - Expert Mentors. - Smart Match. - Track Growth.

Use consistent line icons and subtle dividers. Avoid explanatory
paragraphs here.

### Section 4 --- How MentorMaze Works

Heading: `A clearer path forward.`

Three steps:

1.  **Discover** --- Share your goals.
2.  **Connect** --- Meet the right mentor.
3.  **Grow** --- Turn guidance into progress.

Use three connected cards or a horizontal process. On mobile, stack
vertically.

### Section 5 --- Experience / feature mosaic

Use an asymmetric editorial grid.

**Live Mentorship** - Large image card. - Video-call image on the
left. - Forest-green content panel on the right. - One short heading and
arrow.

**Flexible Schedule** - Calendar photograph or visual. - Warm cream /
beige surface.

**See Progress** - Progress chart / growth visual. - Sage surface.

The cards should have a shared visual system but different proportions.
Do not force equal-sized tiles.

### Section 6 --- Product experience

Show a genuine MentorMaze student dashboard preview.

The preview should communicate: - Next session. - Current goals. -
Mentorship progress. - Pending action items.

Beside or below it, use a concise heading:

**Your growth, in one place.**

Supporting points: - Personalized guidance. - Clear next steps. -
Visible progress.

Use a real product screenshot or a carefully designed, accurate mock
interface. Do not show fabricated performance statistics.

### Section 7 --- Mentorship and mock interviews

The platform has two core service paths. Make the choice explicit.

**Mentorship** - Long-term guidance. - Career direction. - Skill
development. - Ongoing mentor relationship.

**Mock Interviews** - Role-specific practice. - Human interviewer. -
Structured feedback. - Repeat practice.

CTA labels: - Find a Mentor. - Practice an Interview.

Do not bury mock interviews inside a generic feature list.

### Section 8 --- Real Impact / testimonials

Heading: `Real Impact.`

-   Three testimonial cards on desktop.
-   Portrait, short quote, name, and relevant context.
-   Star ratings only if they come from actual platform feedback.
-   Previous / next controls.
-   Optional automatic carousel with pause controls.

Never fabricate testimonials, names, or ratings. Use approved
placeholder content during development.

### Section 9 --- Final CTA

Use a wide dark forest-green banner with an authentic aspirational
image.

Heading: `Start Your Journey.`

CTA: `Get Started →`

The image can show a learner moving toward a goal, but avoid generic
stock-photo clichés.

### Section 10 --- Footer

Use the dedicated footer specification in Section 10 of this document.

------------------------------------------------------------------------

## 10. Footer Design

The footer should feel like a deliberate closing chapter, not an
oversized list of links.

### Visual structure

-   Warm cream transition area above.
-   Organic, flowing wave boundary.
-   Deep forest-green main surface.
-   Subtle tonal wave detail at the bottom.
-   Light cream text and icons.
-   Thin divider above legal links.

### Desktop layout

**Column 1 --- Brand** - MentorMaze logo. -
`A mentorship platform to learn, grow, and achieve your goals.` - Social
links: LinkedIn, X, Instagram, YouTube, GitHub (only where official
accounts exist).

**Column 2 --- Product** - Platform. - Programs. - Mentors.

**Column 3 --- Resources** - Documentation. - Guides. - Blog.

**Column 4 --- Company** - About Us. - Contact. - Support.

### Newsletter panel

Heading: `Stay in the Loop`

Description: `Updates on mentors, programs, and new features.`

-   Email input.
-   Submit arrow button.
-   Clear validation and success / error states.
-   Consent text and privacy link where required.

Do not use a decorative newsletter form that does not submit.

### Legal row

-   Copyright year generated dynamically.
-   Privacy Policy.
-   Terms of Service.
-   Cookie Policy.
-   Language selector only if multiple languages are supported.

### Mobile footer

Stack in this order: 1. Brand and short description. 2. Social links. 3.
Product links. 4. Resources links. 5. Company links. 6. Newsletter. 7.
Legal links.

Use expandable link groups only if they materially improve mobile
scanning. Do not create excessive vertical gaps between headings and
links.

### Footer wave

Use an SVG or CSS shape with a restrained curve. The wave must be
responsive and must not overlap or obscure content. Avoid floating
decorative spheres and unrelated ornaments.

------------------------------------------------------------------------

## 11. Mentor Discovery & Recommendation UI

This is a decision interface, not a marketing gallery.

### Page heading

`Mentors for your goals`

Supporting context: `Matched to your interests, skills, and next steps.`

### Recommendation area

Show the top three recommended mentors based on the student's authorized
profile and stated goals.

Each card should include:

-   Mentor portrait.
-   Full name.
-   Current role and organization.
-   Verified status.
-   Relevant expertise.
-   Experience.
-   Languages.
-   Session type.
-   Availability preview.
-   Concise match explanation.
-   View Profile.
-   Book Session.

### Card hierarchy

1.  Identity and role.
2.  Why this mentor is relevant.
3.  Expertise and evidence.
4.  Availability.
5.  Actions.

Do not fill cards with every field from the mentor database.

### Filters

-   Domain.
-   Expertise.
-   Experience.
-   Language.
-   Session format.
-   Availability.
-   Price, if applicable.

### Matching transparency

Use explanations such as: -
`Relevant to your backend development goal.` -
`Can help with API design and databases.` -
`Available in your preferred time window.`

Avoid unsupported "98% perfect match" labels.

### No-match state

`No strong matches found yet.`

Offer: - Broaden filters. - Change goals. - Request a mentor. - Explore
all approved mentors.

------------------------------------------------------------------------

## 12. Mentor Profile Page

The profile must answer four questions:

1.  Who is this mentor?
2.  What can they help me with?
3.  Why should I trust them?
4.  How can I book them?

### Above the fold

-   Portrait.
-   Name.
-   Role and organization.
-   Verification status.
-   Expertise tags.
-   Short professional introduction.
-   Rating and review count, only when supported by actual data.
-   Next available slot.
-   Book Session CTA.

### Profile sections

1.  Overview.
2.  Expertise.
3.  Professional experience.
4.  Mentorship topics.
5.  Mock interview categories.
6.  Mentoring approach.
7.  Session format and languages.
8.  Availability.
9.  Student reviews.
10. Frequently asked questions.

### Sticky booking panel

Desktop: - Sticky right-side panel where space permits.

Mobile: - Bottom booking CTA that does not cover content or
accessibility controls.

------------------------------------------------------------------------

## 13. Booking Flow

The booking experience should minimize uncertainty and prevent
accidental bookings.

### Steps

1.  Choose service: mentorship or mock interview.
2.  Select topic / objective.
3.  Choose date.
4.  Choose available time.
5.  Review duration, format, price, and cancellation policy.
6.  Add optional context or questions.
7.  Confirm booking.
8.  Show confirmation and next steps.

### UI requirements

-   Display timezone.
-   Clearly distinguish available, selected, and unavailable slots.
-   Never imply a slot is available until the booking service confirms
    it.
-   Prevent double booking.
-   Show loading and retry states.
-   Explain payment requirements before confirmation.
-   Provide reschedule / cancellation rules.
-   Send confirmation through configured notification channels.

### Confirmation screen

-   Mentor / interviewer.
-   Service type.
-   Date and time.
-   Meeting format.
-   Preparation checklist.
-   Add to calendar.
-   View booking.

------------------------------------------------------------------------

## 14. Mock Interview Experience

Mock interviews must be a first-class product path, not an afterthought.

### Interview discovery

Allow students to choose: - Target role. - Interview type. - Experience
level. - Topics. - Difficulty. - Language. - Human interviewer or AI
practice, when available.

### Interview booking

Use a workflow consistent with mentorship booking, but label the service
and expected outcome clearly.

### Preparation screen

Show: - Interview details. - Topics. - Duration. - Required setup. -
Optional resume / project context. - Join instructions.

### Feedback report

Use structured sections: - Overall summary. - Strengths. - Areas to
improve. - Rubric dimensions. - Question-level feedback where
appropriate. - Recommended practice. - Next step.

Do not present an opaque score without rubric definitions and evidence.

------------------------------------------------------------------------

## 15. Student Dashboard

The dashboard should answer:

-   What should I do next?
-   What is happening soon?
-   Am I making progress?

### Information hierarchy

1.  Welcome and next action.
2.  Upcoming session.
3.  Current goals.
4.  Pending action items.
5.  Mentorship progress.
6.  Mock interview history.
7.  Recommended mentors / practice.
8.  Recent feedback.

### Visual treatment

-   White cards on a very light neutral background.
-   Forest-green primary actions.
-   Sage progress surfaces.
-   Simple charts with labeled values.
-   No decorative charts without useful data.

### Empty state

When a student has no mentorship yet, prioritize:
`Start by choosing your goal.`

Show a clear action to find a mentor or book a mock interview.

------------------------------------------------------------------------

## 16. Mentor Dashboard

The mentor dashboard should optimize for preparation, delivery, and
follow-up.

### Main sections

1.  Overview.
2.  Upcoming sessions.
3.  Student requests.
4.  My students.
5.  Availability.
6.  Session history.
7.  Feedback and action items.
8.  Earnings / payouts, if applicable.
9.  Profile and settings.

### Dashboard priorities

-   Next session and preparation brief.
-   Requests requiring action.
-   Availability status.
-   Pending session feedback.
-   Student progress visible under the correct permissions.

### Mentor profile management

Provide clear controls for: - Expertise. - Experience. - Mentorship
topics. - Interview categories. - Languages. - Availability. - Session
formats. - Profile visibility.

------------------------------------------------------------------------

## 17. Admin Dashboard

Admin UI should prioritize operational clarity, not visual storytelling.

### Main sections

-   Overview.
-   Student accounts.
-   Mentor applications.
-   Verification queue.
-   Mentor directory.
-   Programs / services.
-   Bookings and sessions.
-   Mock interviews.
-   Reports and analytics.
-   Support and disputes.
-   Roles and permissions.
-   Audit logs.
-   Platform settings.

### Admin table rules

-   Clear column labels.
-   Search and filters.
-   Sortable columns.
-   Pagination.
-   Bulk actions only where safe.
-   Confirmation for destructive actions.
-   Visible status labels.
-   Audit trail for consequential decisions.

### Admin visual style

-   Neutral light background.
-   Compact but readable tables.
-   Minimal decoration.
-   Strong status and action hierarchy.
-   Dense information only where it improves operational efficiency.

------------------------------------------------------------------------

## 18. Component Design System

Build reusable components before implementing each page independently.

### Buttons

**Primary** - Forest 900 background. - White text. - Pill or 12 px
radius depending on context. - Clear hover, focus, pressed, loading, and
disabled states.

**Secondary** - Transparent or cream surface. - Forest outline or dark
text.

**Tertiary** - Text action with clear hover and focus.

**Destructive** - Danger color. - Explicit confirmation for
consequential actions.

### Cards

Variants: - Mentor card. - Feature card. - Testimonial card. - Session
card. - Goal card. - Dashboard metric card. - Admin data card.

Each variant must have a defined content hierarchy. Do not create a new
visual treatment for every page.

### Inputs

-   Visible label.
-   Helper text where needed.
-   Error text adjacent to the field.
-   Clear focus ring.
-   Correct input type.
-   Accessible required / optional indicators.

### Status labels

Use consistent text and semantic colors: - Pending. - Approved. -
Rejected. - Scheduled. - Completed. - Cancelled. - In review. - Action
required.

### Other components

-   Avatar.
-   Badge.
-   Tabs.
-   Dropdown.
-   Search.
-   Date picker.
-   Time-slot selector.
-   Modal.
-   Drawer.
-   Tooltip.
-   Toast.
-   Breadcrumb.
-   Pagination.
-   Empty state.
-   Skeleton loader.
-   Progress indicator.

------------------------------------------------------------------------

## 19. Responsive Design

Design mobile-first, then expand.

### Breakpoint proposal

  Name                         Width
  -------------- -------------------
  Small mobile           360--389 px
  Mobile                 390--767 px
  Tablet                768--1023 px
  Desktop              1024--1439 px
  Wide desktop     1440 px and above

### Mobile requirements

-   Single-column primary content.
-   Full-width CTA where appropriate.
-   Readable typography.
-   No horizontal page overflow.
-   Touch targets at least 44 × 44 px.
-   Simplified navigation.
-   Cards stack in logical order.
-   Sticky actions must not obscure content.
-   Tables convert to responsive cards or controlled horizontal
    scrolling.
-   Images retain useful focal points.

### Tablet requirements

-   Use two-column layouts where useful.
-   Avoid simply stretching mobile cards.
-   Keep form widths readable.
-   Maintain clear navigation and content hierarchy.

### Desktop requirements

-   Use the full grid.
-   Keep text widths controlled.
-   Use multi-column layouts to improve comparison.
-   Preserve whitespace and clear scanning paths.

------------------------------------------------------------------------

## 20. Accessibility Requirements

Target WCAG 2.2 AA.

-   Text contrast: at least 4.5:1 for normal text.
-   Large text contrast: at least 3:1.
-   Visible keyboard focus.
-   Logical heading hierarchy.
-   Keyboard-operable navigation, forms, dialogs, and carousels.
-   Accessible names for icon-only controls.
-   Alt text for meaningful images.
-   Empty alt text for purely decorative images.
-   Captions / alternatives for video content.
-   Reduced-motion support.
-   Error messages associated with inputs.
-   Do not rely on color alone.
-   Support zoom and reflow.
-   Screen-reader announcements for booking and form status changes.

Carousels must provide pause controls and must not trap keyboard focus.

------------------------------------------------------------------------

## 21. Content Design & UX Writing

### Writing rules

-   Use short headings.
-   Lead with the user's task or outcome.
-   Explain unfamiliar terms.
-   Avoid internal product jargon.
-   Avoid unnecessary marketing adjectives.
-   Use consistent verbs for actions.
-   Keep button labels specific.

### Preferred action labels

  Context              Label
  -------------------- --------------------
  Mentor discovery     Explore Mentors
  Mentor profile       View Profile
  Booking              Book Session
  Interview            Practice Interview
  Goals                Set a Goal
  Session              Join Session
  Feedback             View Feedback
  Profile              Edit Profile
  Admin verification   Review Application

### Error writing

A good error message explains: 1. What happened. 2. What the user can do
next.

Example:

`We couldn't confirm this time slot. Choose another available time.`

### Empty states

Every empty state should include: - A clear explanation. - A useful next
action. - No fake metrics or placeholder records in production.

------------------------------------------------------------------------

## 22. Design Tokens & Frontend Implementation

Create design tokens centrally. Avoid scattered one-off values.

Illustrative CSS:

``` css
:root {
  --color-forest-900: #123B2E;
  --color-forest-800: #174B39;
  --color-forest-700: #21634A;

  --color-sage-200: #DDE6D7;
  --color-sage-100: #EDF1E8;

  --color-cream-50: #FBF8F1;
  --color-cream-100: #F4EFE4;
  --color-sand-200: #DED2BF;

  --color-ink-950: #17211E;
  --color-ink-700: #46514B;
  --color-ink-500: #69736D;

  --color-white: #FFFFFF;
  --color-border: #E6E3DA;

  --font-display: "DM Serif Display", Georgia, serif;
  --font-ui: "Inter", Arial, sans-serif;

  --radius-control: 12px;
  --radius-card: 20px;
  --radius-feature: 28px;
  --radius-pill: 999px;

  --content-max: 1280px;
}
```

Implementation requirements: - Use semantic design tokens. - Build a
shared component library. - Define variants rather than duplicating
components. - Keep layout and content separate. - Use responsive image
handling. - Avoid hardcoded widths that break mobile. - Keep animation
logic accessible. - Use real data states, not screenshots, for
functional UI. - Keep page-level styles consistent with the shared
design system.

------------------------------------------------------------------------

## 23. Page-Level Visual Priority

Not every page should use the same visual density.

  Page                Visual priority                   Density
  ------------------- --------------------------------- --------------
  Landing page        Brand, trust, story, conversion   Low
  Mentor discovery    Comparison and relevance          Medium
  Mentor profile      Credibility and booking           Medium
  Booking             Date, time, price, confirmation   Low
  Student dashboard   Next action and progress          Medium
  Mentor dashboard    Sessions and workload             Medium--high
  Mock interview      Focus and preparation             Low
  Interview report    Evidence and feedback             Medium
  Admin dashboard     Operations and status             High
  Settings            Clear forms and permissions       Medium

------------------------------------------------------------------------

## 24. Anti-Patterns --- Do Not Use

-   Neon colors.
-   Excessive gradients.
-   Glassmorphism as the default surface.
-   Large blurred shadows on every card.
-   Random decorative 3D objects.
-   Too many font families.
-   Tiny body text.
-   Excessive rounded pills on every component.
-   Generic AI-generated portraits presented as actual mentors.
-   Fake testimonials, ratings, statistics, or verification badges.
-   Auto-scrolling page content.
-   Carousels that move without pause controls.
-   Dashboard charts without meaningful data.
-   Overloaded mentor cards.
-   Repeated CTAs in every section.
-   Long paragraphs on the landing page.
-   Identical layout patterns across all user roles.
-   AI-generated scores without an understandable rubric.

------------------------------------------------------------------------

## 25. Design QA Checklist

### Brand and visual consistency

-   [ ] Palette uses approved tokens.
-   [ ] Typography uses the approved font pairing.
-   [ ] Spacing and radii are consistent.
-   [ ] Images match their actual content.
-   [ ] No placeholder imagery remains in production.
-   [ ] Buttons and cards use defined variants.

### Landing page

-   [ ] Hero communicates the value proposition quickly.
-   [ ] Mentor carousel works with keyboard and touch.
-   [ ] Carousel has pause controls and reduced-motion support.
-   [ ] Feature mosaic tells a coherent story.
-   [ ] Mentorship and mock interview paths are distinct.
-   [ ] Testimonials are authentic and approved.
-   [ ] Footer contains working links and newsletter behavior.

### Application

-   [ ] Student, mentor, and admin navigation are role-specific.
-   [ ] Booking states are accurate.
-   [ ] Forms have validation and useful errors.
-   [ ] Empty, loading, success, and failure states exist.
-   [ ] Sensitive information is not exposed to the wrong role.
-   [ ] Dashboards use real data and meaningful visualizations.

### Responsive and accessible

-   [ ] No horizontal overflow at supported widths.
-   [ ] Touch targets meet minimum size.
-   [ ] Contrast meets WCAG AA.
-   [ ] Keyboard navigation works.
-   [ ] Focus indicators are visible.
-   [ ] Screen readers receive meaningful labels.
-   [ ] Reduced motion is respected.
-   [ ] Zoom and reflow do not break layouts.

------------------------------------------------------------------------

## 26. Final Design Direction

MentorMaze should use a **warm editorial + forest-green product design
system**.

The public landing page should feel aspirational and human through: -
Large, confident typography. - A distinctive mentor portrait carousel. -
An asymmetric image-led feature mosaic. - A clear product preview. -
Separate mentorship and mock interview journeys. - Authentic
testimonials. - A dark forest-green CTA and footer.

The application should feel precise and dependable through: - Readable
sans-serif typography. - White and neutral surfaces. - Strong
information hierarchy. - Evidence-backed mentor profiles. - Clear
booking and interview workflows. - Role-specific dashboards. -
Consistent components and accessible interaction states.

**The final test:** A first-time student should understand what
MentorMaze does, how to find a mentor or book a mock interview, why a
recommendation is relevant, and what happens next---without needing
someone to explain the interface.
