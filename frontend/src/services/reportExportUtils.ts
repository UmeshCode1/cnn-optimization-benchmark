/**
 * Export and Print Utilities for Scientific Reports and Platform Documentation
 * Supports TXT, PDF, DOCS (.doc Word-compatible XML/HTML), Markdown, CSV, and JSON
 */

export interface DocumentExportData {
  title: string;
  subtitle?: string;
  author?: string;
  version?: string;
  timestamp?: string;
  sections: Array<{
    title: string;
    content?: string;
    table?: {
      headers: string[];
      rows: (string | number)[][];
    };
    subsections?: Array<{
      title: string;
      content: string;
      codeSnippet?: string;
    }>;
  }>;
}

/**
 * Downloads a file directly in browser
 */
export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates formatted Plain Text (.txt) from structured document data
 */
export function exportToTxt(doc: DocumentExportData, filename: string = 'report.txt') {
  const sep = '='.repeat(80);
  const subsep = '-'.repeat(80);
  const lines: string[] = [
    sep,
    doc.title.toUpperCase(),
    doc.subtitle ? doc.subtitle : '',
    sep,
    `Author     : ${doc.author || 'Umesh Patel (@UmeshCode1)'}`,
    `Platform   : CNN Optimization Benchmark (https://cnn.umeshlabs.in)`,
    `Generated  : ${doc.timestamp || new Date().toISOString()}`,
    `Version    : ${doc.version || 'v2.4 Scientific'}`,
    subsep,
    '',
  ];

  for (const [idx, sec] of doc.sections.entries()) {
    lines.push(`\n${idx + 1}. ${sec.title.toUpperCase()}`);
    lines.push(subsep);
    if (sec.content) {
      lines.push(sec.content);
      lines.push('');
    }

    if (sec.table) {
      const colWidths = sec.table.headers.map((h, i) => {
        let maxLen = h.length;
        for (const row of sec.table!.rows) {
          const val = String(row[i] ?? '');
          if (val.length > maxLen) maxLen = val.length;
        }
        return Math.max(maxLen + 2, 10);
      });

      // Header row
      const headerLine = sec.table.headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ');
      lines.push(headerLine);
      lines.push(colWidths.map((w) => '-'.repeat(w)).join('-|-'));

      // Rows
      for (const row of sec.table.rows) {
        const rowLine = row.map((cell, i) => String(cell ?? '').padEnd(colWidths[i])).join(' | ');
        lines.push(rowLine);
      }
      lines.push('');
    }

    if (sec.subsections) {
      for (const sub of sec.subsections) {
        lines.push(`  * ${sub.title}:`);
        lines.push(`    ${sub.content}`);
        if (sub.codeSnippet) {
          lines.push(`    [Formula / Contract]:`);
          lines.push(`    ${sub.codeSnippet}`);
        }
        lines.push('');
      }
    }
  }

  lines.push(sep);
  lines.push('End of Scientific Report -- CNN Optimization Benchmark Platform');
  lines.push(sep);

  downloadBlob(lines.join('\n'), filename, 'text/plain;charset=utf-8');
}

/**
 * Generates Microsoft Word (.doc) formatted document compatible with MS Word & Google Docs
 */
