
import pandas as pd
from pathlib import Path

# Locate the cleaned dataset
file_path = Path("data/social_media_engagement_cleaned.csv")

if not file_path.exists():
    print("ERROR: Dataset file not found.")
else:
    # Load the CSV
    df = pd.read_csv(file_path)

    print("\n===== DATASET OVERVIEW =====")
    print("Number of rows:", df.shape[0])
    print("Number of columns:", df.shape[1])

    print("\n===== COLUMN NAMES =====")
    print(df.columns.tolist())

    print("\n===== FIRST 5 ROWS =====")
    print(df.head().to_string())

    print("\n===== DATA TYPES =====")
    print(df.dtypes.to_string())

    print("\n===== MISSING VALUES =====")
    print(df.isnull().sum().to_string())

    print("\n===== DUPLICATE ROWS =====")
    print(df.duplicated().sum())

    print("\n===== NUMERICAL SUMMARY =====")
    print(df.describe().to_string())
