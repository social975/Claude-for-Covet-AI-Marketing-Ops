'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  LayoutDashboard, Users, GitBranch, Grid3x3, AlertTriangle, Cpu,
  Plug, ListChecks, Map, Search, HelpCircle, ChevronRight, ArrowDown,
  Brain, Zap, Database, CheckCircle2, BarChart3, Repeat, Layers, Save,
  Slack, FileText, BookOpen, UserPlus, Gauge, Calendar, Shield,
  StickyNote, TrendingUp, Send, Check, Clock, Loader2,
} from 'lucide-react'
import LogoutButton from './auth/LogoutButton'
import {
  loadInventoryData,
  saveInventoryData,
  loadToolScores,
  saveToolScores,
  loadQuickWins,
  seedQuickWins,
  updateQuickWinStatus,
  loadKPIs,
  upsertKPI,
  deleteKPI,
  loadNotes,
  createNote,
  deleteNote,
  type QuickWinRecord,
  type KPIRecord,
  type NoteRecord,
} from '@/lib/supabase/data'

// ─── Reference Data ───────────────────────────────────────────

const DEADLINE = 'August 30, 2026'

const MATURITY: Record<number, { label: string; color: string }> = {
  0: { label: 'Fully Human', color: 'bg-slate-200 text-slate-700' },
  1: { label: 'Human + AI Assist', color: 'bg-sky-100 text-sky-800' },
  2: { label: 'AI-Guided', color: 'bg-indigo-100 text-indigo-800' },
  3: { label: 'Partially Automated', color: 'bg-violet-100 text-violet-800' },
  4: { label: 'Highly Automated', color: 'bg-amber-100 text-amber-800' },
  5: { label: 'Autonomous + Approval', color: 'bg-emerald-100 text-emerald-800' },
}

const CLASS_STYLE: Record<string, string> = {
  'Human Only': 'bg-slate-100 text-slate-700 border-slate-300',
  'AI Assisted': 'bg-indigo-50 text-indigo-700 border-indigo-300',
  Automated: 'bg-emerald-50 text-emerald-700 border-emerald-300',
}

const TEAM = [
  { id: 'karli', name: 'Karli', role: 'Social content, community management, brief interpretation' },
  { id: 'johnathan', name: 'Johnathan', role: 'Shopify execution, asset deployment, agency coordination' },
  { id: 'andrea', name: 'Andrea', role: 'Campaign management, marketing calendar ownership, agency coordination' },
  { id: 'nadine', name: 'Nadine (Offshore PM)', role: 'Brief creation, influencer outreach, calendar mgmt, cross-functional coordination' },
  { id: 'jenny', name: 'Jenny', role: 'Email design, email deployment' },
  { id: 'katina', name: 'Katina', role: 'Education initiatives, student certification coordination' },
]

const INVENTORY_FIELDS = [
  { key: 'objectives', label: 'Key Objectives' },
  { key: 'stakeholders', label: 'Stakeholders' },
  { key: 'tasks', label: 'Recurring Tasks (name · frequency · time · tools)', wide: true },
  { key: 'inputs', label: 'Inputs (data, approvals, assets, briefs, dependencies)' },
  { key: 'outputs', label: 'Outputs / Deliverables' },
  { key: 'time', label: 'Time Estimate (per occurrence · weekly · monthly)' },
  { key: 'painpoints', label: 'Pain Points (repetitive, manual, delays, comms)' },
  { key: 'automation', label: 'Automation Potential (High / Med / Low + why)' },
  { key: 'aiops', label: 'AI Opportunities (Claude, Make, Klaviyo AI, etc.)' },
]

