/* ==========================================
   CAREER ADVISOR AI - ATS PDF EXPORTER
   High-Precision ATS CV & Cover Letter Export
   ========================================== */

export const PDFExporter = {
  /**
   * Export CV element from modal directly to PDF (preserves inline edits!)
   */
  exportCVFromModalElement(element, filename = 'Curriculum_Vitae_ATS.pdf') {
    if (!element) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(s => s.outerHTML)
      .join('\n');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename.replace('.pdf', '')}</title>
        <meta charset="UTF-8">
        ${styles}
        <style>
          body { background: #ffffff !important; color: #0f172a !important; padding: 20px; font-family: 'Inter', sans-serif; }
          .cv-preview-paper { box-shadow: none !important; border: none !important; padding: 0 !important; background: #ffffff !important; color: #0f172a !important; }
          .cv-name { color: #0f172a !important; font-size: 2rem !important; }
          .cv-target-title { color: #2563eb !important; }
          .cv-section-title { color: #0f172a !important; border-bottom-color: #e2e8f0 !important; }
          .cv-entry-role { color: #0f172a !important; font-weight: 700 !important; }
          .cv-entry-company { color: #2563eb !important; }
          .cv-entry-date { color: #64748b !important; }
          .cv-summary-text, .cv-bullets li { color: #334155 !important; }
          .cv-skill-tag { background: #f1f5f9 !important; color: #0f172a !important; border: 1px solid #cbd5e1 !important; }
          .cv-skill-tag.matched-tag { background: #e0e7ff !important; color: #4338ca !important; border-color: #a5b4fc !important; }
          @page { size: A4; margin: 15mm; }
          @media print {
            body { padding: 0; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="cv-preview-paper">
          ${element.innerHTML}
        </div>
        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 300);
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  /**
   * Export Cover Letter directly to PDF
   */
  exportCoverLetterToPDF(letterText, candidateName = 'Matteo Tamborrino', jobTitle = '') {
    const printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) return;

    const formattedText = this.escapeHTML(letterText).replace(/\n/g, '<br>');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lettera_di_Presentazione</title>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #0f172a;
            background: #ffffff;
            padding: 40px;
            line-height: 1.75;
            font-size: 1rem;
          }
          .header {
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .name {
            font-size: 1.8rem;
            font-weight: 800;
            color: #0f172a;
          }
          .sub {
            font-size: 0.95rem;
            color: #4f46e5;
            font-weight: 600;
          }
          .body-text {
            color: #334155;
            font-size: 1.02rem;
            white-space: pre-wrap;
          }
          @page { size: A4; margin: 20mm; }
          @media print {
            body { padding: 0; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="name">${this.escapeHTML(candidateName)}</div>
          ${jobTitle ? `<div class="sub">Candidatura per: ${this.escapeHTML(jobTitle)}</div>` : ''}
        </div>
        <div class="body-text">${letterText}</div>
        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 300);
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  },

  /**
   * Render HTML string for CV preview and PDF export
   */
  renderCVHTML(profile) {
    const info = profile.personalInfo || {};
    const skills = profile.skills || { technical: [], soft: [] };
    const experience = profile.experience || [];
    const education = profile.education || [];
    const courses = profile.courses || [];
    const languages = profile.languages || [];

    let summary = info.summary || '';
    if (summary) {
      summary = summary
        .replace(/^([A-Za-zÀ-ü]+\s[A-Za-zÀ-ü]+)\s+è\s+/i, 'Sono ')
        .replace(/^È\s+/i, 'Sono ')
        .replace(/^è\s+/i, 'Sono ');
    }

    return `
      <div class="cv-preview-paper" id="cv-paper" contenteditable="true" style="outline: none;">
        <!-- Header -->
        <header class="cv-header">
          <h1 class="cv-name" contenteditable="true">${this.escapeHTML(info.fullName || '')}</h1>
          <div class="cv-target-title" contenteditable="true">${this.escapeHTML(info.targetTitle || info.title || '')}</div>
          <div class="cv-contact-row">
            ${info.email ? `<span class="cv-contact-item" contenteditable="true">📧 ${this.escapeHTML(info.email)}</span>` : ''}
            ${info.phone ? `<span class="cv-contact-item" contenteditable="true">📱 ${this.escapeHTML(info.phone)}</span>` : ''}
            ${info.location ? `<span class="cv-contact-item" contenteditable="true">📍 ${this.escapeHTML(info.location)}</span>` : ''}
            ${info.linkedin ? `<span class="cv-contact-item" contenteditable="true">🔗 ${this.escapeHTML(info.linkedin)}</span>` : ''}
          </div>
        </header>

        <!-- Summary (First Person) -->
        ${summary ? `
          <section class="cv-section">
            <h3 class="cv-section-title">Profilo Professionale</h3>
            <p class="cv-summary-text" contenteditable="true">${this.escapeHTML(summary)}</p>
          </section>
        ` : ''}

        <!-- Skills -->
        ${(skills.technical || []).length > 0 || (skills.soft || []).length > 0 ? `
        <section class="cv-section">
          <h3 class="cv-section-title">Competenze Tecniche & Soft Skill</h3>
          <div class="cv-skills-container" contenteditable="true">
            ${(skills.technical || []).map(skill => `<span class="cv-skill-tag matched-tag" contenteditable="true">${this.escapeHTML(skill)}</span>`).join('')}
            ${(skills.soft || []).map(skill => `<span class="cv-skill-tag" contenteditable="true">${this.escapeHTML(skill)}</span>`).join('')}
          </div>
        </section>
        ` : ''}

        <!-- Work Experience -->
        ${experience.length > 0 ? `
        <section class="cv-section">
          <h3 class="cv-section-title">Esperienza Lavorativa</h3>
          ${experience.map(exp => `
            <div class="cv-entry">
              <div class="cv-entry-header">
                <div>
                  <span class="cv-entry-role" contenteditable="true">${this.escapeHTML(exp.role || '')}</span>${exp.company ? ` — <span class="cv-entry-company" contenteditable="true">${this.escapeHTML(exp.company)}</span>` : ''}
                </div>
                <span class="cv-entry-date" contenteditable="true">${this.escapeHTML(exp.startDate || '')}${exp.endDate ? ` – ${this.escapeHTML(exp.endDate)}` : ''}</span>
              </div>
              ${(exp.bullets || []).length > 0 ? `
              <ul class="cv-bullets" contenteditable="true">
                ${(exp.bullets || []).map(b => `<li contenteditable="true">${this.escapeHTML(b)}</li>`).join('')}
              </ul>` : ''}
            </div>
          `).join('')}
        </section>
        ` : ''}

        <!-- Education -->
        ${education.length > 0 ? `
          <section class="cv-section">
            <h3 class="cv-section-title">Istruzione e Formazione</h3>
            ${education.map(edu => `
              <div class="cv-entry">
                <div class="cv-entry-header">
                  <div>
                    <span class="cv-entry-role" contenteditable="true">${this.escapeHTML(edu.degree || '')}</span>${edu.institution ? ` — <span class="cv-entry-company" contenteditable="true">${this.escapeHTML(edu.institution)}</span>` : ''}
                  </div>
                  <span class="cv-entry-date" contenteditable="true">${this.escapeHTML(edu.year || '')}</span>
                </div>
              </div>
            `).join('')}
          </section>
        ` : ''}

        <!-- Courses & Certifications -->
        ${courses.length > 0 ? `
          <section class="cv-section">
            <h3 class="cv-section-title">Corsi di Formazione & Certificazioni</h3>
            ${courses.map(crs => `
              <div class="cv-entry">
                <div class="cv-entry-header">
                  <div>
                    <span class="cv-entry-role" contenteditable="true">${this.escapeHTML(crs.name || '')}</span>${crs.issuer ? ` — <span class="cv-entry-company" contenteditable="true">${this.escapeHTML(crs.issuer)}</span>` : ''}
                  </div>
                  <span class="cv-entry-date" contenteditable="true">${this.escapeHTML(crs.year || '')}</span>
                </div>
              </div>
            `).join('')}
          </section>
        ` : ''}

        <!-- Languages -->
        ${languages.length > 0 ? `
          <section class="cv-section">
            <h3 class="cv-section-title">Lingue</h3>
            <div class="cv-skills-container" contenteditable="true">
              ${languages.map(l => `<span class="cv-skill-tag" contenteditable="true"><strong>${this.escapeHTML(l.language)}:</strong> ${this.escapeHTML(l.level)}</span>`).join('')}
            </div>
          </section>
        ` : ''}
      </div>
    `;
  },

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
