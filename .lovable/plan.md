

## Fix: Prevent Charts from Being Cut Between PDF Pages

### Problem
The current PDF generation captures the entire report as a single tall image and slices it at fixed A4 page boundaries. This causes charts and tables to be cut in half between pages.

### Solution
Instead of rendering the entire report as one large canvas, render each logical section (header, summary cards, each pair of charts, each table) as separate canvas captures and place them on pages intelligently -- if a section won't fit on the remaining space of the current page, move it to a new page.

### Technical Changes

**File: `src/lib/report-pdf.ts`**

1. Refactor `generateReportPDF` to build individual off-screen DOM elements for each section:
   - Header block (title + date range)
   - Summary stats grid
   - Each pair of chart images (2 per row)
   - Each table section

2. Capture each section separately with `html2canvas` to get individual canvas images.

3. Use a cursor-based page layout:
   - Track current Y position on the page
   - Before placing a section, check if it fits in the remaining space
   - If it doesn't fit, call `pdf.addPage()` and reset Y to 0
   - Add the section image at the current Y position
   - Add small padding between sections

4. This ensures no chart or table is ever split across page boundaries -- if a section is too tall for the remaining space, it moves entirely to the next page.

### Implementation Detail

```text
Page Layout Algorithm:
+------------------+
| Header           |  <- always page 1
| Summary Cards    |  <- check fit
|                  |
| Chart Row 1      |  <- check fit, move to next page if needed
|                  |
+--- page break ---+
| Chart Row 2      |  <- starts on new page if previous was full
| Table 1          |  <- check fit
+--- page break ---+
| Table 2          |  <- moves to next page if no room
| Footer           |
+------------------+
```

Each section is rendered independently so nothing gets clipped at page boundaries.

