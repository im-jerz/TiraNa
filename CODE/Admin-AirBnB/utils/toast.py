import streamlit as st


def toast_success(message: str):
    st.toast(message, icon="✅")


def toast_error(message: str):
    st.toast(message, icon="❌")


def toast_info(message: str):
    st.toast(message, icon="ℹ️")


def toast_warning(message: str):
    st.toast(message, icon="⚠️")
