#!/usr/bin/env python3
"""Recover current/missed slots into editor review; never publish."""
import json, os, urllib.request
request=urllib.request.Request("http://127.0.0.1:3011/api/internal/cms/generate",data=b"{}",headers={"Host":"admin.stadione.pro","Content-Type":"application/json","Authorization":"Bearer "+os.environ["CMS_WORKER_SECRET"]},method="POST")
with urllib.request.urlopen(request,timeout=900) as response:
 print(json.dumps(json.load(response)))
