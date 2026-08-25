#!/usr/bin/env python3
"""
Nodelec Tally Agent
====================

Runs on the same machine/network as your Tally installation, reads
your stock items straight from Tally's own local XML/HTTP gateway,
and pushes them to your Nodelec catalog. This exists because Nodelec's
servers generally cannot reach into your local network to pull from
Tally directly -- this script does the opposite: it reaches Tally
locally, then pushes out to Nodelec over HTTPS.

SETUP (one time)
-----------------
1. In Tally, enable the gateway: F1 (Help) > Settings > Connectivity
   > Client/Server configuration > set "TCP/IP Port" (default 9000)
   and turn on "Enable ODBC"/HTTP-XML access (menu wording varies by
   Tally version -- TallyPrime calls this the same thing under
   Help > Settings > Connectivity).
2. Install the one dependency this script needs:
       pip install requests
3. Get your Tally Agent Key from the Nodelec dashboard
   (Integrations > ERP & Inventory Synchronization > Tally), and your
   Tally company's exact name as it appears inside Tally.
4. Run it:
       python nodelec_tally_agent.py \\
           --agent-key nkta_xxxxxxxxxxxxxxxxxxxxx \\
           --company "Formax Electronics" \\
           --tally-host localhost --tally-port 9000

Or set the equivalent environment variables (NODELEC_TALLY_AGENT_KEY,
NODELEC_TALLY_COMPANY, NODELEC_TALLY_HOST, NODELEC_TALLY_PORT,
NODELEC_API_URL) and just run `python nodelec_tally_agent.py` --
useful for scheduling this as a recurring Windows Task.

This script only reads from Tally (a Collection/Export request) and
only writes to Nodelec's push endpoint -- it never writes anything
back into Tally.
"""

import os
import re
import sys
import argparse
import xml.etree.ElementTree as ET

import requests

DEFAULT_API_URL = "https://nodelec.in"
REQUEST_TIMEOUT_SECONDS = 15

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


def _sanitize_xml(raw_text):
    # Tally commonly emits bare, unescaped "&" (e.g. "Formax & Co").
    return re.sub(r"&(?!amp;|lt;|gt;|quot;|apos;|#)", "&amp;", raw_text)


def _parse_rate(raw_rate):
    if not raw_rate:
        return 0.0
    numeric_part = raw_rate.split("/")[0].strip().replace(",", "")
    match = re.match(r"^-?\d+(\.\d+)?", numeric_part)
    return float(match.group(0)) if match else 0.0


def _parse_int(raw_value):
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


def fetch_stock_items_from_tally(host, port, company_name):
    """Returns [{name, rate, stock_quantity}, ...] read live from Tally."""

    url = f"http://{host}:{port}"
    request_xml = STOCK_ITEM_EXPORT_REQUEST.format(company_name=company_name)

    try:
        response = requests.post(
            url,
            data=request_xml.encode("utf-8"),
            headers={"Content-Type": "text/xml"},
            timeout=REQUEST_TIMEOUT_SECONDS
        )
    except requests.exceptions.ConnectionError as exc:
        sys.exit(
            f"Could not reach Tally at {host}:{port} -- is Tally running "
            f"with the XML/HTTP gateway enabled? ({exc})"
        )
    except requests.exceptions.Timeout:
        sys.exit(f"Tally at {host}:{port} did not respond within {REQUEST_TIMEOUT_SECONDS}s")

    if response.status_code != 200:
        sys.exit(f"Tally at {host}:{port} returned HTTP {response.status_code}")

    try:
        root = ET.fromstring(_sanitize_xml(response.text))
    except ET.ParseError as exc:
        sys.exit(f"Tally's response wasn't valid XML: {exc}")

    stock_items = root.findall(".//STOCKITEM")

    if not stock_items:
        sys.exit(
            f"No <STOCKITEM> records found -- check the company name "
            f"('{company_name}') is exactly as it appears in Tally"
        )

    results = []
    for item in stock_items:
        name = item.get("NAME") or (item.findtext("NAME") or "").strip()
        if not name:
            continue
        results.append({
            "name": name,
            "rate": _parse_rate((item.findtext("RATE") or "").strip()),
            "stock_quantity": _parse_int((item.findtext("CLOSINGBALANCE") or "").strip())
        })

    return results


def push_to_nodelec(api_url, agent_key, stock_items):
    """POSTs the stock item list to Nodelec, authenticated by agent key."""

    response = requests.post(
        f"{api_url}/api/integrations/erp/tally-agent/push",
        json={"stock_items": stock_items},
        headers={"X-Tally-Agent-Key": agent_key},
        timeout=60
    )

    if response.status_code == 401:
        sys.exit(
            "Nodelec rejected this agent key (401). It may have been "
            "regenerated from the dashboard since this script was set "
            "up -- get the current key from Integrations > ERP & "
            "Inventory Synchronization > Tally."
        )

    if not response.ok:
        sys.exit(f"Nodelec push failed: HTTP {response.status_code} -- {response.text}")

    return response.json()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--agent-key", default=os.getenv("NODELEC_TALLY_AGENT_KEY"), help="Tally Agent Key from the Nodelec dashboard")
    parser.add_argument("--company", default=os.getenv("NODELEC_TALLY_COMPANY"), help="Exact company name as it appears in Tally")
    parser.add_argument("--tally-host", default=os.getenv("NODELEC_TALLY_HOST", "localhost"))
    parser.add_argument("--tally-port", type=int, default=int(os.getenv("NODELEC_TALLY_PORT", "9000")))
    parser.add_argument("--api-url", default=os.getenv("NODELEC_API_URL", DEFAULT_API_URL))
    args = parser.parse_args()

    if not args.agent_key:
        sys.exit("Missing --agent-key (or NODELEC_TALLY_AGENT_KEY env var)")
    if not args.company:
        sys.exit("Missing --company (or NODELEC_TALLY_COMPANY env var)")

    print(f"Reading stock items from Tally at {args.tally_host}:{args.tally_port} (company: {args.company})...")
    stock_items = fetch_stock_items_from_tally(args.tally_host, args.tally_port, args.company)
    print(f"  found {len(stock_items)} stock items")

    print(f"Pushing to {args.api_url}...")
    result = push_to_nodelec(args.api_url, args.agent_key, stock_items)

    print("Done.")
    print(f"  items seen:        {result.get('tally_items_seen')}")
    print(f"  priced (total):    {result.get('matched_to_catalog')}")
    print(f"    new to catalog:  {result.get('created_from_erp')}")
    print(f"  skipped (no name): {result.get('unmatched')}")


if __name__ == "__main__":
    main()
