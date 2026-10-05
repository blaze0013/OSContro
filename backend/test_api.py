import requests
print(requests.get('http://localhost:8000/api/health').json())
resp = requests.post('http://localhost:8000/api/analyze', data={'repository_url': 'https://github.com/foo/bar'})
print(resp.status_code)
print(resp.json())
