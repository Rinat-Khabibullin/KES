#!/usr/bin/env python3
"""Extract and validate the electrician price catalog from the owner's XLSX file.

The script intentionally uses only the Python standard library so no Excel parser
can accidentally enter the frontend bundle.

Usage:
  python3 scripts/extract-price-catalog.py "/path/to/смета_электромонтаж_полная.xlsx"
"""

from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

MAIN_NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def cell_column(ref: str) -> int:
    letters = "".join(char for char in ref if char.isalpha())
    total = 0
    for char in letters:
        total = total * 26 + (ord(char.upper()) - 64)
    return total


def read_shared_strings(archive: ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []

    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    strings: list[str] = []
    for item in root.findall("m:si", MAIN_NS):
        strings.append("".join(text.text or "" for text in item.findall(".//m:t", MAIN_NS)))
    return strings


def read_cell(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.get("t")
    if cell_type == "s":
        value = cell.find("m:v", MAIN_NS)
        return shared_strings[int(value.text)] if value is not None and value.text is not None else ""

    if cell_type == "inlineStr":
        return "".join(text.text or "" for text in cell.findall(".//m:t", MAIN_NS))

    value = cell.find("m:v", MAIN_NS)
    return value.text if value is not None and value.text is not None else ""


def read_rows(path: Path) -> list[dict[int, str]]:
    with ZipFile(path) as archive:
        shared_strings = read_shared_strings(archive)
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        rows: list[dict[int, str]] = []

        for row in sheet.findall(".//m:sheetData/m:row", MAIN_NS):
            values: dict[int, str] = {}
            for cell in row.findall("m:c", MAIN_NS):
                value = read_cell(cell, shared_strings).strip()
                if value:
                    values[cell_column(cell.get("r", "A"))] = value
            if values:
                rows.append(values)

        return rows


def extract_catalog(path: Path) -> dict[str, object]:
    categories: list[dict[str, object]] = []
    services: list[dict[str, object]] = []
    current_category: str | None = None

    for row in read_rows(path):
        first_cell = row.get(1, "")
        category_match = re.fullmatch(r"(\d+)\.\s+(.+)", first_cell)
        if category_match:
            current_category = category_match.group(2)
            categories.append({"number": int(category_match.group(1)), "title": current_category})
            continue

        if first_cell.isdigit() and current_category:
            services.append(
                {
                    "legacyNumber": int(first_cell),
                    "category": current_category,
                    "name": row.get(2, ""),
                    "unit": row.get(3, ""),
                    "price": int(float(row.get(5, "0"))),
                }
            )

    numbers = [service["legacyNumber"] for service in services]
    expected_numbers = list(range(1, 115))
    errors: list[str] = []

    if len(services) != 114:
        errors.append(f"Expected 114 services, got {len(services)}")
    if len(categories) != 11:
        errors.append(f"Expected 11 categories, got {len(categories)}")
    if numbers != expected_numbers:
        errors.append("Service numbers are not exactly 1..114")
    if len(set(numbers)) != len(numbers):
        errors.append("Duplicate service numbers found")

    return {
      "source": str(path),
      "categories": categories,
      "services": services,
      "errors": errors,
    }


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__.strip(), file=sys.stderr)
        return 2

    path = Path(sys.argv[1]).expanduser()
    if not path.exists():
        print(f"File not found: {path}", file=sys.stderr)
        return 2

    catalog = extract_catalog(path)
    print(json.dumps(catalog, ensure_ascii=False, indent=2))
    return 1 if catalog["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
