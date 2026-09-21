#!/usr/bin/env python3
"""
Verification Script for Technical SEO Schema on quickartphotography.in
Checks all rules strictly:
- No "REPLACE" strings in any HTML file
- Exactly one @graph per page
- Valid JSON-LD syntax
- No forbidden schema types (HowTo, Product, JobPosting, SearchAction)
- No aggregateRating on Course nodes
- Person node (@id https://quickartphotography.in/#anil-sharma) present wherever referenced
- AggregateRating only on Org node on pages with visible reviews + maps link
- Verification output table: URL | schema types | errors
"""

import os
import glob
import json
import re

FORBIDDEN_TYPES = {"HowTo", "Product", "JobPosting", "SearchAction"}

def check_file(rel_path):
    errors = []
    types_found = []
    
    with open(rel_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Rule 1: No REPLACE strings anywhere in HTML
    if "REPLACE" in content:
        matches = re.findall(r'.{0,20}REPLACE.{0,20}', content)
        errors.append(f"Contains placeholder 'REPLACE': {matches[:2]}")

    # Excluded files should have NO JSON-LD
    excluded_files = {
        "404.html",
        "admin.html",
        "adobe-premiere-pro-course/index.html",
        "best-davinci-resolve-online-course-in-hindi/index.html",
        "courses/graphic-design/index.html",
        "join-video-editing-album-design-course/index.html",
        "master-class/live.html",
        "portal/email-template-preview.html",
        "portal/index.html",
        "portal/signup.html",
        "thank-you/index.html",
        "watch/index.html"
    }

    scripts = re.findall(r'<script\s+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', content, re.DOTALL)

    if rel_path in excluded_files:
        if scripts:
            errors.append("Excluded file should NOT contain JSON-LD schema")
        return {
            "file": rel_path,
            "types": ["(none - non-indexable/redirect)"],
            "errors": errors
        }

    # Should have exactly ONE script tag
    if len(scripts) == 0:
        errors.append("No JSON-LD schema found")
        return {"file": rel_path, "types": [], "errors": errors}
    elif len(scripts) > 1:
        errors.append(f"Multiple JSON-LD script tags found ({len(scripts)})")

    for s in scripts:
        try:
            data = json.loads(s)
        except Exception as e:
            errors.append(f"Invalid JSON: {e}")
            continue

        if not isinstance(data, dict):
            errors.append("Schema root is not an object")
            continue

        if "@context" not in data or "schema.org" not in data["@context"]:
            errors.append("Missing or invalid @context")

        if "@graph" not in data or not isinstance(data["@graph"], list):
            errors.append("Missing @graph array")
            continue

        graph = data["@graph"]
        ids = {n.get("@id") for n in graph if isinstance(n, dict) and "@id" in n}

        for node in graph:
            if not isinstance(node, dict):
                continue
            ntype = node.get("@type")
            if isinstance(ntype, list):
                types_found.extend(ntype)
                for t in ntype:
                    if t in FORBIDDEN_TYPES:
                        errors.append(f"Forbidden schema type: {t}")
            elif isinstance(ntype, str):
                types_found.append(ntype)
                if ntype in FORBIDDEN_TYPES:
                    errors.append(f"Forbidden schema type: {ntype}")

            # Check Course nodes
            if ntype == "Course" or (isinstance(ntype, list) and "Course" in ntype):
                if "aggregateRating" in node:
                    errors.append("Course node contains forbidden aggregateRating")

            # Check Org nodes
            if ntype == "EducationalOrganization" or (isinstance(ntype, list) and "EducationalOrganization" in ntype):
                if "aggregateRating" in node:
                    # Verify page has visible reviews & maps link
                    if "4.9" not in content or "1,800" not in content or "maps.app.goo.gl" not in content:
                        errors.append("Org node has aggregateRating but page lacks visible 4.9 / 1800 reviews + Google Maps link")

            # Check Person node reference
            # If anil-sharma is referenced, the full Person node must be in @graph
            node_str = json.dumps(node)
            if "https://quickartphotography.in/#anil-sharma" in node_str and node.get("@id") != "https://quickartphotography.in/#anil-sharma":
                if "https://quickartphotography.in/#anil-sharma" not in ids:
                    errors.append("Anil Sharma Person node referenced by @id but missing from @graph")

    types_unique = sorted(list(set(types_found)))
    return {
        "file": rel_path,
        "types": types_unique,
        "errors": errors
    }

def main():
    files = sorted(glob.glob("**/*.html", recursive=True))
    results = []
    total_errors = 0

    print("| Page URL | Schema Types | Status / Errors |")
    print("| :--- | :--- | :--- |")

    for f in files:
        res = check_file(f)
        results.append(res)
        types_str = ", ".join(res["types"]) if res["types"] else "None"
        err_str = "OK (0 errors)" if not res["errors"] else "; ".join(res["errors"])
        if res["errors"]:
            total_errors += len(res["errors"])
        url = f"https://quickartphotography.in/{f.replace('index.html', '')}" if f != "index.html" else "https://quickartphotography.in/"
        print(f"| {url} | {types_str} | {err_str} |")

    print("\n" + "="*50)
    print(f"Verification Finished. Checked {len(files)} files. Total errors found: {total_errors}")
    print("="*50)

if __name__ == "__main__":
    main()
