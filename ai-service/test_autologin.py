from api_runner import run_api_tests

# Un seul test case simple pour valider juste l'auto-login
test_cases = [
    {
        "name": "Get single user",
        "method": "GET",
        "url": "https://reqres.in/api/users/2",
        "expect_status": 200,
        "expect_field": "data",
        "skip_auth": False,
        "category": "test",
        "priority": "high",
    }
]

result = run_api_tests(
    test_cases,
    token="",  # ← vide exprès pour forcer l'auto-login
    username="eve.holt@reqres.in",
    password="cityslicka",
    base_url="https://reqres.in",
)

print("\n" + "="*50)
print(f"Pass count: {result['pass_count']}")
print(f"Fail count: {result['fail_count']}")
for r in result["results"]:
    print(f"{r['status'].upper()} — {r['name']} — {r.get('reason','')}")