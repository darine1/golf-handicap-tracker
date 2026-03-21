def calculate_score_differential(gross: int, course_rating: float, slope: int) -> float:
    return round((gross - course_rating) * 113 / slope, 1)

def count_differentials_to_use(num_rounds: int) -> int | None:
    table = {
        3:1, 4:1, 5:1, 6:2, 7:2, 8:2,
        9:3, 10:3,11:3, 12:4, 13:4,
        14:5, 15:5, 16:6, 17:6, 18:7,
        19:7, 20:8
    }
    if num_rounds < 3:
        return None
    return table.get(min(num_rounds, 20), 8)

def calculate_handicap_index(differentials: list[float]) -> float | None:
    n = count_differentials_to_use(len(differentials))
    if n is None:
        return None
    best = sorted(differentials)[:n]
    avg = sum(best) / len(best)
    return round(avg * 0.96, 1)