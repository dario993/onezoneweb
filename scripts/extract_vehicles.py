#!/usr/bin/env python3
import csv
import json
import sys
from collections import defaultdict

CSV_PATH = '/Users/dario/Downloads/TAS_automobile.csv'
OUTPUT_PATH = '/Users/dario/Documents/ONEZONE_APP/onezoneweb_20251219/src/assets/vehicles.json'

vehicles: dict[str, set[str]] = defaultdict(set)

encodings = ['utf-8-sig', 'latin-1', 'cp1252']
encoding_used = None

for enc in encodings:
    try:
        with open(CSV_PATH, encoding=enc, newline='') as f:
            reader = csv.reader(f, delimiter=';')
            header = next(reader)
            make_idx = header.index('makeName')
            model_idx = header.index('commercialName')
            for row in reader:
                if len(row) <= max(make_idx, model_idx):
                    continue
                make = row[make_idx].strip().strip('"')
                model = row[model_idx].strip().strip('"')
                if make and model:
                    vehicles[make].add(model)
        encoding_used = enc
        break
    except (UnicodeDecodeError, ValueError):
        continue

if not encoding_used:
    print('Errore: nessun encoding funziona', file=sys.stderr)
    sys.exit(1)

result = {make: sorted(models) for make, models in sorted(vehicles.items())}

with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, separators=(',', ':'))

makes_count = len(result)
models_count = sum(len(m) for m in result.values())
print(f'Encoding: {encoding_used}')
print(f'Marche: {makes_count}')
print(f'Modelli totali (coppie uniche): {models_count}')
print(f'Output: {OUTPUT_PATH}')
