"""Inline SVG icons for the admin dashboard.

All icons are 24x24 outline/stroke style (Lucide-inspired).
Use svg_icon() to wrap any icon for inline use in st.markdown().
"""


def svg_icon(svg: str, size: int = 20) -> str:
    """Wrap an SVG string for inline use in Streamlit markdown."""
    svg = svg.replace("<svg ", f"<svg width='{size}' height='{size}' ", 1)
    return f'<span style="display:inline-block;vertical-align:middle;line-height:1">{svg}</span>'


def user_icon() -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        "fill='none' stroke='currentColor' stroke-width='2' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/>"
        "<circle cx='12' cy='7' r='4'/>"
        "</svg>"
    )


def search_icon() -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        "fill='none' stroke='currentColor' stroke-width='2' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<circle cx='11' cy='11' r='8'/>"
        "<line x1='21' y1='21' x2='16.65' y2='16.65'/>"
        "</svg>"
    )


def list_icon() -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        "fill='none' stroke='currentColor' stroke-width='2' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<line x1='8' y1='6' x2='21' y2='6'/>"
        "<line x1='8' y1='12' x2='21' y2='12'/>"
        "<line x1='8' y1='18' x2='21' y2='18'/>"
        "<line x1='3' y1='6' x2='3.01' y2='6'/>"
        "<line x1='3' y1='12' x2='3.01' y2='12'/>"
        "<line x1='3' y1='18' x2='3.01' y2='18'/>"
        "</svg>"
    )


def house_icon() -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        "fill='none' stroke='currentColor' stroke-width='2' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/>"
        "<polyline points='9 22 9 12 15 12 15 22'/>"
        "</svg>"
    )


def pencil_icon() -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        "fill='none' stroke='currentColor' stroke-width='2' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<path d='M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'/>"
        "</svg>"
    )


def scales_icon() -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        "fill='none' stroke='currentColor' stroke-width='2' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<line x1='12' y1='3' x2='12' y2='21'/>"
        "<path d='M5 8l7-5 7 5'/>"
        "<path d='M5 8v6a7 7 0 0 0 14 0V8'/>"
        "<line x1='3' y1='21' x2='21' y2='21'/>"
        "</svg>"
    )


def compass_icon() -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        "fill='none' stroke='currentColor' stroke-width='2' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<circle cx='12' cy='12' r='10'/>"
        "<polygon points='16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76'/>"
        "</svg>"
    )


def refresh_icon() -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        "fill='none' stroke='currentColor' stroke-width='2' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<polyline points='23 4 23 10 17 10'/>"
        "<polyline points='1 20 1 14 7 14'/>"
        "<path d='M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'/>"
        "</svg>"
    )


def arrow_left_icon() -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        "fill='none' stroke='currentColor' stroke-width='2' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<line x1='19' y1='12' x2='5' y2='12'/>"
        "<polyline points='12 19 5 12 12 5'/>"
        "</svg>"
    )


def arrow_right_icon() -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        "fill='none' stroke='currentColor' stroke-width='2' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<line x1='5' y1='12' x2='19' y2='12'/>"
        "<polyline points='12 5 19 12 12 19'/>"
        "</svg>"
    )


def arrow_right_line() -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        "fill='none' stroke='currentColor' stroke-width='2' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<line x1='5' y1='12' x2='19' y2='12'/>"
        "<polyline points='12 5 19 12 12 19'/>"
        "</svg>"
    )


def check_circle_icon(color: str = "currentColor") -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        f"fill='none' stroke='{color}' stroke-width='2' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/>"
        "<polyline points='22 4 12 14.01 9 11.01'/>"
        "</svg>"
    )


def clock_icon(color: str = "currentColor") -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        f"fill='none' stroke='{color}' stroke-width='2' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<circle cx='12' cy='12' r='10'/>"
        "<polyline points='12 6 12 12 16 14'/>"
        "</svg>"
    )


def x_circle_icon(color: str = "currentColor") -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        f"fill='none' stroke='{color}' stroke-width='2' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<circle cx='12' cy='12' r='10'/>"
        "<line x1='15' y1='9' x2='9' y2='15'/>"
        "<line x1='9' y1='9' x2='15' y2='15'/>"
        "</svg>"
    )


def dot_icon(color: str = "currentColor") -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        f"fill='{color}' stroke='none'>"
        "<circle cx='12' cy='12' r='6'/>"
        "</svg>"
    )


def star_icon(color: str = "currentColor") -> str:
    return (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        f"fill='{color}' stroke='{color}' stroke-width='1' "
        "stroke-linecap='round' stroke-linejoin='round'>"
        "<polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'/>"
        "</svg>"
    )
