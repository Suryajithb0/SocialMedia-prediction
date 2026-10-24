
import pandas as pd

df = pd.read_csv("data/social_media_engagement_cleaned.csv")

# 1. Inspect engagement-rate ranges for each label
print("===== RATE RANGE BY ENGAGEMENT LEVEL =====")
print(
    df.groupby("engagement_level")["engagement_rate_pct"]
    .agg(["count", "min", "max", "mean"])
    .round(3)
    .to_string()
)

# 2. Check the recorded rate against common formulas
interactions = df["likes"] + df["comments"] + df["shares"]

formulas = {
    "Interactions / impressions": interactions / df["impressions"] * 100,
    "Likes only / impressions": df["likes"] / df["impressions"] * 100,
    "Interactions / followers": interactions / df["follower_count"] * 100,
}

print("\n===== FORMULA COMPARISON =====")
for name, calculated in formulas.items():
    difference = (df["engagement_rate_pct"] - calculated).abs()
    print(f"\n{name}")
    print("Median absolute difference:", round(difference.median(), 3))
    print("Rows within 0.01 percentage points:",
          int((difference <= 0.01).sum()))

# 3. Show sample rows where the standard formula differs
df["calculated_rate"] = interactions / df["impressions"] * 100
df["absolute_difference"] = (
    df["engagement_rate_pct"] - df["calculated_rate"]
).abs()

print("\n===== 10 LARGEST RATE DIFFERENCES =====")
print(
    df.nlargest(10, "absolute_difference")[
        [
            "post_id",
            "engagement_rate_pct",
            "calculated_rate",
            "engagement_level",
            "impressions",
            "likes",
            "comments",
            "shares",
        ]
    ].round(3).to_string(index=False)
)

print("\n===== DIAGNOSTIC COMPLETE =====")
