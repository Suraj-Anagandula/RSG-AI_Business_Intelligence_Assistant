"""
Data Cleaning and Database Ingestion Module.
Uses Pandas and NumPy to clean raw sales CSV and load into PostgreSQL.
"""
import pandas as pd
import numpy as np
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import SalesRecord


def clean_sales_dataframe(df_raw: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Cleans raw sales transaction data.
    
    Cleaning rules applied:
    1. Standardize column names.
    2. Strip whitespace from string columns.
    3. Convert Quantity to numeric and remove invalid (<= 0) transactions.
    4. Handle missing/blank Unit_price by imputing known product price or dropping.
    5. Convert Order_date from DD-MM-YYYY to standard date objects.
    6. Calculate net_revenue = (quantity * unit_price) - discount_amount.
    """
    stats = {
        "total_raw_rows": len(df_raw),
        "dropped_rows": 0,
        "imputed_rows": 0,
        "valid_rows": 0
    }

    # Standardize column headers: strip spaces and map to standard names
    df = df_raw.copy()
    df.columns = [c.strip() for c in df.columns]

    column_mapping = {
        "Transaction_Id": "transaction_id",
        "Order_date": "order_date",
        "Product": "product",
        "Category": "category",
        "Region": "region",
        "Sales_channel": "sales_channel",
        "Quantity": "quantity",
        "Unit_price": "unit_price",
        "Discount_amount": "discount_amount",
        "Status": "status"
    }
    df = df.rename(columns=column_mapping)

    # Strip whitespaces from string columns
    string_cols = ["transaction_id", "product", "category", "region", "sales_channel", "status"]
    for col in string_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    # Clean Unit_price (replace non-breaking space and empty strings with NaN)
    df["unit_price"] = df["unit_price"].replace(r"^\s*$", np.nan, regex=True)
    df["unit_price"] = pd.to_numeric(df["unit_price"], errors="coerce")

    # If unit_price is NaN, try imputing from existing rows with same product
    price_map = df.dropna(subset=["unit_price"]).groupby("product")["unit_price"].median().to_dict()
    for idx, row in df[df["unit_price"].isna()].iterrows():
        prod = row["product"]
        if prod in price_map:
            df.at[idx, "unit_price"] = price_map[prod]
            stats["imputed_rows"] += 1
            print(f"[Data Cleaner] Imputed unit_price for {prod} (row {idx+1}) with {price_map[prod]}")

    # Drop any remaining rows with missing unit_price
    before_drop_price = len(df)
    df = df.dropna(subset=["unit_price"])
    stats["dropped_rows"] += (before_drop_price - len(df))

    # Clean Quantity: convert to numeric, drop rows with quantity <= 0
    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0).astype(int)
    invalid_qty_mask = df["quantity"] <= 0
    num_invalid_qty = invalid_qty_mask.sum()
    if num_invalid_qty > 0:
        print(f"[Data Cleaner] Dropping {num_invalid_qty} rows with invalid quantity (<= 0)")
        df = df[~invalid_qty_mask]
        stats["dropped_rows"] += num_invalid_qty

    # Clean Discount_amount: ensure numeric and default to 0
    df["discount_amount"] = pd.to_numeric(df["discount_amount"], errors="coerce").fillna(0.0)

    # Clean Order_date: parse DD-MM-YYYY format
    df["order_date"] = pd.to_datetime(df["order_date"], format="%d-%m-%Y", errors="coerce").dt.date
    df = df.dropna(subset=["order_date"])

    # Calculate net revenue: (quantity * unit_price) - discount_amount
    df["net_revenue"] = (df["quantity"] * df["unit_price"]) - df["discount_amount"]

    # Deduplicate by transaction_id if duplicates exist
    df = df.drop_duplicates(subset=["transaction_id"])

    stats["valid_rows"] = len(df)
    return df, stats


def load_cleaned_data_to_db(df_clean: pd.DataFrame, db: Session = None) -> int:
    """
    Creates tables if they don't exist and inserts cleaned records into PostgreSQL.
    Clears existing sales_records before inserting fresh batch.
    """
    # Ensure database table exists
    Base.metadata.create_all(bind=engine)

    own_session = False
    if db is None:
        db = SessionLocal()
        own_session = True

    try:
        # Clear existing records to avoid duplicate key errors on reload
        db.query(SalesRecord).delete()
        db.commit()

        records_to_insert = []
        for _, row in df_clean.iterrows():
            record = SalesRecord(
                transaction_id=row["transaction_id"],
                order_date=row["order_date"],
                product=row["product"],
                category=row["category"],
                region=row["region"],
                sales_channel=row["sales_channel"],
                quantity=int(row["quantity"]),
                unit_price=float(row["unit_price"]),
                discount_amount=float(row["discount_amount"]),
                status=row["status"],
                net_revenue=float(row["net_revenue"])
            )
            records_to_insert.append(record)

        db.bulk_save_objects(records_to_insert)
        db.commit()
        print(f"[Data Loader] Successfully loaded {len(records_to_insert)} records into sales_records table.")
        return len(records_to_insert)
    finally:
        if own_session:
            db.close()


def process_and_load_csv(csv_path: str) -> dict:
    """
    End-to-end pipeline: reads CSV, cleans data, and loads into PostgreSQL.
    """
    print(f"[Pipeline] Reading CSV file from {csv_path}...")
    df_raw = pd.read_csv(csv_path)
    df_clean, stats = clean_sales_dataframe(df_raw)
    loaded_count = load_cleaned_data_to_db(df_clean)
    stats["loaded_records"] = loaded_count
    return stats


if __name__ == "__main__":
    import sys
    test_csv = "/home/user/suraj_project/data/sales_data_raw.csv"
    if len(sys.argv) > 1:
        test_csv = sys.argv[1]
    result_stats = process_and_load_csv(test_csv)
    print("\nData Cleaning & Loading Report:")
    for k, v in result_stats.items():
        print(f"  {k}: {v}")

