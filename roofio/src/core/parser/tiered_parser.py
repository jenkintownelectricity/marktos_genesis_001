"""
ROOFIO Document Parser - P2/P3 Tiered Extraction
================================================
P2: Python parsing (FREE, FAST) - Always try first
P3: AI parsing (Claude/Groq) - Only when P2 fails

Strategy: Extract maximum data with regex/rules before burning AI tokens.
"""

import re
import json
from typing import Any, Optional
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
import pdfplumber  # pip install pdfplumber
from datetime import datetime


class ParseTier(Enum):
    P2_PYTHON = "python"  # Free, fast, rule-based
    P3_AI = "ai"          # Paid, smart, fallback only


@dataclass
class ExtractedField:
    name: str
    value: Any
    confidence: float
    source_page: Optional[int] = None
    parse_tier: ParseTier = ParseTier.P2_PYTHON


@dataclass
class ParseResult:
    document_id: str
    document_type: str
    success: bool
    fields: list[ExtractedField] = field(default_factory=list)
    p2_extracted: int = 0  # Fields extracted by Python
    p3_extracted: int = 0  # Fields extracted by AI
    ai_tokens_used: int = 0
    errors: list[str] = field(default_factory=list)


# =============================================================================
# P2 PYTHON EXTRACTION PATTERNS (FREE)
# =============================================================================

class P2Patterns:
    """Regex patterns for common construction document fields."""

    # Currency: $1,234,567.89 or 1234567.89
    CURRENCY = r'\$?\s*([\d,]+\.?\d*)'

    # Square footage: 32,450 SF or 32450 sq ft
    SQUARE_FOOTAGE = r'([\d,]+)\s*(?:SF|sq\.?\s*ft\.?|square\s*feet)'

    # R-Value: R-30, R30, R-25
    R_VALUE = r'R-?\s*(\d+)'

    # Dates: 01/15/2025, January 15, 2025, 2025-01-15
    DATE_MDY = r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})'
    DATE_WRITTEN = r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})'
    DATE_ISO = r'(\d{4})-(\d{2})-(\d{2})'

    # Percentages: 10%, 10.5%
    PERCENTAGE = r'(\d+\.?\d*)\s*%'

    # Change Order Number: CO #1, CO-001, Change Order 1
    CO_NUMBER = r'(?:CO|Change\s*Order)\s*#?\s*-?\s*(\d+)'

    # Pay App Number: Pay App #1, Application No. 1
    PAY_APP_NUMBER = r'(?:Pay\s*App(?:lication)?|Application)\s*(?:#|No\.?)\s*(\d+)'

    # Warranty Years: 20 year, 20-year, 20yr
    WARRANTY_YEARS = r'(\d+)\s*-?\s*(?:year|yr)s?'

    # NDL/Material warranty types
    WARRANTY_TYPE = r'(NDL|No\s*Dollar\s*Limit|Material\s*Only|Labor\s*(?:and|&)\s*Material)'

    # Roof types
    ROOF_TYPE = r'(TPO|EPDM|PVC|BUR|Modified\s*Bit(?:umen)?|Metal|Standing\s*Seam)'

    # Submittal status
    SUBMITTAL_STATUS = r'(Approved|Approved\s*as\s*Noted|Revise\s*(?:and|&)\s*Resubmit|Rejected|Pending)'

    # Section numbers: 07 53 00, 075300
    SPEC_SECTION = r'(?:Section\s*)?(\d{2})\s*(\d{2})\s*(\d{2})'

    # Drawing numbers: A-101, S-001, R-1.1
    DRAWING_NUMBER = r'([A-Z])-?(\d+(?:\.\d+)?)'

    # Penetrations count
    PENETRATIONS = r'(\d+)\s*(?:penetration|curb|RTU|HVAC\s*unit)s?'

    # Drains count
    DRAINS = r'(\d+)\s*(?:drain|scupper|overflow)s?'

    # Slope: 1/4" per foot, 1/4:12
    SLOPE = r'(\d+/\d+)["\s]*(?:per\s*(?:foot|ft)|:\s*12)'

    # PSF: 60 psf, 90 PSF
    PSF = r'(\d+)\s*(?:psf|PSF|pounds?\s*per\s*square\s*foot)'

    # Mil thickness: 60 mil, 45mil
    MIL_THICKNESS = r'(\d+)\s*mil'

    # Retainage: 10% retainage
    RETAINAGE = r'(\d+\.?\d*)\s*%\s*(?:retainage|retention)'


