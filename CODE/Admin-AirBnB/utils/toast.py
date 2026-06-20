import streamlit as st
from utils.icons import check_circle_icon, x_circle_icon, svg_icon


def toast_success(message: str):
    st.success(f"{svg_icon(check_circle_icon('#16a34a'))} {message}", unsafe_allow_html=True)


def toast_error(message: str):
    st.error(f"{svg_icon(x_circle_icon('#dc2626'))} {message}", unsafe_allow_html=True)


def toast_info(message: str):
    st.info(message)


def toast_warning(message: str):
    st.warning(message)
