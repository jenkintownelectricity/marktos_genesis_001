"""
Quick test of the tiered parser with the ISOVER PDF
"""

import os
import sys

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from tiered_parser import TieredParser, ParseTier

def test_with_isover():
    """Test parser with the ISOVER FireProtect PDF."""

    # Find the PDF relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(script_dir, "..", "..", "..", ".."))
    pdf_path = os.path.join(repo_root, "ISOVER_FireProtect_HandBook_EN.pdf")

    if not os.path.exists(pdf_path):
        print(f"PDF not found at: {pdf_path}")
        print("Trying alternate path...")
        # Try Windows path
        pdf_path = r"D:\APP_CENTRAL\fire_proof_assistant\ISOVER_FireProtect_HandBook_EN.pdf"

    if not os.path.exists(pdf_path):
        print(f"PDF still not found. Please provide path as argument:")
        print(f"  python test_parser.py <path_to_pdf>")
        return

    print(f"Testing with: {pdf_path}")
    print("=" * 70)

    parser = TieredParser(ai_provider="claude")

    # Parse as a "specification" document (fire protection spec)
    result = parser.parse(
        file_path=pdf_path,
        doc_type="scope",  # Treat as scope for extraction
        document_id="isover-test-001"
    )

    print(f"\n{'=' * 70}")
    print(f"PARSE RESULTS")
    print(f"{'=' * 70}")
    print(f"Document ID: {result.document_id}")
    print(f"Document Type: {result.document_type}")
    print(f"Success: {result.success}")
    print(f"")
    print(f"P2 (Python/FREE):  {result.p2_extracted} fields extracted")
    print(f"P3 (AI/PAID):      {result.p3_extracted} fields extracted")
    print(f"AI Tokens Used:    {result.ai_tokens_used}")
    print(f"{'=' * 70}")

    if result.errors:
        print("\nERRORS:")
        for err in result.errors:
            print(f"  - {err}")

    if result.fields:
        print("\nEXTRACTED FIELDS:")
        print("-" * 70)
        for field in result.fields:
            tier = "FREE " if field.parse_tier == ParseTier.P2_PYTHON else "PAID$"
            conf = f"{field.confidence * 100:.0f}%"
            print(f"  [{tier}] {field.name:25} = {str(field.value):20} ({conf})")
    else:
        print("\nNo fields extracted.")
        print("This may be because:")
        print("  1. PDF text couldn't be extracted (scanned image?)")
        print("  2. No matching patterns found in the text")
        print("\nLet's see what text we got...")

        # Try to show some extracted text
        try:
            import pdfplumber
            with pdfplumber.open(pdf_path) as pdf:
                print(f"\nPDF has {len(pdf.pages)} pages")
                if pdf.pages:
                    text = pdf.pages[0].extract_text()
                    if text:
                        print(f"First 500 chars of page 1:")
                        print("-" * 40)
                        print(text[:500])
                    else:
                        print("No text on page 1 - may be scanned image")
        except Exception as e:
            print(f"Error reading PDF: {e}")


def test_with_custom_path(path: str):
    """Test with a custom PDF path."""
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    parser = TieredParser()
    result = parser.parse(file_path=path, doc_type="scope", document_id="custom-001")

    print(f"\nP2 (FREE): {result.p2_extracted} fields")
    print(f"P3 (PAID): {result.p3_extracted} fields")

    for f in result.fields:
        tier = "FREE" if f.parse_tier == ParseTier.P2_PYTHON else "PAID"
        print(f"  [{tier}] {f.name}: {f.value}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_with_custom_path(sys.argv[1])
    else:
        test_with_isover()
