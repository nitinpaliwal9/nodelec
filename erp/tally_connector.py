# erp/tally_connector.py
#
# Talks to Tally's built-in XML HTTP gateway (enabled in Tally under
# Gateway of Tally > F1 (Help) > Settings > Connectivity, or in
# TallyPrime's equivalent), which listens on a local port (default
# 9000) and accepts POST requests with an XML "Collection" request,
# returning an XML response. No cloud account, no API key from Tally
# itself -- it's a raw protocol against software the distributor
# already runs on their own machine/network.

import re
import xml.etree.ElementTree as ET
from typing import List, Dict, Any

import requests

REQUEST_TIMEOUT_SECONDS = 15

# Fetches every stock item's name, rate, closing stock balance, and
# base unit of measure from the currently-open company.
STOCK_ITEM_EXPORT_REQUEST = """<ENVELOPE>
 <HEADER>
  <VERSION>1</VERSION>
  <TALLYREQUEST>Export</TALLYREQUEST>
  <TYPE>Collection</TYPE>
  <ID>NodelecStockItemCollection</ID>
 </HEADER>
 <BODY>
  <DESC>
   <STATICVARIABLES>
    <SVCURRENTCOMPANY>{company_name}</SVCURRENTCOMPANY>
   </STATICVARIABLES>
   <TDL>
    <TDLMESSAGE>
     <COLLECTION NAME="NodelecStockItemCollection" ISMODIFY="No">
      <TYPE>StockItem</TYPE>
      <FETCH>NAME, RATE, CLOSINGBALANCE, BASEUNITS</FETCH>
     </COLLECTION>
    </TDLMESSAGE>
   </TDL>
  </DESC>
 </BODY>
</ENVELOPE>"""


class TallyConnectionError(Exception):
    """Tally wasn't reachable at all -- not running, wrong host/port, gateway disabled."""


class TallyResponseError(Exception):
    """Tally responded, but the response wasn't a stock item export we could parse."""


def _sanitize_xml(raw_text: str) -> str:
    """
    Tally is well known for emitting XML with bare, unescaped "&"
    characters (e.g. inside company names like "Formax & Co") that
    aren't valid on their own. Escape any "&" that isn't already the
    start of a real entity before handing it to a strict XML parser.
    """

    return re.sub(r"&(?!amp;|lt;|gt;|quot;|apos;|#)", "&amp;", raw_text)


def _parse_rate(raw_rate: str) -> float:
    """
    Tally's RATE field commonly comes back as a combined
    "amount/unit" string, e.g. "45.50/Pcs" or "1,250/Nos" -- pull out
    just the leading numeric amount.
    """

    if not raw_rate:
        return 0.0

    numeric_part = raw_rate.split("/")[0].strip()
    numeric_part = numeric_part.replace(",", "")

    match = re.match(r"^-?\d+(\.\d+)?", numeric_part)

    if not match:
        return 0.0

    return float(match.group(0))


def _parse_int(raw_value: str) -> int:

    if not raw_value:
        return 0

    numeric_part = raw_value.split()[0] if raw_value.split() else raw_value
    numeric_part = re.sub(r"[^\d\-]", "", numeric_part.split("/")[0])

    if not numeric_part or numeric_part == "-":
        return 0

    try:
        return int(float(numeric_part))
    except ValueError:
        return 0


def fetch_stock_items(host: str, port: int, company_name: str) -> List[Dict[str, Any]]:
    """
    Returns a list of {name, rate, currency_unit, stock_quantity} for
    every stock item in the given Tally company. Raises
    TallyConnectionError / TallyResponseError on failure rather than
    letting a raw connection or parse exception bubble up.
    """

    url = f"http://{host}:{port}"

    request_xml = STOCK_ITEM_EXPORT_REQUEST.format(
        company_name=company_name
    )

    try:

        response = requests.post(
            url,
            data=request_xml.encode("utf-8"),
            headers={"Content-Type": "text/xml"},
            timeout=REQUEST_TIMEOUT_SECONDS
        )

    except requests.exceptions.ConnectionError as exc:

        raise TallyConnectionError(
            f"Could not reach Tally at {host}:{port} -- is Tally "
            f"running with the XML/HTTP gateway enabled? ({exc})"
        )

    except requests.exceptions.Timeout:

        raise TallyConnectionError(
            f"Tally at {host}:{port} did not respond within "
            f"{REQUEST_TIMEOUT_SECONDS}s"
        )

    if response.status_code != 200:

        raise TallyConnectionError(
            f"Tally at {host}:{port} returned HTTP {response.status_code}"
        )

    cleaned = _sanitize_xml(response.text)

    try:
        root = ET.fromstring(cleaned)
    except ET.ParseError as exc:
        raise TallyResponseError(
            f"Tally's response wasn't valid XML: {exc}"
        )

    stock_items = root.findall(".//STOCKITEM")

    if not stock_items:
        raise TallyResponseError(
            f"No <STOCKITEM> records found in Tally's response -- "
            f"check the company name ('{company_name}') is exactly "
            f"as it appears in Tally"
        )

    results = []

    for item in stock_items:

        name = item.get("NAME") or (item.findtext("NAME") or "").strip()

        if not name:
            continue

        rate_text = (item.findtext("RATE") or "").strip()
        balance_text = (item.findtext("CLOSINGBALANCE") or "").strip()
        base_unit = (item.findtext("BASEUNITS") or "").strip()

        results.append({
            "name": name,
            "rate": _parse_rate(rate_text),
            "unit": base_unit,
            "stock_quantity": _parse_int(balance_text)
        })

    return results