class P2Extractor:
    """Python-based extractor - FREE and FAST."""

    def __init__(self):
        self.patterns = P2Patterns()

    def extract_text_from_pdf(self, file_path: str) -> tuple[str, int]:
        """Extract text from PDF, return (text, page_count)."""
        text_parts = []
        page_count = 0

        with pdfplumber.open(file_path) as pdf:
            page_count = len(pdf.pages)
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text_parts.append(page_text)

        return "\n\n".join(text_parts), page_count

    def extract_currency(self, text: str, field_name: str = "amount") -> Optional[ExtractedField]:
        """Extract currency value."""
        # Look for context clues first
        patterns = [
            (r'(?:contract\s*(?:sum|amount|price))[:\s]*' + P2Patterns.CURRENCY, "contract_sum"),
            (r'(?:total|amount)[:\s]*' + P2Patterns.CURRENCY, field_name),
            (P2Patterns.CURRENCY, field_name),
        ]

        for pattern, name in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value_str = match.group(1).replace(",", "")
                try:
                    value = float(value_str)
                    if value > 1000:  # Likely a real amount
                        return ExtractedField(
                            name=name,
                            value=value,
                            confidence=0.85,
                            parse_tier=ParseTier.P2_PYTHON
                        )
                except ValueError:
                    continue
        return None

    def extract_square_footage(self, text: str) -> Optional[ExtractedField]:
        """Extract square footage."""
        match = re.search(P2Patterns.SQUARE_FOOTAGE, text, re.IGNORECASE)
        if match:
            value = int(match.group(1).replace(",", ""))
            return ExtractedField(
                name="total_square_footage",
                value=value,
                confidence=0.90,
                parse_tier=ParseTier.P2_PYTHON
            )
        return None

    def extract_r_value(self, text: str) -> Optional[ExtractedField]:
        """Extract insulation R-value."""
        match = re.search(P2Patterns.R_VALUE, text, re.IGNORECASE)
        if match:
            return ExtractedField(
                name="insulation_r_value",
                value=f"R-{match.group(1)}",
                confidence=0.95,
                parse_tier=ParseTier.P2_PYTHON
            )
        return None

    def extract_roof_type(self, text: str) -> Optional[ExtractedField]:
        """Extract roof membrane type."""
        match = re.search(P2Patterns.ROOF_TYPE, text, re.IGNORECASE)
        if match:
            return ExtractedField(
                name="roof_type",
                value=match.group(1).upper(),
                confidence=0.95,
                parse_tier=ParseTier.P2_PYTHON
            )
        return None

    def extract_warranty(self, text: str) -> list[ExtractedField]:
        """Extract warranty information."""
        fields = []

        # Years
        match = re.search(P2Patterns.WARRANTY_YEARS, text, re.IGNORECASE)
        if match:
            fields.append(ExtractedField(
                name="warranty_years",
                value=int(match.group(1)),
                confidence=0.90,
                parse_tier=ParseTier.P2_PYTHON
            ))

        # Type
        match = re.search(P2Patterns.WARRANTY_TYPE, text, re.IGNORECASE)
        if match:
            wtype = match.group(1)
            if "NDL" in wtype.upper() or "NO DOLLAR" in wtype.upper():
                wtype = "NDL"
            elif "MATERIAL" in wtype.upper() and "LABOR" not in wtype.upper():
                wtype = "Material Only"
            else:
                wtype = "Labor & Material"

            fields.append(ExtractedField(
                name="warranty_type",
                value=wtype,
                confidence=0.85,
                parse_tier=ParseTier.P2_PYTHON
            ))

        return fields

    def extract_retainage(self, text: str) -> Optional[ExtractedField]:
        """Extract retainage percentage."""
        match = re.search(P2Patterns.RETAINAGE, text, re.IGNORECASE)
        if match:
            return ExtractedField(
                name="retainage_percent",
                value=float(match.group(1)),
                confidence=0.90,
                parse_tier=ParseTier.P2_PYTHON
            )
        return None

    def extract_dates(self, text: str) -> list[ExtractedField]:
        """Extract all dates found."""
        fields = []

        # Context patterns for specific date types
        date_contexts = [
            (r'(?:contract\s*date|dated)[:\s]*' + P2Patterns.DATE_MDY, "contract_date"),
            (r'(?:substantial\s*completion)[:\s]*' + P2Patterns.DATE_MDY, "substantial_completion"),
            (r'(?:final\s*completion)[:\s]*' + P2Patterns.DATE_MDY, "final_completion"),
            (r'(?:start\s*date|commence)[:\s]*' + P2Patterns.DATE_MDY, "start_date"),
        ]

        for pattern, name in date_contexts:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    month, day, year = match.groups()
                    if len(year) == 2:
                        year = "20" + year
                    date_str = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                    fields.append(ExtractedField(
                        name=name,
                        value=date_str,
                        confidence=0.85,
                        parse_tier=ParseTier.P2_PYTHON
                    ))
                except:
                    continue

        return fields

    def extract_co_number(self, text: str) -> Optional[ExtractedField]:
        """Extract change order number."""
        match = re.search(P2Patterns.CO_NUMBER, text, re.IGNORECASE)
        if match:
            return ExtractedField(
                name="co_number",
                value=int(match.group(1)),
                confidence=0.95,
                parse_tier=ParseTier.P2_PYTHON
            )
        return None

    def extract_pay_app_number(self, text: str) -> Optional[ExtractedField]:
        """Extract pay application number."""
        match = re.search(P2Patterns.PAY_APP_NUMBER, text, re.IGNORECASE)
        if match:
            return ExtractedField(
                name="application_number",
                value=int(match.group(1)),
                confidence=0.95,
                parse_tier=ParseTier.P2_PYTHON
            )
        return None

    def extract_all(self, text: str, doc_type: str) -> list[ExtractedField]:
        """Run all applicable extractors based on document type."""
        fields = []

        # Universal extractors
        extractors = [
            self.extract_currency,
            self.extract_dates,
        ]

        # Document-specific extractors
        if doc_type in ["scope", "contract"]:
            extractors.extend([
                self.extract_square_footage,
                self.extract_r_value,
                self.extract_roof_type,
                self.extract_warranty,
                self.extract_retainage,
            ])

        if doc_type == "change_order":
            extractors.append(self.extract_co_number)

        if doc_type == "pay_application":
            extractors.append(self.extract_pay_app_number)

        # Run extractors
        for extractor in extractors:
            result = extractor(text)
            if result:
                if isinstance(result, list):
                    fields.extend(result)
                else:
                    fields.append(result)

        return fields


