
# Upgrade Admin Reports to Professional PDF with Charts

## Problem
The PDF export currently generates a basic HTML page with only summary stats and plain tables. The charts visible on the web page (pie charts, bar charts) are completely missing from the exported report.

## Solution
Redesign the PDF report generation to include visual charts by capturing the Recharts SVG charts as images and embedding them in the PDF, plus improving the overall layout with professional styling.

## Implementation Steps

### 1. Capture Charts as Images for PDF
- Use `html-to-image` approach: Before generating the PDF, use the canvas API to convert each Recharts SVG chart into a base64 PNG image
- Create a helper function that queries all chart containers on the page and converts them to data URLs

### 2. Redesign `src/lib/report-pdf.ts`
- Accept chart images (base64) as an additional parameter
- Add professional styling: branded header with gradient, better typography, colored stat cards, proper spacing
- Embed chart images in a 2-column grid layout matching the web view
- Add page break handling for print
- Add footer with page info and generation timestamp

### 3. Update `src/pages/admin/AdminReports.tsx`
- Add `ref` attributes to each chart Card container for capture
- Update `exportPDF` function to:
  1. Capture all chart containers as base64 PNG images using canvas/SVG serialization
  2. Pass chart images along with table data to the enhanced `generateReportPDF`
- Add chart titles alongside their images in the PDF

## Technical Approach
- Use native browser SVG serialization + Canvas API (no new dependencies needed)
- Each `ResponsiveContainer` wrapping a Recharts chart contains an SVG element
- Serialize each SVG to a string, draw on a canvas, then export as `toDataURL('image/png')`
- Pass an array of `{ title: string; imageDataUrl: string }` to the PDF generator

## Updated PDF Layout
```text
+------------------------------------------+
|     [Logo/Brand Header with gradient]     |
|        Platform Analytics Report          |
|          Date Range | Generated At        |
+------------------------------------------+
|  [Stat Card] [Stat Card] [Stat Card] ... |
+------------------------------------------+
| [Chart: Projects by Status]  [Chart: Users by Role] |
| [Chart: Services by Category] [Chart: Projects by Region] |
| [Chart: Monthly Donations]   [Chart: Service Approval] |
| [Chart: Monthly Escrow]      [Chart: Hourly Rates]    |
+------------------------------------------+
|           Donor Analytics Section         |
+------------------------------------------+
|        Detailed Data Tables Below         |
|   Projects by Status | Projects by Region |
|   Monthly Donations  | Escrow Transactions|
+------------------------------------------+
|              Footer / Page Info            |
+------------------------------------------+
```

## Files to Modify
1. **`src/lib/report-pdf.ts`** - Complete redesign with chart image support and professional styling
2. **`src/pages/admin/AdminReports.tsx`** - Add chart refs, SVG-to-image capture logic, pass images to PDF generator
