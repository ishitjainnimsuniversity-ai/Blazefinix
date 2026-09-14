"""
=============================================================================
  MODULE 02: DATA STRUCTURES FOR AI & TOKENIZATION
=============================================================================
In AI & Machine Learning, data structures are critical:
  1. Lists: Used for feature vectors, embeddings, batches
  2. List Comprehensions: Super-fast data transformation in Python
  3. Dictionaries: Used for JSON API payloads & Tokenizer Vocabularies
  4. Real AI Example: Building an NLP Tokenizer from Scratch!
=============================================================================
Run this file:
    python 02_data_structures_for_ai.py
"""

print("=" * 65)
print("  STEP 1: LIST COMPREHENSIONS (Fast Data Preprocessing)")
print("=" * 65)

# Raw temperature readings in Fahrenheit
raw_data = [68.0, 72.5, 77.0, 85.2, 90.0]

# Normalizing or converting data using a list comprehension:
# Formula: (F - 32) * 5/9 -> Celsius
celsius = [round((temp - 32.0) * (5.0 / 9.0), 2) for temp in raw_data]
print(f"Raw data (Fahrenheit) : {raw_data}")
print(f"Cleaned data (Celsius): {celsius}")

# Filtering outliers with list comprehension
high_temps = [t for t in celsius if t > 25.0]
print(f"High temps (>25 C)    : {high_temps}")


print("\n" + "=" * 65)
print("  STEP 2: DICTIONARIES (Vocabulary Mapping for AI)")
print("=" * 65)

# Large Language Models (LLMs) cannot read text directly.
# They map every word (token) to a unique number ID.
sample_text = "ai is transforming the world and python is the language of ai"
words = sample_text.lower().split()

# Get unique words
unique_words = sorted(list(set(words)))

# Build word-to-id (Vocabulary) and id-to-word dictionaries
word_to_id = {word: idx for idx, word in enumerate(unique_words)}
id_to_word = {idx: word for word, idx in word_to_id.items()}

print(f"Total words: {len(words)} | Unique vocabulary: {len(unique_words)} tokens")
print(f"Vocabulary Mapping (Word -> ID):")
for word, idx in word_to_id.items():
    print(f"  '{word}' -> {idx}")


print("\n" + "=" * 65)
print("  STEP 3: BUILDING A MINI NLP TOKENIZER (How LLMs process text)")
print("=" * 65)

class SimpleTokenizer:
    """A minimal tokenizer that converts strings to token IDs and back."""
    def __init__(self, vocab: dict):
        self.vocab = vocab
        self.inverse_vocab = {v: k for k, v in vocab.items()}
        self.unk_id = len(vocab)  # ID for Unknown words

    def encode(self, text: str) -> list:
        """Converts human text into a sequence of numbers (Tokens)."""
        tokens = text.lower().replace(".", "").replace(",", "").split()
        return [self.vocab.get(t, self.unk_id) for t in tokens]

    def decode(self, token_ids: list) -> str:
        """Converts token numbers back into readable text."""
        words = [self.inverse_vocab.get(tid, "<UNK>") for tid in token_ids]
        return " ".join(words)

tokenizer = SimpleTokenizer(word_to_id)

sentence_to_encode = "Python is the language of AI"
encoded_tokens = tokenizer.encode(sentence_to_encode)
decoded_sentence = tokenizer.decode(encoded_tokens)

print(f"Original Text : \"{sentence_to_encode}\"")
print(f"Encoded (IDs) : {encoded_tokens}")
print(f"Decoded Back  : \"{decoded_sentence}\"")

# Notice how unknown words are safely handled
new_sentence = "AI will empower robotics"
print(f"\nEncoding unseen words:")
print(f"Input : \"{new_sentence}\"")
print(f"Tokens: {tokenizer.encode(new_sentence)}  (Note: unseen words become token {tokenizer.unk_id} <UNK>)")

print("\n[Done] Module 02 completed! Next up: 03_ai_from_scratch.py\n")
