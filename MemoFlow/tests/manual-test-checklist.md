# MemoFlow manual test checklist

Run the app through a local web server, then verify:

## Notes
- [ ] Create a note with title, details, category, color and tags.
- [ ] Edit the note and confirm changes persist after refresh.
- [ ] Create a note with an empty title and confirm it is rejected.
- [ ] Pin and unpin a note.
- [ ] Mark a note completed and active again.
- [ ] Archive a note, open Archived, then restore it.
- [ ] Delete a note and cancel/confirm the browser prompt.

## Search, filter and sort
- [ ] Search by title.
- [ ] Search by note body.
- [ ] Search by tag.
- [ ] Filter by each category.
- [ ] Filter by reminders, pinned, completed and archived.
- [ ] Test each sort option.
- [ ] Clear search.

## Reminders
- [ ] Set a reminder 10 minutes in the future (or temporarily use a short test time).
- [ ] Confirm reminder count updates.
- [ ] Confirm the due reminder shows an in-app toast and sound.
- [ ] Hide and refocus the tab after a reminder becomes due.
- [ ] Confirm completed and archived notes do not trigger reminders.
- [ ] Confirm invalid/past reminder times are rejected.

## Backup and persistence
- [ ] Export a JSON backup.
- [ ] Import the exported backup and confirm the replacement prompt.
- [ ] Try importing malformed JSON.
- [ ] Try importing a JSON array with invalid records.
- [ ] Refresh and confirm notes persist.
- [ ] Test light/dark theme persistence.

## Responsive and accessibility
- [ ] Test at desktop, tablet and mobile widths.
- [ ] Navigate controls with the keyboard.
- [ ] Close the dialog with Escape and backdrop click.
- [ ] Confirm focus returns to the control that opened the dialog.
- [ ] Check that all icon-only controls have accessible labels.
