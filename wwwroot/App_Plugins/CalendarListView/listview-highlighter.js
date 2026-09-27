(function () {
    console.log("[Calendar ListView] Active - Reading Lit property values directly...");

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
        injectStyles(document);
        const allRoots = findAllShadowRoots(document);

        allRoots.forEach(r => {
            const rows = r.querySelectorAll('uui-table-row[data-sortable-id], uui-table-row');

            rows.forEach(row => {
                let sortValue = null;

                // 1. Check property values inside <umb-document-table-column-property-value>
                const colValues = row.querySelectorAll('umb-document-table-column-property-value, uui-table-cell');

                colValues.forEach(col => {
                    // Extract text from element OR its shadow root
                    let valText = (col.textContent || '').trim();
                    if (col.shadowRoot) {
                        valText += ' ' + (col.shadowRoot.textContent || '').trim();
                    }

                    // Check if the value is a number matching our sort order range
                    const parsed = parseInt(valText, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                        // Found valid sort rank (e.g. 205 for upcoming, 500205+ for past)
                        sortValue = parsed;
                    }
                });

                // 2. Fallback to Lit element JS properties
                if (sortValue === null && row.item) {
                    sortValue = row.item.sortOrder ?? row.item.SortOrder ?? null;
                }

                // Apply styles based on 500,000 threshold
                if (sortValue !== null) {
                    if (sortValue >= 500000) {
                        // PAST EVENT -> Light Grey (#f3f4f6)
                        row.classList.add('is-past-event');
                        row.classList.remove('is-upcoming-event');
                        row.setAttribute('data-is-past', 'true');
                    } else {
                        // UPCOMING EVENT -> Light Blue (#eff6ff)
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