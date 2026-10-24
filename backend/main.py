
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# --------------------------------------------------
# 1. APP CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "social_media_engagement_cleaned.csv"
MODEL_PATH = BASE_DIR / "ml" / "best_model.pkl"

app = FastAPI(
    title="Social Media Engagement Prediction API",
    description="ML-powered social media analytics and engagement prediction",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# --------------------------------------------------
# 2. LOAD MODEL AND DATASET
# --------------------------------------------------

model = joblib.load(MODEL_PATH)


def load_dataset():
    if not DATA_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail="Dataset file not found.",
        )

    return pd.read_csv(DATA_PATH)


# --------------------------------------------------
# 3. PREDICTION INPUT
# --------------------------------------------------

class PostData(BaseModel):
    platform: str
    post_type: str
    topic: str
    day_of_week: str
    posting_hour: int = Field(ge=0, le=23)
    follower_count: int = Field(ge=0)
    caption_length_chars: int = Field(ge=0)
    hashtag_count: int = Field(ge=0)
    video_duration_seconds: float = Field(ge=0)
    contains_call_to_action: int = Field(ge=0, le=1)
    paid_promotion: int = Field(ge=0, le=1)
    historical_avg_engagement_rate_pct: float = Field(ge=0)


# --------------------------------------------------
# 4. HOME / HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Social Media Engagement Prediction API is running",
        "model": type(model.named_steps["model"]).__name__,
        "endpoints": ["/predict", "/analytics", "/docs"],
    }


# --------------------------------------------------
# 5. PREDICT ENGAGEMENT
# --------------------------------------------------

@app.post("/predict")
def predict(data: PostData):
    try:
        features = pd.DataFrame([data.model_dump()])
        prediction = float(model.predict(features)[0])

        return {
            "predicted_engagement_rate_pct": round(
                max(0.0, prediction), 2
            )
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(exc)}",
        )


# --------------------------------------------------
# 6. DATASET ANALYTICS FOR DASHBOARD
# --------------------------------------------------

@app.get("/analytics")
def analytics():
    df = load_dataset()

    target = "engagement_rate_pct"

    required_columns = [
        target,
        "platform",
        "post_type",
        "topic",
        "posting_hour",
        "day_of_week",
        "engagement_level",
    ]

    missing = [
        col for col in required_columns
        if col not in df.columns
    ]

    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Dataset columns missing: {missing}",
        )

    df[target] = pd.to_numeric(df[target], errors="coerce")
    df = df.dropna(subset=[target])

    if df.empty:
        raise HTTPException(
            status_code=500,
            detail="No valid engagement-rate data found.",
        )

    def grouped_average(column):
        grouped = (
            df.groupby(column, dropna=False)[target]
            .agg(["mean", "count"])
            .reset_index()
        )

        grouped.columns = ["name", "engagement", "posts"]
        grouped["name"] = grouped["name"].fillna("Unknown").astype(str)
        grouped["engagement"] = grouped["engagement"].round(2)

        return grouped.sort_values(
            "engagement", ascending=False
        ).to_dict(orient="records")

    distribution = (
        df["engagement_level"]
        .fillna("Unknown")
        .value_counts()
    )

    return {
        "total_posts": int(len(df)),
        "average_engagement": round(float(df[target].mean()), 2),
        "median_engagement": round(float(df[target].median()), 2),
        "high_engagement_posts": int((df[target] >= 5).sum()),
        "platform_performance": grouped_average("platform"),
        "content_performance": grouped_average("post_type"),
        "topic_performance": grouped_average("topic"),
        "hourly_performance": grouped_average("posting_hour"),
        "daily_performance": grouped_average("day_of_week"),
        "engagement_distribution": [
            {
                "name": str(label),
                "value": int(count),
            }
            for label, count in distribution.items()
        ],
    }