export function exportToDoc(doc: DocumentExportData, filename: string = 'report.doc') {
  let sectionsHtml = '';

  for (const [idx, sec] of doc.sections.entries()) {
    let tableHtml = '';
    if (sec.table) {
      const ths = sec.table.headers
        .map((h) => `<th style="background:#f1f5f9; padding:8px 10px; border:1px solid #cbd5e1; font-weight:bold; font-size:10pt;">${h}</th>`)
        .join('');
      const trs = sec.table.rows
        .map(
          (row) =>
            `<tr>${row
              .map((c) => `<td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:10pt;">${c}</td>`)
              .join('')}</tr>`
        )
        .join('');
      tableHtml = `<table style="width:100%; border-collapse:collapse; margin:14px 0;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
    }

    let subHtml = '';
    if (sec.subsections) {
      subHtml = sec.subsections
        .map(
          (s) => `
        <div style="margin: 12px 0 16px 16px;">
          <h3 style="font-size:11pt; color:#0369a1; margin-bottom:4px;">${s.title}</h3>
          <p style="font-size:10.5pt; line-height:1.5; color:#334155; margin:0 0 6px 0;">${s.content}</p>
          ${
            s.codeSnippet
              ? `<pre style="background:#f8fafc; border:1px solid #e2e8f0; border-left:3px solid #0284c7; padding:8px 12px; font-family:Consolas, monospace; font-size:9.5pt; white-space:pre-wrap; color:#0f172a;">${s.codeSnippet}</pre>`
              : ''
          }
        </div>
      `
        )
        .join('');
    }

    sectionsHtml += `
      <section style="margin-top:28px;">
        <h2 style="font-size:13pt; color:#0f172a; border-bottom:1.5px solid #e2e8f0; padding-bottom:6px; margin-bottom:12px;">
          ${idx + 1}. ${sec.title}
        </h2>
        ${sec.content ? `<p style="font-size:11pt; line-height:1.6; color:#334155; margin-bottom:12px;">${sec.content}</p>` : ''}
        ${tableHtml}
        ${subHtml}
      </section>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${doc.title}</title>
      <style>
        body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1e293b; margin: 40px; }
        h1 { font-size: 22pt; color: #0f172a; margin-bottom: 4px; }
        .meta-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0284c7; padding: 14px 18px; margin-bottom: 24px; }
      </style>
    </head>
    <body>
      <h1>${doc.title}</h1>
      ${doc.subtitle ? `<p style="font-size:13pt; color:#64748b; margin-top:0; margin-bottom:16px;">${doc.subtitle}</p>` : ''}
      <div class="meta-card">
        <p style="margin:2px 0;"><strong>Author / Research Lead:</strong> ${doc.author || 'Umesh Patel (@UmeshCode1)'}</p>
        <p style="margin:2px 0;"><strong>Platform & System:</strong> CNN Optimization Benchmark (https://cnn.umeshlabs.in)</p>
        <p style="margin:2px 0;"><strong>Document Generated:</strong> ${doc.timestamp || new Date().toLocaleString()}</p>
        <p style="margin:2px 0;"><strong>Version:</strong> ${doc.version || 'v2.4 Scientific Edition'}</p>
      </div>

      ${sectionsHtml}

      <div style="margin-top:40px; padding-top:16px; border-top:1px solid #cbd5e1; font-size:9.5pt; color:#64748b; text-align:center;">
        Generated by CNN Optimization Benchmark Research Platform &bull; https://cnn.umeshlabs.in &bull; MIT License
      </div>
    </body>
    </html>
  `;

  downloadBlob(html, filename, 'application/msword;charset=utf-8');
}

/**
 * Triggers clean, high-fidelity styled Print / Save as PDF view
 */
export function exportToPdf(doc: DocumentExportData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export the PDF report.');
    return;
  }

  let sectionsHtml = '';
  for (const [idx, sec] of doc.sections.entries()) {
    let tableHtml = '';
    if (sec.table) {
      const ths = sec.table.headers
        .map((h) => `<th style="background:#f1f5f9; padding:8px 10px; border:1px solid #cbd5e1; font-weight:600; font-size:9.5pt; text-align:left;">${h}</th>`)
        .join('');
      const trs = sec.table.rows
        .map(
          (row) =>
            `<tr>${row
              .map((c) => `<td style="padding:6px 10px; border:1px solid #e2e8f0; font-size:9.5pt;">${c}</td>`)
              .join('')}</tr>`
        )
        .join('');
      tableHtml = `<table style="width:100%; border-collapse:collapse; margin:12px 0; page-break-inside:avoid;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
    }

    let subHtml = '';
    if (sec.subsections) {
      subHtml = sec.subsections
        .map(
          (s) => `
        <div style="margin: 10px 0 14px 14px; page-break-inside:avoid;">
          <h4 style="font-size:10.5pt; font-weight:700; color:#0284c7; margin:0 0 4px 0;">${s.title}</h4>
          <p style="font-size:10pt; line-height:1.5; color:#334155; margin:0 0 4px 0;">${s.content}</p>
          ${
            s.codeSnippet
              ? `<pre style="background:#f8fafc; border:1px solid #e2e8f0; border-left:3px solid #0284c7; padding:6px 10px; font-family:'Courier New', monospace; font-size:9pt; white-space:pre-wrap; color:#0f172a; margin:4px 0;">${s.codeSnippet}</pre>`
              : ''
          }
        </div>
      `
        )
        .join('');
    }

    sectionsHtml += `
      <section style="margin-top:24px; page-break-inside:avoid;">
        <h3 style="font-size:12pt; font-weight:bold; color:#0f172a; border-bottom:1.5px solid #e2e8f0; padding-bottom:4px; margin-bottom:8px;">
          ${idx + 1}. ${sec.title}
        </h3>
        ${sec.content ? `<p style="font-size:10.5pt; line-height:1.5; color:#334155; margin-bottom:8px;">${sec.content}</p>` : ''}
        ${tableHtml}
        ${subHtml}
      </section>
    `;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${doc.title} - Scientific Report</title>
      <style>
        @page {
          size: A4;
          margin: 15mm 20mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 10pt;
          line-height: 1.5;
          color: #0f172a;
          margin: 0;
          padding: 20px;
        }
        h1 { font-size: 18pt; margin-bottom: 2px; color: #0f172a; }
        .subtitle { font-size: 11pt; color: #64748b; margin-top: 0; margin-bottom: 14px; }
        .meta-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #0284c7;
          padding: 10px 14px;
          margin-bottom: 20px;
          font-size: 9.5pt;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="background:#0284c7; color:#fff; padding:10px 16px; border-radius:6px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:600; font-size:11pt;">Scientific Print / PDF Generator</span>
        <button onclick="window.print()" style="background:#fff; color:#0284c7; border:none; padding:6px 14px; border-radius:4px; font-weight:bold; cursor:pointer;">
          Print / Save as PDF
        </button>
      </div>

      <h1>${doc.title}</h1>
      ${doc.subtitle ? `<div class="subtitle">${doc.subtitle}</div>` : ''}
      <div class="meta-box">
        <div><strong>Author:</strong> ${doc.author || 'Umesh Patel (@UmeshCode1)'} &bull; <strong>Platform:</strong> CNN Optimization Benchmark (https://cnn.umeshlabs.in)</div>
        <div><strong>Date:</strong> ${doc.timestamp || new Date().toLocaleString()} &bull; <strong>Status:</strong> Peer-Reviewed Scientific Standard (${doc.version || 'v2.4'})</div>
      </div>

      ${sectionsHtml}

      <div style="margin-top:30px; padding-top:12px; border-top:1px solid #e2e8f0; text-align:center; font-size:8.5pt; color:#64748b;">
        CNN Optimization Benchmark Platform &bull; Published by Umesh Patel &bull; https://cnn.umeshlabs.in
      </div>

      <script>
        window.onload = function() {
          // Auto open print dialog after slight delay for styles
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}
