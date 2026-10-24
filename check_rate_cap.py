
import pandas as pd

df = pd.read_csv("data/social_media_engagement_cleaned.csv")

interactions = df["likes"] + df["comments"] + df["shares"]

df["calculated_rate"] = interactions / df["impressions"] * 100
df["capped_rate"] = df["calculated_rate"].clip(upper=25)

df["raw_difference"] = (
    df["engagement_rate_pct"] - df["calculated_rate"]
).abs()

df["capped_difference"] = (
    df["engagement_rate_pct"] - df["capped_rate"]
).abs()

print("===== CHECKING THE 25% CAP =====")
print("Rows matching raw formula within 0.01:",
      int((df["raw_difference"] <= 0.01).sum()))

print("Rows matching capped formula within 0.01:",
      int((df["capped_difference"] <= 0.01).sum()))

print("Median difference after applying cap:",
      round(df["capped_difference"].median(), 3))

print("\n===== SAMPLE ROWS NOT EXPLAINED BY THE CAP =====")
unexplained = df[df["capped_difference"] > 0.01]

print("Number of unexplained rows:", len(unexplained))
print(
    unexplained[
        [
            "post_id",
            "engagement_rate_pct",
            "calculated_rate",
            "capped_rate",
        ]
    ].head(10).round(3).to_string(index=False)
)