const WORKFLOWS = [
  {
    id: 'social', title: 'Social Content', owner: 'Karli', maturity: 2,
    current: 'Karli interprets briefs, drafts, schedules, and moderates content manually; performance review is ad-hoc.',
    stages: {
      external: 'Notion calendar, creative briefs, campaign objectives, existing assets (Frame.io), prior performance',
      analysis: 'Synthesize brief intent, surface content gaps, cluster top-performing themes',
      decision: 'Generate post recs, captions, hashtags, and repurposing plan (magazine/edu → TikTok/IG/LinkedIn)',
      automation: 'Make.com routes approved drafts to scheduling; pulls engagement metrics on a schedule',
      execution: 'Social scheduling tools, Google Workspace, Frame.io, Canva AI / Descript for assets',
      confirmation: 'Publish verification + posting log; flag failed/missed posts',
      reporting: 'Engagement dashboard logged to Notion',
      knowledge: "Performance patterns → Notion KB → next cycle's recs",
    },
    slack: 'Draft batch posted to #social-approvals with thumbnail + caption; one-click ✅/✏️.',
    approval: 'Approver: Andrea (brand) · fallback Karli. If no action in 24h → auto-reminder, then hold.',
    justify: 'Brand voice & community nuance keep a human in the loop; AI guides ideation/drafting (L2).',
  },
  {
    id: 'email', title: 'Email Marketing', owner: 'Jenny', maturity: 3,
    current: 'Jenny designs and deploys in Klaviyo; segmentation and testing are manual and inconsistent.',
    stages: {
      external: 'Klaviyo metrics, campaign brief, segments, Shopify customer data',
      analysis: 'Review objectives, surface segment opportunities, find under-tested variables',
      decision: 'Generate messaging recs, subject-line variants, send-time + A/B suggestions',
      automation: 'Pipedream/Make sync Shopify segments → Klaviyo; trigger test setup + metric pulls; Klaviyo AI',
      execution: 'Klaviyo',
      confirmation: 'Deployment + deliverability/bounce check',
      reporting: 'Open, CTR, revenue attribution → Notion',
      knowledge: 'Winning variants & segment learnings retained',
    },
    slack: 'Pre-send summary to #email-ops: audience, subject, send time → approve to schedule.',
    approval: 'Approver: Jenny (creative) + Andrea (calendar). No action by send-window − 2h → auto-hold.',
    justify: 'Repeatable structure + strong data allow tests/flows to be largely automated with creative sign-off (L3).',
  },
  {
    id: 'shopify', title: 'Shopify Deployment', owner: 'Johnathan', maturity: 3,
    current: 'Johnathan builds pages, checks assets, deploys; QA is manual and error-prone under deadline.',
    stages: {
      external: 'Campaign assets, product info, inventory data, APC API data',
      analysis: 'Review requirements, detect missing assets, assess inventory/operational risk',
      decision: 'Produce deployment checklist, flag blockers, sequence launch steps',
      automation: 'Pipedream/Make push validated assets, sync APC + inventory, stage publish',
      execution: 'Shopify',
      confirmation: 'Automated deployment verification + error monitoring',
      reporting: 'Performance dashboards + operational logs → Notion',
      knowledge: 'Recurring error types captured to prevent repeats',
    },
    slack: 'Readiness report to #shopify-deploy: ✅ assets present / ❌ missing list → approve to publish.',
    approval: 'Approver: Johnathan + Andrea. Missing assets → auto-route request to asset owner in Slack.',
    justify: 'Asset checks & deploys are rule-based and integrable; final publish stays human-gated (L3).',
  },
  {
    id: 'campaign', title: 'Campaign & Calendar', owner: 'Andrea', maturity: 2,
    current: 'Andrea owns the marketing calendar and agency coordination, largely over email/Notion with manual chasing.',
    stages: {
      external: 'Campaign briefs, agency deliverables (Frame.io), timelines, stakeholder requests',
      analysis: 'Track deliverable status, detect timeline risk, summarize agency feedback',
      decision: 'Draft status updates, flag at-risk items, propose timeline adjustments',
      automation: 'Make watches Frame.io/Notion for status; auto-nudges + digest generation',
      execution: 'Notion, Google Workspace, Frame.io, ClickUp AI',
      confirmation: 'Deliverable receipt + approval tracking',
      reporting: 'Weekly campaign status digest to leadership',
      knowledge: 'Agency turnaround & bottleneck patterns retained',
    },
    slack: 'Auto status digest to #campaign-status every Mon AM; at-risk items @mention owners.',
    approval: 'Approver: Andrea (calendar). Timeline change → structured approval card to CEO if >1wk slip.',
    justify: 'Relationship management & creative approvals need human judgment; AI guides tracking (L2).',
  },
  {
    id: 'influencer', title: 'Influencer & Briefs', owner: 'Nadine', maturity: 2,
    current: 'Nadine creates briefs, runs influencer outreach, and manages the calendar with manual onboarding/tracking.',
    stages: {
      external: 'Refersion + ShareASale data, influencer lists, Paperform submissions, Aircall logs',
      analysis: 'Identify top performers, surface weak partnerships, summarize submissions',
      decision: 'Draft briefs & outreach, prioritize partners, recommend program adjustments',
      automation: 'Pipedream/Make sync Paperform → Notion; automate onboarding sequences + payout data',
      execution: 'Refersion, ShareASale, Notion, Google Workspace',
      confirmation: 'Onboarding completion + tracking-link validation',
      reporting: 'Affiliate performance dashboard → Notion',
      knowledge: 'Partner ROI history retained for selection',
    },
    slack: 'New influencer submissions summarized to #partnerships; approve to onboard.',
    approval: 'Approver: Nadine. Brief draft → Slack to Andrea for calendar fit before outreach.',
    justify: 'Partner relationships are human-owned; onboarding/admin automatable, AI guides selection (L2).',
  },
  {
    id: 'education', title: 'Education & Certification', owner: 'Katina', maturity: 1,
    current: 'Katina coordinates certification, scheduling, and material distribution; tracking is fragmented.',
    stages: {
      external: 'Paperform registrations, Zoom sessions, educational content, certification criteria',
      analysis: 'Track enrollment/completion, identify content gaps, summarize learner feedback',
      decision: 'Recommend content updates, draft comms, flag certification follow-ups',
      automation: 'Make sync Paperform → Notion → Zoom scheduling + reminder sequences',
      execution: 'Paperform, Zoom, Google Workspace, Notion',
      confirmation: 'Completion + certification issuance tracking',
      reporting: 'Education metrics → Notion',
      knowledge: 'Curriculum performance + FAQ patterns retained',
    },
    slack: 'Enrollment + completion summary to #education weekly; certification follow-ups @mention Katina.',
    approval: 'Approver: Katina (certification integrity). Auto-reminders for incomplete certifications.',
    justify: 'Educational quality & certification integrity are human-owned; AI assists drafting/tracking (L1).',
  },
]

const PIPELINE = [
  { key: 'external', label: 'External Systems', icon: Database, color: 'text-slate-600', note: 'Information & events' },
  { key: 'analysis', label: 'Claude Analysis Layer', icon: Brain, color: 'text-indigo-600', note: 'Synthesize & evaluate' },
  { key: 'decision', label: 'Claude Decision Layer', icon: GitBranch, color: 'text-violet-600', note: 'Recommendations' },
  { key: 'automation', label: 'Automation Layer', icon: Zap, color: 'text-amber-600', note: 'Make.com / Pipedream' },
  { key: 'execution', label: 'Execution Systems', icon: Cpu, color: 'text-rose-600', note: 'Operational tools' },
  { key: 'confirmation', label: 'Confirmation Layer', icon: CheckCircle2, color: 'text-emerald-600', note: 'Verify success' },
  { key: 'reporting', label: 'Reporting Layer', icon: BarChart3, color: 'text-sky-600', note: 'Log outcomes' },
  { key: 'knowledge', label: 'Knowledge Layer', icon: Repeat, color: 'text-fuchsia-600', note: 'Retain learnings' },
]

const MATRIX = [
  { task: 'Brand-voice approval & community tone', owner: 'Karli', cls: 'Human Only', lvl: 0 },
  { task: 'Content ideation & caption drafting', owner: 'Karli', cls: 'AI Assisted', lvl: 2 },
  { task: 'Repurposing magazine/edu → social', owner: 'Karli', cls: 'AI Assisted', lvl: 2 },
  { task: 'Post scheduling & metric pulls', owner: 'Karli', cls: 'Automated', lvl: 3 },
  { task: 'Email creative direction & sign-off', owner: 'Jenny', cls: 'Human Only', lvl: 0 },
  { task: 'Subject lines & A/B test design', owner: 'Jenny', cls: 'AI Assisted', lvl: 2 },
  { task: 'Segment sync Shopify ↔ Klaviyo', owner: 'Jenny', cls: 'Automated', lvl: 4 },
  { task: 'Flow/test deployment & reporting', owner: 'Jenny', cls: 'Automated', lvl: 3 },
  { task: 'Asset QA & missing-asset detection', owner: 'Johnathan', cls: 'AI Assisted', lvl: 3 },
  { task: 'Deployment checklist generation', owner: 'Johnathan', cls: 'AI Assisted', lvl: 2 },
  { task: 'Product/page publish (gated)', owner: 'Johnathan', cls: 'Automated', lvl: 3 },
  { task: 'Inventory/APC sync', owner: 'Johnathan', cls: 'Automated', lvl: 4 },
  { task: 'Agency relationship & approvals', owner: 'Andrea', cls: 'Human Only', lvl: 0 },
  { task: 'Calendar status tracking & risk flags', owner: 'Andrea', cls: 'AI Assisted', lvl: 2 },
  { task: 'Status digest generation (Slack)', owner: 'Andrea', cls: 'Automated', lvl: 3 },
  { task: 'Influencer relationship management', owner: 'Nadine', cls: 'Human Only', lvl: 0 },
  { task: 'Brief drafting', owner: 'Nadine', cls: 'AI Assisted', lvl: 2 },
  { task: 'Onboarding & payout data sync', owner: 'Nadine', cls: 'Automated', lvl: 3 },
  { task: 'Certification integrity decisions', owner: 'Katina', cls: 'Human Only', lvl: 0 },
  { task: 'Enrollment tracking & reminders', owner: 'Katina', cls: 'Automated', lvl: 3 },
  { task: 'Learner feedback synthesis', owner: 'Katina', cls: 'AI Assisted', lvl: 1 },
]

