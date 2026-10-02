#!/usr/bin/env python3
"""Run by systemd with the Stadione production environment, never log secrets."""
import json
import os
import urllib.request

request = urllib.request.Request(
    "http://127.0.0.1:3011/api/internal/cms/publish-due",
    data=b"{}",
    headers={
        "Host": "admin.stadione.pro",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + os.environ["CMS_WORKER_SECRET"],
    },
    method="POST",
)
with urllib.request.urlopen(request, timeout=175) as response:
    print(json.dumps(json.load(response)))
