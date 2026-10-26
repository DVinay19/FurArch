
import os
import json
import sqlite3
import logging
from datetime import datetime
from pathlib import Path
from html import escape

from flask import (
    Flask, render_template, request, redirect,
    url_for, jsonify, flash, make_response
)

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "furarch.db"

app = Flask(__name__)
app.secret_key = os.getenv(
    "FURARCH_SECRET_KEY", "furarch-local-development-key"
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("furarch")

ROOM_TYPES = [
    "Living Room", "Bedroom", "Kitchen",
    "Office", "Dining Room", "Studio Apartment"
]

DESIGN_STYLES = [
    "Modern", "Minimalist", "Scandinavian",
    "Industrial", "Contemporary", "Traditional"
]

FURNITURE = {
    "Living Room": [
        {"name": "Sofa", "price": 28000},
        {"name": "Coffee Table", "price": 6500},
        {"name": "TV Unit", "price": 14000},
        {"name": "Floor Lamp", "price": 3200},
        {"name": "Area Rug", "price": 5500},
    ],
    "Bedroom": [
        {"name": "Bed Frame", "price": 22000},
        {"name": "Mattress", "price": 12000},
        {"name": "Wardrobe", "price": 26000},
        {"name": "Bedside Table", "price": 3500},
        {"name": "Study Lamp", "price": 1800},
    ],
    "Kitchen": [
        {"name": "Cabinet Set", "price": 35000},
        {"name": "Kitchen Counter", "price": 18000},
        {"name": "Dining Table", "price": 12000},
        {"name": "Storage Rack", "price": 4500},
    ],
    "Office": [
        {"name": "Office Desk", "price": 10000},
        {"name": "Ergonomic Chair", "price": 8500},
        {"name": "Bookshelf", "price": 6000},
        {"name": "Desk Lamp", "price": 1800},
    ],
    "Dining Room": [
        {"name": "Dining Table", "price": 18000},
        {"name": "Dining Chairs", "price": 9000},
        {"name": "Sideboard", "price": 12000},
        {"name": "Pendant Light", "price": 4500},
    ],
    "Studio Apartment": [
        {"name": "Sofa Bed", "price": 24000},
        {"name": "Compact Desk", "price": 6500},
        {"name": "Storage Unit", "price": 10000},
        {"name": "Dining Set", "price": 8500},
    ],
}


# ---------------- DATABASE ----------------

def get_db():
    db = sqlite3.connect(DB_PATH, timeout=15)
    db.row_factory = sqlite3.Row
    return db


def init_db():
    definitions = {
        "name": "TEXT NOT NULL DEFAULT 'Untitled Design'",
        "plot_area": "REAL NOT NULL DEFAULT 144",
        "room_type": "TEXT NOT NULL DEFAULT 'Living Room'",
        "width": "REAL NOT NULL DEFAULT 12",
        "length": "REAL NOT NULL DEFAULT 12",
        "height": "REAL NOT NULL DEFAULT 8",
        "style": "TEXT NOT NULL DEFAULT 'Modern'",
        "budget": "REAL NOT NULL DEFAULT 100000",
        "furniture_json": "TEXT NOT NULL DEFAULT '[]'",
        "created_at": "TEXT NOT NULL DEFAULT ''",
        "updated_at": "TEXT NOT NULL DEFAULT ''",
        "customer": "TEXT NOT NULL DEFAULT ''",
        "wall_color": "TEXT NOT NULL DEFAULT '#e9e2d5'",
        "floor_color": "TEXT NOT NULL DEFAULT '#b99b78'",
        "notes": "TEXT NOT NULL DEFAULT ''",
    }

    with get_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL DEFAULT 'Untitled Design',
                plot_area REAL NOT NULL DEFAULT 144,
                room_type TEXT NOT NULL DEFAULT 'Living Room',
                width REAL NOT NULL DEFAULT 12,
                length REAL NOT NULL DEFAULT 12,
                height REAL NOT NULL DEFAULT 8,
                style TEXT NOT NULL DEFAULT 'Modern',
                budget REAL NOT NULL DEFAULT 100000,
                furniture_json TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL DEFAULT '',
                customer TEXT NOT NULL DEFAULT '',
                wall_color TEXT NOT NULL DEFAULT '#e9e2d5',
                floor_color TEXT NOT NULL DEFAULT '#b99b78',
                notes TEXT NOT NULL DEFAULT ''
            )
        """)

        columns = {
            row["name"]
            for row in db.execute(
                "PRAGMA table_info(projects)"
            ).fetchall()
        }

        for name, definition in definitions.items():
            if name not in columns:
                db.execute(
                    f'ALTER TABLE projects ADD COLUMN "{name}" {definition}'
                )

        now = datetime.now().isoformat(timespec="seconds")

        db.execute("""
            UPDATE projects
            SET plot_area = length * width
            WHERE plot_area IS NULL OR plot_area <= 0
        """)

        db.execute("""
            UPDATE projects
            SET height = 8
            WHERE height IS NULL OR height <= 0
        """)

        db.execute("""
            UPDATE projects
            SET created_at = ?
            WHERE created_at IS NULL OR created_at = ''
        """, (now,))

        db.execute("""
            UPDATE projects
            SET updated_at = created_at
            WHERE updated_at IS NULL OR updated_at = ''
        """)

        db.commit()


def get_projects():
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM projects ORDER BY updated_at DESC, id DESC"
        ).fetchall()
    return [dict(row) for row in rows]


def get_project(project_id):
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM projects WHERE id = ?",
            (project_id,)
        ).fetchone()
    return dict(row) if row else None


def safe_float(value, default, minimum=0, maximum=1_000_000_000):
    try:
        number = float(value)
        if minimum <= number <= maximum:
            return number
    except (TypeError, ValueError):
        pass
    return default


def safe_furniture(project):
    try:
        items = json.loads(project.get("furniture_json") or "[]")
        if isinstance(items, list) and items:
            return [
                {
                    "name": str(item["name"]),
                    "price": safe_float(item.get("price"), 0),
                }
                for item in items
                if isinstance(item, dict) and item.get("name")
            ]
    except (ValueError, TypeError):
        pass

    return FURNITURE.get(
        project.get("room_type", "Living Room"),
        FURNITURE["Living Room"]
    )


def calculate(project):
    if not project:
        return None

    length = safe_float(project.get("length"), 12, 0.1)
    width = safe_float(project.get("width"), 12, 0.1)
    budget = safe_float(project.get("budget"), 100000)

    area = length * width
    items = safe_furniture(project)
    furniture_total = sum(item["price"] for item in items)
    interior_total = round(area * 1200)
    contingency = round((furniture_total + interior_total) * 0.10)
    total = furniture_total + interior_total + contingency

    return {
        "area": round(area, 2),
        "items": items,
        "furniture_total": furniture_total,
        "interior_total": interior_total,
        "contingency": contingency,
        "total": total,
        "budget": budget,
        "difference": round(budget - total),
        "within_budget": total <= budget,
    }


def template_context(page, project=None, **extra):
    projects = get_projects()
    project_dict = dict(project) if project else {}

    return {
        "page": page,
        "project": project_dict,
        "projects": projects,
        "project_data": projects,
        "estimate": calculate(project_dict) if project_dict else None,
        "room_types": ROOM_TYPES,
        "design_styles": DESIGN_STYLES,
        "furniture_catalog": FURNITURE,
        **extra,
    }


# ---------------- PAGES ----------------

@app.route("/")
@app.route("/overview")
def overview():
    projects = get_projects()
    total_budget = sum(
        float(p.get("budget") or 0) for p in projects
    )

    return render_template(
        "index.html",
        **template_context(
            "overview",
            total_projects=len(projects),
            total_budget=total_budget,
        ),
    )


@app.route("/studio")
def studio():
    project_id = request.args.get("project_id", type=int)
    project = get_project(project_id) if project_id else None

    if project_id and not project:
        flash("Project not found.", "error")

    return render_template(
        "index.html",
        **template_context("studio", project=project),
    )


@app.route("/studio/<int:project_id>")
def studio_edit(project_id):
    project = get_project(project_id)

    if not project:
        flash("Project not found.", "error")
        return redirect(url_for("studio"))

    return render_template(
        "index.html",
        **template_context("studio", project=project),
    )


# ---------------- SAVE / UPDATE ----------------

@app.route("/studio/save", methods=["POST"])
@app.route("/studio/<int:project_id>/save", methods=["POST"])
def studio_save(project_id=None):
    form = request.form

    name = form.get("name", "").strip() or "Untitled Design"
    customer = form.get("customer", "").strip()
    room_type = form.get("room_type", "Living Room")
    style = form.get("style", "Modern")

    if room_type not in ROOM_TYPES:
        room_type = "Living Room"

    if style not in DESIGN_STYLES:
        style = "Modern"

    try:
        length = float(form.get("length", 12))
        width = float(form.get("width", 12))
        height = float(form.get("height", 8))
        budget = float(form.get("budget", 100000))

        if not (0 < length <= 10000):
            raise ValueError("Invalid room length")
        if not (0 < width <= 10000):
            raise ValueError("Invalid room width")
        if not (0 < height <= 100):
            raise ValueError("Invalid room height")
        if not (0 <= budget <= 1_000_000_000):
            raise ValueError("Invalid budget")

    except (TypeError, ValueError):
        flash("Enter valid dimensions, height and budget.", "error")
        return redirect(url_for("studio"))

    plot_area = length * width
    wall_color = form.get("wall_color", "#e9e2d5").strip()
    floor_color = form.get("floor_color", "#b99b78").strip()
    notes = form.get("notes", "").strip()

    try:
        furniture = json.loads(form.get("furniture_json", "[]"))
        if not isinstance(furniture, list):
            furniture = []
    except (TypeError, ValueError):
        furniture = []

    furniture_json = json.dumps(furniture)
    now = datetime.now().isoformat(timespec="seconds")

    try:
        with get_db() as db:
            if project_id is None:
                cursor = db.execute("""
                    INSERT INTO projects (
                        name, customer, room_type, style,
                        length, width, height, plot_area, budget,
                        wall_color, floor_color, notes, furniture_json,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    name, customer, room_type, style,
                    length, width, height, plot_area, budget,
                    wall_color, floor_color, notes, furniture_json,
                    now, now
                ))

                saved_id = cursor.lastrowid

            else:
                existing = db.execute(
                    "SELECT id FROM projects WHERE id = ?",
                    (project_id,)
                ).fetchone()

                if not existing:
                    flash("Project not found.", "error")
                    return redirect(url_for("studio"))

                db.execute("""
                    UPDATE projects SET
                        name = ?, customer = ?, room_type = ?, style = ?,
                        length = ?, width = ?, height = ?, plot_area = ?,
                        budget = ?, wall_color = ?, floor_color = ?,
                        notes = ?, furniture_json = ?, updated_at = ?
                    WHERE id = ?
                """, (
                    name, customer, room_type, style,
                    length, width, height, plot_area, budget,
                    wall_color, floor_color, notes, furniture_json,
                    now, project_id
                ))

                saved_id = project_id

        flash("Design saved successfully.", "success")
        return redirect(url_for("studio_edit", project_id=saved_id))

    except Exception as error:
        logger.exception("Failed to save FurArch design")
        flash(f"Save failed: {error}", "error")
        return redirect(url_for("studio"))