const TOOLS_SEED = [
  { id: 'report', name: 'Weekly reporting digest (Slack)', ts: 5, bi: 4, al: 5, ease: 5, cost: 5 },
  { id: 'asset', name: 'AI asset-readiness checker', ts: 4, bi: 5, al: 4, ease: 4, cost: 4 },
  { id: 'repurpose', name: 'Content repurposing engine (Claude)', ts: 5, bi: 4, al: 4, ease: 4, cost: 4 },
  { id: 'segment', name: 'Shopify↔Klaviyo segment sync', ts: 4, bi: 5, al: 4, ease: 3, cost: 4 },
  { id: 'brief', name: 'Brief template + Claude drafting', ts: 4, bi: 3, al: 5, ease: 5, cost: 5 },
  { id: 'onboard', name: 'Affiliate onboarding automation', ts: 3, bi: 3, al: 4, ease: 3, cost: 4 },
  { id: 'edu', name: 'Education enrollment automation', ts: 3, bi: 3, al: 4, ease: 3, cost: 4 },
  { id: 'approval', name: 'Slack approval routing layer', ts: 4, bi: 4, al: 3, ease: 3, cost: 5 },
]

const BOTTLENECKS = [
  { cat: 'Approval Dependencies', items: ['Sequential sign-offs stall launches', 'Unclear approval ownership across campaign → Shopify → email', 'Approvals scattered across email/DM'] },
  { cat: 'Manual Effort', items: ['Repetitive asset checks & re-uploads', 'Hand-built segments and reports', 'Manual status chasing'] },
  { cat: 'Rework', items: ['Missing/incorrect assets surface late in deploy', 'Inconsistent briefs cause redo loops'] },
  { cat: 'Communication', items: ['Context scattered across email/Notion/Zoom', 'Offshore ↔ onshore handoff lag', 'No standardized request format'] },
  { cat: 'Documentation', items: ['No single source of truth for workflows', 'Tribal knowledge concentrated per person'] },
  { cat: 'Delays', items: ['Agency deliverable turnaround', 'Waiting on data to make decisions'] },
]

const AUTOMATIONS = [
  { title: 'AI asset-readiness checker', desc: 'Claude reviews assets vs. requirements, flags gaps in Slack before deploy.', stack: ['Claude', 'Frame.io', 'Make.com', 'Slack', 'Shopify'] },
  { title: 'Shopify ↔ Klaviyo segment sync', desc: 'Auto-sync segments and trigger relevant flows.', stack: ['Shopify', 'Pipedream', 'Klaviyo AI'] },
  { title: 'Affiliate onboarding pipeline', desc: 'Submission → Notion record → onboarding sequence → Slack confirm.', stack: ['Paperform', 'Make.com', 'Notion', 'Refersion', 'Slack'] },
  { title: 'Weekly reporting digest', desc: 'Cross-channel metrics → Slack + Notion leadership digest.', stack: ['Klaviyo', 'Make.com', 'Claude', 'Slack', 'Notion'] },
  { title: 'Content repurposing engine', desc: 'Long-form → channel-specific drafts for review.', stack: ['Claude', 'Canva AI', 'Descript', 'Notion'] },
  { title: 'Slack approval routing', desc: 'Standardized approval cards routed to named owners with no-action fallbacks.', stack: ['Make.com', 'Slack', 'Claude'] },
]

const INTEGRATIONS = [
  { from: 'Shopify', to: 'Klaviyo', via: 'Pipedream', value: 'Real-time segment & purchase sync for targeted email' },
  { from: 'Paperform', to: 'Notion', via: 'Make.com', value: 'Centralize registrations & influencer submissions' },
  { from: 'Frame.io', to: 'Shopify', via: 'Pipedream', value: 'Approved assets flow straight into deployment' },
  { from: 'Any workflow', to: 'Slack', via: 'Make.com', value: 'Approvals, alerts & digests routed to named owners' },
  { from: 'Klaviyo / Refersion', to: 'Notion', via: 'Make.com', value: 'Unified performance reporting' },
  { from: 'APC API', to: 'Shopify', via: 'Pipedream', value: 'Inventory & product data automation' },
]

const QUICKWINS_SEED = [
  { title: 'Weekly reporting digest (Slack)', impact: 'High', effort: 'Low' },
  { title: 'AI asset-readiness checklist', impact: 'High', effort: 'Low' },
  { title: 'Standardized brief template', impact: 'Med', effort: 'Low' },
  { title: 'Slack approval card templates', impact: 'High', effort: 'Low' },
  { title: 'Shopify↔Klaviyo segment sync', impact: 'High', effort: 'Med' },
  { title: 'Content repurposing prompts', impact: 'Med', effort: 'Low' },
]

const ROADMAP = [
  { phase: 'Phase 1 · Audit & Foundation (Jun)', items: ['Interview all 6 roles, fill Process Inventory', 'Document workflows in Notion KB', 'AI literacy + prompting standards', 'Ship quick wins: reporting digest, asset checker'] },
  { phase: 'Phase 2 · Orchestration (Jul)', items: ['Stand up Make.com/Pipedream pipelines', 'Shopify↔Klaviyo + Paperform↔Notion integrations', 'Slack approval routing layer live', 'Repurposing engine + SOP library v1'] },
  { phase: 'Phase 3 · Maturity (early Aug)', items: ['Feedback loops into Notion KB', 'Partially automated email & Shopify flows (L3)', 'Cross-channel reporting intelligence', 'Governance, prompt library, audit trails'] },
  { phase: `Phase 4 · Handoff (by ${DEADLINE})`, items: ['Finalize AI Operations Playbook', 'Deliver Fall Hire Recommendation Brief', 'Operator-independent: ops run via documented workflows', 'Onboard via documentation alone'] },
]

const MISSING = [
  'Actual time-per-task data (all roles) — pending interviews',
  'Confirmed tool list per person vs. assumed stack',
  'Real approval chains and decision owners per workflow',
  'Volume metrics (posts/week, campaigns/month, deploys/week)',
  'Current Slack usage, channel structure & norms',
  'Missing stakeholders: CEO sponsor, IT/security owner, finance for payouts',
  'Current Claude usage & AI literacy baseline per person',
]

