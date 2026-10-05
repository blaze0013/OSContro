import asyncio
from app.services.github import fetch_github_context

async def main():
    repos = [
        "https://github.com/tiangolo/fastapi", # valid large
        "https://github.com/psf/requests", # valid mid
        "https://github.com/invalidowner123/invalidrepo123" # invalid
    ]
    for url in repos:
        print(f"Testing {url}")
        try:
            ctx = await fetch_github_context(url)
            print("Success! Tree size:", len(ctx['tree']))
            print("Files fetched:", list(ctx['files'].keys()))
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
