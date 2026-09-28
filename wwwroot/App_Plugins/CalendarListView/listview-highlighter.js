(function () {
    console.log("[Calendar ListView] Active - Restricted by Workspace Key & Column Context...");

    // Target the exact Calendar Node GUID from your Backoffice URL
    const CALENDAR_PAGE_KEY = "19fb71de-3ebc-42df-a563-07299b36a18b";

    const cssRules = `
        uui-table-row.is-past-event,
        uui-table-row[data-is-past="true"] {
            --uui-table-row-color-background: #f3f4f6 !important;
            background-color: #f3f4f6 !important;
            color: #6b7280 !important;
        }
        uui-table-row.is-upcoming-event,
        uui-table-row[data-is-past="false"] {
            --uui-table-row-color-background: #eff6ff !important;
            background-color: #eff6ff !important;
            color: #1e3a8a !important;
        }
        uui-table-row.is-past-event uui-table-cell,
        uui-table-row[data-is-past="true"] uui-table-cell {
            --uui-table-cell-color-background: #f3f4f6 !important;
            background-color: #f3f4f6 !important;
        }
        uui-table-row.is-upcoming-event uui-table-cell,
        uui-table-row[data-is-past="false"] uui-table-cell {
            --uui-table-cell-color-background: #eff6ff !important;
            background-color: #eff6ff !important;
        }
    `;

    // Guard: Checks if the URL matches the Calendar node GUID
    function isCalendarWorkspace() {
        const url = window.location.href.toLowerCase();
        return url.includes(CALENDAR_PAGE_KEY.toLowerCase());
    }

    function injectStyles(root) {
        if (!root) return;

        if (root === document && !document.getElementById('calendar-style-global')) {
            const style = document.createElement('style');
            style.id = 'calendar-style-global';
            style.textContent = cssRules;
            document.head.appendChild(style);
            return;
        }

        if (root instanceof ShadowRoot) {
            if ('adoptedStyleSheets' in root) {
                if (!root.adoptedStyleSheets.some(s => s._calendarStyle)) {
                    const sheet = new CSSStyleSheet();
                    sheet.replaceSync(cssRules);
                    sheet._calendarStyle = true;
                    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
                }
            } else if (!root.querySelector('#calendar-style-shadow')) {
                const style = document.createElement('style');
                style.id = 'calendar-style-shadow';
                style.textContent = cssRules;
                root.appendChild(style);
            }
        }
    }

    function findAllShadowRoots(root = document) {
        let roots = [root];
        const elements = root.querySelectorAll('*');
        elements.forEach(el => {
            if (el.shadowRoot) {
                injectStyles(el.shadowRoot);
                roots = roots.concat(findAllShadowRoots(el.shadowRoot));
            }
        });
        return roots;
    }

    function scanRows() {
        // Exit immediately if not on the Calendar page workspace GUID
        if (!isCalendarWorkspace()) return;

        injectStyles(document);
        const allRoots = findAllShadowRoots(document);

        allRoots.forEach(r => {
            const rows = r.querySelectorAll('uui-table-row[data-sortable-id], uui-table-row');

            rows.forEach(row => {
                let sortValue = null;

                const colValues = row.querySelectorAll('umb-document-table-column-property-value, uui-table-cell');

                colValues.forEach(col => {
                    let valText = (col.textContent || '').trim();
                    if (col.shadowRoot) {
                        valText += ' ' + (col.shadowRoot.textContent || '').trim();
                    }

                    const parsed = parseInt(valText, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                        sortValue = parsed;
                    }
                });

                if (sortValue === null && row.item) {
                    sortValue = row.item.sortOrder ?? row.item.SortOrder ?? null;
                }

                if (sortValue !== null) {
                    if (sortValue >= 500000) {
                        row.classList.add('is-past-event');
                        row.classList.remove('is-upcoming-event');
                        row.setAttribute('data-is-past', 'true');
                    } else {
                        row.classList.add('is-upcoming-event');
                        row.classList.remove('is-past-event');
                        row.setAttribute('data-is-past', 'false');
                    }
                }
            });
        });
    }

    setInterval(scanRows, 1000);
})();