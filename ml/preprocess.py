
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from pathlib import Path

# Load dataset
DATA_PATH = Path("data/social_media_engagement_cleaned.csv")
df = pd.read_csv(DATA_PATH)

# Predict numerical engagement rate
target = "engagement_rate_pct"

# Exclude identifiers and post-publication engagement metrics
excluded = [
    "post_id",
    "engagement_level",
    "impressions",
    "likes",
    "comments",
    "shares",
    target,
]

X = df.drop(columns=excluded)
y = df[target]

# Identify column types
categorical_cols = X.select_dtypes(include=["object", "str"]).columns.tolist()
numerical_cols = X.select_dtypes(include=["number"]).columns.tolist()

# Preprocess numeric and categorical features
preprocessor = ColumnTransformer(
    transformers=[
        ("num", SimpleImputer(strategy="median"), numerical_cols),
        ("cat", Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]), categorical_cols),
    ]
)

# Split before fitting preprocessing to avoid data leakage
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Fit preprocessing only on training features
X_train_processed = preprocessor.fit_transform(X_train)
X_test_processed = preprocessor.transform(X_test)

print("Dataset loaded successfully.")
print("Training rows:", X_train.shape[0])
print("Testing rows:", X_test.shape[0])
print("Original input features:", X.shape[1])
print("Processed training shape:", X_train_processed.shape)
print("Processed testing shape:", X_test_processed.shape)
print("Target: engagement_rate_pct")
print("Preprocessing completed successfully.")
