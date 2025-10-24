# UV Setup (macOS + Windows)

Use this to install uv and prepare the project after cloning.

## 1) Install uv

Pick one method per OS.

### macOS / Linux
- Standalone installer:
  ```sh
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
  Or:
  ```sh
  wget -qO- https://astral.sh/uv/install.sh | sh
  ```
- Homebrew:
  ```sh
  brew install uv
  ```
- PyPI (isolated):
  ```sh
  pipx install uv
  ```
  Or:
  ```sh
  pip install uv
  ```

### Windows
- Standalone installer (PowerShell):
  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```
- WinGet (Recommended):
  ```powershell
  winget install --id=astral-sh.uv -e
  ```
- Scoop:
  ```powershell
  scoop install main/uv
  ```
- PyPI (isolated):
  ```powershell
  pipx install uv
  ```
  Or:
  ```powershell
  pip install uv
  ```

### Verify install
```sh
uv --version
```

## 2) Clone the repo
```sh
git clone <your-repo-url>
cd <project-folder>
```

## 3) Create and sync the environment
This reads `pyproject.toml` and installs dependencies.
```sh
uv sync
```

## 4) Activate the virtual environment (if not automatic)
- macOS/Linux (bash/zsh):
  ```sh
  source .venv/bin/activate
  ```
- Windows (PowerShell):
  ```powershell
  .venv\Scripts\Activate.ps1
  ```
- Windows (CMD):
  ```bat
  .venv\Scripts\activate.bat
  ```

## 5) Common commands
- Run Python or scripts:
  ```sh
  uv run python main.py
  ```
- Run tests:
  ```sh
  uv run pytest
  ```
- Add a runtime dependency:
  ```sh
  uv add <package>
  ```
- Add a dev dependency:
  ```sh
  uv add --dev <package>
  ```
- Update/lock:
  ```sh
  uv lock
  uv sync
  ```
