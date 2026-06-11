import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, GitBranch, Grid3x3, AlertTriangle, Cpu,
  Plug, ListChecks, Map, Search, HelpCircle, ChevronRight, ArrowDown,
  Brain, Zap, Database, CheckCircle2, BarChart3, Repeat, Layers, Save,
  Slack, FileText, BookOpen, UserPlus, Gauge, Calendar, Shield
} from "lucide-react";

// ================= REFERENCE DATA =================

const DEADLINE = "August 30, 2026";

const MATURITY = {
  0: { label: "Fully Human", color: "bg-slate-200 text-slate-700" },
  1: { label: "Human + AI Assist", color: "bg-sky-100 text-sky-800" },
  2: { label: "AI-Guided", color: "bg-indigo-100 text-indigo-800" },
  3: { label: "Partially Automated", color: "bg-violet-100 text-violet-800" },
  4: { label: "Highly Automated", color: "bg-amber-100 text-amber-800" },
  5: { label: "Autonomous + Approval", color: "bg-emerald-100 text-emerald-800" },
};

const CLASS_STYLE = {
  "Human Only": "bg-slate-100 text-slate-700 border-slate-300",
  "AI Assisted": "bg-indigo-50 text-indigo-700 border-indigo-300",
  "Automated": "bg-emerald-50 text-emerald-700 border-emerald-300",
};

const TEAM = [
  { id: "karli", name: "Karli", role: "Social content, community management, brief interpretation" },
  { id: "johnathan", name: "Johnathan", role: "Shopify execution, asset deployment, agency coordination" },
  { id: "andrea", name: "Andrea", role: "Campaign management, marketing calendar ownership, agency coordination" },
  { id: "nadine", name: "Nadine (Offshore PM)", role: "Brief creation, influencer outreach, calendar mgmt, cross-functional coordination" },
  { id: "jenny", name: "Jenny", role: "Email design, email deployment" },
  { id: "katina", name: "Katina", role: "Education initiatives, student certification coordination" },
];

const INVENTORY_FIELDS = [
  { key: "objectives", label: "Key Objectives" },
  { key: "stakeholders", label: "Stakeholders" },
  { key: "tasks", label: "Recurring Tasks (name · frequency · time · tools)", wide: true },
  { key: "inputs", label: "Inputs (data, approvals, assets, briefs, dependencies)" },
  { key: "outputs", label: "Outputs / Deliverables" },
  { key: "time", label: "Time Estimate (per occurrence · weekly · monthly)" },
  { key: "painpoints", label: "Pain Points (repetitive, manual, delays, comms)" },
  { key: "automation", label: "Automation Potential (High / Med / Low + why)" },
  { key: "aiops", label: "AI Opportunities (Claude, Make, Klaviyo AI, etc.)" },
];

// Future-state orchestration workflows (INFERRED) — Slack-first
const WORKFLOWS = [
  {
    id: "social", title: "Social Content", owner: "Karli", maturity: 2,
    current: "Karli interprets briefs, drafts, schedules, and moderates content manually; performance review is ad-hoc.",
    stages: {
      external: "Notion calendar, creative briefs, campaign objectives, existing assets (Frame.io), prior performance",
      analysis: "Synthesize brief intent, surface content gaps, cluster top-performing themes",
      decision: "Generate post recs, captions, hashtags, and repurposing plan (magazine/edu → TikTok/IG/LinkedIn)",
      automation: "Make.com routes approved drafts to scheduling; pulls engagement metrics on a schedule",
      execution: "Social scheduling tools, Google Workspace, Frame.io, Canva AI / Descript for assets",
      confirmation: "Publish verification + posting log; flag failed/missed posts",
      reporting: "Engagement dashboard logged to Notion",
      knowledge: "Performance patterns → Notion KB → next cycle's recs",
    },
    slack: "Draft batch posted to #social-approvals with thumbnail + caption; one-click ✅/✏️.",
    approval: "Approver: Andrea (brand) · fallback Karli. If no action in 24h → auto-reminder, then hold.",
    justify: "Brand voice & community nuance keep a human in the loop; AI guides ideation/drafting (L2).",
  },
  {
    id: "email", title: "Email Marketing", owner: "Jenny", maturity: 3,
    current: "Jenny designs and deploys in Klaviyo; segmentation and testing are manual and inconsistent.",
    stages: {
      external: "Klaviyo metrics, campaign brief, segments, Shopify customer data",
      analysis: "Review objectives, surface segment opportunities, find under-tested variables",
      decision: "Generate messaging recs, subject-line variants, send-time + A/B suggestions",
      automation: "Pipedream/Make sync Shopify segments → Klaviyo; trigger test setup + metric pulls; Klaviyo AI",
      execution: "Klaviyo",
      confirmation: "Deployment + deliverability/bounce check",
      reporting: "Open, CTR, revenue attribution → Notion",
      knowledge: "Winning variants & segment learnings retained",
    },
    slack: "Pre-send summary to #email-ops: audience, subject, send time → approve to schedule.",
    approval: "Approver: Jenny (creative) + Andrea (calendar). No action by send-window − 2h → auto-hold.",
    justify: "Repeatable structure + strong data allow tests/flows to be largely automated with creative sign-off (L3).",
  },
  {
    id: "shopify", title: "Shopify Deployment", owner: "Johnathan", maturity: 3,
    current: "Johnathan builds pages, checks assets, deploys; QA is manual and error-prone under deadline.",
    stages: {
      external: "Campaign assets, product info, inventory data, APC API data",
      analysis: "Review requirements, detect missing assets, assess inventory/operational risk",
      decision: "Produce deployment checklist, flag blockers, sequence launch steps",
      automation: "Pipedream/Make push validated assets, sync APC + inventory, stage publish",
      execution: "Shopify",
      confirmation: "Automated deployment verification + error monitoring",
      reporting: "Performance dashboards + operational logs → Notion",
      knowledge: "Recurring error types captured to prevent repeats",
    },
    slack: "Readiness report to #shopify-deploy: ✅ assets present / ❌ missing list → approve to publish.",
    approval: "Approver: Johnathan + Andrea. Missing assets → auto-route request to asset owner in Slack.",
    justify: "Asset checks & deploys are rule-based and integrable; final publish stays human-gated (L3).",
  },
  {
    id: "campaign", title: "Campaign & Calendar", owner: "Andrea", maturity: 2,
    current: "Andrea owns the marketing calendar and agency coordination, largely over email/Notion with manual chasing.",
    stages: {
      external: "Campaign briefs, agency deliverables (Frame.io), timelines, stakeholder requests",
      analysis: "Track deliverable status, detect timeline risk, summarize agency feedback",
      decision: "Draft status updates, flag at-risk items, propose timeline adjustments",
      automation: "Make watches Frame.io/Notion for status; auto-nudges + digest generation",
      execution: "Notion, Google Workspace, Frame.io, ClickUp AI",
      confirmation: "Deliverable receipt + approval tracking",
      reporting: "Weekly campaign status digest to leadership",
      knowledge: "Agency turnaround & bottleneck patterns retained",
    },
    slack: "Auto status digest to #campaign-status every Mon AM; at-risk items @mention owners.",
    approval: "Approver: Andrea (calendar). Timeline change → structured approval card to CEO if >1wk slip.",
    justify: "Relationship management & creative approvals need human judgment; AI guides tracking (L2).",
  },
  {
    id: "influencer", title: "Influencer & Briefs", owner: "Nadine", maturity: 2,
    current: "Nadine creates briefs, runs influencer outreach, and manages the calendar with manual onboarding/tracking.",
    stages: {
      external: "Refersion + ShareASale data, influencer lists, Paperform submissions, Aircall logs",
      analysis: "Identify top performers, surface weak partnerships, summarize submissions",
      decision: "Draft briefs & outreach, prioritize partners, recommend program adjustments",
      automation: "Pipedream/Make sync Paperform → Notion; automate onboarding sequences + payout data",
      execution: "Refersion, ShareASale, Notion, Google Workspace",
      confirmation: "Onboarding completion + tracking-link validation",
      reporting: "Affiliate performance dashboard → Notion",
      knowledge: "Partner ROI history retained for selection",
    },
    slack: "New influencer submissions summarized to #partnerships; approve to onboard.",
    approval: "Approver: Nadine. Brief draft → Slack to Andrea for calendar fit before outreach.",
    justify: "Partner relationships are human-owned; onboarding/admin automatable, AI guides selection (L2).",
  },
  {
    id: "education", title: "Education & Certification", owner: "Katina", maturity: 1,
    current: "Katina coordinates certification, scheduling, and material distribution; tracking is fragmented.",
    stages: {
      external: "Paperform registrations, Zoom sessions, educational content, certification criteria",
      analysis: "Track enrollment/completion, identify content gaps, summarize learner feedback",
      decision: "Recommend content updates, draft comms, flag certification follow-ups",
      automation: "Make sync Paperform → Notion → Zoom scheduling + reminder sequences",
      execution: "Paperform, Zoom, Google Workspace, Notion",
      confirmation: "Completion + certification issuance tracking",
      reporting: "Education metrics → Notion",
      knowledge: "Curriculum performance + FAQ patterns retained",
    },
    slack: "Enrollment + completion summary to #education weekly; certification follow-ups @mention Katina.",
    approval: "Approver: Katina (certification integrity). Auto-reminders for incomplete certifications.",
    justify: "Educational quality & certification integrity are human-owned; AI assists drafting/tracking (L1).",
  },
];

