# app_ui.py

import io
import time
import requests
import pandas as pd
import streamlit as st

# ==========================================================
# PAGE CONFIG
# ==========================================================

st.set_page_config(
    page_title="Nodelec BOM Matcher",
    layout="wide"
)

FASTAPI_URL = "http://localhost:8000"

# ==========================================================
# HEADER
# ==========================================================

st.title("🔌 Nodelec B2B BOM Matcher Engine")
st.caption(
    "Internal Quotation & Component Matching Portal"
)

st.divider()

# ==========================================================
# SIDEBAR
# ==========================================================

st.sidebar.header("Upload Configuration")

api_key = st.sidebar.text_input(
    "API Key",
    type="password",
    help="Issued via manage_api_keys.py issue-key <organization_id>"
)

distributor_id = st.sidebar.text_input(
    "Sales Employee ID",
    value="EMP_DELHI_01"
)

st.sidebar.markdown(
    """
### Workflow

1. Upload customer BOM
2. System parses spreadsheet
3. Components are matched
4. Review exact/fuzzy/unmatched parts
5. Export quotation sheet
"""
)

# ==========================================================
# FILE UPLOAD
# ==========================================================

uploaded_file = st.file_uploader(
    "Upload BOM Spreadsheet",
    type=["csv", "xlsx", "xls"]
)

if uploaded_file and not api_key:

    st.error("Enter an API key in the sidebar before uploading.")

    st.stop()

if uploaded_file:

    auth_headers = {
        "Authorization": f"Bearer {api_key}"
    }

    st.info("Uploading BOM...")

    file_bytes = uploaded_file.getvalue()

    files = {
        "file": (
            uploaded_file.name,
            file_bytes,
            uploaded_file.type
        )
    }

    data = {
        "distributor_id": distributor_id
    }

    try:

        upload_response = requests.post(
            f"{FASTAPI_URL}/api/bom/upload",
            files=files,
            data=data,
            headers=auth_headers
        )

        if upload_response.status_code != 200:

            st.error(
                f"Upload failed:\n\n"
                f"{upload_response.text}"
            )

            st.stop()

        upload_data = upload_response.json()

        file_id = upload_data["file_id"]

        st.success(
            f"Upload accepted. "
            f"File ID: {file_id}"
        )

        status_placeholder = st.empty()

        progress_bar = st.progress(0)

        # ==================================================
        # POLLING LOOP
        # ==================================================

        while True:

            status_response = requests.get(
                f"{FASTAPI_URL}/api/bom/status/{file_id}",
                headers=auth_headers
            )

            if status_response.status_code != 200:

                st.error(
                    "Failed to retrieve processing status."
                )

                break

            payload = status_response.json()

            status = payload.get(
                "status",
                "unknown"
            )

            status_placeholder.markdown(
                f"### Current Status: `{status.upper()}`"
            )

            if status == "pending":
                progress_bar.progress(15)

            elif status == "processing":
                progress_bar.progress(65)

            elif status == "completed":

                progress_bar.progress(100)

                st.success(
                    "Pipeline completed successfully."
                )

                # ======================================
                # SUMMARY
                # ======================================

                summary = payload.get(
                    "summary",
                    {}
                )

                st.subheader(
                    "📊 Processing Summary"
                )

                c1, c2, c3, c4, c5 = st.columns(5)

                c1.metric(
                    "Rows",
                    summary.get(
                        "rows_processed",
                        0
                    )
                )

                c2.metric(
                    "Exact",
                    summary.get(
                        "exact_matches",
                        0
                    )
                )

                c3.metric(
                    "Fuzzy",
                    summary.get(
                        "fuzzy_matches",
                        0
                    )
                )

                c4.metric(
                    "Unmatched",
                    summary.get(
                        "unmatched",
                        0
                    )
                )

                c5.metric(
                    "Errors",
                    summary.get(
                        "errors",
                        0
                    )
                )

                st.divider()

                # ======================================
                # MATCHES
                # ======================================

                matches = payload.get(
                    "matches",
                    []
                )

                if matches:

                    st.subheader(
                        "✅ Matched Components"
                    )

                    matches_df = pd.DataFrame(
                        matches
                    )

                    st.dataframe(
                        matches_df,
                        width="stretch"
                    )

                # ======================================
                # UNMATCHED
                # ======================================

                unmatched = payload.get(
                    "unmatched_parts",
                    []
                )

                if unmatched:

                    st.subheader(
                        "⚠️ Unmatched Components"
                    )

                    unmatched_df = pd.DataFrame(
                        unmatched
                    )

                    st.dataframe(
                        unmatched_df,
                        width="stretch"
                    )

                # ======================================
                # ERRORS
                # ======================================

                errors = payload.get(
                    "processing_errors",
                    []
                )

                if errors:

                    st.subheader(
                        "🚨 Processing Errors"
                    )

                    errors_df = pd.DataFrame(
                        errors
                    )

                    st.dataframe(
                        errors_df,
                        width="stretch"
                    )

                # ======================================
                # EXPORT
                # ======================================

                if matches:

                    st.divider()

                    st.subheader(
                        "📦 Export Results"
                    )

                    excel_buffer = io.BytesIO()

                    with pd.ExcelWriter(
                        excel_buffer,
                        engine="openpyxl"
                    ) as writer:

                        pd.DataFrame(
                            matches
                        ).to_excel(
                            writer,
                            sheet_name="Matches",
                            index=False
                        )

                        if unmatched:

                            pd.DataFrame(
                                unmatched
                            ).to_excel(
                                writer,
                                sheet_name="Unmatched",
                                index=False
                            )

                    st.download_button(
                        label="📥 Download Excel Report",
                        data=excel_buffer.getvalue(),
                        file_name=f"Nodelec_Report_{file_id}.xlsx",
                        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    )

                break

            elif status == "failed":

                progress_bar.progress(100)

                st.error(
                    "Pipeline failed."
                )

                errors = payload.get(
                    "processing_errors",
                    []
                )

                if errors:

                    st.dataframe(
                        pd.DataFrame(errors),
                        width="stretch"
                    )

                break

            time.sleep(2)

    except requests.exceptions.ConnectionError:

        st.error(
            "Cannot connect to FastAPI server.\n\n"
            "Verify backend is running on port 8000."
        )