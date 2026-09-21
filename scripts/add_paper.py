#!/usr/bin/env python3
"""
add_paper.py — add a publication to data/publications.json

Fetches title / authors / venue / year automatically from a DOI (Crossref) or an
arXiv id (arXiv API), asks you for the few things it cannot know (short venue
name, tags, links, one-line description), and appends the entry to the JSON.
Nothing else on the site needs editing: publications.html renders the JSON.

Usage (run from the website folder):
    python3 scripts/add_paper.py --doi 10.1145/3613904.3642000
    python3 scripts/add_paper.py --arxiv 2310.04869
    python3 scripts/add_paper.py --manual            # type everything in by hand
    python3 scripts/add_paper.py --check             # validate the JSON, print a summary

Options:
    --dry-run      show the entry that would be added without writing the file
    --yes          accept all defaults without prompting (good for scripts)

Only the Python standard library is used (Python 3.8+).
"""
import argparse, json, re, sys, urllib.request, urllib.error, urllib.parse, xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JSON_PATH = ROOT / "data" / "publications.json"
UA = {"User-Agent": "LUNA-lab-website add_paper.py (mailto:yue.jiang@utah.edu)"}


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        sys.exit(f"Lookup failed ({e.code}) for {url}\n  Check the id, or add the paper with --manual.")
    except urllib.error.URLError as e:
        sys.exit(f"Could not reach {url} ({e.reason}).\n  Are you online / behind a proxy? You can still add the paper with --manual.")


def from_doi(doi):
    doi = doi.strip().replace("https://doi.org/", "").replace("doi:", "")
    data = json.loads(fetch(f"https://api.crossref.org/works/{urllib.parse.quote(doi)}"))["message"]
    title = " ".join(data.get("title", [""])[0].split())
    authors = [f"{a.get('given','')} {a.get('family','')}".strip() for a in data.get("author", [])]
    venue_long = (data.get("container-title") or data.get("event", {}).get("name") or [""])
    venue_long = venue_long[0] if isinstance(venue_long, list) else venue_long
    date = (data.get("published-print") or data.get("published-online") or data.get("issued") or {}).get("date-parts", [[None]])[0]
    year = date[0] if date else None
    return {"title": title, "authors": authors, "venue_type": venue_long, "year": year,
            "links": [{"label": "Paper", "url": f"https://doi.org/{doi}"}]}


def from_arxiv(arxiv_id):
    arxiv_id = re.sub(r"^(https?://)?arxiv\.org/(abs|pdf)/", "", arxiv_id.strip()).replace(".pdf", "")
    xml = fetch(f"http://export.arxiv.org/api/query?id_list={urllib.parse.quote(arxiv_id)}")
    ns = {"a": "http://www.w3.org/2005/Atom"}
    entry = ET.fromstring(xml).find("a:entry", ns)
    if entry is None or entry.find("a:title", ns) is None:
        sys.exit(f"arXiv id not found: {arxiv_id}")
    title = " ".join(entry.find("a:title", ns).text.split())
    authors = [a.find("a:name", ns).text for a in entry.findall("a:author", ns)]
    year = int(entry.find("a:published", ns).text[:4])
    return {"title": title, "authors": authors, "venue_type": "arXiv preprint", "year": year,
            "links": [{"label": "Paper", "url": f"https://arxiv.org/abs/{arxiv_id}"}]}


def ask(prompt, default="", yes=False):
    if yes:
        return default
    shown = f" [{default}]" if default else ""
    val = input(f"{prompt}{shown}: ").strip()
    return val or default


def slug(title):
    words = re.findall(r"[a-z0-9]+", title.lower())
    return "-".join(words[:3]) or "paper"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--doi"); g.add_argument("--arxiv"); g.add_argument("--manual", action="store_true")
    g.add_argument("--check", action="store_true")
    ap.add_argument("--dry-run", action="store_true"); ap.add_argument("--yes", action="store_true")
    args = ap.parse_args()

    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    pubs = data.setdefault("publications", [])

    if args.check:
        ids = [p.get("id") for p in pubs]
        dup = {i for i in ids if ids.count(i) > 1}
        for p in pubs:
            missing = [k for k in ("id", "title", "authors", "venue", "year") if not p.get(k)]
            if missing: print(f"  ! {p.get('id') or p.get('title')}: missing {missing}")
        if dup: print(f"  ! duplicate ids: {dup}")
        print(f"{len(pubs)} publications, years {min(p['year'] for p in pubs)}–{max(p['year'] for p in pubs)}. "
              f"{'OK' if not dup else 'Fix the duplicates above.'}")
        return

    meta = {"title": "", "authors": [], "venue_type": "", "year": None, "links": []}
    if args.doi:      meta.update(from_doi(args.doi))
    elif args.arxiv:  meta.update(from_arxiv(args.arxiv))
    elif not args.manual:
        ap.print_help(); return

    print("\nFill in the details (press Enter to keep the value in brackets).\n")
    title = ask("Title", meta["title"], args.yes)
    authors = ask("Authors, comma-separated (add * for equal contribution)", ", ".join(meta["authors"]), args.yes)
    authors = [a.strip() for a in authors.split(",") if a.strip()]
    year = int(ask("Year", str(meta["year"] or ""), args.yes) or 0)
    venue = ask("Short venue name shown in red, e.g. CHI 2026", f"{meta['venue_type'].split()[0] if meta['venue_type'] else ''} {year}".strip(), args.yes)
    venue_type = ask("Venue type / series, e.g. ACM CHI, TVCG Paper, Workshop", meta["venue_type"], args.yes)
    desc = ask("One-sentence description (optional)", "", args.yes)
    tags = ask("Tags, comma-separated", "", args.yes)
    tags = [t.strip() for t in tags.split(",") if t.strip()]
    links = list(meta["links"])
    if not args.yes:
        print("Links — label and URL, e.g.  Code https://github.com/...   (empty line to finish)")
        while True:
            line = input("  link: ").strip()
            if not line: break
            parts = line.split(None, 1)
            if len(parts) == 2: links.append({"label": parts[0], "url": parts[1]})
    note = ask("Note under authors, e.g. *Equal Contribution (optional)", "", args.yes)
    pid = ask("Short id (letters/digits/hyphens)", slug(title), args.yes)
    if any(p.get("id") == pid for p in pubs):
        sys.exit(f"An entry with id '{pid}' already exists — choose another id.")

    entry = {"id": pid, "title": title, "authors": authors, "note": note or None, "venue": venue,
             "venue_type": venue_type, "year": year, "description": desc, "links": links, "tags": tags, "thumb": ""}
    print("\n" + json.dumps(entry, indent=2, ensure_ascii=False))
    if args.dry_run:
        print("\n(dry run — nothing written)"); return

    # newest first: insert before the first entry with an older or equal year
    pos = next((i for i, p in enumerate(pubs) if p.get("year", 0) <= year), len(pubs))
    pubs.insert(pos, entry)
    JSON_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nAdded to {JSON_PATH.relative_to(ROOT)}. Open publications.html to check, then commit & push.")


if __name__ == "__main__":
    main()
