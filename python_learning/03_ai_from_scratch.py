"""
=============================================================================
  MODULE 03: ARTIFICIAL INTELLIGENCE FROM SCRATCH (No Libraries Required!)
=============================================================================
How does machine learning actually work under the hood?
You will learn:
  1. The Dot Product (How weights and inputs multiply)
  2. The Artificial Neuron: y = Activation(w1*x1 + w2*x2 + ... + bias)
  3. The Loss Function: Measuring model errors
  4. The Training Loop: Updating weights using Gradient Descent!
=============================================================================
Run this file:
    python 03_ai_from_scratch.py
"""

import math
import random

print("=" * 65)
print("  STEP 1: THE MATHEMATICS OF A NEURON")
print("=" * 65)

# A single artificial neuron takes inputs (x), multiplies by weights (w),
# adds a bias (b), and passes through an activation function.

def sigmoid(z: float) -> float:
    """Activation function squeezing output between 0 and 1."""
    # Prevent overflow
    z_clamped = max(min(z, 500.0), -500.0)
    return 1.0 / (1.0 + math.exp(-z_clamped))

def sigmoid_derivative(output: float) -> float:
    """Derivative of sigmoid used for backpropagation."""
    return output * (1.0 - output)

print("Sigmoid Activation Ready: Converts raw sum into confidence probability.")


print("\n" + "=" * 65)
print("  STEP 2: TRAINING DATA (AI Decision Problem)")
print("=" * 65)
print("Goal: Train a neuron to predict whether a student passes an AI exam")
print("Features: [Study Hours (0 to 1), Past Score (0 to 1)]")
print("Target: 1 = Pass, 0 = Fail\n")

# Training dataset: (study_hours, past_score) -> pass(1) / fail(0)
training_data = [
    ([0.1, 0.2], 0),  # low study, low score  -> Fail
    ([0.2, 0.3], 0),  # low study, low score  -> Fail
    ([0.8, 0.7], 1),  # high study, high score -> Pass
    ([0.9, 0.8], 1),  # high study, high score -> Pass
    ([0.7, 0.6], 1),  # good study, good score -> Pass
    ([0.3, 0.2], 0),  # low study, low score  -> Fail
]

for features, label in training_data:
    status = "Pass (1)" if label == 1 else "Fail (0)"
    print(f"  Inputs: Study={features[0]*10:.0f} hrs, Score={features[1]*100:.0f}% -> {status}")


print("\n" + "=" * 65)
print("  STEP 3: INITIALIZING THE NEURAL NETWORK")
print("=" * 65)

# Seed random for repeatable results
random.seed(42)

# Weights for each input feature (initially random small values)
weights = [random.uniform(-1.0, 1.0), random.uniform(-1.0, 1.0)]
bias = random.uniform(-1.0, 1.0)
learning_rate = 0.5

print(f"Initial random weights : {[round(w, 4) for w in weights]}")
print(f"Initial random bias    : {bias:.4f}")


print("\n" + "=" * 65)
print("  STEP 4: THE TRAINING LOOP (Learning from Errors)")
print("=" * 65)

epochs = 1000

for epoch in range(1, epochs + 1):
    total_loss = 0.0

    for x, y_true in training_data:
        # 1. FORWARD PASS:
        # linear sum = w1*x1 + w2*x2 + bias
        linear_sum = weights[0] * x[0] + weights[1] * x[1] + bias
        # activation
        y_pred = sigmoid(linear_sum)

        # 2. CALCULATE ERROR (Mean Squared Error):
        error = y_true - y_pred
        total_loss += error ** 2

        # 3. BACKPROPAGATION & GRADIENT DESCENT:
        # Calculate how much to adjust weights
        gradient = error * sigmoid_derivative(y_pred)

        # Update weights and bias:
        weights[0] += learning_rate * gradient * x[0]
        weights[1] += learning_rate * gradient * x[1]
        bias += learning_rate * gradient

    # Print progress every 200 epochs
    if epoch % 200 == 0:
        avg_loss = total_loss / len(training_data)
        print(f"  Epoch {epoch:4d}/{epochs} | Average Loss: {avg_loss:.5f}")

print(f"\n[Training Complete!]")
print(f"Final Trained Weights : {[round(w, 4) for w in weights]}")
print(f"Final Trained Bias    : {bias:.4f}")


print("\n" + "=" * 65)
print("  STEP 5: TESTING THE TRAINED AI ON NEW, UNSEEN STUDENTS")
print("=" * 65)

test_students = [
    ("Student A (Study: 9 hrs, Past: 85%)", [0.9, 0.85]),
    ("Student B (Study: 1.5 hrs, Past: 25%)", [0.15, 0.25]),
    ("Student C (Study: 6.5 hrs, Past: 60%)", [0.65, 0.60]),
    ("Student D (Study: 2 hrs, Past: 40%)", [0.20, 0.40]),
]

for name, features in test_students:
    z = weights[0] * features[0] + weights[1] * features[1] + bias
    probability = sigmoid(z)
    prediction = "PASS" if probability >= 0.50 else "FAIL"

    print(f"\n[+] {name}")
    print(f"    Confidence: {probability * 100:5.1f}% -> AI Verdict: {prediction}")

print("\n" + "=" * 65)
print("You just built and trained a complete neural network neuron from scratch!")
print("Next up: 04_ai_assistant_project.py")
print("=" * 65 + "\n")