const PIPELINE = [
  { key: "external", label: "External Systems", icon: Database, color: "text-slate-600", note: "Information & events" },
  { key: "analysis", label: "Claude Analysis Layer", icon: Brain, color: "text-indigo-600", note: "Synthesize & evaluate" },
  { key: "decision", label: "Claude Decision Layer", icon: GitBranch, color: "text-violet-600", note: "Recommendations" },
  { key: "automation", label: "Automation Layer", icon: Zap, color: "text-amber-600", note: "Make.com / Pipedream" },
  { key: "execution", label: "Execution Systems", icon: Cpu, color: "text-rose-600", note: "Operational tools" },
  { key: "confirmation", label: "Confirmation Layer", icon: CheckCircle2, color: "text-emerald-600", note: "Verify success" },
  { key: "reporting", label: "Reporting Layer", icon: BarChart3, color: "text-sky-600", note: "Log outcomes" },
  { key: "knowledge", label: "Knowledge Layer", icon: Repeat, color: "text-fuchsia-600", note: "Retain learnings" },
];

const MATRIX = [
  { task: "Brand-voice approval & community tone", owner: "Karli", cls: "Human Only", lvl: 0 },
  { task: "Content ideation & caption drafting", owner: "Karli", cls: "AI Assisted", lvl: 2 },
  { task: "Repurposing magazine/edu → social", owner: "Karli", cls: "AI Assisted", lvl: 2 },
  { task: "Post scheduling & metric pulls", owner: "Karli", cls: "Automated", lvl: 3 },
  { task: "Email creative direction & sign-off", owner: "Jenny", cls: "Human Only", lvl: 0 },
  { task: "Subject lines & A/B test design", owner: "Jenny", cls: "AI Assisted", lvl: 2 },
  { task: "Segment sync Shopify ↔ Klaviyo", owner: "Jenny", cls: "Automated", lvl: 4 },
  { task: "Flow/test deployment & reporting", owner: "Jenny", cls: "Automated", lvl: 3 },
  { task: "Asset QA & missing-asset detection", owner: "Johnathan", cls: "AI Assisted", lvl: 3 },
  { task: "Deployment checklist generation", owner: "Johnathan", cls: "AI Assisted", lvl: 2 },
  { task: "Product/page publish (gated)", owner: "Johnathan", cls: "Automated", lvl: 3 },
  { task: "Inventory/APC sync", owner: "Johnathan", cls: "Automated", lvl: 4 },
  { task: "Agency relationship & approvals", owner: "Andrea", cls: "Human Only", lvl: 0 },
  { task: "Calendar status tracking & risk flags", owner: "Andrea", cls: "AI Assisted", lvl: 2 },
  { task: "Status digest generation (Slack)", owner: "Andrea", cls: "Automated", lvl: 3 },
  { task: "Influencer relationship management", owner: "Nadine", cls: "Human Only", lvl: 0 },
  { task: "Brief drafting", owner: "Nadine", cls: "AI Assisted", lvl: 2 },
  { task: "Onboarding & payout data sync", owner: "Nadine", cls: "Automated", lvl: 3 },
  { task: "Certification integrity decisions", owner: "Katina", cls: "Human Only", lvl: 0 },
  { task: "Enrollment tracking & reminders", owner: "Katina", cls: "Automated", lvl: 3 },
  { task: "Learner feedback synthesis", owner: "Katina", cls: "AI Assisted", lvl: 1 },
];

