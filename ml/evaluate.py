
import pandas as pd
import joblib
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

df = pd.read_csv("data/social_media_engagement_cleaned.csv")

target = "engagement_rate_pct"
excluded = [
    "post_id", "engagement_level", "impressions",
    "likes", "comments", "shares", target
]

X = df.drop(columns=excluded)
y = df[target]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = joblib.load("ml/best_model.pkl")
predictions = model.predict(X_test)

print("Model:", type(model.named_steps["model"]).__name__)
print(f"MAE: {mean_absolute_error(y_test, predictions):.3f}")
print(f"R² Score: {r2_score(y_test, predictions):.3f}")

plt.scatter(y_test, predictions, alpha=0.7)
plt.xlabel("Actual Engagement Rate (%)")
plt.ylabel("Predicted Engagement Rate (%)")
plt.title("Actual vs Predicted Engagement Rate")
plt.tight_layout()
plt.savefig("reports/evaluation_plot.png")
plt.show()

print("Plot saved to reports/evaluation_plot.png")
