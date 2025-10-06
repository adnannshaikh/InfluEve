from typing import Dict, Tuple

# Deterministic pseudo-scorer derived from handle text
def _seed_from_text(text: str) -> int:
    h = 0
    for ch in text.lower():
        h = (h * 131 + ord(ch)) % (10**9 + 7)
    return h

def compute_scores(handle: str, weights: Dict[str, float]) -> Tuple[float, float, float, float, float, list[str]]:
    seed = _seed_from_text(handle)

    def s(offset):
        x = ((seed >> offset) & 1023) / 1023.0
        return 50 + x * 45  # 50..95

    authenticity = s(2)
    relevance    = s(12)
    resonance    = s(22)
    expected_roas = round(1.2 + (s(6) - 50) / 45 * 2.0, 2)  # ~0.2..3.2

    w_a = weights.get("authenticity", 0.25)
    w_r = weights.get("relevance", 0.25)
    w_s = weights.get("resonance", 0.25)
    w_ret = weights.get("return", 0.25)

    trust_index = (
        authenticity * w_a + relevance * w_r + resonance * w_s + (expected_roas * 30) * w_ret
    ) / (w_a + w_r + w_s + w_ret)

    signals = [
        f"Stable L/C ratio proxy: {authenticity:.1f}",
        f"Keyword similarity proxy: {relevance:.1f}",
        f"Engagement depth proxy: {resonance:.1f}",
    ]
    return (
        round(authenticity, 1),
        round(relevance, 1),
        round(resonance, 1),
        expected_roas,
        round(trust_index, 1),
        signals,
    )