# ---------------- DELETE ----------------

@app.route("/project/<int:project_id>/delete", methods=["POST"])
def delete_project(project_id):
    try:
        with get_db() as db:
            cursor = db.execute(
                "DELETE FROM projects WHERE id = ?", (project_id,)
            )

        flash(
            "Project deleted successfully." if cursor.rowcount
            else "Project not found.",
            "success" if cursor.rowcount else "error"
        )

    except sqlite3.Error:
        logger.exception("Could not delete project")
        flash("Could not delete the project.", "error")

    return redirect(url_for("overview"))


# ---------------- PLANNER ----------------

@app.route("/planner")
def planner():
    project_id = request.args.get("project_id", type=int)
    project = get_project(project_id) if project_id else None

    if project_id and not project:
        flash("Project not found.", "error")

    return render_template(
        "index.html",
        **template_context("planner", project=project),
    )


# ---------------- BUDGET ----------------

@app.route("/budget")
def budget():
    rows = []
    grand_total = 0
    grand_budget = 0

    for project in get_projects():
        estimate = calculate(project)
        rows.append({
            "project": project,
            "estimate": estimate,
            "total": estimate["total"],
            "budget": estimate["budget"],
        })
        grand_total += estimate["total"]
        grand_budget += estimate["budget"]

    return render_template(
        "index.html",
        **template_context(
            "budget",
            rows=rows,
            totals={
                "estimated": grand_total,
                "budget": grand_budget,
                "remaining": grand_budget - grand_total,
            },
        ),
    )


