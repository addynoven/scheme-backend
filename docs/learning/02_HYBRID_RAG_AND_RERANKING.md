# 📖 Chapter 2: Hybrid RAG, Reciprocal Rank Fusion & Cross-Encoder Reranking

> **Milestone:** V3.0 / Phase 6  
> **Core Concept:** Why naive vector search fails on government policies and how Sparse (BM25) + Dense (Embeddings) + Cross-Encoder Reranking guarantees high-precision answers with exact citations.

---

## 1. Why Simple Vector Search Fails on Government Documents

Most beginner RAG tutorials tell you:
> *"Embed all text chunks using OpenAI/Gemini embeddings, store in a vector database, and do cosine similarity search."*

In government welfare systems, this causes critical failures:

1. **Exact Number / Code Blindness:**
   - Vector embeddings capture *general semantic vibes*.
   - If a citizen asks *"What is the quota under Circular GR-2024/09 for Sehore?"*, vector search often returns a document for *"Circular GR-2023/04 for Bhopal"* because the texts look semantically similar in embedding space, completely missing the exact circular ID!
2. **Version Drift:**
   - Policy changes in 2026 look 99% identical to the 2021 policy. Cosine search often retrieves the outdated 2021 chunk because it has higher keyword overlap with historical training sets.
3. **The Lost-in-the-Middle Problem:**
   - Feeding 10 arbitrary chunks to an LLM causes it to hallucinate or ignore the crucial condition buried in chunk #7.

---

## 2. The Solution: Hybrid Search (Sparse + Dense)

We combine two complementary search paradigms:

```text
                                CITIZEN QUERY
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
         SPARSE SEARCH (BM25)                      DENSE SEARCH (Vectors)
         Matches exact terms:                      Matches conceptual meaning:
         "GR-2024", "Khasra", "Sehore"             "farming help", "widow pension"
                 │                                         │
                 ▼                                         ▼
            Top 50 Sparse                             Top 50 Dense
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      │
                                      ▼
                         HYBRID FUSION (RRF Algorithm)
                                      │
                                      ▼
                          Top 25 Merged Candidates
                                      │
                                      ▼
                        CROSS-ENCODER RERANKER
                        (Joint Query-Passage Attention)
                                      │
                                      ▼
                             Top 3-5 Best Chunks
                                      │
                                      ▼
                               LLM + Citations
```

---

## 3. Sparse vs Dense: Head-to-Head Comparison

| Feature | Sparse (BM25) | Dense (Vector Embeddings) |
| :--- | :--- | :--- |
| **How It Works** | Counts exact keyword occurrences weighted by rarity (TF-IDF). | Converts text into high-dimensional geometric vectors (e.g. 768-dim floats). |
| **Superpower** | **100% precision on exact keywords:** scheme IDs, circular numbers, district names, act sections. | **Understands synonyms and intent:** *"financial support for tractor"* $\to$ *Sub-Mission on Agricultural Mechanization*. |
| **Weakness** | Zero understanding of synonyms or paraphrasing. | Misses exact code numbers, sensitive to typos. |
| **Implementation** | `rank-bm25` or PostgreSQL `tsvector` | `pgvector` or embedding models |

---

## 4. Merging Results: Reciprocal Rank Fusion (RRF)

How do you combine a BM25 score of `14.2` with a Cosine Similarity score of `0.87`? **You don't compare scores directly; you compare their ranks!**

The **RRF Formula**:
\[
\text{RRF\_Score}(d) = \sum_{m \in M} \frac{1}{k + \text{Rank}_m(d)}
\]
*(Where \(k \approx 60\) is a smoothing constant, and \(\text{Rank}_m(d)\) is the rank of document \(d\) in search system \(m\)).*

### Python RRF Implementation:

```python
def reciprocal_rank_fusion(
    sparse_results: list[str], 
    dense_results: list[str], 
    k: int = 60
) -> list[tuple[str, float]]:
    scores: dict[str, float] = {}

    for rank, doc_id in enumerate(sparse_results):
        scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))

    for rank, doc_id in enumerate(dense_results):
        scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))

    # Sort descending by fused score
    return sorted(scores.items(), key=lambda item: item[1], reverse=True)
```

---

## 5. The Secret Weapon: Cross-Encoder Reranking

### Bi-Encoder (Fast, Approximate) vs Cross-Encoder (Slow, Ultra-Accurate)

- **Bi-Encoder (Embeddings):** Encodes the query and document separately into vectors: \(\text{cosine}(\vec{q}, \vec{d})\). Great for searching 1,000,000 documents in 5 milliseconds.
- **Cross-Encoder (Reranker):** Feeds the query and document *together* into a transformer: \(\text{BERT}(\text{Query} + \text{Document})\). Every word in the query attends to every word in the document simultaneously!

```text
Query: "Can 17 year olds get college stipend?"

Chunk A: "Students enrolled in degree college receive ₹5000."
  Bi-Encoder Score: 0.88 (High semantic match)
  Cross-Encoder Score: 0.12 (Rejected! Cross-encoder notices '17 year old' conflicts with standard college age rules)

Chunk B: "Under section 3, minor students aged 17 with exceptional admission are eligible."
  Bi-Encoder Score: 0.79
  Cross-Encoder Score: 0.96 (Selected! Exact logical match)
```

We use Bi-Encoders to grab **top 50 candidates** in 5ms, then run a fast Cross-Encoder (e.g. `bge-reranker-base` or Flash LLM) to pick the **top 3 definitive chunks**.

---

## 6. Dynamic Top-K: No More Hardcoded `K=5`

Instead of always passing 5 chunks to the LLM:
1. If the Top-1 chunk has a reranker confidence score of `> 0.95` and Top-2 is `< 0.30`, we send **only Top-1** (saves tokens, reduces latency, eliminates noise).
2. If Top-5 chunks all have moderate scores (`0.65 - 0.70`), we send **all 5** because the query requires synthesizing multi-clause policies.

---

## 📚 Recommended External Resources to Read

1. **Foundational Papers & Articles:**
   - [Pinecone: What is Hybrid Search and RRF?](https://www.pinecone.io/learn/hybrid-search-rrf/)
   - [Hugging Face: Cross-Encoders and Reranking](https://www.sbert.net/examples/applications/cross-encoder/README.html)
   - [Nils Reimers: Sentence-Transformers & Bi-Encoder vs Cross-Encoder](https://www.sbert.net/)
2. **Database Integration:**
   - [pgvector: Vector similarity search for PostgreSQL](https://github.com/pgvector/pgvector)
3. **Advanced Chunking:**
   - [LlamaIndex: Hierarchical Node Parsing & Parent-Child Chunking](https://docs.llamaindex.ai/en/stable/examples/node_parsers/hierarchical/)
