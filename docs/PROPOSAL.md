# Cynbit Website Improvement Proposal: AI Project Blueprint

Full Stack Developer Intern assessment for Cynbit Technologies. Prepared for Kapil Dev. Deadline: Sat, Nov 21, 11:20 AM.

## Audit findings

I reviewed the Services and Contact pages of cynbit.in.

### Contact page (the main conversion point)

- The page promises that the team will "analyze your requirements and prepare a tailored strategic overview". The form behind it is only name, email, optional company, optional industry and one free-text box.
- It doesn't ask what the visitor is building, their timeline or their budget. That makes the first reply slow for Cynbit and gives the visitor no feedback until someone responds.
- The Services page has three distinct tracks: AI automation, software and cloud, and marketing/SEO. Every "Inquire" and "Start discovery" button leads to the same generic form, so intent is lost.

### Technical issues (from the page metadata)

- `og:url` is `https://cynbit.in` on both the Services and Contact pages. It should be the page's own URL.
- `og:image` is an SVG logo. Most social platforms (LinkedIn, X, WhatsApp) don't render SVG previews, so shared links show no image.

## Proposed improvement: AI Project Blueprint

Turn the contact form into a guided 4-step wizard. It pre-fills from the service the visitor clicked, then returns an instant structured "blueprint" that delivers the promise the page already makes.

1. **Step 1:** Choose a service track (AI automation, software/cloud, or marketing/SEO). This can arrive from `?service=` on the "Inquire" buttons.
2. **Step 2:** Pick goals and features with chips. These are tailored per track.
3. **Step 3:** Choose timeline and budget range, then enter contact details.
4. **Output:** An LLM call with a strict JSON schema returns a summary, suggested stack (drawn from Cynbit's listed stack), rough phases and open questions. The lead and blueprint are stored in Postgres and the visitor sees the result immediately.

### Why this one

It addresses conversion, UX and a new capability in one feature. It is easy to demo in 2 minutes. It uses their own stack (Next.js, TypeScript, Tailwind, Prisma, PostgreSQL/Supabase), so it looks like something you could ship on the team.

## Suggested stack

- Next.js App Router, TypeScript and Tailwind
- Zod for validation on the client and server
- Prisma with Supabase Postgres
- LLM call through a server route (with a rule-based fallback if the API is down)
- Basic rate limiting and a honeypot field against spam
- Deployed on Vercel

## Technical report outline

1. Problem statement
2. Audit findings
3. Why this feature
4. Architecture diagram
5. Key decisions and trade-offs
6. Results (e.g. form completion and Lighthouse checks)
7. Future work

The quick metadata fix (`og:url` and `og:image`) can go in as a small separate commit to show attention to detail.

## Timing and scope

The deadline is tomorrow at 11:20 AM, so scope it to a working wizard, one API route and a saved lead. Skip an admin dashboard. GitHub push and Vercel deployment need to be done by you.

## Next step

Scaffold the full project: code, a clean commit sequence, README and a draft of the technical report. Alternatively, pick a different idea such as a performance or SEO audit.
