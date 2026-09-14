"""
=============================================================================
  WELCOME TO PYTHON FOR AI - STARTER GUIDE (python.py)
=============================================================================
This file is your interactive playground to start learning Python with AI!
You can run this directly in PyCharm or in your terminal using:
    python python.py
=============================================================================
"""

import math

def print_header(title: str):
    print("\n" + "=" * 65)
    print(f"  {title}")
    print("=" * 65)

def lesson_1_variables():
    print_header("LESSON 1: Variables & Data Types (AI Foundation)")
    print("In AI, data is stored in variables (numbers, text, labels, probabilities).\n")

    # Numbers (Integers & Floats)
    dataset_size = 1000          # int: number of training samples
    learning_rate = 0.001       # float: controls how fast an AI model learns
    accuracy = 94.7             # float: model accuracy percentage

    # Strings (Text data for Natural Language Processing / LLMs)
    prompt = "Explain quantum computing in simple terms"
    model_name = "Gemini / GPT"

    # Booleans (True / False - used for conditions and thresholds)
    is_trained = True
    gpu_available = False

    print(f"[+] Dataset size   : {dataset_size} samples (Type: {type(dataset_size).__name__})")
    print(f"[+] Learning rate  : {learning_rate} (Type: {type(learning_rate).__name__})")
    print(f"[+] Model accuracy : {accuracy}% (Type: {type(accuracy).__name__})")
    print(f"[+] Model name     : {model_name} (Type: {type(model_name).__name__})")
    print(f"[+] Prompt text    : \"{prompt}\" (Type: {type(prompt).__name__})")
    print(f"[+] Is trained?    : {is_trained} (Type: {type(is_trained).__name__})")
    print(f"[+] GPU available  : {gpu_available} (Type: {type(gpu_available).__name__})")

def lesson_2_data_structures():
    print_header("LESSON 2: Lists & Dictionaries (How AI stores data)")
    print("AI models rarely work with single numbers. They work with collections.\n")

    # 1. Lists: Ordered sequences (like a batch of inputs or vector embeddings)
    input_features = [1.2, 0.45, -0.89, 2.15]  # A simple 4-dimensional vector!
    class_labels = ["Cat", "Dog", "Bird"]

    print("[1] Lists:")
    print(f"    Feature vector  : {input_features}")
    print(f"    Number of items : {len(input_features)}")
    print(f"    First item      : {input_features[0]}")
    print(f"    Last item       : {input_features[-1]}")
    print(f"    Class labels    : {class_labels}")

    # 2. Dictionaries: Key-Value pairs (how AI APIs return JSON responses)
    prediction_result = {
        "label": "Cat",
        "confidence": 0.982,
        "processing_time_ms": 14.5,
        "is_confident": True
    }

    print("\n[2] Dictionaries (AI Output format):")
    print(f"    Predicted Label : {prediction_result['label']}")
    print(f"    Confidence      : {prediction_result['confidence'] * 100:.1f}%")
    print(f"    Latency         : {prediction_result['processing_time_ms']} ms")

def lesson_3_functions():
    print_header("LESSON 3: Functions (Reusable AI Building Blocks)")
    print("Functions take inputs, perform computations, and return predictions.\n")

    def sigmoid_activation(x: float) -> float:
        """
        Sigmoid activation function:
        Transforms any number into a probability between 0.0 and 1.0.
        Widely used in Neural Networks and Logistic Regression!
        Formula: 1 / (1 + e^(-x))
        """
        return 1.0 / (1.0 + math.exp(-x))

    test_values = [-5.0, -1.0, 0.0, 1.0, 5.0]
    print("Testing Sigmoid Activation (Converts raw score into probability):")
    for val in test_values:
        prob = sigmoid_activation(val)
        print(f"  Input: {val:+5.1f}  -->  Activation: {prob:.4f} ({prob * 100:5.1f}%)")

def lesson_4_ai_similarity_demo():
    print_header("LESSON 4: Mini AI Demo - Semantic Search with Cosine Similarity")
    print("How do Modern AI search engines (like Vector Databases & ChatGPT) find answers?")
    print("They convert text into numerical vectors and measure the similarity angle!\n")

    # Let's define a tiny vocabulary of 4 concepts: [technology, coding, animals, nature]
    # Each document is represented as weights across these concepts:
    documents = {
        "Python Programming Guide":  [0.9, 0.95, 0.0, 0.1],
        "Machine Learning with AI":  [0.95, 0.85, 0.0, 0.05],
        "Wildlife Photography":      [0.1, 0.0, 0.9, 0.85],
        "African Safari Adventures": [0.0, 0.0, 0.95, 0.9]
    }

    # User searches for: "Learn to write code" -> high on technology and coding
    user_query_vector = [0.85, 0.9, 0.0, 0.0]

    def cosine_similarity(v1: list, v2: list) -> float:
        """Calculates the cosine of the angle between two vectors."""
        dot_product = sum(a * b for a, b in zip(v1, v2))
        magnitude1 = math.sqrt(sum(a * a for a in v1))
        magnitude2 = math.sqrt(sum(b * b for b in v2))
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        return dot_product / (magnitude1 * magnitude2)

    print(f"User Query Vector: {user_query_vector}")
    print("Calculating similarity score with documents:\n")

    scores = []
    for doc_name, doc_vector in documents.items():
        sim = cosine_similarity(user_query_vector, doc_vector)
        scores.append((doc_name, sim))

    # Sort documents by highest similarity
    scores.sort(key=lambda x: x[1], reverse=True)

    for rank, (doc, score) in enumerate(scores, 1):
        bar = "#" * int(score * 25)
        print(f"  Rank {rank}: [{score * 100:5.1f}% match] {doc.ljust(28)} | {bar}")

    print(f"\n[AI Result] Best matching document: '{scores[0][0]}'!")

def interactive_menu():
    while True:
        print_header("LEARN PYTHON FOR AI - MENU")
        print("  1. Run Lesson 1: Variables & Data Types")
        print("  2. Run Lesson 2: Lists & Dictionaries")
        print("  3. Run Lesson 3: Functions (Neural Net Activation)")
        print("  4. Run Lesson 4: Mini AI Demo (Semantic Search / Vector Similarity)")
        print("  5. Run All Lessons")
        print("  6. Exit")
        print("-" * 65)

        try:
            choice = input("Enter your choice (1-6) [Press Enter for 5]: ").strip()
        except EOFError:
            choice = "5"

        if not choice:
            choice = "5"

        if choice == "1":
            lesson_1_variables()
        elif choice == "2":
            lesson_2_data_structures()
        elif choice == "3":
            lesson_3_functions()
        elif choice == "4":
            lesson_4_ai_similarity_demo()
        elif choice == "5":
            lesson_1_variables()
            lesson_2_data_structures()
            lesson_3_functions()
            lesson_4_ai_similarity_demo()
            print("\n" + "=" * 65)
            print("  CONGRATULATIONS! You have run all the starter lessons!")
            print("  Explore the next files in this folder:")
            print("   - 01_python_basics.py")
            print("   - 02_data_structures_for_ai.py")
            print("   - 03_ai_from_scratch.py")
            print("   - 04_ai_assistant_project.py")
            print("=" * 65 + "\n")
            break
        elif choice == "6":
            print("\nHappy Coding! See you in the next lesson.\n")
            break
        else:
            print("[!] Invalid choice. Please enter a number between 1 and 6.")

if __name__ == "__main__":
    interactive_menu()
