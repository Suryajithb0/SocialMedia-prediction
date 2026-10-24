
import pandas as pd
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score

DATA_PATH = Path("data/social_media_engagement_cleaned.csv")
df = pd.read_csv(DATA_PATH)

target = "engagement_rate_pct"
excluded = [
    "post_id", "engagement_level", "impressions",
    "likes", "comments", "shares", target
]

X = df.drop(columns=excluded)
y = df[target]

categorical = X.select_dtypes(include=["object"]).columns.tolist()
numerical = X.select_dtypes(include=["number"]).columns.tolist()

preprocessor = ColumnTransformer([
    ("num", SimpleImputer(strategy="median"), numerical),
    ("cat", Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore"))
    ]), categorical)
])

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

models = {
    "Linear Regression": LinearRegression(),
    "Random Forest": RandomForestRegressor(
        n_estimators=100, random_state=42
    ),
    "Gradient Boosting": GradientBoostingRegressor(random_state=42)
}

best_model = None
best_mae = float("inf")

for name, model in models.items():
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", model)
    ])

    pipeline.fit(X_train, y_train)
    predictions = pipeline.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)

    print(f"\n{name}")
    print(f"MAE: {mae:.3f}")
    print(f"R² Score: {r2:.3f}")

    if mae < best_mae:
        best_mae = mae
        best_model = pipeline

Path("ml").mkdir(exist_ok=True)
joblib.dump(best_model, "ml/best_model.pkl")

print("\nBest model saved to ml/best_model.pkl")
