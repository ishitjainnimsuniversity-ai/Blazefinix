import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Dense vector embedding generation helper
function generateVector(text: string): number[] {
  const VECTOR_DIMENSIONS = 128;
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ");
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const vector = new Array(VECTOR_DIMENSIONS).fill(0);

  if (tokens.length === 0) return vector;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let hash1 = 5381;
    for (let c = 0; c < token.length; c++) {
      hash1 = (hash1 * 33) ^ token.charCodeAt(c);
    }
    vector[Math.abs(hash1) % VECTOR_DIMENSIONS] += 1.5;

    for (let j = 0; j < token.length - 1; j++) {
      const bigram = token.substring(j, j + 2);
      let hash2 = 0;
      for (let k = 0; k < bigram.length; k++) {
        hash2 = (hash2 << 5) - hash2 + bigram.charCodeAt(k);
      }
      vector[Math.abs(hash2) % VECTOR_DIMENSIONS] += 0.5;
    }
  }

  let norm = 0;
  for (let i = 0; i < VECTOR_DIMENSIONS; i++) norm += vector[i] * vector[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6));
    }
  }
  return vector;
}

interface SeedFeedbackItem {
  source: string;
  customerName: string;
  customerEmail: string;
  rawText: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  sentimentScore: number;
  featureArea: string;
  themes: string[];
  daysAgo: number;
  status: "NEW" | "REVIEWED" | "RESOLVED" | "ARCHIVED";
}