// Tool evaluation — scores 1-5; Priority = TS + BI + AL − ImplComplexity, where ImplComplexity = (6 − Ease)
const TOOLS_SEED = [
  { id: "report", name: "Weekly reporting digest (Slack)", ts: 5, bi: 4, al: 5, ease: 5, cost: 5 },
  { id: "asset", name: "AI asset-readiness checker", ts: 4, bi: 5, al: 4, ease: 4, cost: 4 },
  { id: "repurpose", name: "Content repurposing engine (Claude)", ts: 5, bi: 4, al: 4, ease: 4, cost: 4 },
  { id: "segment", name: "Shopify↔Klaviyo segment sync", ts: 4, bi: 5, al: 4, ease: 3, cost: 4 },
  { id: "brief", name: "Brief template + Claude drafting", ts: 4, bi: 3, al: 5, ease: 5, cost: 5 },
  { id: "onboard", name: "Affiliate onboarding automation", ts: 3, bi: 3, al: 4, ease: 3, cost: 4 },
  { id: "edu", name: "Education enrollment automation", ts: 3, bi: 3, al: 4, ease: 3, cost: 4 },
  { id: "approval", name: "Slack approval routing layer", ts: 4, bi: 4, al: 3, ease: 3, cost: 5 },
];

const BOTTLENECKS = [
  { cat: "Approval Dependencies", items: ["Sequential sign-offs stall launches", "Unclear approval ownership across campaign → Shopify → email", "Approvals scattered across email/DM"] },
  { cat: "Manual Effort", items: ["Repetitive asset checks & re-uploads", "Hand-built segments and reports", "Manual status chasing"] },
  { cat: "Rework", items: ["Missing/incorrect assets surface late in deploy", "Inconsistent briefs cause redo loops"] },
  { cat: "Communication", items: ["Context scattered across email/Notion/Zoom", "Offshore ↔ onshore handoff lag", "No standardized request format"] },
  { cat: "Documentation", items: ["No single source of truth for workflows", "Tribal knowledge concentrated per person"] },
  { cat: "Delays", items: ["Agency deliverable turnaround", "Waiting on data to make decisions"] },
];

const AUTOMATIONS = [
  { title: "AI asset-readiness checker", desc: "Claude reviews assets vs. requirements, flags gaps in Slack before deploy.", stack: ["Claude", "Frame.io", "Make.com", "Slack", "Shopify"] },
  { title: "Shopify ↔ Klaviyo segment sync", desc: "Auto-sync segments and trigger relevant flows.", stack: ["Shopify", "Pipedream", "Klaviyo AI"] },
  { title: "Affiliate onboarding pipeline", desc: "Submission → Notion record → onboarding sequence → Slack confirm.", stack: ["Paperform", "Make.com", "Notion", "Refersion", "Slack"] },
  { title: "Weekly reporting digest", desc: "Cross-channel metrics → Slack + Notion leadership digest.", stack: ["Klaviyo", "Make.com", "Claude", "Slack", "Notion"] },
  { title: "Content repurposing engine", desc: "Long-form → channel-specific drafts for review.", stack: ["Claude", "Canva AI", "Descript", "Notion"] },
  { title: "Slack approval routing", desc: "Standardized approval cards routed to named owners with no-action fallbacks.", stack: ["Make.com", "Slack", "Claude"] },
];

const INTEGRATIONS = [
  { from: "Shopify", to: "Klaviyo", via: "Pipedream", value: "Real-time segment & purchase sync for targeted email" },
  { from: "Paperform", to: "Notion", via: "Make.com", value: "Centralize registrations & influencer submissions" },
  { from: "Frame.io", to: "Shopify", via: "Pipedream", value: "Approved assets flow straight into deployment" },
  { from: "Any workflow", to: "Slack", via: "Make.com", value: "Approvals, alerts & digests routed to named owners" },
  { from: "Klaviyo / Refersion", to: "Notion", via: "Make.com", value: "Unified performance reporting" },
  { from: "APC API", to: "Shopify", via: "Pipedream", value: "Inventory & product data automation" },
];

const QUICKWINS = [
  { title: "Weekly reporting digest (Slack)", impact: "High", effort: "Low" },
  { title: "AI asset-readiness checklist", impact: "High", effort: "Low" },
  { title: "Standardized brief template", impact: "Med", effort: "Low" },
  { title: "Slack approval card templates", impact: "High", effort: "Low" },
  { title: "Shopify↔Klaviyo segment sync", impact: "High", effort: "Med" },
  { title: "Content repurposing prompts", impact: "Med", effort: "Low" },
];

const ROADMAP = [
  { phase: "Phase 1 · Audit & Foundation (Jun)", items: ["Interview all 6 roles, fill Process Inventory", "Document workflows in Notion KB", "AI literacy + prompting standards", "Ship quick wins: reporting digest, asset checker"] },
  { phase: "Phase 2 · Orchestration (Jul)", items: ["Stand up Make.com/Pipedream pipelines", "Shopify↔Klaviyo + Paperform↔Notion integrations", "Slack approval routing layer live", "Repurposing engine + SOP library v1"] },
  { phase: "Phase 3 · Maturity (early Aug)", items: ["Feedback loops into Notion KB", "Partially automated email & Shopify flows (L3)", "Cross-channel reporting intelligence", "Governance, prompt library, audit trails"] },
  { phase: `Phase 4 · Handoff (by ${DEADLINE})`, items: ["Finalize AI Operations Playbook", "Deliver Fall Hire Recommendation Brief", "Operator-independent: ops run via documented workflows", "Onboard via documentation alone"] },
];

const MISSING = [
  "Actual time-per-task data (all roles) — pending interviews",
  "Confirmed tool list per person vs. assumed stack",
  "Real approval chains and decision owners per workflow",
  "Volume metrics (posts/week, campaigns/month, deploys/week)",
  "Current Slack usage, channel structure & norms",
  "Missing stakeholders: CEO sponsor, IT/security owner, finance for payouts",
  "Current Claude usage & AI literacy baseline per person",
];

