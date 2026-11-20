import path from "path";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Load .env.local explicitly, falling back to .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { connectToDatabase } from "../src/lib/db";
import { User } from "../src/lib/models/User";
import { Service } from "../src/lib/models/Service";
import { FormVersion, IFormField } from "../src/lib/models/FormVersion";
import { MessageTemplate } from "../src/lib/models/MessageTemplate";
import { Inquiry } from "../src/lib/models/Inquiry";
import { RateLimit } from "../src/lib/models/RateLimit";
import { validateQuestionDependencies } from "../src/lib/validation/form-builder";
import { generateReferenceId } from "../src/lib/utils/reference-id";
import { normalizeToE164, extractPhoneDigits } from "../src/lib/utils/phone";

async function runSeed() {
  if (process.env.NODE_ENV === "production") {
    console.error("CRITICAL: Seed script refused to run in production environment.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB database...");
  await connectToDatabase();
  console.log("Connected successfully.");

  // 1. Synchronize indexes across all Mongoose models
  console.log("Synchronizing schema indexes...");
  await Promise.all([
    User.syncIndexes(),
    Service.syncIndexes(),
    FormVersion.syncIndexes(),
    Inquiry.syncIndexes(),
    MessageTemplate.syncIndexes(),
    RateLimit.syncIndexes(),
  ]);
  console.log("Indexes synchronized successfully.");

  // 2. Seed Services
  console.log("Seeding Cynbit service offerings...");
  const servicesData = [
    // AI Automation
    {
      slug: "autonomous-agents",
      name: "Autonomous Agents",
      category: "AI_AUTOMATION",
      description: "End-to-end autonomous business task agents, workflow orchestrators, and automated decision bots.",
      features: ["Multi-step task execution", "Tool calling & API integrations", "Human-in-the-loop triggers", "Failover recovery"],
      active: true,
      order: 1,
    },
    {
      slug: "llm-automation",
      name: "LLM Automation",
      category: "AI_AUTOMATION",
      description: "Custom enterprise LLM pipelines, document parsers, automated summarization, and domain knowledge bases.",
      features: ["Domain-specific embeddings", "Context routing", "Structured JSON extraction", "Enterprise compliance"],
      active: true,
      order: 2,
    },
    {
      slug: "ai-voice-agents",
      name: "AI Voice Agents",
      category: "AI_AUTOMATION",
      description: "Conversational telephony agents for inbound customer qualification, booking, and outbound lead follow-up.",
      features: ["Low-latency streaming audio", "Natural conversational tone", "CRM call logging", "Multilingual support"],
      active: true,
      order: 3,
    },
    {
      slug: "ai-stack-integration",
      name: "AI Stack Integration",
      category: "AI_AUTOMATION",
      description: "Seamlessly integrate open-source and proprietary AI capabilities into existing enterprise architectures.",
      features: ["Hybrid cloud hosting", "Latency optimization", "Model monitoring", "Cost governance"],
      active: true,
      order: 4,
    },
    // Custom IT
    {
      slug: "fullstack-development",
      name: "Full-Stack Web Development",
      category: "CUSTOM_IT",
      description: "Scalable, high-performance web applications built on modern frameworks with high-velocity release cycles.",
      features: ["Next.js & React architecture", "Role-based access control", "Responsive UI/UX design", "Zero-downtime deployment"],
      active: true,
      order: 5,
    },
    {
      slug: "backend-systems",
      name: "Backend Systems & APIs",
      category: "CUSTOM_IT",
      description: "Fault-tolerant microservices, resilient event streaming, high-throughput database design, and REST/GraphQL APIs.",
      features: ["High throughput processing", "Secure authentication", "Rate limiting & caching", "Automated telemetry"],
      active: true,
      order: 6,
    },
    {
      slug: "cloud-infrastructure",
      name: "Cloud Infrastructure & DevOps",
      category: "CUSTOM_IT",
      description: "Automated CI/CD pipelines, container orchestration (Docker/K8s), and cloud-native serverless deployments.",
      features: ["Infrastructure as Code", "Multi-region resilience", "Security hardening", "Cost optimization"],
      active: true,
      order: 7,
    },
    {
      slug: "legacy-migration",
      name: "Legacy System Modernization",
      category: "CUSTOM_IT",
      description: "Refactor legacy monolithic software into modular, cloud-ready, and maintainable services without business disruption.",
      features: ["Data migration pipelines", "Strangler fig pattern", "API facades", "Regression safety"],
      active: true,
      order: 8,
    },
    // Digital Marketing
    {
      slug: "performance-ads",
      name: "Performance Advertising",
      category: "DIGITAL_MARKETING",
      description: "High-ROI digital ad management across Meta, Google Ads, and LinkedIn with algorithmic audience targeting.",
      features: ["Audience segmentation", "Creative A/B testing", "Conversion tracking", "ROAS optimization"],
      active: true,
      order: 9,
    },
    {
      slug: "technical-seo",
      name: "Technical SEO & Speed Optimization",
      category: "DIGITAL_MARKETING",
      description: "Core Web Vitals acceleration, semantic search architecture, schema markup, and high-intent programmatic SEO.",
      features: ["Core Web Vitals tuning", "Structured schema", "Indexation auditing", "Content architecture"],
      active: true,
      order: 10,
    },
    {
      slug: "crm-automation",
      name: "CRM & Funnel Automation",
      category: "DIGITAL_MARKETING",
      description: "End-to-end lead ingestion, automated pipeline stages, nurture sequences, and sales team notification webhooks.",
      features: ["Lead scoring", "Multi-channel sequences", "Sales pipeline syncing", "Real-time alerts"],
      active: true,
      order: 11,
    },
    {
      slug: "funnel-optimization",
      name: "Conversion Funnel Optimization",
      category: "DIGITAL_MARKETING",
      description: "Data-driven user journey mapping, heatmaps, landing page conversion rate optimization (CRO), and checkout tuning.",
      features: ["Friction analysis", "Split testing", "Behavioral analytics", "Conversion attribution"],
      active: true,
      order: 12,
    },
  ];

  for (const s of servicesData) {
    await Service.findOneAndUpdate({ slug: s.slug }, s, { upsert: true, new: true });
  }
  console.log(`Seeded ${servicesData.length} services.`);

  // 3. Seed FormVersion (PUBLISHED v1) with dynamic Step 2 (Requirements) & Step 3 (Planning) questions
  console.log("Seeding default published form questions (FormVersion v1)...");
  const questions: IFormField[] = [
    // --- STEP 2: TECHNICAL REQUIREMENTS ---
    // Common requirements
    {
      id: "q_desc",
      key: "project_description",
      label: "Project Description & Objectives",
      step: 2,
      helpText: "Describe the primary problem you are solving or what you want to achieve.",
      placeholder: "e.g., We need to streamline our internal client intake and automatically trigger notifications...",
      type: "textarea",
      required: true,
      active: true,
      order: 1,
      serviceSlugs: ["all"],
      validation: { maxLength: 2000 },
    },
    // Web / App specific
    {
      id: "q_platform_type",
      key: "platform_type",
      label: "Target Platform / Architecture",
      step: 2,
      helpText: "Specify what type of digital product you need developed.",
      type: "select",
      required: true,
      active: true,
      order: 2,
      serviceSlugs: ["fullstack-development", "backend-systems", "legacy-migration"],
      options: [
        { label: "SaaS Web Application", value: "saas_web_app" },
        { label: "Internal Operations Portal / Dashboard", value: "internal_portal" },
        { label: "Public Marketing / Company Website", value: "marketing_site" },
        { label: "E-Commerce Storefront & Checkout", value: "ecommerce" },
        { label: "API Microservices & Backend Only", value: "backend_api" },
      ],
    },
    {
      id: "q_auth_needed",
      key: "auth_needed",
      label: "User Authentication & Roles Required?",
      step: 2,
      type: "radio",
      required: true,
      active: true,
      order: 3,
      serviceSlugs: ["fullstack-development", "backend-systems"],
      options: [
        { label: "Yes, multi-role user authentication (Admins, Staff, Clients)", value: "yes_multi_role" },
        { label: "Yes, simple user sign-in only", value: "yes_simple" },
        { label: "No user logins needed", value: "none" },
      ],
    },
    {
      id: "q_payments_needed",
      key: "payments_needed",
      label: "Payment Gateway Integration Needed?",
      step: 2,
      type: "radio",
      required: true,
      active: true,
      order: 4,
      serviceSlugs: ["fullstack-development", "backend-systems"],
      options: [
        { label: "Yes (Stripe, Razorpay, or subscriptions)", value: "yes" },
        { label: "No payments required", value: "no" },
      ],
    },
    // AI Automation specific
    {
      id: "q_ai_use_case",
      key: "ai_use_case",
      label: "AI Automation Focus Area",
      step: 2,
      helpText: "Which operational area should the autonomous or LLM agent address?",
      type: "select",
      required: true,
      active: true,
      order: 5,
      serviceSlugs: ["autonomous-agents", "llm-automation", "ai-voice-agents", "ai-stack-integration"],
      options: [
        { label: "Customer Inbound Support & Ticket Resolution", value: "customer_support" },
        { label: "Internal Document & Knowledge Base Search", value: "doc_qa" },
        { label: "Automated Data Extraction & CRM Syncing", value: "data_extraction" },
        { label: "Outbound Lead Outreach & Telephony Screening", value: "voice_outreach" },
        { label: "Custom Multi-Agent Orchestration", value: "custom_multi_agent" },
      ],
    },
    {
      id: "q_existing_tools",
      key: "existing_tools",
      label: "Existing Software / CRM to Integrate With",
      step: 2,
      helpText: "List tools like HubSpot, Salesforce, Slack, PostgreSQL, etc.",
      placeholder: "e.g., Salesforce, Slack, Google Workspace",
      type: "text",
      required: false,
      active: true,
      order: 6,
      serviceSlugs: ["autonomous-agents", "llm-automation", "ai-voice-agents", "crm-automation"],
      validation: { maxLength: 300 },
    },
    // Digital Marketing specific
    {
      id: "q_marketing_goals",
      key: "marketing_goals",
      label: "Primary Marketing Objective",
      step: 2,
      type: "select",
      required: true,
      active: true,
      order: 7,
      serviceSlugs: ["performance-ads", "technical-seo", "crm-automation", "funnel-optimization"],
      options: [
        { label: "Increase B2B Qualified Inquiries / Leads", value: "b2b_leads" },
        { label: "Lower Cost Per Acquisition (CPA) on Ads", value: "lower_cpa" },
        { label: "Organic Search Ranking & Traffic Growth", value: "organic_rankings" },
        { label: "Automate Lead Follow-ups & Nurture", value: "lead_nurture" },
      ],
    },
    // Conditional question: depends on q_marketing_goals == "b2b_leads"
    {
      id: "q_target_audience",
      key: "target_audience",
      label: "Target Industry & Decision Maker Profile",
      step: 2,
      helpText: "Who is your ideal customer (e.g., FinTech CTOs, D2C Founders)?",
      placeholder: "e.g., Founders and Marketing VPs in Healthcare SaaS",
      type: "text",
      required: true,
      active: true,
      order: 8,
      serviceSlugs: ["performance-ads", "technical-seo", "funnel-optimization"],
      visibleIf: {
        questionId: "q_marketing_goals",
        equals: "b2b_leads",
      },
      validation: { maxLength: 200 },
    },
    // Current website URL
    {
      id: "q_current_url",
      key: "current_website_url",
      label: "Current Website / App URL (if applicable)",
      step: 2,
      placeholder: "https://yourcompany.com",
      type: "url",
      required: false,
      active: true,
      order: 9,
      serviceSlugs: ["all"],
    },

    // --- STEP 3: PROJECT PLANNING ---
    {
      id: "q_budget_range",
      key: "budget_range",
      label: "Estimated Budget Range (INR / USD)",
      step: 3,
      helpText: "Helps us propose an architecture suited to your realistic scope.",
      type: "select",
      required: true,
      active: true,
      order: 10,
      serviceSlugs: ["all"],
      options: [
        { label: "₹50,000 – ₹1,50,000 (~$600 – $1,800) – Proof of Concept", value: "tier_poc" },
        { label: "₹1,50,000 – ₹4,00,000 (~$1,800 – $5,000) – Production MVP", value: "tier_mvp" },
        { label: "₹4,00,000 – ₹10,00,000 (~$5,000 – $12,000) – Scaled Architecture", value: "tier_growth" },
        { label: "₹10,00,000+ (~$12,000+) – Enterprise Custom Solution", value: "tier_enterprise" },
        { label: "Flexible / To be scoped with engineer", value: "flexible" },
      ],
    },
    {
      id: "q_timeline",
      key: "target_timeline",
      label: "Desired Launch Timeline",
      step: 3,
      type: "radio",
      required: true,
      active: true,
      order: 11,
      serviceSlugs: ["all"],
      options: [
        { label: "Urgent (Within 2 to 4 weeks)", value: "weeks_2_4" },
        { label: "Standard (1 to 2 months)", value: "months_1_2" },
        { label: "Comprehensive (3+ months)", value: "months_3_plus" },
        { label: "Exploring / Early planning phase", value: "exploratory" },
      ],
    },
    {
      id: "q_urgency_factor",
      key: "urgency_factor",
      label: "Deployment Urgency Level",
      step: 3,
      type: "select",
      required: false,
      active: true,
      order: 12,
      serviceSlugs: ["all"],
      options: [
        { label: "Normal – Regular engineering sprint schedule", value: "normal" },
        { label: "High – Immediate kickoff required", value: "high" },
        { label: "Critical – Immediate incident or migration deadline", value: "critical" },
      ],
    },
  ];

  // Validate conditional rules before saving
  const depCheck = validateQuestionDependencies(questions);
  if (!depCheck.valid) {
    throw new Error(`Question dependency validation failed: ${depCheck.errors.join("; ")}`);
  }

  // Atomically upsert the single PUBLISHED FormVersion
  await FormVersion.findOneAndUpdate(
    { status: "PUBLISHED" },
    {
      versionNumber: 1,
      status: "PUBLISHED",
      questions,
      publishedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`Published FormVersion v1 with ${questions.length} dynamic questions.`);

  // 4. Seed Message Templates
  console.log("Seeding message templates...");
  const templates = [
    {
      name: "Initial Inquiry Follow-up (Email)",
      channel: "EMAIL",
      subject: "Cynbit Technologies – Inquiry Follow-Up [{{referenceId}}]",
      body: `Hello {{name}},\n\nThank you for reaching out to Cynbit Technologies regarding your inquiry (Reference: {{referenceId}}).\n\nWe have reviewed your project requirements for {{service}} and would like to schedule a brief 20-minute discovery call to align on technical architecture and milestones.\n\nCould you please let us know a suitable time this week, or reply directly with any supplementary specifications?\n\nBest regards,\nEngineering Team\nCynbit Technologies\nhttps://cynbit.in`,
    },
    {
      name: "Initial Inquiry Follow-up (WhatsApp)",
      channel: "WHATSAPP",
      body: `Hi {{name}}, this is the team at Cynbit Technologies regarding your inquiry (Ref: {{referenceId}}). We reviewed your requirements for {{service}} and would love to connect for a quick 15-minute technical discovery call. Does today or tomorrow suit you?`,
    },
    {
      name: "Technical Proposal Notification (Email)",
      channel: "EMAIL",
      subject: "Cynbit Technologies – Proposal & Architecture Roadmap [{{referenceId}}]",
      body: `Hi {{name}},\n\nFollowing our review of your requirements for {{service}} (Ref: {{referenceId}}), we have prepared an initial architecture proposal and timeline.\n\nPlease find the details outlined for your review, and let us know if you'd like to walk through the technical milestones together.\n\nBest regards,\nCynbit Technologies`,
    },
    {
      name: "Quick Check-in (WhatsApp)",
      channel: "WHATSAPP",
      body: `Hi {{name}}, just checking in from Cynbit Technologies regarding your inquiry {{referenceId}}. Feel free to let us know if you have any questions about the scope or timeline!`,
    },
  ];

  for (const t of templates) {
    await MessageTemplate.findOneAndUpdate({ name: t.name }, t, { upsert: true, new: true });
  }
  console.log(`Seeded ${templates.length} message templates.`);

  // 5. Seed Initial Admin User (Credentials sourced strictly from environment)
  let adminUser: any = null;
  const adminEmail = process.env.ADMIN_SEED_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  if (adminEmail && adminPassword) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    adminUser = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        email: adminEmail,
        name: "Cynbit Administrator",
        passwordHash,
        role: "ADMIN",
        active: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log("Admin user account synchronized (credentials sourced securely from environment).");
  } else {
    console.log("Notice: ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD not set in environment. Skipping admin creation.");
  }

  // Seed optional team member user only if explicit environment variables are set
  let memberUser: any = null;
  const memberEmail = process.env.SEED_MEMBER_EMAIL?.toLowerCase().trim();
  const memberPassword = process.env.SEED_MEMBER_PASSWORD;

  if (memberEmail && memberPassword) {
    const memberPasswordHash = bcrypt.hashSync(memberPassword, 10);
    memberUser = await User.findOneAndUpdate(
      { email: memberEmail },
      {
        email: memberEmail,
        name: "Systems Engineer",
        passwordHash: memberPasswordHash,
        role: "MEMBER",
        active: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log("Team member account synchronized (sourced from SEED_MEMBER_EMAIL).");
  } else {
    console.log("Notice: SEED_MEMBER_EMAIL and SEED_MEMBER_PASSWORD not set. Skipping member creation.");
  }

  // 6. Seed Demo Inquiries if --demo flag is present
  const isDemoRun = process.argv.includes("--demo");
  if (isDemoRun) {
    console.log("Generating 15 realistic demo inquiries (--demo flag passed)...");

    // Remove existing demo inquiries
    await Inquiry.deleteMany({ isDemo: true });

    const publishedForm = await FormVersion.findOne({ status: "PUBLISHED" });
    if (!publishedForm) throw new Error("Published form missing during demo generation");

    const sampleInquiries = [
      {
        name: "[DEMO] Rajesh Sharma",
        company: "Veda Logistics",
        email: "rajesh.sharma@vedalogistics.demo",
        phone: "+919829012345",
        serviceSlug: "autonomous-agents",
        projectType: "Autonomous Order Dispatch Agent",
        status: "NEW",
        preferredContact: "WHATSAPP",
        budget: "tier_mvp",
        timeline: "weeks_2_4",
        desc: "We need an autonomous agent to monitor freight WhatsApp messages and update our warehouse database automatically.",
      },
      {
        name: "[DEMO] Priya Mehra",
        company: "CarePulse HealthTech",
        email: "priya@carepulse.demo",
        phone: "+919876543210",
        serviceSlug: "fullstack-development",
        projectType: "Patient Portal Web App",
        status: "CONTACTED",
        preferredContact: "EMAIL",
        budget: "tier_growth",
        timeline: "months_1_2",
        desc: "Next.js web portal for doctors and patients with role-based access and appointment booking.",
      },
      {
        name: "[DEMO] Vikramaditya Rathore",
        company: "Rathore Heritage Exports",
        email: "vikram@rathoreexports.demo",
        phone: "+919414098765",
        serviceSlug: "performance-ads",
        projectType: "Global B2B Performance Ads",
        status: "IN_DISCUSSION",
        preferredContact: "WHATSAPP",
        budget: "tier_mvp",
        timeline: "weeks_2_4",
        desc: "Targeting wholesale buyers in UK & US for handicraft exports.",
      },
      {
        name: "[DEMO] Ananya Gupta",
        company: "FinStack Analytics",
        email: "ananya.g@finstack.demo",
        phone: "+919988776655",
        serviceSlug: "llm-automation",
        projectType: "Financial Document Parsing Pipeline",
        status: "PROPOSAL_SENT",
        preferredContact: "EMAIL",
        budget: "tier_enterprise",
        timeline: "months_1_2",
        desc: "Automated ingestion and extraction of quarterly financial reports into structured metrics.",
      },
      {
        name: "[DEMO] Kabir Nair",
        company: "OmniFlow Logistics",
        email: "kabir@omniflow.demo",
        phone: "+919123456780",
        serviceSlug: "backend-systems",
        projectType: "High-Throughput Tracking API",
        status: "CONVERTED",
        preferredContact: "WHATSAPP",
        budget: "tier_growth",
        timeline: "months_1_2",
        desc: "Microservices handling 5,000 GPS ping updates per minute with MongoDB time-series.",
      },
      {
        name: "[DEMO] Sunita Verma",
        company: "Jaipur Jewels Online",
        email: "sunita@jjewels.demo",
        phone: "+919829988776",
        serviceSlug: "technical-seo",
        projectType: "Core Web Vitals & International SEO",
        status: "REJECTED",
        preferredContact: "PHONE",
        budget: "tier_poc",
        timeline: "exploratory",
        desc: "Speed up Shopify theme and rank for gemstone jewelry terms.",
      },
      {
        name: "[DEMO] Manish Kothari",
        company: "Apex InsureTech",
        email: "manish@apexinsure.demo",
        phone: "+919928123456",
        serviceSlug: "ai-voice-agents",
        projectType: "Automated Inbound Claim Assistant",
        status: "NEW",
        preferredContact: "WHATSAPP",
        budget: "tier_enterprise",
        timeline: "weeks_2_4",
        desc: "Voice bot to receive initial motor claim details over phone and verify policy IDs.",
      },
      {
        name: "[DEMO] Rohini Deshmukh",
        company: "Edvance Learning",
        email: "rohini@edvance.demo",
        phone: "+919822334455",
        serviceSlug: "fullstack-development",
        projectType: "Interactive Student Assessment Platform",
        status: "CONTACTED",
        preferredContact: "EMAIL",
        budget: "tier_mvp",
        timeline: "months_1_2",
        desc: "Multi-tenant learning portal with automated grading and certificate generation.",
      },
      {
        name: "[DEMO] Amitav Sen",
        company: "Sen Global Trading",
        email: "amitav@senglobal.demo",
        phone: "+919830112233",
        serviceSlug: "crm-automation",
        projectType: "Lead Qualification Webhook Pipeline",
        status: "IN_DISCUSSION",
        preferredContact: "WHATSAPP",
        budget: "tier_mvp",
        timeline: "weeks_2_4",
        desc: "Sync website form leads directly to Zoho CRM and dispatch WhatsApp alerts to sales team.",
      },
      {
        name: "[DEMO] Divya Joshi",
        company: "UrbanNest Realty",
        email: "divya@urbannest.demo",
        phone: "+919811223344",
        serviceSlug: "funnel-optimization",
        projectType: "Real Estate Buyer Funnel Redesign",
        status: "PROPOSAL_SENT",
        preferredContact: "WHATSAPP",
        budget: "tier_poc",
        timeline: "weeks_2_4",
        desc: "Redesign landing page flow to increase site-visit booking conversion rates.",
      },
      {
        name: "[DEMO] Karan Singhania",
        company: "Singhania Textile Mills",
        email: "karan@singhaniamills.demo",
        phone: "+919820011223",
        serviceSlug: "legacy-migration",
        projectType: "ERP Modernization to Cloud",
        status: "NEW",
        preferredContact: "EMAIL",
        budget: "tier_enterprise",
        timeline: "months_3_plus",
        desc: "Migrate 15-year-old on-premise inventory database to cloud API services.",
      },
      {
        name: "[DEMO] Neha Chawla",
        company: "OptiFleet Telematics",
        email: "neha@optifleet.demo",
        phone: "+919810998877",
        serviceSlug: "cloud-infrastructure",
        projectType: "Kubernetes Migration & Auto-scaling",
        status: "CONVERTED",
        preferredContact: "EMAIL",
        budget: "tier_growth",
        timeline: "months_1_2",
        desc: "Set up Terraform scripts and EKS clusters for auto-scaling telemetry workers.",
      },
      {
        name: "[DEMO] Tarun Bhalla",
        company: "SwiftPay Remittance",
        email: "tarun@swiftpay.demo",
        phone: "+919871002233",
        serviceSlug: "ai-stack-integration",
        projectType: "Anti-Fraud Document Verification",
        status: "CONTACTED",
        preferredContact: "WHATSAPP",
        budget: "tier_enterprise",
        timeline: "weeks_2_4",
        desc: "Integrate computer vision model into existing KYC onboarding flow.",
      },
      {
        name: "[DEMO] Zoya Merchant",
        company: "GreenRoots Organics",
        email: "zoya@greenroots.demo",
        phone: "+919892334455",
        serviceSlug: "performance-ads",
        projectType: "D2C Brand Performance Scaling",
        status: "NEW",
        preferredContact: "WHATSAPP",
        budget: "tier_mvp",
        timeline: "weeks_2_4",
        desc: "Meta ad creative testing and Google Shopping campaign optimization.",
      },
      {
        name: "[DEMO] Harshvardhan Singh",
        company: "Singh Agro Equipments",
        email: "harsh@singhagro.demo",
        phone: "+919413223344",
        serviceSlug: "fullstack-development",
        projectType: "Dealer Quoting & B2B Portal",
        status: "IN_DISCUSSION",
        preferredContact: "PHONE",
        budget: "tier_growth",
        timeline: "months_1_2",
        desc: "Dealer portal to generate instantaneous equipment quotes with finance calculation.",
      },
    ];

    const statuses = ["NEW", "CONTACTED", "IN_DISCUSSION", "PROPOSAL_SENT", "CONVERTED", "REJECTED"];

    for (let i = 0; i < sampleInquiries.length; i++) {
      const item = sampleInquiries[i];
      const refId = generateReferenceId();
      const idempotencyKey = `demo-key-${i + 1}-${Date.now()}`;
      const normalizedPhone = normalizeToE164(item.phone);

      const assignedUserId = i % 2 === 0 ? (adminUser?._id || memberUser?._id) : (memberUser?._id || adminUser?._id);

      // Realistic answers snapshot
      const answersSnapshot = [
        {
          questionId: "q_desc",
          key: "project_description",
          label: "Project Description & Objectives",
          type: "textarea",
          value: item.desc,
        },
        {
          questionId: "q_budget_range",
          key: "budget_range",
          label: "Estimated Budget Range (INR / USD)",
          type: "select",
          value: item.budget,
        },
        {
          questionId: "q_timeline",
          key: "target_timeline",
          label: "Desired Launch Timeline",
          type: "radio",
          value: item.timeline,
        },
      ];

      const inquiryDoc = new Inquiry({
        referenceId: refId,
        idempotencyKey,
        formVersionId: publishedForm._id,
        serviceSlug: item.serviceSlug,
        projectType: item.projectType,
        contact: {
          name: item.name,
          company: item.company,
          email: item.email.toLowerCase(),
          whatsapp: normalizedPhone,
          country: "IN",
          preferredContact: item.preferredContact,
          preferredTime: "11:00 AM - 5:00 PM IST",
          message: item.desc,
        },
        consent: {
          accepted: true,
          at: new Date(Date.now() - (15 - i) * 86400000),
        },
        answers: answersSnapshot,
        status: item.status,
        assignedTo: assignedUserId || undefined,
        statusHistory: [
          {
            from: "NEW",
            to: item.status,
            userId: assignedUserId || undefined,
            at: new Date(Date.now() - (15 - i) * 86400000 + 3600000),
          },
        ],
        notes: [
          {
            text: `Initial intake logged for ${item.company}. Client prefers communication via ${item.preferredContact}.`,
            userId: assignedUserId || undefined,
            createdAt: new Date(Date.now() - (15 - i) * 86400000 + 1800000),
          },
        ],
        communications:
          item.status !== "NEW" && assignedUserId
            ? [
                {
                  type: item.preferredContact === "WHATSAPP" ? "WHATSAPP" : "EMAIL",
                  outcome: item.status === "CONVERTED" ? "CALL_BOOKED" : "REPLIED",
                  note: "Followed up regarding technical architecture and budget estimate.",
                  message: `Outreach to ${item.name} regarding reference ${refId}`,
                  userId: assignedUserId,
                  at: new Date(Date.now() - (15 - i) * 86400000 + 7200000),
                },
              ]
            : [],
        activity: [
          {
            type: "CREATED",
            detail: `Inquiry submitted with reference ID ${refId}`,
            at: new Date(Date.now() - (15 - i) * 86400000),
          },
        ],
        searchFields: {
          nameLower: item.name.toLowerCase(),
          companyLower: item.company.toLowerCase(),
          emailLower: item.email.toLowerCase(),
          whatsappDigits: extractPhoneDigits(normalizedPhone),
          referenceIdLower: refId.toLowerCase(),
        },
        isDemo: true,
        createdAt: new Date(Date.now() - (15 - i) * 86400000),
        updatedAt: new Date(),
      });

      await inquiryDoc.save();
    }

    console.log(`Successfully seeded ${sampleInquiries.length} demo inquiries.`);
  }

  console.log("\nDatabase seeding completed successfully!");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
