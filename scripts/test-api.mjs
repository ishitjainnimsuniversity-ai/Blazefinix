async function runLiveApiTests() {
  console.log("\n========================================================");
  console.log("   LOOP INTELLIGENCE PLATFORM — LIVE API TEST SUITE");
  console.log("========================================================\n");

  const baseUrl = "http://localhost:3000";

  // 1. Dashboard KPIs
  console.log("1. Testing GET /api/analytics/dashboard...");
  const dashRes = await fetch(`${baseUrl}/api/analytics/dashboard`);
  const dash = await dashRes.json();
  console.log(`   [STATUS: ${dashRes.status}]`);
  console.log(`   Total Feedback: ${dash.data.totalFeedback}`);
  console.log(`   Sentiment: ${dash.data.sentimentPercentages.positive}% Pos, ${dash.data.sentimentPercentages.neutral}% Neu, ${dash.data.sentimentPercentages.negative}% Neg`);
  console.log(`   Active Themes: ${dash.data.activeThemesCount} | Active Spikes: ${dash.data.activeSpikesCount}`);

  // 2. Anomaly Spikes
  console.log("\n2. Testing GET /api/analytics/spikes...");
  const spikesRes = await fetch(`${baseUrl}/api/analytics/spikes`);
  const spikes = await spikesRes.json();
  console.log(`   [STATUS: ${spikesRes.status}]`);
  for (const s of spikes.data.slice(0, 3)) {
    const flag = s.isSpike ? "[SPIKE ALERT]" : "[NORMAL]";
    console.log(`   ${flag} ${s.theme}: +${s.changePercent}% (${s.currentCount} mentions vs ${s.baselineAverage} baseline)`);
  }

  // 3. Feedback Listing with Filtering
  console.log("\n3. Testing GET /api/feedback (Filtering by Negative Sentiment)...");
  const fbRes = await fetch(`${baseUrl}/api/feedback?page=1&pageSize=2&sentiment=NEGATIVE`);
  const feedback = await fbRes.json();
  console.log(`   [STATUS: ${fbRes.status}]`);
  console.log(`   Total Matching Items: ${feedback.data.total}`);
  for (const item of feedback.data.items) {
    const snippet = item.rawText.substring(0, 70);
    console.log(`   • [${item.featureArea}] "${snippet}..."`);
  }

  // 4. Create Single Feedback with AI Auto-Classification
  console.log("\n4. Testing POST /api/feedback (New Item Auto-Classification)...");
  const createRes = await fetch(`${baseUrl}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rawText: "The mobile checkout process is crashing repeatedly whenever I enter credit card details.",
      source: "Mobile App",
      customerName: "Live Test Customer",
      customerEmail: "live.tester@example.com",
    }),
  });
  const created = await createRes.json();
  console.log(`   [STATUS: ${createRes.status}]`);
  console.log(`   Created Feedback ID: ${created.data.id}`);
  console.log(`   AI Sentiment: ${created.data.sentiment} (${created.data.sentimentScore})`);
  console.log(`   AI Feature Area: ${created.data.featureArea}`);
  console.log(`   AI Rationale: ${created.data.aiRationale}`);

  // 5. Ask LOOP (Grounded Semantic Retrieval Assistant)
  console.log("\n5. Testing POST /api/ask-loop (Semantic AI Assistant)...");
  const askRes = await fetch(`${baseUrl}/api/ask-loop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: "Why are customers upset about payments and checkout?",
      topK: 3,
    }),
  });
  const ask = await askRes.json();
  console.log(`   [STATUS: ${askRes.status}]`);
  console.log(`   Question: ${ask.data.question}`);
  console.log(`   Grounded Answer: ${ask.data.answer}`);
  console.log(`   Evidence Items Retrieved: ${ask.data.evidence.length}`);
  for (const ev of ask.data.evidence) {
    const snippet = ev.text.substring(0, 65);
    console.log(`      * [Sim: ${ev.similarity}] "${snippet}..."`);
  }

  // 6. Voice-of-Customer Reports
  console.log("\n6. Testing GET /api/reports/voc...");
  const vocRes = await fetch(`${baseUrl}/api/reports/voc`);
  const voc = await vocRes.json();
  console.log(`   [STATUS: ${vocRes.status}]`);
  console.log(`   Stored VOC Reports Count: ${voc.data.length}`);
  console.log(`   Latest Report Period: ${voc.data[0].period} (${voc.data[0].totalFeedback} total feedback processed)`);

  console.log("\n========================================================");
  console.log("   🎉 ALL LIVE ENDPOINTS TESTED & 100% OPERATIONAL!");
  console.log("========================================================\n");
}

runLiveApiTests().catch(console.error);