# =============================================================================
# P3 AI EXTRACTION (PAID - USE SPARINGLY)
# =============================================================================

class P3AIExtractor:
    """AI-based extractor - Use only when P2 fails."""

    def __init__(self, provider: str = "claude"):
        self.provider = provider
        self.tokens_used = 0

    def extract_missing_fields(
        self,
        text: str,
        doc_type: str,
        existing_fields: list[ExtractedField],
        required_fields: list[str]
    ) -> list[ExtractedField]:
        """Extract only the fields that P2 couldn't get."""

        # Determine what's missing
        extracted_names = {f.name for f in existing_fields}
        missing = [f for f in required_fields if f not in extracted_names]

        if not missing:
            return []  # Nothing to extract, save tokens!

        # Build targeted prompt
        prompt = self._build_prompt(text, doc_type, missing)

        # Call AI (placeholder - implement actual API call)
        response = self._call_ai(prompt)

        # Parse response
        return self._parse_response(response, missing)

    def _build_prompt(self, text: str, doc_type: str, fields: list[str]) -> str:
        """Build minimal prompt for specific fields only."""
        field_list = "\n".join(f"- {f}" for f in fields)

        return f"""Extract ONLY these specific fields from the {doc_type} document.
Return JSON format: {{"field_name": "value", ...}}
If not found, use null.

FIELDS NEEDED:
{field_list}

DOCUMENT TEXT (truncated):
{text[:4000]}

JSON OUTPUT:"""

    def _call_ai(self, prompt: str) -> str:
        """Call AI API - implement based on provider."""
        # Placeholder - implement actual API call
        # self.tokens_used += len(prompt.split()) * 2  # Rough estimate
        print(f"[P3 AI] Would call {self.provider} with {len(prompt)} chars")
        return "{}"

    def _parse_response(self, response: str, field_names: list[str]) -> list[ExtractedField]:
        """Parse AI response into ExtractedField objects."""
        fields = []
        try:
            data = json.loads(response)
            for name in field_names:
                if name in data and data[name] is not None:
                    fields.append(ExtractedField(
                        name=name,
                        value=data[name],
                        confidence=0.80,  # AI confidence
                        parse_tier=ParseTier.P3_AI
                    ))
        except json.JSONDecodeError:
            pass
        return fields