const FOLLOWUPS: Record<string, string[]> = {
  karli: ['How many posts/week across channels?', 'Where does the most manual time go?', 'How are briefs interpreted & where do they break down?'],
  johnathan: ['What % of deploys hit missing-asset issues?', 'How is QA done today?', 'How does agency coordination flow?'],
  andrea: ['How is the marketing calendar maintained?', 'Where do timeline risks originate?', 'What reporting does the CEO ask for?'],
  nadine: ["How are briefs created & approved?", "What's manual in influencer outreach?", 'Biggest offshore handoff friction?'],
  jenny: ['How are segments built?', 'How often do you A/B test?', "What's the deploy → report process?"],
  katina: ['How is certification tracked?', 'Where does scheduling break down?', 'What content needs frequent updates?'],
}

const PRINCIPLES = [
  { t: 'No-human-dependency by default', d: 'Systems run without the operator after deployment; minimal interpretation once live.' },
  { t: 'Slack-first routing', d: 'Notifications, requests & approvals pushed through Slack to named owners automatically.' },
  { t: 'Automation-first decomposition', d: 'Every task split into fully / partially / non-automatable; automate anything without judgment.' },
  { t: 'Role-based approval architecture', d: 'Named approvers, standardized yes/no prompts, impossible to misroute.' },
  { t: 'Documented for outsiders', d: "Every system states what's automatic, what's human, who owns it, and the no-action fallback." },
  { t: 'Knowledge externalized', d: 'SOPs, templates, prompt libraries, workflow maps — nothing left to memory or intuition.' },
]

const TOOLSTACK = [
  { layer: 'Reasoning', tools: ['Claude', 'Claude Projects', 'Claude Code'] },
  { layer: 'Knowledge Base', tools: ['Notion'] },
  { layer: 'Orchestration', tools: ['Make.com', 'Pipedream'] },
  { layer: 'Coordination & Approvals', tools: ['Slack'] },
  { layer: 'Project Mgmt', tools: ['ClickUp AI', 'Notion'] },
  { layer: 'Execution', tools: ['Shopify', 'Klaviyo AI', 'Paperform', 'Refersion', 'ShareASale', 'Zoom', 'Aircall'] },
  { layer: 'Creative', tools: ['Canva AI', 'Figma AI', 'Descript', 'Frame.io'] },
  { layer: 'Data', tools: ['APC API', 'Google Workspace'] },
]

const CADENCE = [
  { when: 'Daily', what: 'Slack approval cards processed; deploy/asset checks auto-run; alerts triaged.' },
  { when: 'Weekly', what: 'Mon: campaign status digest. Wed: email/social performance pull. Fri: KB updates.' },
  { when: 'Monthly', what: 'Performance review, partner ROI, roadmap re-prioritization, SOP audit.' },
]

const OWNERSHIP = [
  { fn: 'Social', owner: 'Karli', approver: 'Andrea', channel: '#social-approvals' },
  { fn: 'Email', owner: 'Jenny', approver: 'Jenny + Andrea', channel: '#email-ops' },
  { fn: 'Shopify', owner: 'Johnathan', approver: 'Johnathan + Andrea', channel: '#shopify-deploy' },
  { fn: 'Campaign / Calendar', owner: 'Andrea', approver: 'CEO (major slips)', channel: '#campaign-status' },
  { fn: 'Influencer / Briefs', owner: 'Nadine', approver: 'Nadine + Andrea', channel: '#partnerships' },
  { fn: 'Education', owner: 'Katina', approver: 'Katina', channel: '#education' },
]

const FALLHIRE = {
  ai: ['Reporting & digest generation', 'Content/brief drafting', 'Asset QA & checklist generation', 'Repurposing long-form content', 'Data sync & onboarding admin'],
  partial: ['A/B test design (human approves)', 'Campaign status synthesis', 'Segment building', 'Caption/subject-line generation', 'SOP drafting from observed work'],
  human: ['Brand voice & creative direction', 'Agency & influencer relationships', 'Calendar & priority trade-offs', 'Certification integrity', 'Final launch approvals'],
  role: 'AI Marketing Operations Coordinator',
  resp: ['Own & maintain the Make.com/Slack workflow layer', 'Steward the Notion KB & prompt library', 'Run the approval architecture & escalations', 'Onboard new hires from documentation', 'Drive continuous optimization from feedback loops'],
  justify: 'AI absorbs the repetitive execution & reporting load; the remaining work is relationship-, brand-, and judgment-heavy. A coordinator role sustains the operating system and captures compounding leverage rather than re-absorbing manual tasks.',
}

const SOPS = [
  {
    id: 'email', title: 'Email Campaign Deployment',
    purpose: 'Deploy a Klaviyo email campaign reliably with AI-assisted prep and Slack approval.',
    inputs: ['Approved creative brief', 'Target segment', 'Subject-line options', 'Send window'],
    steps: ['Claude reviews brief → drafts subject variants + send-time rec', 'Confirm segment auto-synced from Shopify', 'Build campaign in Klaviyo from template', 'Post pre-send summary to #email-ops for approval', 'On ✅, schedule; on ✏️, revise & re-post', 'Auto deliverability check at send'],
    output: 'Scheduled/sent campaign + logged metrics in Notion',
    errors: ['Segment out of date', 'Broken merge tags', 'Missing approval before send window'],
    troubleshoot: ['Re-run Shopify→Klaviyo sync', 'Validate template tags in test send', 'Auto-hold triggers if no approval at window − 2h'],
    best: ['Always test-send to self first', 'Keep subject variants ≤ 3', 'Standardize the Slack summary format'],
    screens: ['Klaviyo campaign builder', 'Slack #email-ops approval card', 'Notion metrics log'],
    training: ['Where the approval card comes from', 'How auto-hold works', 'Reading attribution in Notion'],
  },
  {
    id: 'shopify', title: 'Shopify Asset Deployment',
    purpose: 'Publish campaign pages/products only after automated asset readiness checks.',
    inputs: ['Campaign assets (Frame.io)', 'Product/inventory data', 'APC API data', 'Deployment date'],
    steps: ['Claude checks assets vs. requirements', 'Missing assets → auto-request to owner in Slack', 'Generate deployment checklist', 'Stage publish via Make/Pipedream', 'Post readiness report to #shopify-deploy', 'On approval, publish + verify'],
    output: 'Published, verified pages/products + operational log',
    errors: ['Missing/incorrect assets', 'Inventory mismatch', 'Broken links post-publish'],
    troubleshoot: ['Check #shopify-deploy missing-asset list', 'Re-run APC sync', 'Auto error-monitor flags failed publishes'],
    best: ['Never publish without ✅ readiness report', 'Keep an asset-naming convention', 'Log every error type to KB'],
    screens: ['Frame.io asset view', 'Slack readiness card', 'Shopify publish confirmation'],
    training: ['Reading the readiness report', 'Where missing-asset requests route', 'Rollback steps'],
  },
]

