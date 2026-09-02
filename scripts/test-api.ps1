$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================================"
Write-Host "   LOOP INTELLIGENCE PLATFORM — LIVE API TEST SUITE"
Write-Host "========================================================"
Write-Host ""

# 1. Dashboard KPIs
Write-Host "1. Testing GET /api/analytics/dashboard..."
$dash = Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/dashboard"
Write-Host "   [SUCCESS] Total Feedback: $($dash.data.totalFeedback)"
Write-Host "   [SUCCESS] Sentiment: $($dash.data.sentimentPercentages.positive)% Pos, $($dash.data.sentimentPercentages.neutral)% Neu, $($dash.data.sentimentPercentages.negative)% Neg"
Write-Host "   [SUCCESS] Active Themes: $($dash.data.activeThemesCount), Active Spikes: $($dash.data.activeSpikesCount)"

# 2. Anomaly Spikes
Write-Host ""
Write-Host "2. Testing GET /api/analytics/spikes..."
$spikes = Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/spikes"
foreach ($s in $spikes.data | Select-Object -First 3) {
  $flag = "[NORMAL]"
  if ($s.isSpike -eq $true) {
    $flag = "[SPIKE ALERT]"
  }
  Write-Host "   $flag $($s.theme): +$($s.changePercent)% ($($s.currentCount) vs $($s.baselineAverage) baseline)"
}

# 3. Feedback Listing
Write-Host ""
Write-Host "3. Testing GET /api/feedback (Filtering by Negative Sentiment)..."
$feedback = Invoke-RestMethod -Uri "http://localhost:3000/api/feedback?page=1&pageSize=2&sentiment=NEGATIVE"
Write-Host "   [SUCCESS] Total Matching Negative: $($feedback.data.total) items"
foreach ($item in $feedback.data.items) {
  $snippet = $item.rawText.Substring(0, [Math]::Min(70, $item.rawText.Length))
  Write-Host "   - [$($item.featureArea)] $snippet..."
}

# 4. Create Single Feedback with AI Classification
Write-Host ""
Write-Host "4. Testing POST /api/feedback (New Item Auto-Classification)..."
$newObj = @{
  rawText = "The mobile checkout process is crashing repeatedly whenever I enter credit card details."
  source = "Mobile App"
  customerName = "Live Test Customer"
  customerEmail = "live.tester@example.com"
}
$newJson = ConvertTo-Json $newObj
$created = Invoke-RestMethod -Uri "http://localhost:3000/api/feedback" -Method Post -Body $newJson -ContentType "application/json"
Write-Host "   [SUCCESS] Created Feedback ID: $($created.data.id)"
Write-Host "   [SUCCESS] AI Sentiment: $($created.data.sentiment) ($($created.data.sentimentScore))"
Write-Host "   [SUCCESS] AI Feature Area: $($created.data.featureArea)"
Write-Host "   [SUCCESS] AI Rationale: $($created.data.aiRationale)"

# 5. Ask LOOP (Grounded Semantic Retrieval)
Write-Host ""
Write-Host "5. Testing POST /api/ask-loop (Semantic AI Assistant)..."
$askObj = @{
  question = "Why are customers upset about payments and checkout?"
  topK = 3
}
$askJson = ConvertTo-Json $askObj
$answer = Invoke-RestMethod -Uri "http://localhost:3000/api/ask-loop" -Method Post -Body $askJson -ContentType "application/json"
Write-Host "   [SUCCESS] Question: $($answer.data.question)"
Write-Host "   [SUCCESS] Grounded Answer: $($answer.data.answer)"
Write-Host "   [SUCCESS] Evidence Items Retrieved: $($answer.data.evidence.Count)"
foreach ($ev in $answer.data.evidence) {
  $snippet = $ev.text.Substring(0, [Math]::Min(65, $ev.text.Length))
  Write-Host "      * [Sim: $($ev.similarity)] $snippet..."
}

# 6. Voice-of-Customer Reports
Write-Host ""
Write-Host "6. Testing GET /api/reports/voc..."
$reports = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/voc"
Write-Host "   [SUCCESS] Stored VOC Reports Count: $($reports.data.Count)"
Write-Host "   [SUCCESS] Latest Report Period: $($reports.data[0].period) ($($reports.data[0].totalFeedback) total feedback)"

Write-Host ""
Write-Host "========================================================"
Write-Host "   ALL 6 LIVE ENDPOINT CATEGORIES VERIFIED OPERATIONAL!"
Write-Host "========================================================"
Write-Host ""
