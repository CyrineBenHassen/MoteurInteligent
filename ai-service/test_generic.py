from api_generator import generate_api_tests

# Doc fictif — une "autre app" complètement différente d'ANPE
fake_doc = """
API Documentation - BookStore App

Endpoints:
GET /api/books - List all books
GET /api/books/{id} - Get book details
POST /api/books - Create a new book (requires: title, author, price)
GET /api/categories - List all categories
POST /api/auth/login - Login (requires: email, password)
"""

result = generate_api_tests(
    base_url="https://fake-bookstore-app.com",
    username="test@test.com",
    password="testpass123",
    framework="Postman",
    domains=[],  # ← vide exprès pour forcer le passage par le LLM (pas KNOWN_ENDPOINTS)
    original_url="https://fake-bookstore-app.com/books",
    doc_text=fake_doc,
)

print("\n" + "="*60)
print("TEST CASES GÉNÉRÉS :")
print("="*60)
for tc in result.get("test_cases", []):
    print(f"{tc['method']:6} {tc['path']:40} | {tc['name']}")

print(f"\nTotal: {len(result.get('test_cases', []))} test cases")