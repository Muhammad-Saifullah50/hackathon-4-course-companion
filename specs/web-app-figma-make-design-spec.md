# Course Companion - Figma Make Specification

Design a responsive web LMS for **Course Companion**, an **AI Agent Development
with Claude Agent SDK** course. Use reusable components, Auto Layout, variants,
and high-fidelity desktop/mobile screens. It should feel calm, technical,
editorial, and credible, not like a generic LMS, chatbot, or children's app.

## Product Rules

The five public Markdown chapters are:

1. Claude Agent SDK Foundations
2. Claude Agent SDK Advanced
3. MCP Introduction
4. MCP Building Servers
5. Agent Skills

Visitors can read chapters and take quizzes. Google or email/password sign-in
saves completion, latest score, and streak. Search, progress, and account data
require authentication. The account also works inside ChatGPT.

Each chapter has five MCQs answered individually with instant correctness,
correct answer, and explanation. Save the final score with completion.
Free/Premium is informational; never lock chapters. Do not add classes,
certificates, community, billing, videos, or an AI chat panel.

## Visual Direction

Use warm off-white, ink text, emerald actions/progress, indigo accents, fine
borders, subtle shadows, generous space, and abstract node graphics. Avoid
robots, stock photos, neon, glossy 3D art, and gradients on cards.

Colors: canvas `#F7F7F3`, surface `#FFFFFF`, ink `#171A18`, muted `#626861`,
border `#DDE1DB`, emerald `#0A7F5A`, indigo `#4F46B8`, success `#137447`,
danger `#B4232C`, code background `#171A18`.

Use Geist/Inter and JetBrains Mono for code. Apply 8px spacing, 16px card
radius, 44px controls, WCAG AA contrast, a 760px reading column, Lucide icons,
and light/dark themes.

Desktop: 12 columns and 1280px content. Tablet: two-column cards. Mobile: one
column, 20px padding, bottom nav, contents drawer, and sticky learning actions.

## Navigation and Components

Visitor nav: brand, Course, Sign in, Create account.
Authenticated nav: Home, Course, Progress, Search, streak, theme, avatar.

Create reusable controls plus progress, streak, chapter, quiz, search, Markdown,
code, feedback, and navigation components. Include hover, focus, disabled,
loading, empty, success, and error states. Never rely on color alone.

## Core Screens

**Landing:** “Learn to build reliable AI agents,” course-path graphic, Start
course/Sign in actions, value cards, chapter preview, and save-progress notice.

**Dashboard:** Greeting, prominent Continue Learning card, 40% progress,
4-day streak, chapter path, recent completions, and search suggestions. Include
a 0% new-user state with “Begin Chapter 1.”

**Course:** Five connected chapter cards with description, quiz label,
completion, latest score, and contextual action. Visitors see Read chapter and
a save-progress prompt. Never show locks.

**Reader:** Left course rail, centered article, optional TOC, reading progress,
styled Markdown, copyable code, callouts, key takeaways, completion, quiz, and
previous/next actions. Mobile uses a drawer and sticky actions.

**Quiz:** Intro, then one question with five-step progress, four radio cards,
and Check answer. Lock graded choices and show answer plus explanation. Results
show score, correctness summary, Review, Retake, and Save/Sign in. No timer or
confetti.

**Search:** Authenticated overlay/page with suggestions, loading, ranked
excerpt results, empty state, and chapter links. Visitors see sign-in.

**Progress:** Completion, streak, chapters, average score, and chapter list with
dates/scores/actions. Streak days use UTC. Do not invent history or badges.

**Account:** Email, created date, user ID, tier, ChatGPT guidance, theme,
session expiry, and Sign out. Premium may say “Coming later”; no checkout.

**Authentication:** Sign in/up, reset, callback, sign-out, and error screens.
Reserve Stytch areas for Google/email. Add “Connect Course Companion” consent
listing profile, progress, and score permissions.

## States and Prototype

Include 401/session expired, 404 chapter/quiz missing, offline, and 503
“Service unavailable. Please try again.” Never expose infrastructure details.

Prototype:

1. Landing → course → chapter → sign-in prompt
2. Dashboard → chapter → quiz → feedback → results → save → next chapter
3. Search → result → chapter
4. Progress → review chapter
5. Account → sign out

Demo: Saifullah, `saifullah@example.com`, Free, 4-day streak, chapters 1-2 at
80%/100%, chapter 3 current, 40% progress.

Create Foundations, Components, Public, Authenticated, Learning, Authentication,
Responsive, States, Prototype, and Handoff pages. Use realistic copy, semantic
names, keyboard accessibility, reduced motion, and Next.js/Tailwind-ready UI.