const FOLLOWUPS = {
  karli: ["How many posts/week across channels?", "Where does the most manual time go?", "How are briefs interpreted & where do they break down?"],
  johnathan: ["What % of deploys hit missing-asset issues?", "How is QA done today?", "How does agency coordination flow?"],
  andrea: ["How is the marketing calendar maintained?", "Where do timeline risks originate?", "What reporting does the CEO ask for?"],
  nadine: ["How are briefs created & approved?", "What's manual in influencer outreach?", "Biggest offshore handoff friction?"],
  jenny: ["How are segments built?", "How often do you A/B test?", "What's the deploy → report process?"],
  katina: ["How is certification tracked?", "Where does scheduling break down?", "What content needs frequent updates?"],
};

const PRINCIPLES = [
  { t: "No-human-dependency by default", d: "Systems run without the operator after deployment; minimal interpretation once live." },
  { t: "Slack-first routing", d: "Notifications, requests & approvals pushed through Slack to named owners automatically." },
  { t: "Automation-first decomposition", d: "Every task split into fully / partially / non-automatable; automate anything without judgment." },
  { t: "Role-based approval architecture", d: "Named approvers, standardized yes/no prompts, impossible to misroute." },
  { t: "Documented for outsiders", d: "Every system states what's automatic, what's human, who owns it, and the no-action fallback." },
  { t: "Knowledge externalized", d: "SOPs, templates, prompt libraries, workflow maps — nothing left to memory or intuition." },
];

const TOOLSTACK = [
  { layer: "Reasoning", tools: ["Claude", "Claude Projects", "Claude Code"] },
  { layer: "Knowledge Base", tools: ["Notion"] },
  { layer: "Orchestration", tools: ["Make.com", "Pipedream"] },
  { layer: "Coordination & Approvals", tools: ["Slack"] },
  { layer: "Project Mgmt", tools: ["ClickUp AI", "Notion"] },
  { layer: "Execution", tools: ["Shopify", "Klaviyo AI", "Paperform", "Refersion", "ShareASale", "Zoom", "Aircall"] },
  { layer: "Creative", tools: ["Canva AI", "Figma AI", "Descript", "Frame.io"] },
  { layer: "Data", tools: ["APC API", "Google Workspace"] },
];

const CADENCE = [
  { when: "Daily", what: "Slack approval cards processed; deploy/asset checks auto-run; alerts triaged." },
  { when: "Weekly", what: "Mon: campaign status digest. Wed: email/social performance pull. Fri: KB updates." },
  { when: "Monthly", what: "Performance review, partner ROI, roadmap re-prioritization, SOP audit." },
];

const OWNERSHIP = [
  { fn: "Social", owner: "Karli", approver: "Andrea", channel: "#social-approvals" },
  { fn: "Email", owner: "Jenny", approver: "Jenny + Andrea", channel: "#email-ops" },
  { fn: "Shopify", owner: "Johnathan", approver: "Johnathan + Andrea", channel: "#shopify-deploy" },
  { fn: "Campaign / Calendar", owner: "Andrea", approver: "CEO (major slips)", channel: "#campaign-status" },
  { fn: "Influencer / Briefs", owner: "Nadine", approver: "Nadine + Andrea", channel: "#partnerships" },
  { fn: "Education", owner: "Katina", approver: "Katina", channel: "#education" },
];

const FALLHIRE = {
  ai: ["Reporting & digest generation", "Content/brief drafting", "Asset QA & checklist generation", "Repurposing long-form content", "Data sync & onboarding admin"],
  partial: ["A/B test design (human approves)", "Campaign status synthesis", "Segment building", "Caption/subject-line generation", "SOP drafting from observed work"],
  human: ["Brand voice & creative direction", "Agency & influencer relationships", "Calendar & priority trade-offs", "Certification integrity", "Final launch approvals"],
  role: "AI Marketing Operations Coordinator",
  resp: ["Own & maintain the Make.com/Slack workflow layer", "Steward the Notion KB & prompt library", "Run the approval architecture & escalations", "Onboard new hires from documentation", "Drive continuous optimization from feedback loops"],
  justify: "AI absorbs the repetitive execution & reporting load; the remaining work is relationship-, brand-, and judgment-heavy. A coordinator role sustains the operating system and captures compounding leverage rather than re-absorbing manual tasks.",
};

const SOPS = [
  {
    id: "email", title: "Email Campaign Deployment",
    purpose: "Deploy a Klaviyo email campaign reliably with AI-assisted prep and Slack approval.",
    inputs: ["Approved creative brief", "Target segment", "Subject-line options", "Send window"],
    steps: ["Claude reviews brief → drafts subject variants + send-time rec", "Confirm segment auto-synced from Shopify", "Build campaign in Klaviyo from template", "Post pre-send summary to #email-ops for approval", "On ✅, schedule; on ✏️, revise & re-post", "Auto deliverability check at send"],
    output: "Scheduled/sent campaign + logged metrics in Notion",
    errors: ["Segment out of date", "Broken merge tags", "Missing approval before send window"],
    troubleshoot: ["Re-run Shopify→Klaviyo sync", "Validate template tags in test send", "Auto-hold triggers if no approval at window − 2h"],
    best: ["Always test-send to self first", "Keep subject variants ≤ 3", "Standardize the Slack summary format"],
    screens: ["Klaviyo campaign builder", "Slack #email-ops approval card", "Notion metrics log"],
    training: ["Where the approval card comes from", "How auto-hold works", "Reading attribution in Notion"],
  },
  {
    id: "shopify", title: "Shopify Asset Deployment",
    purpose: "Publish campaign pages/products only after automated asset readiness checks.",
    inputs: ["Campaign assets (Frame.io)", "Product/inventory data", "APC API data", "Deployment date"],
    steps: ["Claude checks assets vs. requirements", "Missing assets → auto-request to owner in Slack", "Generate deployment checklist", "Stage publish via Make/Pipedream", "Post readiness report to #shopify-deploy", "On approval, publish + verify"],
    output: "Published, verified pages/products + operational log",
    errors: ["Missing/incorrect assets", "Inventory mismatch", "Broken links post-publish"],
    troubleshoot: ["Check #shopify-deploy missing-asset list", "Re-run APC sync", "Auto error-monitor flags failed publishes"],
    best: ["Never publish without ✅ readiness report", "Keep an asset-naming convention", "Log every error type to KB"],
    screens: ["Frame.io asset view", "Slack readiness card", "Shopify publish confirmation"],
    training: ["Reading the readiness report", "Where missing-asset requests route", "Rollback steps"],
  },
];

