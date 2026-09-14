"""
=============================================================================
  MODULE 04: BUILD YOUR FIRST AI ASSISTANT (RAG & NLP)
=============================================================================
This project brings everything together:
  - Natural Language Processing (NLP)
  - Information Retrieval (Semantic / Keyword Relevance)
  - Context Augmentation (The exact technique used in RAG AI applications)
  - Interactive CLI Chat interface
=============================================================================
Run this file:
    python 04_ai_assistant_project.py
"""

import re
import sys

# 1. KNOWLEDGE BASE (Our AI's memory bank)
KNOWLEDGE_BASE = [
    {
        "topic": "Python for AI",
        "keywords": ["python", "ai", "artificial intelligence", "learn", "start", "language"],
        "answer": "Python is the undisputed #1 language for AI because of its simple syntax and rich ecosystem (NumPy, PyTorch, TensorFlow, Scikit-learn, HuggingFace)."
    },
    {
        "topic": "Neural Networks",
        "keywords": ["neural network", "deep learning", "neuron", "weights", "bias", "layers"],
        "answer": "A Neural Network is a collection of interconnected nodes (neurons) inspired by biological brains. Each connection has a weight that gets tuned during training."
    },
    {
        "topic": "Large Language Models (LLMs)",
        "keywords": ["llm", "large language model", "chatgpt", "gemini", "gpt", "transformer"],
        "answer": "LLMs are massive neural networks trained on vast amounts of text to predict the next word in a sequence using the Transformer architecture and Attention mechanisms."
    },
    {
        "topic": "Retrieval Augmented Generation (RAG)",
        "keywords": ["rag", "retrieval", "vector", "database", "context", "embeddings"],
        "answer": "RAG connects an AI model to an external database. When a user asks a question, the system retrieves relevant documents and gives them to the AI as context for accurate answers."
    },
    {
        "topic": "PyCharm IDE Tips",
        "keywords": ["pycharm", "ide", "run", "debug", "shortcut", "terminal"],
        "answer": "In PyCharm, you can run any Python file by right-clicking inside the code editor and selecting 'Run', or pressing Shift+F10 (Windows)."
    }
]

def clean_and_tokenize(text: str) -> set:
    """Extracts words and lowers them into a clean token set."""
    words = re.findall(r'\w+', text.lower())
    # Remove common stopwords for cleaner matching
    stopwords = {"is", "what", "the", "a", "an", "how", "to", "for", "in", "of", "and", "do", "you", "tell", "me", "about"}
    return {w for w in words if w not in stopwords}

def query_knowledge_base(user_question: str) -> tuple:
    """Finds the most relevant knowledge article for the question."""
    query_tokens = clean_and_tokenize(user_question)

    best_match = None
    highest_score = 0

    for item in KNOWLEDGE_BASE:
        score = 0
        # Check topic match
        topic_tokens = clean_and_tokenize(item["topic"])
        score += len(query_tokens.intersection(topic_tokens)) * 3

        # Check keyword matches
        for kw in item["keywords"]:
            kw_tokens = clean_and_tokenize(kw)
            if kw_tokens.issubset(query_tokens):
                score += 2
            elif len(kw_tokens.intersection(query_tokens)) > 0:
                score += 1

        if score > highest_score:
            highest_score = score
            best_match = item

    return best_match, highest_score

def ai_chat_loop():
    print("=" * 65)
    print("  WELCOME TO YOUR FIRST AI ASSISTANT!")
    print("=" * 65)
    print("Ask me anything about: Python, Neural Networks, LLMs, RAG, or PyCharm!")
    print("Type 'exit' or 'quit' to stop.\n")

    # If running in automated/piped mode, run automated demonstrations
    is_interactive = sys.stdin.isatty()

    sample_questions = [
        "What is a neural network and how does a neuron work?",
        "Why should I learn Python for AI?",
        "How do I run files in PyCharm?",
        "What is RAG?"
    ]

    if not is_interactive:
        print("[Demo Mode Detected] Running automated sample queries:")
        for q in sample_questions:
            print(f"\nUser: {q}")
            match, score = query_knowledge_base(q)
            if match and score > 0:
                print(f"AI Assistant ({match['topic']}): {match['answer']}")
            else:
                print("AI Assistant: I'm not sure about that yet, but I'm continuously learning!")
        print("\n" + "=" * 65)
        print("Demo completed successfully!")
        return

    # Interactive mode
    while True:
        try:
            user_input = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not user_input:
            continue

        if user_input.lower() in ["exit", "quit", "q"]:
            print("AI Assistant: Keep practicing Python! Goodbye!")
            break

        match, score = query_knowledge_base(user_input)
        if match and score > 0:
            print(f"\nAI Assistant [{match['topic']}]:")
            print(f"  {match['answer']}")
        else:
            print("\nAI Assistant:")
            print("  I don't have information on that topic in my local knowledge base yet.")
            print("  Try asking about 'Python for AI', 'Neural Networks', 'LLMs', 'RAG', or 'PyCharm'!")

if __name__ == "__main__":
    ai_chat_loop()
