#!/usr/bin/env python3
"""Refresh the Stadione sports trend pool without logging credentials."""
import json
import os
import urllib.request

request = urllib.request.Request(
    "http://127.0.0.1:3011/api/internal/cms/sync-trends",
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