# =============================================================================
# MAIN PARSER - TIERED APPROACH
# =============================================================================

class TieredParser:
    """
    P2 First (Python) → P3 Fallback (AI)
    Maximizes free extraction before using paid AI.
    """

    # Required fields per document type
    REQUIRED_FIELDS = {
        "contract": ["contract_sum", "contract_date", "retainage_percent"],
        "scope": ["total_square_footage", "roof_type", "insulation_r_value", "warranty_years"],
        "change_order": ["co_number", "amount", "description"],
        "pay_application": ["application_number", "total_completed_stored", "current_payment_due"],
        "drawing": ["drawing_number", "revision", "scale"],
        "submittal": ["submittal_number", "status", "manufacturer"],
    }

    def __init__(self, ai_provider: str = "claude"):
        self.p2 = P2Extractor()
        self.p3 = P3AIExtractor(provider=ai_provider)

    def parse(self, file_path: str, doc_type: str, document_id: str) -> ParseResult:
        """Parse document using P2 first, P3 only if needed."""

        result = ParseResult(
            document_id=document_id,
            document_type=doc_type,
            success=False
        )

        try:
            # Step 1: Extract text from PDF
            text, page_count = self.p2.extract_text_from_pdf(file_path)

            if not text.strip():
                result.errors.append("No text extracted from PDF - may need OCR")
                return result

            # Step 2: P2 Python extraction (FREE)
            p2_fields = self.p2.extract_all(text, doc_type)
            result.fields.extend(p2_fields)
            result.p2_extracted = len(p2_fields)

            print(f"[P2 Python] Extracted {len(p2_fields)} fields for FREE")

            # Step 3: Check if we need P3 AI
            required = self.REQUIRED_FIELDS.get(doc_type, [])
            extracted_names = {f.name for f in p2_fields}
            missing = [f for f in required if f not in extracted_names]

            if missing:
                print(f"[P3 AI] Need to extract {len(missing)} missing fields: {missing}")

                # P3 AI extraction (PAID - only missing fields)
                p3_fields = self.p3.extract_missing_fields(text, doc_type, p2_fields, required)
                result.fields.extend(p3_fields)
                result.p3_extracted = len(p3_fields)
                result.ai_tokens_used = self.p3.tokens_used
            else:
                print("[P3 AI] Skipped - P2 got everything!")

            result.success = True

        except Exception as e:
            result.errors.append(str(e))

        return result


# =============================================================================
# USAGE EXAMPLE
# =============================================================================

if __name__ == "__main__":
    # Example usage
    parser = TieredParser(ai_provider="claude")

    # Parse a scope document
    result = parser.parse(
        file_path="/path/to/scope.pdf",
        doc_type="scope",
        document_id="doc-001"
    )

    print(f"\n{'='*60}")
    print(f"Document: {result.document_id}")
    print(f"Type: {result.document_type}")
    print(f"Success: {result.success}")
    print(f"P2 (Python/Free): {result.p2_extracted} fields")
    print(f"P3 (AI/Paid): {result.p3_extracted} fields")
    print(f"AI Tokens Used: {result.ai_tokens_used}")
    print(f"{'='*60}")

    for field in result.fields:
        tier = "FREE" if field.parse_tier == ParseTier.P2_PYTHON else "PAID"
        print(f"  [{tier}] {field.name}: {field.value} (conf: {field.confidence})")