// ─── Small Components ─────────────────────────────────────────

function Tag({ kind }: { kind: string }) {
  const map: Record<string, [string, string]> = {
    inferred: ['Inferred', 'bg-amber-100 text-amber-800 border border-amber-300'],
    confirmed: ['Confirmed', 'bg-emerald-100 text-emerald-800 border border-emerald-300'],
    pending: ['Pending interview', 'bg-slate-100 text-slate-600 border border-slate-300'],
    deliverable: ['Final deliverable', 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-300'],
  }
  const [t, c] = map[kind] ?? map.inferred
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${c}`}>{t}</span>
}

function MaturityBadge({ lvl }: { lvl: number }) {
  const m = MATURITY[lvl]
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded ${m.color}`}>L{lvl} · {m.label}</span>
}

function SectionHeader({ icon: Icon, title, subtitle, tag }: {
  icon: React.ElementType; title: string; subtitle?: string; tag?: string
}) {
  return (
    <div className="mb-6 border-b border-slate-200 pb-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-white"><Icon size={18} /></div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {tag && <Tag kind={tag} />}
      </div>
      {subtitle && <p className="text-slate-500 mt-2 text-sm max-w-3xl">{subtitle}</p>}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>{children}</div>
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3 mb-4 flex gap-2">
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />{message}
    </div>
  )
}

// ─── Section Components ───────────────────────────────────────

