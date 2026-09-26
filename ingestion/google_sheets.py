import os
import requests
from dotenv import load_dotenv

load_dotenv()

GOOGLE_SHEET_API_URL = os.getenv("GOOGLE_SHEET_API_URL")


def get_sheet_data():
    response = requests.get(GOOGLE_SHEET_API_URL)

    response.raise_for_status()

    return response.json()


if __name__ == "__main__":
    data = get_sheet_data()

    print(f"Rows fetched: {len(data)}")

    for row in data:
        print(row.get("Name"), "-", row.get("Company "))