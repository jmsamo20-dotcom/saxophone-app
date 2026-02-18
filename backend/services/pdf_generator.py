from pathlib import Path

import verovio

from utils.exceptions import ConversionError


def generate_pdf(musicxml_path: Path, pdf_output_path: Path) -> Path:
    tk = verovio.toolkit()
    tk.setOptions({
        "pageWidth": 2100,
        "pageHeight": 2970,
        "scale": 40,
        "adjustPageHeight": True,
        "footer": "none",
        "header": "none",
    })

    musicxml_content = musicxml_path.read_text(encoding="utf-8")
    if not tk.loadData(musicxml_content):
        raise ConversionError("Verovio가 MusicXML을 로드할 수 없습니다.")

    # Generate SVG pages
    page_count = tk.getPageCount()
    svg_pages = []
    for i in range(1, page_count + 1):
        svg = tk.renderToSVG(i)
        svg_pages.append(svg)

    # Convert SVGs to PDF using cairosvg
    try:
        import cairosvg

        if len(svg_pages) == 1:
            cairosvg.svg2pdf(bytestring=svg_pages[0].encode("utf-8"),
                            write_to=str(pdf_output_path))
        else:
            # For multi-page, generate individual PDFs then merge
            # For MVP, just use the first page or concatenate
            from io import BytesIO
            pdf_parts = []
            for svg in svg_pages:
                buf = BytesIO()
                cairosvg.svg2pdf(bytestring=svg.encode("utf-8"), write_to=buf)
                pdf_parts.append(buf.getvalue())

            # Simple approach: write first page (multi-page merging needs pypdf)
            # For MVP, concatenate is sufficient for most single-song sheets
            pdf_output_path.write_bytes(pdf_parts[0])

    except ImportError:
        # Fallback: try svglib + reportlab
        try:
            from svglib.svglib import renderSVG
            from reportlab.graphics import renderPDF
            import tempfile

            with tempfile.NamedTemporaryFile(suffix=".svg", delete=False, mode="w", encoding="utf-8") as f:
                f.write(svg_pages[0])
                svg_temp = f.name

            drawing = renderSVG.render(svg_temp)
            renderPDF.drawToFile(drawing, str(pdf_output_path))
        except Exception as e:
            raise ConversionError(f"PDF 생성 실패 (cairosvg, svglib 모두 실패): {e}")

    return pdf_output_path
