
import pandas as pd
from pathlib import Path

file_path = Path("data/social_media_engagement_cleaned.csv")
df = pd.read_csv(file_path)

print("===== UNIQUE POST IDS =====")
print("Unique post IDs:", df["post_id"].nunique())
print("Duplicate post IDs:", df["post_id"].duplicated().sum())

print("\n===== CATEGORICAL VALUES =====")
for col in ["platform", "post_type", "topic", "day_of_week", "engagement_level"]:
    print(f"\n{col}:")
    print(df[col].value_counts().to_string())

print("\n===== VALUE RANGE CHECKS =====")
checks = {
    "posting_hour outside 0-23":
        ~df["posting_hour"].between(0, 23),
    "negative follower_count":
        df["follower_count"] < 0,
    "negative caption_length_chars":
        df["caption_length_chars"] < 0,
    "negative hashtag_count":
        df["hashtag_count"] < 0,
    "negative video_duration_seconds":
        df["video_duration_seconds"] < 0,
    "negative impressions":
        df["impressions"] < 0,
    "negative likes/comments/shares":
        (df[["likes", "comments", "shares"]] < 0).any(axis=1),
    "engagement rate outside 0-100":
        ~df["engagement_rate_pct"].between(0, 100),
    "invalid contains_call_to_action":
        ~df["contains_call_to_action"].isin([0, 1]),
    "invalid paid_promotion":
        ~df["paid_promotion"].isin([0, 1]),
}

for name, invalid in checks.items():
    print(f"{name}: {int(invalid.sum())} rows")

print("\n===== ENGAGEMENT LEVEL VS RATE =====")
print(pd.crosstab(
    df["engagement_level"],
    pd.cut(
        df["engagement_rate_pct"],
        bins=[-float("inf"), 5, 10, 15, 20, float("inf")],
        labels=["<=5%", "5-10%", "10-15%", "15-20%", ">20%"],
        right=True
    ),
    dropna=False
).to_string())

print("\n===== ENGAGEMENT RATE FORMULA CHECK =====")
calculated = (
    (df["likes"] + df["comments"] + df["shares"])
    / df["impressions"].replace(0, pd.NA)
    * 100
)

difference = (df["engagement_rate_pct"] - calculated).abs()

print("Rows with zero impressions:", int((df["impressions"] == 0).sum()))
print("Rows matching calculated rate within 0.01 percentage points:",
      int((difference <= 0.01).sum()))
print("Median absolute difference:",
      round(difference.median(), 3))

print("\n===== VALIDATION COMPLETE =====")
