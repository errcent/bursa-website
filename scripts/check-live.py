import re
import urllib.request

URLS = [
    "https://bursanalar.com",
    "https://bursanalar-git-master-errcent1.vercel.app",
    "https://bursanalar-gxzdiy6e4-errcent1.vercel.app",
]

for url in URLS:
    html = urllib.request.urlopen(url, timeout=30).read().decode("utf-8", "replace")
    print(f"=== {url}")
    print("  Jadi Mentor:", "Jadi Mentor" in html)
    print("  Bursa Note:", "Bursa Note" in html)
    print("  /lab in page:", "/lab" in html)
    print("  /note links:", len(re.findall(r'href="/note"', html)))
