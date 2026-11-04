#!/usr/bin/env python3
"""Build portable TabHero logos from the local OFL font and existing symbol.

Run with a Python environment containing fonttools. No network or external font
references are used in the resulting SVGs. Font license: see the existing
website/assets/fonts/BRICOLAGE-OFL.txt. Artwork: Klederson Bueno, 2026, MIT.
"""

from pathlib import Path
import xml.etree.ElementTree as ET

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


ROOT = Path(__file__).resolve().parent.parent
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)


def main():
    font = instantiateVariableFont(
        TTFont(ROOT / "website/assets/fonts/bricolage-grotesque.ttf"),
        {"wght": 800, "opsz": 96, "wdth": 100},
    )
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    outline = SVGPathPen(glyphs)
    bounds = BoundsPen(glyphs)
    cursor = 0
    for char in "tabhero.":
        glyph = glyphs[cmap[ord(char)]]
        matrix = (1, 0, 0, 1, cursor, 0)
        glyph.draw(TransformPen(outline, matrix))
        glyph.draw(TransformPen(bounds, matrix))
        cursor += glyph.width - 25

    xmin, ymin, xmax, ymax = bounds.bounds
    scale = 108 / (ymax - ymin)
    x = 154 - xmin * scale
    baseline = 10 + ymax * scale
    width = round(154 + (xmax - xmin) * scale + 4, 2)
    out = ROOT / "brand"
    out.mkdir(exist_ok=True)

    for filename, text_color, mono in (
        ("logo.svg", "#17231B", False),
        ("logo-mono.svg", "#17231B", True),
        ("logo-on-dark.svg", "#F7F7EF", False),
    ):
        svg = ET.Element(f"{{{NS}}}svg", {
            "viewBox": f"0 0 {width} 128", "role": "img",
            "aria-labelledby": "logo-title", "fill": "none",
        })
        ET.SubElement(svg, f"{{{NS}}}title", {"id": "logo-title"}).text = "TabHero"
        ET.SubElement(svg, f"{{{NS}}}desc").text = (
            "Browser tab with an arrow returning inside and the wordmark tabhero. "
            "Bricolage Grotesque 800 converted to outlines. Klederson Bueno, 2026."
        )
        symbol = ET.parse(ROOT / "website/assets/symbol.svg").getroot()
        for child in symbol:
            if child.tag.rsplit("}", 1)[-1] in ("title", "desc"):
                continue
            if mono and child.tag.rsplit("}", 1)[-1] == "rect":
                continue
            svg.append(child)
        ET.SubElement(svg, f"{{{NS}}}path", {
            "d": outline.getCommands(), "fill": text_color,
            "transform": f"matrix({scale:.8f} 0 0 {-scale:.8f} {x:.8f} {baseline:.8f})",
        })
        ET.indent(svg, space="  ")
        (out / filename).write_text(ET.tostring(svg, encoding="unicode") + "\n")
        print(f"Generated brand/{filename} ({width} × 128)")


if __name__ == "__main__":
    main()