# ---------------- JSON API ----------------

@app.route("/api/health")
def health():
    return jsonify({
        "status": "online",
        "app": "FurArch",
        "timestamp": datetime.now().isoformat(timespec="seconds"),
    })


@app.route("/api/projects")
def api_projects():
    return jsonify(get_projects())


@app.route("/api/projects/<int:project_id>")
def api_project(project_id):
    project = get_project(project_id)

    if not project:
        return jsonify({"error": "Project not found"}), 404

    return jsonify({
        "project": project,
        "estimate": calculate(project)
    })


@app.route("/api/assistant", methods=["POST"])
def assistant():
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()

    if not message:
        return jsonify({
            "reply": "Ask about layout, furniture, colours or budget."
        }), 400

    lower = message.lower()

    if any(word in lower for word in (
        "budget", "cost", "price", "expensive"
    )):
        reply = (
            "Compare furniture and interior costs in Budget Manager. "
            "Keep about 10% aside for unexpected expenses."
        )
    elif any(word in lower for word in ("small", "space", "compact")):
        reply = (
            "Use multipurpose furniture, vertical storage, light colours "
            "and clear walking paths."
        )
    elif "bedroom" in lower:
        reply = (
            "Plan bed placement, wardrobe clearance, layered lighting "
            "and comfortable walking space."
        )
    elif "kitchen" in lower:
        reply = (
            "Plan the sink, cooking area and refrigerator together. "
            "Verify measurements before ordering cabinets."
        )
    elif any(word in lower for word in ("3d", "planner", "furniture")):
        reply = (
            "Open Space Planner, load a saved project and review its room "
            "concept. Check clearances before buying furniture."
        )
    else:
        reply = (
            "Choose a room type, enter dimensions, select a style and "
            "save your design. I can help with layout, colours and budgeting."
        )

    return jsonify({"reply": reply, "mode": "fallback"})