const RAW_SEED_ITEMS: SeedFeedbackItem[] = [
  // 1. Payment & Billing (Negative / Neutral / Positive)
  {
    source: "Website",
    customerName: "Sarah Jenkins",
    customerEmail: "sarah.j@acmecorp.net",
    rawText: "My credit card was charged twice for the monthly subscription renewal. Please reverse the duplicate charge immediately.",
    sentiment: "NEGATIVE",
    sentimentScore: -0.85,
    featureArea: "Billing & Pricing",
    themes: ["Payment Gateway Failures", "Refund Processing Delay"],
    daysAgo: 2,
    status: "NEW",
  },
  {
    source: "App",
    customerName: "Marcus Vance",
    customerEmail: "marcus.v@techflow.io",
    rawText: "The checkout process fails with error code ERR_PAYMENT_TIMEOUT whenever I try to use my corporate Amex card.",
    sentiment: "NEGATIVE",
    sentimentScore: -0.9,
    featureArea: "Billing & Pricing",
    themes: ["Payment Gateway Failures"],
    daysAgo: 1,
    status: "NEW",
  },
  {
    source: "Support",
    customerName: "Elena Rostova",
    customerEmail: "elena@rostova-design.com",
    rawText: "It took 12 days to receive a refund for an invoice discrepancy. The support agent was polite, but your billing team turnaround is unacceptable.",
    sentiment: "NEGATIVE",
    sentimentScore: -0.7,
    featureArea: "Billing & Pricing",
    themes: ["Refund Processing Delay", "Support Response Time"],
    daysAgo: 4,
    status: "REVIEWED",
  },
  {
    source: "Website",
    customerName: "David Chen",
    customerEmail: "david@chenconsulting.org",
    rawText: "We upgraded our team to the Enterprise tier and the invoice PDF was generated automatically with our VAT number included. Very smooth transaction.",
    sentiment: "POSITIVE",
    sentimentScore: 0.9,
    featureArea: "Billing & Pricing",
    themes: ["Pricing & Plans"],
    daysAgo: 6,
    status: "RESOLVED",
  },
  {
    source: "Survey",
    customerName: "Chloe Martin",
    customerEmail: "cmartin@ventures.co",
    rawText: "The seat-based pricing model gets expensive very quickly once you exceed 25 users. Would love volume tier discounts.",
    sentiment: "NEUTRAL",
    sentimentScore: -0.1,
    featureArea: "Billing & Pricing",
    themes: ["Pricing & Plans"],
    daysAgo: 10,
    status: "REVIEWED",
  },

  // 2. Authentication & Login
  {
    source: "Support",
    customerName: "James Wilson",
    customerEmail: "jwilson@cloudops.dev",
    rawText: "2FA SMS verification codes are taking up to 10 minutes to arrive on Verizon carriers, locking our team out of their accounts during deployments.",
    sentiment: "NEGATIVE",
    sentimentScore: -0.92,
    featureArea: "Authentication",
    themes: ["2FA SMS Delays", "Login & SSO"],
    daysAgo: 1,
    status: "NEW",
  },
  {
    source: "Website",
    customerName: "Priya Patel",
    customerEmail: "priya.patel@fintechglobal.com",
    rawText: "Okta SAML Single Sign-On setup was incredibly straightforward. Our IT department configured 500 employee seats in under an hour.",
    sentiment: "POSITIVE",
    sentimentScore: 0.95,
    featureArea: "Authentication",
    themes: ["Login & SSO"],
    daysAgo: 5,
    status: "RESOLVED",
  },
  {
    source: "App",
    customerName: "Lucas Silva",
    customerEmail: "lucas@silva-studio.br",
    rawText: "The mobile app keeps logging me out every 4 hours. Having to type my 24-character master password multiple times a day is ruining productivity.",
    sentiment: "NEGATIVE",
    sentimentScore: -0.8,
    featureArea: "Authentication",
    themes: ["Login & SSO", "Mobile UX"],
    daysAgo: 3,
    status: "NEW",
  },
  {
    source: "Support",
    customerName: "Hannah Abbott",
    customerEmail: "habbott@biotech-labs.org",
    rawText: "Password reset emails never arrive in Outlook inboxes unless whitelisted manually by our exchange administrators.",
    sentiment: "NEGATIVE",
    sentimentScore: -0.65,
    featureArea: "Authentication",
    themes: ["Login & SSO"],
    daysAgo: 8,
    status: "REVIEWED",
  },
  {
    source: "Survey",
    customerName: "Tom Becker",
    customerEmail: "tbecker@germany-corp.de",
    rawText: "Would like support for hardware security keys like YubiKey WebAuthn for FIDO2 compliance.",
    sentiment: "NEUTRAL",
    sentimentScore: 0.2,
    featureArea: "Authentication",
    themes: ["Login & SSO"],
    daysAgo: 14,
    status: "REVIEWED",
  },

  // 3. Performance & Latency
  {
    source: "Website",
    customerName: "Alex Rivera",
    customerEmail: "alex@data-nexus.io",
    rawText: "The analytics dashboard takes 14 seconds to render when querying 50,000 feedback items. We need query caching or server-side pagination.",
    sentiment: "NEGATIVE",
    sentimentScore: -0.88,
    featureArea: "Performance",
    themes: ["Page Load Latency"],
    daysAgo: 2,
    status: "NEW",
  },
  {
    source: "Website",
    customerName: "Sophia Zhang",
    customerEmail: "szhang@quantum-ai.com",
    rawText: "Since the v2.4 deployment, search filter execution is virtually instantaneous. Kudos to the engineering team for the speed boost.",
    sentiment: "POSITIVE",
    sentimentScore: 0.94,
    featureArea: "Performance",
    themes: ["Page Load Latency", "Search Filter Accuracy"],
    daysAgo: 3,
    status: "RESOLVED",
  },
  {
    source: "Support",
    customerName: "Liam O'Connor",
    customerEmail: "liam@dublin-digital.ie",
    rawText: "Exporting 10k feedback items to CSV hangs indefinitely at 99% before throwing a 504 Gateway Timeout error.",
    sentiment: "NEGATIVE",
    sentimentScore: -0.82,
    featureArea: "Performance",
    themes: ["Data Export", "Page Load Latency"],
    daysAgo: 4,
    status: "REVIEWED",
  },
  {
    source: "App",
    customerName: "Klaus Schmidt",
    customerEmail: "kschmidt@auto-logistics.de",
    rawText: "The chart rendering on mobile has slight stuttering when scrolling through 30-day time-series data.",
    sentiment: "NEUTRAL",
    sentimentScore: -0.3,
    featureArea: "Performance",
    themes: ["Page Load Latency", "Mobile UX"],
    daysAgo: 9,
    status: "REVIEWED",
  },

  // 4. Mobile Experience
  {
    source: "App",
    customerName: "Emily Watson",
    customerEmail: "emily@watson-media.uk",
    rawText: "App crashes immediately upon opening the Voice-of-Customer report tab on iOS 17.4 on iPhone 15 Pro.",
    sentiment: "NEGATIVE",
    sentimentScore: -0.95,
    featureArea: "Mobile App",
    themes: ["Mobile App Crashes"],
    daysAgo: 1,
    status: "NEW",
  },
  {
    source: "App",
    customerName: "Daniel Morales",
    customerEmail: "daniel@cdmx-design.mx",
    rawText: "The new bottom sheet navigation on Android feels super fluid and intuitive. Love the haptic feedback.",
    sentiment: "POSITIVE",
    sentimentScore: 0.88,
    featureArea: "Mobile App",
    themes: ["Mobile UX"],
    daysAgo: 7,
    status: "RESOLVED",
  },
  {
    source: "App",
    customerName: "Yuki Tanaka",
    customerEmail: "yuki.tanaka@tokyo-systems.jp",
    rawText: "Push notifications on iPad are cut off midway through the feedback preview and cannot be expanded.",
    sentiment: "NEUTRAL",
    sentimentScore: -0.2,
    featureArea: "Mobile App",
    themes: ["Mobile UX", "Push Notification Spam"],
    daysAgo: 11,
    status: "REVIEWED",
  },

  // 5. Customer Support
  {
    source: "Support",
    customerName: "Jessica Alba",
    customerEmail: "jalba@honest-goods.com",
    rawText: "Your technical support specialist Arthur resolved our webhook ingestion issue within 15 minutes of opening the ticket. Outstanding customer service!",
    sentiment: "POSITIVE",
    sentimentScore: 0.98,
    featureArea: "Customer Support",
    themes: ["Support Response Time", "Fast Support Resolution"],
    daysAgo: 2,
    status: "RESOLVED",
  },
  {
    source: "Support",
    customerName: "Ryan Reynolds",
    customerEmail: "ryan@minty-telecom.com",
    rawText: "Waited 4 days for a first response on our tier-1 priority ticket regarding billing errors.",
    sentiment: "NEGATIVE",
    sentimentScore: -0.85,
    featureArea: "Customer Support",
    themes: ["Support Response Time"],
    daysAgo: 3,
    status: "NEW",
  },

  // 6. Onboarding & UI/UX
  {
    source: "Survey",
    customerName: "Fatima Al-Mansoor",
    customerEmail: "fatima@dubai-tech.ae",
    rawText: "The 5-step onboarding guide made importing our first 10,000 Zendesk tickets completely painless. Our team was productive within 20 minutes.",
    sentiment: "POSITIVE",
    sentimentScore: 0.92,
    featureArea: "Onboarding",
    themes: ["Interactive Onboarding", "Onboarding Flow"],
    daysAgo: 4,
    status: "RESOLVED",
  },
  {
    source: "Website",
    customerName: "Noah Campbell",
    customerEmail: "ncampbell@pacific-ventures.ca",
    rawText: "Please add a Dark Mode option. Working in the dashboard late at night is blinding with all the white backgrounds.",
    sentiment: "NEUTRAL",
    sentimentScore: 0.1,
    featureArea: "UI / UX",
    themes: ["Dark Mode Request", "User Interface Design"],
    daysAgo: 5,
    status: "REVIEWED",
  },
  {
    source: "Website",
    customerName: "Bella Thorne",
    customerEmail: "bella@thorn-apparel.com",
    rawText: "The sentiment breakdown donut chart is visually stunning and executive-ready. Presented it directly to our CPO.",
    sentiment: "POSITIVE",
    sentimentScore: 0.96,
    featureArea: "UI / UX",
    themes: ["User Interface Design"],
    daysAgo: 6,
    status: "RESOLVED",
  },

  // 7. Search & Discovery
  {
    source: "Website",
    customerName: "George Miller",
    customerEmail: "gmiller@aussie-retail.com.au",
    rawText: "Searching for phrases with quotes or boolean operators like 'AND' / 'OR' does not work as expected in the feedback table.",
    sentiment: "NEUTRAL",
    sentimentScore: -0.3,
    featureArea: "Search & Discovery",
    themes: ["Search Filter Accuracy"],
    daysAgo: 8,
    status: "REVIEWED",
  },
  {
    source: "Website",
    customerName: "Amara Nwosu",
    customerEmail: "anwosu@lagos-fintech.ng",
    rawText: "The semantic search 'Ask LOOP' feature is phenomenal. It pinpointed our top 3 customer friction points instantly.",
    sentiment: "POSITIVE",
    sentimentScore: 0.97,
    featureArea: "Search & Discovery",
    themes: ["Search Filter Accuracy"],
    daysAgo: 1,
    status: "RESOLVED",
  },
];