// ================= SMALL COMPONENTS =================

function Tag({ kind }) {
  const map = {
    inferred: ["Inferred", "bg-amber-100 text-amber-800 border border-amber-300"],
    confirmed: ["Confirmed", "bg-emerald-100 text-emerald-800 border border-emerald-300"],
    pending: ["Pending interview", "bg-slate-100 text-slate-600 border border-slate-300"],
    deliverable: ["Final deliverable", "bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-300"],
  };
  const [t, c] = map[kind] || map.inferred;
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${c}`}>{t}</span>;
}

function MaturityBadge({ lvl }) {
  const m = MATURITY[lvl];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded ${m.color}`}>L{lvl} · {m.label}</span>;
}

function SectionHeader({ icon: Icon, title, subtitle, tag }) {
  return (
    <div className="mb-6 border-b border-slate-200 pb-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-white"><Icon size={18} /></div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {tag && <Tag kind={tag} />}
      </div>
      {subtitle && <p className="text-slate-500 mt-2 text-sm max-w-3xl">{subtitle}</p>}
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>{children}</div>;
}

// ================= SECTIONS =================

function ExecSummary() {
  return (
    <div>
      <SectionHeader icon={LayoutDashboard} title="Executive Summary"
        subtitle={`AI Marketing Systems internship operating system. Goal: audit marketing & sales ops, implement AI-enabled workflows, and deliver a complete operator-independent handoff by ${DEADLINE}.`} />
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-900 flex gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <p><strong>Confidence note:</strong> Roles & framework are confirmed from the brief. Workflow detail, maturity levels, scores, and recommendations are <strong>inferred</strong> pending interviews. The Process Inventory is a <strong>blank, editable framework</strong>. No facts are fabricated.</p>
      </div>
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {[
          { k: "6", v: "Roles audited", d: "Content, commerce, campaigns, partnerships, email, education" },
          { k: "21", v: "Workflows classified", d: "Human / AI Assisted / Automated" },
          { k: "Slack", v: "Execution layer", d: "Approvals & routing centralized" },
          { k: DEADLINE.split(",")[0], v: "Handoff target", d: "Operator-independent ops" },
        ].map((s) => (
          <Card key={s.v} className="p-5">
            <div className="text-2xl font-bold text-amber-600">{s.k}</div>
            <div className="font-semibold text-slate-800 mt-1 text-sm">{s.v}</div>
            <div className="text-xs text-slate-500 mt-1">{s.d}</div>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Headline opportunities</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            {["Centralize fragmented context into a Notion KB feeding Claude.",
              "Make Slack the approval & routing layer — kill scattered comms.",
              "Eliminate manual reporting via a weekly cross-channel digest.",
              "Cut deploy rework with an AI asset-readiness checker.",
              "Free strategic & creative time by automating admin and sync tasks."].map((x) => (
              <li key={x} className="flex gap-2"><ChevronRight size={16} className="text-amber-500 shrink-0 mt-0.5" />{x}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Shield size={16} className="text-amber-500" />Design principle: autonomous operability</h3>
          <p className="text-sm text-slate-600">Every system is built to run <strong>without the operator</strong>. A workflow is incomplete if it still depends on one person to reformat info, re-explain, manually route, or repeatedly clarify. End state: marketing ops continue, approvals route automatically via Slack, new hires onboard from documentation alone.</p>
        </Card>
      </div>
    </div>
  );
}

function Inventory({ data, setData }) {
  const [active, setActive] = useState(TEAM[0].id);
  const person = TEAM.find((t) => t.id === active);
  const vals = data[active] || {};
  const update = (key, val) => setData((p) => ({ ...p, [active]: { ...p[active], [key]: val } }));
  return (
    <div>
      <SectionHeader icon={Users} title="Process Inventory" tag="pending"
        subtitle="Editable per-role framework following the audit structure. Fields auto-save and persist — populate during interviews." />
      <div className="flex gap-2 flex-wrap mb-5">
        {TEAM.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${active === t.id ? "bg-amber-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-amber-300"}`}>
            {t.name.split(" ")[0]}
          </button>
        ))}
      </div>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <h3 className="text-lg font-bold text-slate-900">{person.name}</h3>
          <span className="text-xs text-slate-400 flex items-center gap-1"><Save size={12} /> Auto-saved</span>
        </div>
        <p className="text-sm text-amber-600 font-medium mb-4">{person.role}</p>
        <div className="grid md:grid-cols-2 gap-4">
          {INVENTORY_FIELDS.map((f) => (
            <div key={f.key} className={f.wide ? "md:col-span-2" : ""}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{f.label}</label>
              <textarea value={vals[f.key] || ""} onChange={(e) => update(f.key, e.target.value)}
                placeholder="Pending interview input…" rows={f.wide ? 4 : 2}
                className="mt-1 w-full text-sm rounded-lg border border-slate-200 p-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none resize-y bg-slate-50" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Orchestration() {
  const [active, setActive] = useState(WORKFLOWS[0].id);
  const wf = WORKFLOWS.find((w) => w.id === active);
  return (
    <div>
      <SectionHeader icon={GitBranch} title="Workflow Orchestration" tag="inferred"
        subtitle="Each workflow as an end-to-end operating system: Inputs → Analysis → Decision → Execution → Confirmation → Reporting → Learning, with Slack as the approval layer." />
      <div className="flex gap-2 flex-wrap mb-5">
        {WORKFLOWS.map((w) => (
          <button key={w.id} onClick={() => setActive(w.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${active === w.id ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"}`}>
            {w.title}
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-slate-900">{wf.title} <span className="text-slate-400 font-normal">· {wf.owner}</span></h3>
            <MaturityBadge lvl={wf.maturity} />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase mt-3">Current State</p>
          <p className="text-sm text-slate-600 mt-1">{wf.current}</p>
        </Card>
        <Card className="p-4 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase">Maturity Justification</p>
          <p className="text-sm text-slate-600 mt-1">{wf.justify}</p>
        </Card>
      </div>
      <Card className="p-4 mb-4 border-l-4 border-l-[#4A154B]">
        <div className="flex items-start gap-3">
          <Slack size={20} className="text-[#4A154B] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Slack routing & approval architecture</p>
            <p className="text-sm text-slate-600 mt-1">{wf.slack}</p>
            <p className="text-sm text-slate-500 mt-1"><strong>Approval:</strong> {wf.approval}</p>
          </div>
        </div>
      </Card>
      <Card className="p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-4">Future State — Orchestration Stack</p>
        <div className="space-y-2">
          {PIPELINE.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={p.key}>
                <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <Icon size={20} className={`${p.color} shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 text-sm">{p.label}</span>
                      <span className="text-[11px] text-slate-400">{p.note}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{wf.stages[p.key]}</p>
                  </div>
                </div>
                {i < PIPELINE.length - 1 && <div className="flex justify-center py-0.5"><ArrowDown size={14} className="text-slate-300" /></div>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Matrix() {
  const [cls, setCls] = useState("All");
  const [owner, setOwner] = useState("All");
  const filtered = MATRIX.filter((m) => (cls === "All" || m.cls === cls) && (owner === "All" || m.owner === owner));
  const owners = ["All", ...new Set(MATRIX.map((m) => m.owner))];
  return (
    <div>
      <SectionHeader icon={Grid3x3} title="AI Opportunity Matrix" tag="inferred"
        subtitle="Every workflow classified Human Only / AI Assisted / Automated, with an automation maturity level (0–5)." />
      <div className="flex gap-2 flex-wrap mb-4 items-center">
        {["All", "Human Only", "AI Assisted", "Automated"].map((c) => (
          <button key={c} onClick={() => setCls(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${cls === c ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>{c}</button>
        ))}
        <select value={owner} onChange={(e) => setOwner(e.target.value)} className="ml-auto text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600">
          {owners.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr><th className="text-left p-3 font-semibold">Task / Workflow</th><th className="text-left p-3 font-semibold">Owner</th><th className="text-left p-3 font-semibold">Classification</th><th className="text-left p-3 font-semibold">Maturity</th></tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-3 text-slate-700">{m.task}</td>
                <td className="p-3 text-slate-500">{m.owner}</td>
                <td className="p-3"><span className={`text-xs font-semibold px-2 py-1 rounded border ${CLASS_STYLE[m.cls]}`}>{m.cls}</span></td>
                <td className="p-3"><MaturityBadge lvl={m.lvl} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ToolEval({ scores, setScores }) {
  const priority = (s) => s.ts + s.bi + s.al - (6 - s.ease);
  const ranked = [...scores].sort((a, b) => priority(b) - priority(a));
  const update = (id, field, val) => {
    const v = Math.max(1, Math.min(5, Number(val) || 1));
    setScores((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: v } : s)));
  };
  const cols = [["ts", "Time Savings"], ["bi", "Business Impact"], ["al", "Adoption"], ["ease", "Ease of Impl."], ["cost", "Cost Eff."]];
  return (
    <div>
      <SectionHeader icon={Gauge} title="Tool Evaluation & Priority" tag="inferred"
        subtitle="Score each opportunity 1–5. Priority = Time Savings + Business Impact + Adoption − Implementation Complexity (where complexity = 6 − Ease). Ranked highest first. Editable & saved." />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left p-3 font-semibold">#</th>
              <th className="text-left p-3 font-semibold">Opportunity</th>
              {cols.map((c) => <th key={c[0]} className="p-2 font-semibold text-center">{c[1]}</th>)}
              <th className="p-3 font-semibold text-center">Priority</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((s, i) => (
              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-3 text-slate-400 font-semibold">{i + 1}</td>
                <td className="p-3 text-slate-700">{s.name}</td>
                {cols.map((c) => (
                  <td key={c[0]} className="p-2 text-center">
                    <input type="number" min={1} max={5} value={s[c[0]]} onChange={(e) => update(s.id, c[0], e.target.value)}
                      className="w-12 text-center text-sm rounded border border-slate-200 py-1 focus:border-amber-400 outline-none" />
                  </td>
                ))}
                <td className="p-3 text-center">
                  <span className="inline-block min-w-[2rem] font-bold text-amber-600 bg-amber-50 rounded px-2 py-1">{priority(s)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-slate-400 mt-2">Tip: validate scores with each team member during interviews — adoption likelihood especially.</p>
    </div>
  );
}

function Bottlenecks() {
  return (
    <div>
      <SectionHeader icon={AlertTriangle} title="Bottleneck Analysis" tag="inferred" subtitle="Categorized friction points to validate and quantify during interviews." />
      <div className="grid md:grid-cols-2 gap-4">
        {BOTTLENECKS.map((b) => (
          <Card key={b.cat} className="p-4">
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500" />{b.cat}</h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {b.items.map((i) => <li key={i} className="flex gap-2"><ChevronRight size={14} className="text-slate-300 shrink-0 mt-0.5" />{i}</li>)}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Automations() {
  return (
    <div>
      <SectionHeader icon={Cpu} title="Automation Recommendations" tag="inferred" subtitle="Mapped to the existing tech ecosystem, Slack-first." />
      <div className="grid md:grid-cols-2 gap-4">
        {AUTOMATIONS.map((a) => (
          <Card key={a.title} className="p-4">
            <h3 className="font-semibold text-slate-800">{a.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{a.desc}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">{a.stack.map((s) => <span key={s} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{s}</span>)}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Integrations() {
  return (
    <div>
      <SectionHeader icon={Plug} title="Integration Recommendations" tag="inferred" subtitle="System-to-system connections to remove manual handoffs." />
      <div className="space-y-3">
        {INTEGRATIONS.map((it, i) => (
          <Card key={i} className="p-4 flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm bg-slate-100 px-3 py-1.5 rounded-lg">{it.from}</span>
            <span className="text-xs text-slate-400 flex flex-col items-center"><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-semibold">via {it.via}</span><ChevronRight size={16} /></span>
            <span className="font-semibold text-slate-800 text-sm bg-slate-100 px-3 py-1.5 rounded-lg">{it.to}</span>
            <span className="text-sm text-slate-500 flex-1 min-w-[200px]">{it.value}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SopLibrary() {
  const [active, setActive] = useState(SOPS[0].id);
  const sop = SOPS.find((s) => s.id === active);
  const Block = ({ title, items }) => (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{title}</p>
      <ul className="space-y-1 text-sm text-slate-600">{items.map((x, i) => <li key={i} className="flex gap-2"><ChevronRight size={13} className="text-slate-300 shrink-0 mt-1" />{x}</li>)}</ul>
    </div>
  );
  return (
    <div>
      <SectionHeader icon={BookOpen} title="SOP Library" tag="inferred"
        subtitle="Standardized SOPs so any system is operable by someone who didn't build it. Sample SOPs below — expand the library as workflows go live." />
      <div className="flex gap-2 flex-wrap mb-5">
        {SOPS.map((s) => (
          <button key={s.id} onClick={() => setActive(s.id)} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${active === s.id ? "bg-amber-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-amber-300"}`}>{s.title}</button>
        ))}
      </div>
      <Card className="p-5 space-y-4">
        <div><h3 className="font-bold text-slate-900">{sop.title}</h3><p className="text-sm text-slate-600 mt-1">{sop.purpose}</p></div>
        <div className="grid md:grid-cols-2 gap-4">
          <Block title="Required Inputs" items={sop.inputs} />
          <Block title="Step-by-Step" items={sop.steps} />
          <Block title="Common Errors" items={sop.errors} />
          <Block title="Troubleshooting" items={sop.troubleshoot} />
          <Block title="Best Practices" items={sop.best} />
          <Block title="Screenshots Needed" items={sop.screens} />
        </div>
        <div className="bg-slate-50 rounded-lg p-3"><p className="text-xs font-semibold text-slate-500 uppercase">Expected Output</p><p className="text-sm text-slate-700 mt-1">{sop.output}</p></div>
        <Block title="Training Notes" items={sop.training} />
      </Card>
    </div>
  );
}

function QuickWins() {
  const color = (v) => v === "High" ? "text-emerald-600" : v === "Med" ? "text-amber-600" : "text-slate-500";
  return (
    <div>
      <SectionHeader icon={ListChecks} title="High-Impact Quick Wins" tag="inferred" subtitle="Low-effort, high-leverage moves to build momentum early." />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr><th className="text-left p-3 font-semibold">Initiative</th><th className="text-left p-3 font-semibold">Impact</th><th className="text-left p-3 font-semibold">Effort</th></tr></thead>
          <tbody>
            {QUICKWINS.map((q) => (
              <tr key={q.title} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-3 text-slate-700">{q.title}</td>
                <td className={`p-3 font-semibold ${color(q.impact)}`}>{q.impact}</td>
                <td className={`p-3 font-semibold ${color(q.effort === "Low" ? "High" : q.effort)}`}>{q.effort}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Playbook() {
  return (
    <div>
      <SectionHeader icon={FileText} title="AI Operations Playbook" tag="deliverable"
        subtitle="The operating system handoff: tool stack, ownership, cadence, and design principles. Workflows & SOPs live in their own tabs." />
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Layers size={16} className="text-amber-500" />Tool Stack</h3>
          <div className="space-y-2">
            {TOOLSTACK.map((l) => (
              <div key={l.layer} className="flex gap-3 text-sm flex-wrap items-start">
                <span className="w-40 shrink-0 font-medium text-slate-700">{l.layer}</span>
                <span className="flex flex-wrap gap-1">{l.tools.map((t) => <span key={t} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{t}</span>)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Calendar size={16} className="text-amber-500" />Operating Cadence</h3>
          <div className="space-y-3">
            {CADENCE.map((c) => (
              <div key={c.when}><span className="text-xs font-semibold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{c.when}</span><p className="text-sm text-slate-600 mt-1">{c.what}</p></div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="p-5 mb-4">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Users size={16} className="text-amber-500" />Ownership & Approval Matrix</h3>
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-xs uppercase"><tr><th className="text-left py-2">Function</th><th className="text-left py-2">Owner</th><th className="text-left py-2">Approver</th><th className="text-left py-2">Slack Channel</th></tr></thead>
          <tbody>
            {OWNERSHIP.map((o) => (
              <tr key={o.fn} className="border-t border-slate-100"><td className="py-2 text-slate-700">{o.fn}</td><td className="py-2 text-slate-600">{o.owner}</td><td className="py-2 text-slate-600">{o.approver}</td><td className="py-2 text-[#4A154B] font-medium">{o.channel}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Shield size={16} className="text-amber-500" />Operating Principles (Autonomous Operability)</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {PRINCIPLES.map((p) => (
            <div key={p.t} className="border border-slate-200 rounded-lg p-3"><p className="font-semibold text-slate-800 text-sm">{p.t}</p><p className="text-xs text-slate-500 mt-1">{p.d}</p></div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FallHire() {
  const Col = ({ title, items, color }) => (
    <Card className="p-4">
      <h3 className={`font-semibold mb-2 ${color}`}>{title}</h3>
      <ul className="space-y-1.5 text-sm text-slate-600">{items.map((i) => <li key={i} className="flex gap-2"><ChevronRight size={14} className="text-slate-300 shrink-0 mt-0.5" />{i}</li>)}</ul>
    </Card>
  );
  return (
    <div>
      <SectionHeader icon={UserPlus} title="Fall Hire Recommendation Brief" tag="deliverable"
        subtitle="Where AI absorbs work, where humans remain essential, and the role recommended to sustain the operating system." />
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Col title="AI Can Perform" items={FALLHIRE.ai} color="text-emerald-600" />
        <Col title="AI Partially Supports" items={FALLHIRE.partial} color="text-indigo-600" />
        <Col title="Requires Human Judgment" items={FALLHIRE.human} color="text-slate-700" />
      </div>
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2"><UserPlus size={18} className="text-amber-500" /><h3 className="font-bold text-slate-900">Recommended role: {FALLHIRE.role}</h3></div>
        <p className="text-xs font-semibold text-slate-500 uppercase mt-3 mb-1">Suggested responsibilities</p>
        <ul className="space-y-1.5 text-sm text-slate-600 mb-4">{FALLHIRE.resp.map((r) => <li key={r} className="flex gap-2"><ChevronRight size={14} className="text-amber-500 shrink-0 mt-0.5" />{r}</li>)}</ul>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-xs font-semibold text-amber-700 uppercase">Strategic justification</p><p className="text-sm text-amber-900 mt-1">{FALLHIRE.justify}</p></div>
      </Card>
    </div>
  );
}

function Roadmap() {
  return (
    <div>
      <SectionHeader icon={Map} title="Internship Roadmap" tag="inferred" subtitle={`Phased path to an operator-independent handoff by ${DEADLINE}.`} />
      <div className="space-y-4">
        {ROADMAP.map((p, i) => (
          <Card key={p.phase} className="p-5 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
            <div className="flex items-center gap-3 mb-3"><span className="w-7 h-7 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center">{i + 1}</span><h3 className="font-bold text-slate-900">{p.phase}</h3></div>
            <div className="grid md:grid-cols-2 gap-2">{p.items.map((it) => <div key={it} className="flex gap-2 text-sm text-slate-600"><Layers size={14} className="text-amber-500 shrink-0 mt-0.5" />{it}</div>)}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Gaps() {
  return (
    <div>
      <SectionHeader icon={Search} title="Missing Information Tracker" tag="pending" subtitle="Gaps to close before findings can be confirmed. Nothing here is fabricated." />
      <Card className="p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Open data gaps & missing stakeholders</h3>
        <ul className="space-y-2 text-sm text-slate-600">{MISSING.map((m) => <li key={m} className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />{m}</li>)}</ul>
      </Card>
    </div>
  );
}

function Followups() {
  return (
    <div>
      <SectionHeader icon={HelpCircle} title="Follow-Up Questions" tag="pending" subtitle="Interview prompts to validate assumptions and collect missing data per role." />
      <div className="grid md:grid-cols-2 gap-4">
        {TEAM.map((t) => (
          <Card key={t.id} className="p-4">
            <h3 className="font-semibold text-slate-800">{t.name}</h3>
            <p className="text-xs text-amber-600 mb-2">{t.role}</p>
            <ul className="space-y-1.5 text-sm text-slate-600">{FOLLOWUPS[t.id].map((q) => <li key={q} className="flex gap-2"><HelpCircle size={14} className="text-slate-300 shrink-0 mt-0.5" />{q}</li>)}</ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ================= APP =================

const NAV = [
  { group: "Audit", items: [
    { id: "summary", label: "Executive Summary", icon: LayoutDashboard },
    { id: "inventory", label: "Process Inventory", icon: Users },
    { id: "bottlenecks", label: "Bottleneck Analysis", icon: AlertTriangle },
    { id: "tooleval", label: "Tool Evaluation", icon: Gauge },
  ]},
  { group: "Design", items: [
    { id: "orchestration", label: "Workflow Orchestration", icon: GitBranch },
    { id: "matrix", label: "AI Opportunity Matrix", icon: Grid3x3 },
    { id: "automations", label: "Automation Recs", icon: Cpu },
    { id: "integrations", label: "Integration Recs", icon: Plug },
    { id: "sops", label: "SOP Library", icon: BookOpen },
  ]},
  { group: "Deliverables", items: [
    { id: "playbook", label: "AI Ops Playbook", icon: FileText },
    { id: "fallhire", label: "Fall Hire Brief", icon: UserPlus },
    { id: "roadmap", label: "Roadmap", icon: Map },
  ]},
  { group: "Tracking", items: [
    { id: "quickwins", label: "Quick Wins", icon: ListChecks },
    { id: "gaps", label: "Missing Info", icon: Search },
    { id: "followups", label: "Follow-Ups", icon: HelpCircle },
  ]},
];

export default function App() {
  const [section, setSection] = useState("summary");
  const [invData, setInvData] = useState({});
  const [scores, setScores] = useState(TOOLS_SEED);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("cm:inventory"); if (r?.value) setInvData(JSON.parse(r.value)); } catch (e) {}
      try { const r = await window.storage.get("cm:scores"); if (r?.value) setScores(JSON.parse(r.value)); } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (!loaded) return; (async () => { try { await window.storage.set("cm:inventory", JSON.stringify(invData)); } catch (e) {} })(); }, [invData, loaded]);
  useEffect(() => { if (!loaded) return; (async () => { try { await window.storage.set("cm:scores", JSON.stringify(scores)); } catch (e) {} })(); }, [scores, loaded]);

  const render = () => {
    switch (section) {
      case "summary": return <ExecSummary />;
      case "inventory": return <Inventory data={invData} setData={setInvData} />;
      case "bottlenecks": return <Bottlenecks />;
      case "tooleval": return <ToolEval scores={scores} setScores={setScores} />;
      case "orchestration": return <Orchestration />;
      case "matrix": return <Matrix />;
      case "automations": return <Automations />;
      case "integrations": return <Integrations />;
      case "sops": return <SopLibrary />;
      case "playbook": return <Playbook />;
      case "fallhire": return <FallHire />;
      case "roadmap": return <Roadmap />;
      case "quickwins": return <QuickWins />;
      case "gaps": return <Gaps />;
      case "followups": return <Followups />;
      default: return <ExecSummary />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-700">
          <div className="text-amber-400 font-bold tracking-widest text-xs uppercase">Covet &amp; Mane</div>
          <div className="text-white font-semibold mt-1 leading-tight text-sm">AI Marketing Operations OS</div>
          <div className="text-[10px] text-slate-500 mt-1">Handoff target: {DEADLINE}</div>
        </div>
        <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
          {NAV.map((g) => (
            <div key={g.group}>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 px-3 mb-1">{g.group}</div>
              <div className="space-y-0.5">
                {g.items.map((n) => {
                  const Icon = n.icon; const on = section === n.id;
                  return (
                    <button key={n.id} onClick={() => setSection(n.id)}
                      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition text-left ${on ? "bg-amber-500 text-white font-semibold" : "hover:bg-slate-800"}`}>
                      <Icon size={15} className="shrink-0" />{n.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 text-[10px] text-slate-500 border-t border-slate-700">Inferred content flagged for validation · No facts fabricated</div>
      </aside>
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen"><div className="max-w-5xl mx-auto">{render()}</div></main>
    </div>
  );
}