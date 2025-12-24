from typing import Optional
from psycopg2.extras import RealDictCursor


def get_product_id_by_name(
    conn,
    product_name: str,
    schema: str = "public"
) -> Optional[int]:
    """
    Fetch product ID by product name.
    Returns None if not found.
    """
    query = f"""
        SELECT id
        FROM {schema}.product
        WHERE name = %s
        LIMIT 1;
    """

    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute(query, (product_name,))
        result = cursor.fetchone()

    return result["id"] if result else None
