import streamlit as st


def _format_label(item: dict, label_fields: tuple[str, ...]) -> str:
    for field in label_fields:
        value = item.get(field)
        if value:
            return str(value)
    return str(item.get("id", ""))


def render_master_detail(
    items: list[dict] | None,
    selection_key: str,
    render_detail,
    *,
    list_ratio: tuple[int, int] = (1, 3),
    title: str = "Items",
    detail_title: str = "Details",
    id_field: str = "id",
    label_fields: tuple[str, ...] = ("full_name", "email"),
    no_items_message: str = "No items found.",
    error_message: str = "Could not load items. The upstream service may be unavailable.",
    total: int = 0,
    page: int = 1,
    per_page: int = 20,
    page_state_key: str | None = None,
) -> None:
    """Render a master-detail layout: compact list on the left, details on the right.

    The list column is a vertical stack of buttons (one per item). The active
    item is highlighted. The detail column renders the selected item via the
    `render_detail` callable. Search/filter inputs should live ABOVE this
    function in the parent view (full-width, above the columns).

    Args:
        items: List of dicts (or None if the upstream fetch failed).
        selection_key: session_state key that holds the currently selected id.
        render_detail: callable(selected_id: str) -> None that draws the right column.
        list_ratio: column width ratio for [list, detail]. Default (1, 3).
        title: heading shown above the list column.
        detail_title: heading shown above the detail column. Default "Details".
        id_field: dict key used to identify each item.
        label_fields: fields to try, in order, for the button label.
        no_items_message: shown in the list column when items is empty.
        error_message: shown in the list column when items is None.
        total: total number of items (for pagination display).
        page: current page number (1-indexed).
        per_page: items per page.
        page_state_key: session_state key for the current page; if given,
            Prev/Next buttons mutate it and rerun.
    """
    selected_id = st.session_state.get(selection_key, "")

    col_list, col_detail = st.columns(list_ratio)

    # ── List column ────────────────────────────────────────
    with col_list:
        st.markdown(f"### {title}", unsafe_allow_html=True)
        _spacer()

        if items is None:
            with st.container(border=True):
                st.error(error_message)
                if st.button("Retry Connection", type="secondary", key=f"{selection_key}_retry"):
                    st.rerun()
        elif not items:
            with st.container(border=True):
                st.info(no_items_message)
        else:
            for item in items:
                item_id = item.get(id_field, "")
                if not item_id:
                    continue
                is_active = selected_id == item_id
                label = _format_label(item, label_fields)
                if st.button(
                    label,
                    key=f"md_{selection_key}_{item_id}",
                    use_container_width=True,
                    type="primary" if is_active else "secondary",
                ):
                    st.session_state[selection_key] = item_id
                    st.rerun()

            # Pagination controls (only when caller wired up page_state_key)
            if page_state_key and total > per_page:
                total_pages = (total + per_page - 1) // per_page
                st.divider()
                prev_col, info_col, next_col = st.columns([1, 2, 1])
                with prev_col:
                    if st.button(
                        "Prev",
                        key=f"{selection_key}_prev",
                        use_container_width=True,
                        disabled=page <= 1,
                    ):
                        st.session_state[page_state_key] = page - 1
                        st.rerun()
                with info_col:
                    st.caption(f"Page {page} of {total_pages}")
                with next_col:
                    if st.button(
                        "Next",
                        key=f"{selection_key}_next",
                        use_container_width=True,
                        disabled=page >= total_pages,
                    ):
                        st.session_state[page_state_key] = page + 1
                        st.rerun()

    # ── Detail column ──────────────────────────────────────
    with col_detail:
        st.markdown(f"### {detail_title}", unsafe_allow_html=True)
        _spacer()

        if not selected_id:
            with st.container(border=True):
                st.info("Select an item from the list to see details.")
            return
        render_detail(selected_id)


def _spacer() -> None:
    """Tiny vertical spacer so column headers and content line up."""
    st.markdown("<div style='height:0.25rem'></div>", unsafe_allow_html=True)
