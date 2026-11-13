# Live Demo Runbook: Campus Problem-Reporting Platform

**Audience:** Pitch Judges, Campus Administrators, College Leadership  
**Estimated Demo Time:** 3 – 4 Minutes  
**Core Value Proposition:** Seamless student reporting, transparent democratic prioritization, and instant AI-driven administrative synthesis powered by Cloudflare Edge & Workers AI.

---

## 1. Demo Credentials & Pre-Flight Checklist

Ensure you have these credentials ready for copy-pasting during the presentation:

| Role | Login Email | Purpose in Demo |
|---|---|---|
| **Student** | `student@iiit-bh.ac.in` | Submitting a live campus grievance |
| **Administrator** | `admin@iiit-bh.ac.in` | Reviewing ranked grievances & generating AI executive brief |

---

## 2. Step-by-Step Happy Path Script

### Phase 1: Student Login & Grievance Submission (1.5 Minutes)

1. **Open the Login Screen:**
   - **Action:** Navigate to `/login`.
   - **Presenter Voiceover:**
     > *"Welcome to the IIIT Bhubaneswar Campus Grievance Platform. Students log in instantly with their verified university email without needing passwords or complicated portals."*
2. **Authenticate as Student:**
   - **Action:** Enter `student@iiit-bh.ac.in` and click **Log In**.
   - **Backend Verification:** Calls `POST /api/auth/login`. Receives role `'student'` and redirects to `/student`.
3. **Submit a New Urgent Issue:**
   - **Action:** Fill out the Problem Submission Form:
     - **Title:** `Severe Wi-Fi packet loss in Labs 3 and 4`
     - **Description:** `During evening coding contests, latency spikes over 800ms and connections disconnect every 10 minutes. Affects 60+ students.`
   - **Action:** Click **Submit Grievance**.
   - **Presenter Voiceover:**
     > *"Within milliseconds, this ticket is recorded directly into our distributed Cloudflare D1 database running on the edge right here in India."*
   - **Backend Verification:** Calls `POST /api/problems/submit`. Displays green confirmation banner.

---

### Phase 2: Administrative View & Prioritization (1 Minute)

4. **Switch to Administrative Role:**
   - **Action:** Click **Log Out** in the navigation bar.
   - **Action:** Enter `admin@iiit-bh.ac.in` on `/login` and click **Log In**.
   - **Backend Verification:** Calls `POST /api/auth/login`. Receives role `'admin'` and redirects to `/admin`.
5. **Demonstrate Democratic Ranking:**
   - **Presenter Voiceover:**
     > *"Administrators aren't bombarded by unsorted emails. The dashboard automatically sorts issues by student upvotes so faculty leadership sees the most critical pain points first."*
   - **Action:** Click between **"Most Upvoted"** (`?sort=upvotes`) and **"Newest"** (`?sort=newest`) tabs to show instant client/edge reordering.

---

### Phase 3: The Climax - Cloudflare Workers AI Executive Summary (1.5 Minutes)

6. **Trigger the AI Executive Brief:**
   - **Presenter Voiceover:**
     > *"College Deans and Directors don't have hours to read through hundreds of student grievances. With one click, our platform invokes Cloudflare Workers AI running Meta Llama-3-8B directly on Cloudflare's serverless GPU edge."*
   - **Action:** Click **"Generate Executive AI Summary"** (`lucide-react: Sparkles`).
   - **Backend Verification:** Calls `GET /api/admin/summarize`.
7. **Read the Generated 2-Paragraph Summary:**
   - **Action:** The AI Summary Modal opens with the generated brief:
     - **Paragraph 1 (The Problem):** Synthesizes the core issues (lab connectivity and residential disruptions).
     - **Paragraph 2 (The Solution):** Outlines specific administrative action items (procuring replacement enterprise switches and assigning network engineers).
   - **Presenter Closing:**
     > *"In under 3 seconds, leadership has an actionable, executive briefing with zero manual compilation. That is how we turn student feedback into immediate campus action."*
