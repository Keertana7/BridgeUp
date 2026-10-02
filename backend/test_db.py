from services.database import supabase

try:
    response = (
        supabase
        .table("companies")
        .select("*")
        .limit(5)
        .execute()
    )

    print("SUCCESS: Companies table is accessible!")
    print("Number of records fetched:", len(response.data))
    print("Data:", response.data)

except Exception as e:
    print("DATABASE ERROR:")
    print(type(e).__name__)
    print(str(e))