// Expanded seed generator to ensure 130+ realistic feedback items
const SEED_TEMPLATES = [
  {
    area: "Billing & Pricing",
    source: "Website",
    templates: [
      { text: "Unable to update company billing address on the checkout invoice.", sentiment: "NEGATIVE" as const, score: -0.65, theme: "Payment Gateway Failures" },
      { text: "Love the clear breakdown of monthly usage charges on the billing overview page.", sentiment: "POSITIVE" as const, score: 0.85, theme: "Pricing & Plans" },
      { text: "Refund request submitted 8 days ago is still marked as pending.", sentiment: "NEGATIVE" as const, score: -0.78, theme: "Refund Processing Delay" },
      { text: "Can we get annual prepaid invoice discounts for startup teams?", sentiment: "NEUTRAL" as const, score: 0.2, theme: "Pricing & Plans" },
      { text: "Credit card payment declined without any explanatory error message.", sentiment: "NEGATIVE" as const, score: -0.82, theme: "Payment Gateway Failures" },
      { text: "The Stripe integration for automatic tax compliance works flawlessly.", sentiment: "POSITIVE" as const, score: 0.91, theme: "Pricing & Plans" },
    ],
  },
  {
    area: "Authentication",
    source: "App",
    templates: [
      { text: "2FA codes sent to international phone numbers never arrive.", sentiment: "NEGATIVE" as const, score: -0.9, theme: "2FA SMS Delays" },
      { text: "Biometric Face ID login on iPhone works in under a second. Great work!", sentiment: "POSITIVE" as const, score: 0.93, theme: "Login & SSO" },
      { text: "Google OAuth sign-in button threw a 400 redirect_uri_mismatch error yesterday.", sentiment: "NEGATIVE" as const, score: -0.75, theme: "Login & SSO" },
      { text: "Please allow session timeout to be configured by workspace administrators.", sentiment: "NEUTRAL" as const, score: 0.1, theme: "Login & SSO" },
      { text: "Password reset link expired in only 5 minutes before I could open it.", sentiment: "NEGATIVE" as const, score: -0.6, theme: "Login & SSO" },
      { text: "SAML SSO with Azure Active Directory synced all roles seamlessly.", sentiment: "POSITIVE" as const, score: 0.96, theme: "Login & SSO" },
    ],
  },
  {
    area: "Performance",
    source: "Website",
    templates: [
      { text: "Dashboard takes over 8 seconds to load on 4G connections.", sentiment: "NEGATIVE" as const, score: -0.74, theme: "Page Load Latency" },
      { text: "Page transitions between feedback inbox and analytics are lightning fast.", sentiment: "POSITIVE" as const, score: 0.9, theme: "Page Load Latency" },
      { text: "CSV import with 5,000 records processed in less than 3 seconds. Incredible speed!", sentiment: "POSITIVE" as const, score: 0.95, theme: "Page Load Latency" },
      { text: "Memory usage in Google Chrome spikes to 1.5GB when browsing large feedback tables.", sentiment: "NEGATIVE" as const, score: -0.8, theme: "Page Load Latency" },
      { text: "Filtering by multiple tags occasionally causes a brief UI freeze.", sentiment: "NEUTRAL" as const, score: -0.35, theme: "Page Load Latency" },
      { text: "Real-time query performance is rock solid even during peak enterprise hours.", sentiment: "POSITIVE" as const, score: 0.89, theme: "Page Load Latency" },
    ],
  },
  {
    area: "Mobile App",
    source: "App",
    templates: [
      { text: "App crashes when attempting to export PDF reports on Android 14.", sentiment: "NEGATIVE" as const, score: -0.92, theme: "Mobile App Crashes" },
      { text: "The mobile inbox gesture controls (swipe to resolve) are super convenient.", sentiment: "POSITIVE" as const, score: 0.88, theme: "Mobile UX" },
      { text: "Push notifications arrive 3 times for the same alert.", sentiment: "NEGATIVE" as const, score: -0.7, theme: "Push Notification Spam" },
      { text: "Dark mode theme on iOS looks gorgeous on OLED displays.", sentiment: "POSITIVE" as const, score: 0.94, theme: "Dark Mode Request" },
      { text: "Tablet landscape layout has wasted whitespace on iPad Pro.", sentiment: "NEUTRAL" as const, score: -0.1, theme: "Mobile UX" },
      { text: "Crash on launching the camera for feedback attachment.", sentiment: "NEGATIVE" as const, score: -0.85, theme: "Mobile App Crashes" },
    ],
  },
  {
    area: "Customer Support",
    source: "Support",
    templates: [
      { text: "Customer success manager hosted a 1-on-1 walkthrough for our executive team.", sentiment: "POSITIVE" as const, score: 0.98, theme: "Fast Support Resolution" },
      { text: "Support ticket was closed automatically without resolving the root cause.", sentiment: "NEGATIVE" as const, score: -0.88, theme: "Support Response Time" },
      { text: "Chatbot assistance resolved my basic permissions question in seconds.", sentiment: "POSITIVE" as const, score: 0.82, theme: "Fast Support Resolution" },
      { text: "Received conflicting answers from two different support representatives.", sentiment: "NEGATIVE" as const, score: -0.65, theme: "Support Response Time" },
      { text: "Help center documentation is comprehensive and up-to-date.", sentiment: "POSITIVE" as const, score: 0.87, theme: "Fast Support Resolution" },
      { text: "Live chat is unavailable during European business hours.", sentiment: "NEUTRAL" as const, score: -0.25, theme: "Support Response Time" },
    ],
  },
  {
    area: "Onboarding & UI/UX",
    source: "Survey",
    templates: [
      { text: "The workspace setup checklist guided our team through integration without a hitch.", sentiment: "POSITIVE" as const, score: 0.94, theme: "Interactive Onboarding" },
      { text: "The navigation sidebar is a bit cluttered with too many submenus.", sentiment: "NEUTRAL" as const, score: -0.2, theme: "User Interface Design" },
      { text: "Dark mode implementation is sleek and reduces eye strain significantly.", sentiment: "POSITIVE" as const, score: 0.91, theme: "Dark Mode Request" },
      { text: "Tooltips on complex metrics are extremely helpful for junior analysts.", sentiment: "POSITIVE" as const, score: 0.86, theme: "Interactive Onboarding" },
      { text: "Font size on data tables is slightly small on high-DPI 4K monitors.", sentiment: "NEUTRAL" as const, score: -0.15, theme: "User Interface Design" },
      { text: "Export button is hidden deep inside the settings modal instead of on the main table.", sentiment: "NEUTRAL" as const, score: -0.3, theme: "User Interface Design" },
    ],
  },
  {
    area: "Search & Discovery",
    source: "Website",
    templates: [
      { text: "Ask LOOP answered our quarterly feedback inquiry with pinpoint citations.", sentiment: "POSITIVE" as const, score: 0.97, theme: "Search Filter Accuracy" },
      { text: "Searching for exact error codes returns unrelated feedback items.", sentiment: "NEGATIVE" as const, score: -0.6, theme: "Search Filter Accuracy" },
      { text: "Date range filter resets when switching between dashboard tabs.", sentiment: "NEGATIVE" as const, score: -0.55, theme: "Search Filter Accuracy" },
      { text: "Saved search queries save our analysts hours of repetitive filtering each week.", sentiment: "POSITIVE" as const, score: 0.92, theme: "Search Filter Accuracy" },
      { text: "Search autocomplete suggestions are fast and relevant.", sentiment: "POSITIVE" as const, score: 0.85, theme: "Search Filter Accuracy" },
      { text: "Would love regex search support for engineering bug triage.", sentiment: "NEUTRAL" as const, score: 0.1, theme: "Search Filter Accuracy" },
    ],
  },
];

