"""
=============================================================================
  MODULE 01: PYTHON BASICS FOR AI BEGINNERS
=============================================================================
In this module, you will learn:
  1. Variables & Types
  2. Conditionals (if / elif / else)
  3. Loops (for, while, enumerate)
  4. Functions & Return values
  5. Practical AI Exercise: Rule-based Spam Detection Classifier
=============================================================================
Run this file:
    python 01_python_basics.py
"""

print("=" * 65)
print("  STEP 1: VARIABLES & TYPES IN AI")
print("=" * 65)

# In AI, everything is a number or text representation
model_name = "Perceptron"       # string (str)
layers = 3                      # integer (int)
learning_rate = 0.01            # floating-point number (float)
is_converged = False            # boolean (bool)

print(f"Model: {model_name} | Layers: {layers} | LR: {learning_rate} | Converged: {is_converged}")


print("\n" + "=" * 65)
print("  STEP 2: CONDITIONAL LOGIC (AI Decision Making)")
print("=" * 65)

confidence = 0.88

if confidence >= 0.90:
    verdict = "High confidence prediction"
elif confidence >= 0.70:
    verdict = "Moderate confidence prediction - requires review"
else:
    verdict = "Low confidence - flagged for human inspection"

print(f"Confidence score: {confidence * 100:.1f}% -> Status: {verdict}")


print("\n" + "=" * 65)
print("  STEP 3: LOOPS (Processing Training Data)")
print("=" * 65)

# Processing a batch of loss values across training epochs
losses = [0.82, 0.65, 0.43, 0.28, 0.15]

print("Simulating 5 Training Epochs:")
for epoch, loss in enumerate(losses, start=1):
    bar = "=" * int((1.0 - loss) * 30)
    print(f"  Epoch {epoch}/5 -> Loss: {loss:.2f} | Progress: [{bar.ljust(30)}]")


print("\n" + "=" * 65)
print("  STEP 4: FUNCTIONS (The Building Blocks of AI)")
print("=" * 65)

def calculate_accuracy(correct_predictions: int, total_samples: int) -> float:
    """Calculates accuracy percentage safely."""
    if total_samples <= 0:
        return 0.0
    return (correct_predictions / total_samples) * 100.0

acc = calculate_accuracy(942, 1000)
print(f"Computed Model Accuracy: {acc:.2f}%")


print("\n" + "=" * 65)
print("  STEP 5: PRACTICAL AI EXERCISE - SPAM CLASSIFIER")
print("=" * 65)

def classify_email(text: str) -> dict:
    """
    A simple rule-based AI classifier that detects spam
    based on keyword presence and suspicious patterns.
    """
    spam_triggers = ["free money", "winner", "claim prize", "urgent", "click here", "cash reward"]
    clean_text = text.lower()
    detected_triggers = []

    for trigger in spam_triggers:
        if trigger in clean_text:
            detected_triggers.append(trigger)

    # Spam score: percentage of triggers hit (capped at 1.0)
    spam_score = min(len(detected_triggers) * 0.35, 1.0)
    is_spam = spam_score >= 0.50

    return {
        "text": text,
        "is_spam": is_spam,
        "score": spam_score,
        "triggers_found": detected_triggers
    }

# Test the classifier with two sample emails
sample_emails = [
    "Congratulations! You are our lucky WINNER, click here to claim prize now!",
    "Hi Ishit, can we reschedule our Python AI project review meeting to tomorrow?"
]

for email in sample_emails:
    result = classify_email(email)
    label = "[SPAM DETECTED]" if result["is_spam"] else "[CLEAN EMAIL]"
    print(f"{label} (Score: {result['score']*100:.0f}%)")
    print(f"  Subject: \"{result['text']}\"")
    if result["triggers_found"]:
        print(f"  Triggers: {result['triggers_found']}")
    print("-" * 65)

print("\n[Done] Module 01 completed! Next up: 02_data_structures_for_ai.py\n")