# ---------------- HTML REPORT ----------------

@app.route("/report")
def report():
    projects = get_projects()

    lines = [
        "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>",
        "<meta name='viewport' content='width=device-width, initial-scale=1'>",
        "<title>FurArch Design Report</title>",
        "<style>body{font:16px Arial;max-width:1000px;margin:40px auto;"
        "padding:0 20px;color:#222}table{width:100%;border-collapse:collapse}"
        "th,td{padding:12px;border:1px solid #ddd;text-align:left}"
        "th{background:#eee}@media print{button{display:none}}</style>",
        "</head><body><h1>FurArch — Design Report</h1>",
        f"<p>Generated {escape(datetime.now().strftime('%d %b %Y, %H:%M'))}</p>",
        "<table><thead><tr><th>Project</th><th>Customer</th><th>Room</th>",
        "<th>Area (sq ft)</th><th>Budget</th><th>Estimate</th><th>Status</th>",
        "</tr></thead><tbody>",
    ]

    for project in projects:
        estimate = calculate(project)
        status = (
            "Within budget" if estimate["within_budget"]
            else "Over budget"
        )

        lines.append(
            "<tr>"
            f"<td>{escape(str(project.get('name', '')))}</td>"
            f"<td>{escape(str(project.get('customer', '')))}</td>"
            f"<td>{escape(str(project.get('room_type', '')))}</td>"
            f"<td>{estimate['area']:,.2f}</td>"
            f"<td>₹{estimate['budget']:,.0f}</td>"
            f"<td>₹{estimate['total']:,.0f}</td>"
            f"<td>{status}</td></tr>"
        )

    lines.extend([
        "</tbody></table>",
        "<p>Estimates are illustrative, not supplier quotations.</p>",
        "<button onclick='window.print()'>Print / Save as PDF</button>",
        "</body></html>",
    ])

    response = make_response("\n".join(lines))
    response.headers["Content-Type"] = "text/html; charset=utf-8"
    return response


@app.errorhandler(404)
def not_found(error):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Endpoint not found"}), 404

    return "Page not found. Return to /overview.", 404


@app.errorhandler(500)
def server_error(error):
    logger.error("Unexpected server error: %s", error)

    if request.path.startswith("/api/"):
        return jsonify({"error": "Internal server error"}), 500

    return "Unexpected server error. Check the VS Code terminal.", 500


init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
