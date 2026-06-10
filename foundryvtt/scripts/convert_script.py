import re

light_indicators = ['bright light', 'dim light', 'sheds light', 'Illumination:', 'Continual Radiance', 'Continual Flame']

def convert(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        lines = content.split('\n')
        new_lines = []
        changed = 0
        for line in lines:
            is_light = any(p.lower() in line.lower() for p in light_indicators)
            if not is_light:
                new_line = re.sub(r'(\d+)-foot radius', r'\1-foot diameter', line)
                new_line = re.sub(r'within the radius\b', 'within the area', new_line)
                if new_line != line:
                    changed += 1
                new_lines.append(new_line)
            else:
                new_lines.append(line)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        print(f"{filepath}: {changed} lines changed")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

convert(r'c:\repos\legends\ttrpg\bestiary.md')
convert(r'c:\repos\legends\ttrpg\magic_items.md')
