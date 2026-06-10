import json, os

base = r"c:\repos\legends\foundryvtt\packs\weaves\_source"

patches = {
    "fly.json":              [{"effectId": "Flight",          "params": {}}],
    "fortune-s-favor.json":  [{"effectId": "Fortune's Favor", "params": {}}],
    "confusion.json":        [{"effectId": "disoriented",     "params": {}}],
    "mental-domination.json":[{"effectId": "charmed",         "params": {}}],
    "suggestion.json":       [{"effectId": "charmed",         "params": {}}],
    "suggestion-mass.json":  [{"effectId": "charmed",         "params": {}}],
    "calm-emotions.json":    [{"effectId": "charmed",         "params": {}}],
    "cutting-words.json":    [{"effectId": "dazed",           "params": {}}],
    "light.json":            [{"effectId": "revealed",        "params": {}}],
}

for filename, effects in patches.items():
    path = os.path.join(base, filename)
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    data["system"]["appliesEffects"] = effects
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"Patched: {filename}")

print("Done.")
