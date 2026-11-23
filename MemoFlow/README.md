# MemoFlow — Notes & Smart Reminders

MemoFlow is a responsive, offline-first notes and reminders application built with **HTML, CSS and vanilla JavaScript (ES modules)**. It is designed as a portfolio project demonstrating DOM manipulation, CRUD operations, browser storage, input validation, filtering, sorting, import/export, accessibility and browser APIs.

## Features

- Create, edit and delete notes
- Pin, complete, archive and restore notes
- Categories, tags and card colors
- Search notes by title, content, category or tag
- Filter by status and category
- Sort by recently updated, newest, oldest, title or reminder
- Reminder date/time with quick presets
- In-app reminder toast and sound
- Optional browser notification while the app is open
- Dashboard statistics
- Dark and light themes
- JSON backup export and validated import
- Responsive desktop and mobile layout
- Legacy LocalStorage migration from `memoflow_notes_v1`

## Run locally

Because this project uses JavaScript modules, run it through a local web server rather than opening `index.html` directly.

### Option 1: Python

```bash
python -m http.server 5500
```

Open <http://localhost:5500>.

### Option 2: VS Code

Install the **Live Server** extension, right-click `index.html`, and choose **Open with Live Server**.

## Publish on GitHub

1. Create a new GitHub repository named `memoflow`.
2. Extract the ZIP file.
3. Upload the contents of the `MemoFlow` folder to the repository root (the `index.html` file should be at the root).
4. Commit the files.
5. Open **Settings → Pages**.
6. Under **Build and deployment**, select **Deploy from a branch**.
7. Choose `main` and `/ (root)`, then save.
8. Wait for GitHub Pages to publish your site.

## Data and privacy

- Notes are stored locally in the browser using `localStorage`.
- The app does not currently have an account system, cloud sync or server database.
- Clearing browser site data can remove saved notes. Export JSON backups regularly.
- Imported backups are validated and limited to 5 MB / 5,000 notes.
- Google Fonts are loaded from Google Fonts when internet access is available. The app's core functionality does not depend on them.

## Reminder limitations

The reminder engine runs while the app is open in a browser tab. If the browser is closed or the device is asleep, reminders are not guaranteed to fire. Browser notifications may require permission and browser support. Reliable background delivery would require a backend scheduler and push notification infrastructure.

To enable browser notifications, double-click the date label at the top of the dashboard and grant permission when prompted. Notifications are only attempted when the page is hidden and permission has been granted.

## Project structure

```text
MemoFlow/
├── index.html
├── README.md
├── LICENSE
├── .gitignore
├── assets/
│   └── favicon.svg
├── src/
│   ├── app.js
│   ├── storage.js
│   └── styles.css
└── tests/
    └── manual-test-checklist.md
```

## Manual test checklist

See [`tests/manual-test-checklist.md`](tests/manual-test-checklist.md).

## Future improvements

- Recurring reminders and server-side scheduled notifications
- IndexedDB for larger offline datasets
- Automated unit and browser tests
- Rich-text editor and checklists
- Calendar and Kanban views
- Cloud sync and multi-device support
- Authentication and backend API

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript (ES modules)
- Web Storage API
- Notifications API
- Web Audio API
- Google Fonts (optional visual enhancement)

## License

MIT — see [`LICENSE`](LICENSE).