async function main() {
  console.log("🌱 Starting LOOP Database Seeding...");

  // 1. Create Demo Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      id: "ws_demo_acme",
      name: "Acme Corporation",
      slug: "acme-corp",
    },
  });
  console.log(`✅ Demo Workspace configured: ${workspace.name} (${workspace.id})`);

  // 2. Create 3 Demo Users with standard development roles
  const users = [
    { id: "usr_admin_001", email: "admin@loop.dev", name: "Ishit Jain (Admin)", role: "ADMIN" as const },
    { id: "usr_analyst_001", email: "analyst@loop.dev", name: "Alex Chen (Analyst)", role: "ANALYST" as const },
    { id: "usr_viewer_001", email: "viewer@loop.dev", name: "Taylor Smith (Viewer)", role: "VIEWER" as const },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name, workspaceId: workspace.id },
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        workspaceId: workspace.id,
      },
    });
  }
  console.log("✅ Seed Users configured (ADMIN, ANALYST, VIEWER)");

  // 3. Collect all seed feedback items
  const allFeedbackItems: SeedFeedbackItem[] = [...RAW_SEED_ITEMS];

  // Generate additional structured items across templates to reach 130+ items
  let itemCounter = 1;
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const group of SEED_TEMPLATES) {
      for (const t of group.templates) {
        const daysAgo = (itemCounter % 28) + 1;
        const status = itemCounter % 4 === 0 ? "RESOLVED" : itemCounter % 3 === 0 ? "REVIEWED" : "NEW";
        allFeedbackItems.push({
          source: group.source,
          customerName: `Customer #${itemCounter + 20}`,
          customerEmail: `customer${itemCounter + 20}@example.com`,
          rawText: t.text,
          sentiment: t.sentiment,
          sentimentScore: t.score,
          featureArea: group.area,
          themes: [t.theme],
          daysAgo,
          status,
        });
        itemCounter++;
      }
    }
  }

  console.log(`📊 Ingesting ${allFeedbackItems.length} realistic customer feedback records...`);

  // 4. Insert Feedback, Themes, AI Analysis, and Embeddings
  const themeMap = new Map<string, string>(); // themeName -> themeId

  for (let i = 0; i < allFeedbackItems.length; i++) {
    const item = allFeedbackItems[i];
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - item.daysAgo);
    createdDate.setMinutes(createdDate.getMinutes() - (i * 17) % 1440);

    const feedback = await prisma.feedback.create({
      data: {
        workspaceId: workspace.id,
        source: item.source,
        customerName: item.customerName,
        customerEmail: item.customerEmail,
        rawText: item.rawText,
        status: item.status,
        sentiment: item.sentiment,
        sentimentScore: item.sentimentScore,
        featureArea: item.featureArea,
        aiRationale: `AI classified as ${item.sentiment.toLowerCase()} (${item.sentimentScore > 0 ? "+" : ""}${item.sentimentScore}) focusing on ${item.featureArea}.`,
        aiStatus: "COMPLETED",
        createdAt: createdDate,
        updatedAt: createdDate,
      },
    });

    // Create AI Analysis record
    await prisma.aiAnalysis.create({
      data: {
        feedbackId: feedback.id,
        sentiment: item.sentiment,
        sentimentScore: item.sentimentScore,
        themes: item.themes,
        featureArea: item.featureArea,
        rationale: `Classified via LOOP AI Intelligence Engine for ${item.featureArea}.`,
        model: "claude-3-5-sonnet-20241022",
        processingStatus: "COMPLETED",
        createdAt: createdDate,
      },
    });

    // Create Embedding vector
    const embeddingVector = generateVector(item.rawText);
    await prisma.feedbackEmbedding.create({
      data: {
        feedbackId: feedback.id,
        workspaceId: workspace.id,
        embedding: embeddingVector,
      },
    });

    // Link themes
    for (const themeName of item.themes) {
      let themeId = themeMap.get(themeName);
      if (!themeId) {
        const theme = await prisma.theme.upsert({
          where: {
            workspaceId_name: {
              workspaceId: workspace.id,
              name: themeName,
            },
          },
          update: { count: { increment: 1 } },
          create: {
            workspaceId: workspace.id,
            name: themeName,
            description: `Aggregated feedback concerning ${themeName}`,
            count: 1,
          },
        });
        themeId = theme.id;
        themeMap.set(themeName, themeId);
      } else {
        await prisma.theme.update({
          where: { id: themeId },
          data: { count: { increment: 1 } },
        });
      }

      await prisma.feedbackTheme.upsert({
        where: {
          feedbackId_themeId: {
            feedbackId: feedback.id,
            themeId,
          },
        },
        update: {},
        create: {
          feedbackId: feedback.id,
          themeId,
        },
      });
    }
  }

  // 5. Create initial Voice-of-Customer Report
  await prisma.voiceOfCustomerReport.create({
    data: {
      workspaceId: workspace.id,
      period: "Last 30 Days",
      totalFeedback: allFeedbackItems.length,
      positivePercent: 46.5,
      neutralPercent: 21.0,
      negativePercent: 32.5,
      topThemes: [
        { name: "Payment Gateway Failures", count: 18, percentage: 14.2 },
        { name: "2FA SMS Delays", count: 15, percentage: 11.8 },
        { name: "Page Load Latency", count: 14, percentage: 11.0 },
        { name: "Fast Support Resolution", count: 12, percentage: 9.4 },
        { name: "Login & SSO", count: 12, percentage: 9.4 },
      ],
      spikes: [
        {
          theme: "Payment Gateway Failures",
          currentCount: 14,
          baselineAverage: 4.0,
          changePercent: 250.0,
          isSpike: true,
          explanation: "Surged +250.0% in the last 7 days (14 mentions vs 4.0 baseline avg).",
        },
        {
          theme: "2FA SMS Delays",
          currentCount: 10,
          baselineAverage: 3.5,
          changePercent: 185.7,
          isSpike: true,
          explanation: "Surged +185.7% in the last 7 days (10 mentions vs 3.5 baseline avg).",
        },
      ],
      aiNarrative: `### Executive Summary
During the past 30 days, LOOP processed **${allFeedbackItems.length} customer feedback items** for Acme Corporation. Overall customer sentiment is **46.5% Positive**, **21.0% Neutral**, and **32.5% Negative**.

### Primary Sentiment Drivers
1. **Delighters**: Customers consistently praised **Fast Support Resolution** and **Intuitive Onboarding**, highlighting quick team responses.
2. **Friction Points**: Persistent customer frustration centers around **Payment Gateway Failures** and **2FA SMS Verification Delays**.

### Anomaly Spikes Detected
- **Payment Gateway Failures** experienced an acute +250% surge following third-party payment gateway latency.
- **2FA SMS Delays** spiked +185.7% across international carriers.

### Recommended Actions
- Deploy redundant SMS fallback providers for 2FA verification.
- Implement checkout timeout retries to eliminate duplicate authorization holds.`,
    },
  });

  console.log("✅ Voice-of-Customer Seed Report created.");
  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
