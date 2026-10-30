def find_company_by_name(supabase, name):
    normalized_name = name.strip().lower()
    response = (
        supabase.table("companies")
        .select("id,name")
        .execute()
    )
    return next(
        (
            company
            for company in response.data or []
            if isinstance(company.get("name"), str)
            and company["name"].strip().lower() == normalized_name
        ),
        None,
    )


def get_or_create_company(supabase, company_name):
    """Reuse a normalized company record or create one."""
    if not isinstance(company_name, str) or not company_name.strip():
        return None

    name = company_name.strip()
    existing = find_company_by_name(supabase, name)
    if existing:
        return existing["id"]

    try:
        response = (
            supabase.table("companies")
            .insert({"name": name})
            .execute()
        )
    except Exception as exc:
        if "23505" in str(exc):
            existing = find_company_by_name(supabase, name)
            if existing:
                return existing["id"]
        raise

    if not response.data:
        raise RuntimeError("Company creation failed. No data returned.")

    return response.data[0]["id"]
