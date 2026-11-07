#  FurArch — Spatial Design Studio

<p align="center">
  <strong>Design Spaces. Visualize Ideas. Plan Better Living.</strong>
  <br/>
  A web-based interior design planning platform that combines interactive 3D room visualization, furniture placement, project management and budget estimation in one workspace.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-Web%20Framework-black?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/Three.js-3D%20Graphics-black?style=for-the-badge&logo=threedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Status-Prototype-success?style=for-the-badge" />
</p>

---

##  Overview

**FurArch** is a web-based interior design planning prototype designed to make room visualization and project planning more accessible.

The platform allows users to create interior design projects, define room dimensions, experiment with colours, visualize furniture arrangements in an interactive 3D environment, and track project progress.

It also includes a budget management workspace with illustrative interior estimates and an optional AI-powered design assistant.

By bringing visualization, planning and project management together, FurArch provides a centralized workspace for exploring interior design ideas before moving into actual implementation.

##  Key Features

| Feature | Description |
|---|---|
|  Project Dashboard | View saved interior design projects and project statistics |
|  Project Management | Create, edit and delete customer room projects |
|  3D Room Visualization | Explore room layouts using Three.js |
|  Interactive Camera | Orbit, rotate and zoom around the room |
|  Room Customization | Experiment with wall and floor colours |
|  Furniture Placement | Add sample furniture objects to the 3D scene |
|  Room Dimensions | Define room measurements for planning |
|  Furniture Recommendations | Explore suggested furniture based on room dimensions |
|  Project Tracking | Monitor project stages using a 4D-style workflow |
|  Budget Manager | Estimate illustrative furniture and interior costs |
|  AI Design Assistant | Optional AI-assisted design suggestions |
|  JSON API | Access application data through API endpoints |
|  Persistent Storage | Store project information using SQLite |
|  Responsive Interface | Designed for desktop and mobile browsers |

##  Technology Stack

| Layer | Technology |
|---|---|
| Programming Language | Python |
| Backend Framework | Flask |
| Database | SQLite |
| Frontend | HTML5, CSS3, JavaScript |
| 3D Visualization | Three.js |
| API | Flask JSON APIs |
| AI Integration | Optional OpenAI API |
| Typography | Google Fonts |

##  How FurArch Works

```text
          Open FurArch
                |
                ▼
         Project Dashboard
                |
                ▼
        Create Room Project
                |
         ┌──────┼──────┐
         ▼      ▼      ▼
      Define  Choose  Set Room
     Dimensions Style  Colours
         |      |      |
         └──────┼──────┘
                |
                ▼
        Interactive 3D Planner
                |
                ▼
         Add Sample Furniture
                |
                ▼
         Budget Estimation
                |
                ▼
       Project Stage Tracking
                |
                ▼
         Save Design Project
```

##  Application Pages

| Route | Purpose |
|---|---|
| `/overview` | Main dashboard and saved projects |
| `/studio` | Create and manage interior design projects |
| `/planner` | Interactive 3D room planning workspace |
| `/budget` | Furniture and interior budget estimates |

##  Getting Started

Follow these steps to run FurArch locally.

### Prerequisites

- Python 3.10 or newer
- pip
- Git
- Internet connection for Three.js CDN and Google Fonts

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate into the project:

```bash
cd FurArch
```

### 2. Create a Virtual Environment

```bash
python -m venv .venv
```

### 3. Activate the Environment

For Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 4. Install Dependencies

```powershell
python -m pip install -r requirements.txt
```

### 5. Start the Application

```bash
python app.py
```

### 6. Open FurArch

Visit:

**http://127.0.0.1:5000/overview**

The application dashboard will be available in your browser.

##  Optional AI Assistant Setup

FurArch supports an optional AI design assistant.

To enable AI-powered responses:

### 1. Create a `.env` file

Create it in the same directory as `app.py`.

### 2. Configure the API key

```env
OPENAI_API_KEY=your_api_key_here
```

### 3. Keep credentials private

Make sure `.env` is included in `.gitignore`.

Never commit API keys or other private credentials to GitHub.

Without a configured API key, the assistant uses the application's basic local fallback.

##  Project Architecture

The application is organized around a Flask backend, browser-based interface, 3D visualization and persistent project storage.

```text
FurArch/
│
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
│
├── templates/
│   └── HTML application pages
│
├── static/
│   ├── CSS stylesheets
│   ├── JavaScript files
│   └── frontend assets
│
└── SQLite database
```

*The structure above is a conceptual overview. Actual filenames and folders may vary depending on the implementation.*

##  3D Visualization & Planning

FurArch uses Three.js to render interactive room environments directly in the browser.

The current 3D planning experience includes:

- Room geometry and visualization.
- Interactive orbit camera controls.
- Zoom and scene navigation.
- Customizable wall and floor colours.
- Sample furniture objects.
- Room dimensions for planning.

The 3D environment helps users explore spatial layouts visually rather than relying only on static floor plans.

##  4D-Style Project Tracking

FurArch includes a project-stage tracking workflow to organize the progression of interior design projects.

It provides visibility into project stages and their completion progress.

This is a lightweight project-management feature inspired by 4D planning workflows. It does not perform construction simulation or time-dependent physics calculations.

##  Budget Management

The budget manager provides illustrative cost estimates for furniture and interior planning.

Users can explore estimated expenses and organize project budgets before proceeding with actual purchases or construction.

**Estimation disclaimer:** All displayed figures are illustrative planning estimates, not professional quotations or guaranteed market prices. Verify measurements, material specifications and actual costs with qualified professionals.

##  Privacy & Configuration

- Project information is stored using SQLite.
- AI credentials are configured through environment variables.
- API keys should never be committed to source control.
- Review database and file handling before public deployment.
- Implement appropriate authentication and access controls before storing confidential customer information.

##  Current Limitations

FurArch is an interior design planning prototype rather than a production-grade CAD or architectural engineering system.

- The 3D environment uses lightweight sample geometry.
- Furniture objects are demonstration assets.
- The planner does not provide professional architectural modelling.
- Budget estimates are illustrative and require professional verification.
- The 4D-style workflow tracks project stages rather than simulating construction physics.
- AI functionality requires a valid provider API key for real AI-generated responses.

##  Future Enhancements

Potential improvements for future versions include:

- Advanced furniture customization and placement.
- Drag-and-drop 3D furniture positioning.
- Importing custom 3D models.
- Realistic lighting and material rendering.
- Room layout recommendations.
- Advanced floor-plan visualization.
- More detailed project scheduling.
- Improved cost estimation using configurable material prices.
- User authentication and project sharing.
- Cloud-based project storage.

##  Project Objectives

- Explore interactive 3D visualization using Three.js.
- Build a full-stack application using Flask and SQLite.
- Simplify interior design planning and room visualization.
- Combine project management with spatial design.
- Demonstrate practical frontend and backend integration.
- Explore optional AI-assisted design workflows.

##  License

Add a `LICENSE` file to specify the terms under which FurArch can be used, modified and distributed.

---

<p align="center">
  <strong> FurArch — Spatial Design Studio</strong>
  <br/>
  <em>Imagine It. Design It. Visualize It.</em>
  <br/><br/>
  Built with Python, Flask, SQLite and Three.js.
</p>
