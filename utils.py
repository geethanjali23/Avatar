# utils.py
import json
from pathlib import Path

def safe_load_json(path, default=None):
    p = Path(path)
    if not p.exists():
        return default if default is not None else {}
    try:
        with p.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default if default is not None else {}

def safe_save_json(path, data):
    p = Path(path)
    try:
        with p.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print("Failed to save json:", e)
        return False
