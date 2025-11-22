# backend/app/rag/validator.py
def validate_relevance(results, threshold=0.008):  # ← LOWERED FROM 0.018
    """
    RRF scores are usually between 0.005 and 0.03
    0.008 = safe but catches 99% of real matches
    """
    if not results:
        return False
    
    max_score = max(item.get("score", 0) for item in results)
    print(f"[VALIDATOR] Max relevance score: {max_score:.5f} | Threshold: {threshold}")
    
    return max_score > threshold