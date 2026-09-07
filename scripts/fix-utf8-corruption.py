"""Fix broken UTF-8 sequences (0xC3 followed by ASCII '-') introduced by em-dash sweep."""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
MULTIPLY = b"\xc3\x97"  # ×
EN_DASH = b"\xe2\x80\x93"  # –


def fix_content(path: Path, data: bytes) -> bytes:
    if path.name == "public-posture.ts":
        data = data.replace(b"3\xc3-24", b"3" + EN_DASH + b"24")
        data = data.replace(b'akses admin \xc3-"', b"akses admin ditolak\"")
        return data
    return data.replace(b"\xc3-", MULTIPLY)


def main() -> None:
    changed: list[str] = []
    for path in ROOT.rglob("*"):
        if path.suffix not in {".ts", ".tsx", ".js", ".jsx", ".css", ".md"}:
            continue
        original = path.read_bytes()
        fixed = fix_content(path, original)
        if fixed != original:
            path.write_bytes(fixed)
            changed.append(str(path.relative_to(ROOT)))

    print(f"Fixed {len(changed)} file(s):")
    for rel in changed:
        print(f"  {rel}")

    broken = []
    for path in ROOT.rglob("*"):
        if path.suffix not in {".ts", ".tsx", ".js", ".jsx", ".css", ".md"}:
            continue
        data = path.read_bytes()
        for i, byte in enumerate(data):
            if byte == 0xC3 and i + 1 < len(data) and not (0x80 <= data[i + 1] <= 0xBF):
                broken.append((path, i))

    if broken:
        print(f"WARNING: {len(broken)} broken C3 sequence(s) remain")
        for path, idx in broken:
            print(f"  {path}:{idx}")
    else:
        print("No broken C3 sequences remain.")


if __name__ == "__main__":
    main()