function ExecSummary() {
  return (
    <div>
      <SectionHeader icon={LayoutDashboard} title="Executive Summary"
        subtitle={`AI Marketing Systems internship OS. Goal: audit marketing & sales ops, implement AI-enabled workflows, and deliver a complete operator-independent handoff by ${DEADLINE}.`} />
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-900 flex gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <p><strong>Confidence note:</strong> Roles & framework are confirmed from the brief. Workflow detail, maturity levels, scores, and recommendations are <strong>inferred</strong> pending interviews. The Process Inventory is a <strong>blank, editable framework</strong>. No facts are fabricated.</p>
      </div>
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {[
          { k: '6', v: 'Roles audited', d: 'Content, commerce, campaigns, partnerships, email, education' },
          { k: '21', v: 'Workflows classified', d: 'Human / AI Assisted / Automated' },
          { k: 'Slack', v: 'Execution layer', d: 'Approvals & routing centralized' },
          { k: DEADLINE.split(',')[0], v: 'Handoff target', d: 'Operator-independent ops' },
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
            {['Centralize fragmented context into a Notion KB feeding Claude.',
              'Make Slack the approval & routing layer — kill scattered comms.',
              'Eliminate manual reporting via a weekly cross-channel digest.',
              'Cut deploy rework with an AI asset-readiness checker.',
              'Free strategic & creative time by automating admin and sync tasks.'].map((x) => (
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
  )
}

function Inventory({ data, setData }: {
  data: Record<string, Record<string, string>>
  setData: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>
}) {
  const [active, setActive] = useState(TEAM[0].id)
  const person = TEAM.find((t) => t.id === active)!
  const vals = data[active] ?? {}
  const update = (key: string, val: string) => setData((p) => ({ ...p, [active]: { ...p[active], [key]: val } }))
  return (
    <div>
      <SectionHeader icon={Users} title="Process Inventory" tag="pending"
        subtitle="Editable per-role framework. Fields auto-save to Supabase — populate during interviews." />
      <div className="flex gap-2 flex-wrap mb-5">
        {TEAM.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${active === t.id ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300'}`}>
            {t.name.split(' ')[0]}
          </button>
        ))}
      </div>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <h3 className="text-lg font-bold text-slate-900">{person.name}</h3>
          <span className="text-xs text-slate-400 flex items-center gap-1"><Save size={12} /> Auto-saved to Supabase</span>
        </div>
        <p className="text-sm text-amber-600 font-medium mb-4">{person.role}</p>
        <div className="grid md:grid-cols-2 gap-4">
          {INVENTORY_FIELDS.map((f) => (
            <div key={f.key} className={f.wide ? 'md:col-span-2' : ''}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{f.label}</label>
              <textarea value={vals[f.key] ?? ''} onChange={(e) => update(f.key, e.target.value)}
                placeholder="Pending interview input…" rows={f.wide ? 4 : 2}
                className="mt-1 w-full text-sm rounded-lg border border-slate-200 p-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none resize-y bg-slate-50" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Orchestration() {
  const [active, setActive] = useState(WORKFLOWS[0].id)
  const wf = WORKFLOWS.find((w) => w.id === active)!
  return (
    <div>
      <SectionHeader icon={GitBranch} title="Workflow Orchestration" tag="inferred"
        subtitle="Each workflow as an end-to-end OS: Inputs → Analysis → Decision → Execution → Confirmation → Reporting → Learning, with Slack as the approval layer." />
      <div className="flex gap-2 flex-wrap mb-5">
        {WORKFLOWS.map((w) => (
          <button key={w.id} onClick={() => setActive(w.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${active === w.id ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'}`}>
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
            const Icon = p.icon
            return (
              <div key={p.key}>
                <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <Icon size={20} className={`${p.color} shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 text-sm">{p.label}</span>
                      <span className="text-[11px] text-slate-400">{p.note}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{wf.stages[p.key as keyof typeof wf.stages]}</p>
                  </div>
                </div>
                {i < PIPELINE.length - 1 && <div className="flex justify-center py-0.5"><ArrowDown size={14} className="text-slate-300" /></div>}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function Matrix() {
  const [cls, setCls] = useState('All')
  const [owner, setOwner] = useState('All')
  const filtered = MATRIX.filter((m) => (cls === 'All' || m.cls === cls) && (owner === 'All' || m.owner === owner))
  const owners = ['All', ...new Set(MATRIX.map((m) => m.owner))]
  return (
    <div>
      <SectionHeader icon={Grid3x3} title="AI Opportunity Matrix" tag="inferred"
        subtitle="Every workflow classified Human Only / AI Assisted / Automated, with an automation maturity level (0–5)." />
      <div className="flex gap-2 flex-wrap mb-4 items-center">
        {['All', 'Human Only', 'AI Assisted', 'Automated'].map((c) => (
          <button key={c} onClick={() => setCls(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${cls === c ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{c}</button>
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
  )
}

function ToolEval({ scores, setScores }: {
  scores: typeof TOOLS_SEED
  setScores: React.Dispatch<React.SetStateAction<typeof TOOLS_SEED>>
}) {
  const priority = (s: typeof TOOLS_SEED[0]) => s.ts + s.bi + s.al - (6 - s.ease)
  const ranked = [...scores].sort((a, b) => priority(b) - priority(a))
  const update = (id: string, field: string, val: string) => {
    const v = Math.max(1, Math.min(5, Number(val) || 1))
    setScores((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: v } : s)))
  }
  const cols: [string, string][] = [['ts', 'Time Savings'], ['bi', 'Business Impact'], ['al', 'Adoption'], ['ease', 'Ease of Impl.'], ['cost', 'Cost Eff.']]
  return (
    <div>
      <SectionHeader icon={Gauge} title="Tool Evaluation & Priority" tag="inferred"
        subtitle="Score each opportunity 1–5. Priority = Time Savings + Business Impact + Adoption − Implementation Complexity. Scores saved to Supabase." />
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
                    <input type="number" min={1} max={5} value={(s as Record<string, number>)[c[0]]} onChange={(e) => update(s.id, c[0], e.target.value)}
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
    </div>
  )
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
              {b.items.map((item) => <li key={item} className="flex gap-2"><ChevronRight size={14} className="text-slate-300 shrink-0 mt-0.5" />{item}</li>)}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
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
  )
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
  )
}

function SopLibrary() {
  const [active, setActive] = useState(SOPS[0].id)
  const sop = SOPS.find((s) => s.id === active)!
  const Block = ({ title, items }: { title: string; items: string[] }) => (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{title}</p>
      <ul className="space-y-1 text-sm text-slate-600">{items.map((x, i) => <li key={i} className="flex gap-2"><ChevronRight size={13} className="text-slate-300 shrink-0 mt-1" />{x}</li>)}</ul>
    </div>
  )
  return (
    <div>
      <SectionHeader icon={BookOpen} title="SOP Library" tag="inferred"
        subtitle="Standardized SOPs so any system is operable by someone who didn't build it." />
      <div className="flex gap-2 flex-wrap mb-5">
        {SOPS.map((s) => (
          <button key={s.id} onClick={() => setActive(s.id)} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${active === s.id ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300'}`}>{s.title}</button>
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
  )
}

function QuickWinsPanel() {
  const [wins, setWins] = useState<QuickWinRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        await seedQuickWins(QUICKWINS_SEED)
        const data = await loadQuickWins()
        setWins(data)
      } catch (e) {
        setError('Failed to load quick wins. Check your Supabase connection.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const toggle = async (id: string, current: QuickWinRecord['status']) => {
    const next: QuickWinRecord['status'] = current === 'done' ? 'pending' : current === 'pending' ? 'in_progress' : 'done'
    setWins((prev) => prev.map((w) => (w.id === id ? { ...w, status: next } : w)))
    try {
      await updateQuickWinStatus(id, next)
    } catch {
      setWins((prev) => prev.map((w) => (w.id === id ? { ...w, status: current } : w)))
    }
  }

  const statusIcon = (s: QuickWinRecord['status']) => {
    if (s === 'done') return <Check size={14} className="text-emerald-600" />
    if (s === 'in_progress') return <Clock size={14} className="text-amber-500" />
    return <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
  }
  const impactColor = (v: string) => v === 'High' ? 'text-emerald-600' : v === 'Med' ? 'text-amber-600' : 'text-slate-500'

  return (
    <div>
      <SectionHeader icon={ListChecks} title="High-Impact Quick Wins" tag="inferred"
        subtitle="Low-effort, high-leverage moves. Click the status icon to cycle through pending → in progress → done. Saved to Supabase." />
      {error && <ErrorBanner message={error} />}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-8 justify-center"><Loader2 size={16} className="animate-spin" /> Loading…</div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left p-3 font-semibold w-8">Status</th>
                <th className="text-left p-3 font-semibold">Initiative</th>
                <th className="text-left p-3 font-semibold">Impact</th>
                <th className="text-left p-3 font-semibold">Effort</th>
              </tr>
            </thead>
            <tbody>
              {wins.map((q) => (
                <tr key={q.id} className={`border-t border-slate-100 hover:bg-slate-50 ${q.status === 'done' ? 'opacity-60' : ''}`}>
                  <td className="p-3">
                    <button onClick={() => toggle(q.id, q.status)} className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-slate-100 transition">
                      {statusIcon(q.status)}
                    </button>
                  </td>
                  <td className={`p-3 text-slate-700 ${q.status === 'done' ? 'line-through' : ''}`}>{q.title}</td>
                  <td className={`p-3 font-semibold ${impactColor(q.impact)}`}>{q.impact}</td>
                  <td className={`p-3 font-semibold ${impactColor(q.effort === 'Low' ? 'High' : q.effort)}`}>{q.effort}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

function Playbook() {
  return (
    <div>
      <SectionHeader icon={FileText} title="AI Operations Playbook" tag="deliverable"
        subtitle="The operating system handoff: tool stack, ownership, cadence, and design principles." />
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
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Shield size={16} className="text-amber-500" />Operating Principles</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {PRINCIPLES.map((p) => (
            <div key={p.t} className="border border-slate-200 rounded-lg p-3"><p className="font-semibold text-slate-800 text-sm">{p.t}</p><p className="text-xs text-slate-500 mt-1">{p.d}</p></div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function FallHire() {
  const Col = ({ title, items, color }: { title: string; items: string[]; color: string }) => (
    <Card className="p-4">
      <h3 className={`font-semibold mb-2 ${color}`}>{title}</h3>
      <ul className="space-y-1.5 text-sm text-slate-600">{items.map((item) => <li key={item} className="flex gap-2"><ChevronRight size={14} className="text-slate-300 shrink-0 mt-0.5" />{item}</li>)}</ul>
    </Card>
  )
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
  )
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
  )
}

function Gaps() {
  return (
    <div>
      <SectionHeader icon={Search} title="Missing Information Tracker" tag="pending" subtitle="Gaps to close before findings can be confirmed." />
      <Card className="p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Open data gaps & missing stakeholders</h3>
        <ul className="space-y-2 text-sm text-slate-600">{MISSING.map((m) => <li key={m} className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />{m}</li>)}</ul>
      </Card>
    </div>
  )
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
  )
}

// ─── KPIs Panel ───────────────────────────────────────────────

function KPIsPanel() {
  const [kpis, setKpis] = useState<KPIRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', value: '', target: '', unit: '', category: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadKPIs().then(setKpis).catch(() => setError('Failed to load KPIs.')).finally(() => setLoading(false))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await upsertKPI({
        name: form.name,
        value: form.value ? Number(form.value) : null,
        target: form.target ? Number(form.target) : null,
        unit: form.unit || null,
        category: form.category || null,
      })
      const updated = await loadKPIs()
      setKpis(updated)
      setForm({ name: '', value: '', target: '', unit: '', category: '' })
    } catch {
      setError('Failed to save KPI.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setKpis((prev) => prev.filter((k) => k.id !== id))
    try { await deleteKPI(id) } catch { const d = await loadKPIs(); setKpis(d) }
  }

  return (
    <div>
      <SectionHeader icon={TrendingUp} title="KPI Tracker" subtitle="Track key performance indicators. All data saved to Supabase." />
      {error && <ErrorBanner message={error} />}
      <Card className="p-5 mb-4">
        <h3 className="font-semibold text-slate-800 mb-3 text-sm">Add KPI</h3>
        <form onSubmit={handleAdd} className="grid md:grid-cols-5 gap-3 items-end">
          {[
            { key: 'name', label: 'Name', placeholder: 'Email open rate', required: true },
            { key: 'value', label: 'Current', placeholder: '24', type: 'number' },
            { key: 'target', label: 'Target', placeholder: '35', type: 'number' },
            { key: 'unit', label: 'Unit', placeholder: '%' },
            { key: 'category', label: 'Category', placeholder: 'Email' },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{f.label}</label>
              <input
                type={f.type ?? 'text'} required={f.required}
                value={(form as Record<string, string>)[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="mt-1 w-full text-sm rounded-lg border border-slate-200 p-2 focus:border-amber-400 outline-none bg-slate-50"
              />
            </div>
          ))}
          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-400 transition disabled:opacity-50 whitespace-nowrap">
            {saving ? 'Adding…' : 'Add KPI'}
          </button>
        </form>
      </Card>
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-8 justify-center"><Loader2 size={16} className="animate-spin" /> Loading…</div>
      ) : kpis.length === 0 ? (
        <Card className="p-8 text-center text-slate-400 text-sm">No KPIs yet — add one above.</Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr><th className="text-left p-3">KPI</th><th className="text-left p-3">Category</th><th className="text-right p-3">Current</th><th className="text-right p-3">Target</th><th className="text-right p-3">Progress</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {kpis.map((k) => {
                const pct = k.target && k.value != null ? Math.min(100, Math.round((k.value / k.target) * 100)) : null
                return (
                  <tr key={k.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-800">{k.name}</td>
                    <td className="p-3 text-slate-500">{k.category ?? '—'}</td>
                    <td className="p-3 text-right text-slate-700">{k.value != null ? `${k.value}${k.unit ?? ''}` : '—'}</td>
                    <td className="p-3 text-right text-slate-500">{k.target != null ? `${k.target}${k.unit ?? ''}` : '—'}</td>
                    <td className="p-3 text-right">
                      {pct != null ? (
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleDelete(k.id)} className="text-xs text-slate-400 hover:text-rose-500 transition">Remove</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

// ─── Notes Panel ──────────────────────────────────────────────

function NotesPanel({ section: sectionKey }: { section?: string }) {
  const [notes, setNotes] = useState<NoteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadNotes(sectionKey).then(setNotes).catch(() => setError('Failed to load notes.')).finally(() => setLoading(false))
  }, [sectionKey])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    setError('')
    try {
      await createNote(text.trim(), sectionKey)
      const updated = await loadNotes(sectionKey)
      setNotes(updated)
      setText('')
    } catch {
      setError('Failed to save note.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    try { await deleteNote(id) } catch { const d = await loadNotes(sectionKey); setNotes(d) }
  }

  return (
    <div>
      <SectionHeader icon={StickyNote} title="Notes" subtitle="Freeform notes saved to Supabase. Use this for interview findings, observations, or action items." />
      {error && <ErrorBanner message={error} />}
      <Card className="p-5 mb-4">
        <form onSubmit={handleAdd} className="space-y-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} required
            placeholder="Add a note…" rows={3}
            className="w-full text-sm rounded-lg border border-slate-200 p-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none resize-y bg-slate-50" />
          <button type="submit" disabled={saving || !text.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-400 transition disabled:opacity-50">
            <Send size={14} />{saving ? 'Saving…' : 'Save Note'}
          </button>
        </form>
      </Card>
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-4 justify-center"><Loader2 size={16} className="animate-spin" /> Loading…</div>
      ) : notes.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-4">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-slate-700 flex-1 whitespace-pre-wrap">{n.content}</p>
                <button onClick={() => handleDelete(n.id)} className="text-xs text-slate-400 hover:text-rose-500 transition shrink-0">Delete</button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AI Router Panel ──────────────────────────────────────────

interface RouterResult {
  analysis: string
  workflow_step: string
  recommendations: string[]
  relevant_tools: string[]
  automatable: boolean
  priority: 'high' | 'medium' | 'low'
  next_steps: string[]
  maturity_level: number
}

function AIRouterPanel() {
  const [source, setSource] = useState('social')
  const [content, setContent] = useState('')
  const [result, setResult] = useState<RouterResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, content }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as RouterResult
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const priorityStyle = (p: string) =>
    p === 'high' ? 'bg-rose-100 text-rose-700' : p === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'

  return (
    <div>
      <SectionHeader icon={Brain} title="AI Operations Router"
        subtitle="Ask Claude a question about any workflow. Your request flows: Browser → /api/router → Claude (server-side) — API key never leaves the server." />
      <Card className="p-5 mb-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Workflow Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)}
                className="mt-1 w-full text-sm rounded-lg border border-slate-200 p-2.5 focus:border-amber-400 outline-none bg-white">
                <option value="social">Social Content</option>
                <option value="email">Email Marketing</option>
                <option value="shopify">Shopify Deployment</option>
                <option value="campaign">Campaign & Calendar</option>
                <option value="influencer">Influencer & Briefs</option>
                <option value="education">Education & Certification</option>
                <option value="general">General Operations</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Question or Context</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your situation or ask a question about this workflow…"
              rows={4} required maxLength={4000}
              className="mt-1 w-full text-sm rounded-lg border border-slate-200 p-2.5 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none resize-y bg-slate-50" />
            <p className="text-[10px] text-slate-400 mt-1">{content.length}/4000</p>
          </div>
          {error && <ErrorBanner message={error} />}
          <button type="submit" disabled={loading || !content.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-400 transition disabled:opacity-50">
            {loading ? <><Loader2 size={15} className="animate-spin" />Analyzing…</> : <><Brain size={15} />Analyze with Claude</>}
          </button>
        </form>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <h3 className="font-semibold text-slate-800">Analysis</h3>
              <div className="flex gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded ${priorityStyle(result.priority)}`}>{result.priority} priority</span>
                <MaturityBadge lvl={result.maturity_level ?? 0} />
                <span className={`text-xs font-semibold px-2 py-1 rounded ${result.automatable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {result.automatable ? 'Automatable' : 'Human-required'}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-4">{result.analysis}</p>
            <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Workflow Step</div>
            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-semibold">{result.workflow_step}</span>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Recommendations</h4>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {result.recommendations.map((r, i) => <li key={i} className="flex gap-2"><ChevronRight size={14} className="text-amber-500 shrink-0 mt-0.5" />{r}</li>)}
              </ul>
            </Card>
            <Card className="p-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Next Steps</h4>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {result.next_steps.map((s, i) => <li key={i} className="flex gap-2"><ChevronRight size={14} className="text-emerald-500 shrink-0 mt-0.5" />{s}</li>)}
              </ul>
            </Card>
          </div>
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Relevant Tools</h4>
            <div className="flex flex-wrap gap-2">
              {result.relevant_tools.map((t) => <span key={t} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{t}</span>)}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// ─── Navigation ───────────────────────────────────────────────

const NAV = [
  { group: 'Audit', items: [
    { id: 'summary', label: 'Executive Summary', icon: LayoutDashboard },
    { id: 'inventory', label: 'Process Inventory', icon: Users },
    { id: 'bottlenecks', label: 'Bottleneck Analysis', icon: AlertTriangle },
    { id: 'tooleval', label: 'Tool Evaluation', icon: Gauge },
  ]},
  { group: 'Design', items: [
    { id: 'orchestration', label: 'Workflow Orchestration', icon: GitBranch },
    { id: 'matrix', label: 'AI Opportunity Matrix', icon: Grid3x3 },
    { id: 'automations', label: 'Automation Recs', icon: Cpu },
    { id: 'integrations', label: 'Integration Recs', icon: Plug },
    { id: 'sops', label: 'SOP Library', icon: BookOpen },
  ]},
  { group: 'Deliverables', items: [
    { id: 'playbook', label: 'AI Ops Playbook', icon: FileText },
    { id: 'fallhire', label: 'Fall Hire Brief', icon: UserPlus },
    { id: 'roadmap', label: 'Roadmap', icon: Map },
  ]},
  { group: 'Tracking', items: [
    { id: 'quickwins', label: 'Quick Wins', icon: ListChecks },
    { id: 'kpis', label: 'KPI Tracker', icon: TrendingUp },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'gaps', label: 'Missing Info', icon: Search },
    { id: 'followups', label: 'Follow-Ups', icon: HelpCircle },
  ]},
  { group: 'AI Tools', items: [
    { id: 'ai-router', label: 'AI Router', icon: Brain },
  ]},
]

// ─── Save Status Badge ────────────────────────────────────────

function SaveBadge({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null
  return (
    <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
      status === 'saving' ? 'bg-amber-100 text-amber-700' :
      status === 'saved'  ? 'bg-emerald-100 text-emerald-700' :
                            'bg-rose-100 text-rose-700'
    }`}>
      {status === 'saving' && <Loader2 size={10} className="animate-spin" />}
      {status === 'saved'  && <Check size={10} />}
      {status === 'error'  && <AlertTriangle size={10} />}
      {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Save error'}
    </span>
  )
}

// ─── App ──────────────────────────────────────────────────────

type InventoryData = Record<string, Record<string, string>>

export default function App({ userEmail, userId: _userId }: { userEmail?: string; userId?: string }) {
  const [section, setSection] = useState('summary')
  const [invData, setInvData] = useState<InventoryData>({})
  const [scores, setScores] = useState(TOOLS_SEED)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const invTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        const [inv, sc] = await Promise.all([
          loadInventoryData(),
          loadToolScores(TOOLS_SEED),
        ])
        setInvData(inv)
        setScores(sc)
      } catch (e) {
        console.error('Supabase load failed, falling back to localStorage:', e)
        setLoadError('Could not reach Supabase — showing locally cached data.')
        try { const v = localStorage.getItem('cm:inventory'); if (v) setInvData(JSON.parse(v)) } catch {}
        try { const v = localStorage.getItem('cm:scores'); if (v) setScores(JSON.parse(v)) } catch {}
      } finally {
        setLoaded(true)
      }
    })()
  }, [])

  // ── Debounced inventory save ──────────────────────────────
  const scheduleInvSave = useCallback((data: InventoryData) => {
    if (invTimer.current) clearTimeout(invTimer.current)
    setSaveStatus('saving')
    invTimer.current = setTimeout(async () => {
      try {
        await saveInventoryData(data)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
        try { localStorage.setItem('cm:inventory', JSON.stringify(data)) } catch {}
      }
    }, 800)
  }, [])

  useEffect(() => {
    if (!loaded) return
    scheduleInvSave(invData)
  }, [invData, loaded, scheduleInvSave])

  // ── Debounced scores save ─────────────────────────────────
  const scheduleScoreSave = useCallback((sc: typeof TOOLS_SEED) => {
    if (scoreTimer.current) clearTimeout(scoreTimer.current)
    setSaveStatus('saving')
    scoreTimer.current = setTimeout(async () => {
      try {
        await saveToolScores(sc)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
        try { localStorage.setItem('cm:scores', JSON.stringify(sc)) } catch {}
      }
    }, 800)
  }, [])

  useEffect(() => {
    if (!loaded) return
    scheduleScoreSave(scores)
  }, [scores, loaded, scheduleScoreSave])

  const render = () => {
    switch (section) {
      case 'summary':       return <ExecSummary />
      case 'inventory':     return <Inventory data={invData} setData={setInvData} />
      case 'bottlenecks':   return <Bottlenecks />
      case 'tooleval':      return <ToolEval scores={scores} setScores={setScores} />
      case 'orchestration': return <Orchestration />
      case 'matrix':        return <Matrix />
      case 'automations':   return <Automations />
      case 'integrations':  return <Integrations />
      case 'sops':          return <SopLibrary />
      case 'playbook':      return <Playbook />
      case 'fallhire':      return <FallHire />
      case 'roadmap':       return <Roadmap />
      case 'quickwins':     return <QuickWinsPanel />
      case 'kpis':          return <KPIsPanel />
      case 'notes':         return <NotesPanel />
      case 'gaps':          return <Gaps />
      case 'followups':     return <Followups />
      case 'ai-router':     return <AIRouterPanel />
      default:              return <ExecSummary />
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 size={20} className="animate-spin text-amber-500" />
          <span className="text-sm">Loading your data…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
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
                  const Icon = n.icon
                  const on = section === n.id
                  return (
                    <button key={n.id} onClick={() => setSection(n.id)}
                      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition text-left ${on ? 'bg-amber-500 text-white font-semibold' : 'hover:bg-slate-800'}`}>
                      <Icon size={15} className="shrink-0" />{n.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-700">
          {userEmail && (
            <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 truncate flex-1" title={userEmail}>{userEmail}</span>
              <LogoutButton />
            </div>
          )}
          <div className="px-4 pb-3 pt-1 flex items-center gap-2">
            <SaveBadge status={saveStatus} />
          </div>
          <div className="px-4 pb-4 text-[10px] text-slate-500">
            Inferred content flagged for validation · No facts fabricated
          </div>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        <div className="max-w-5xl mx-auto">
          {loadError && <ErrorBanner message={loadError} />}
          {render()}
        </div>
      </main>
    </div>
  )
}
