/* ==========================================
   CAREER ADVISOR AI - MAIN SPA CONTROLLER
   Complete & Working: Kanban D&D, Cover Letter Modal, CV Modal
   ========================================== */

import { StorageManager } from './storage.js';
import { AIEngine } from './ai-engine.js';
import { PDFExporter } from './pdf-exporter.js';

class App {
  constructor() {
    this.currentView = 'analyzer';
    this.currentAnalysis = null;
    this.tailoredProfile = null;
    this.draggedAppId = null;
    this.popupTimeout = null;
    this.loadingTimeout = null;
    this.uploadedFileUrl = null;
    this.uploadedFileName = localStorage.getItem('ca_uploaded_filename') || '';
    this.uploadedRawText = localStorage.getItem('ca_uploaded_rawtext') || '';

    this.init();
  }

  init() {
    window.app = this;

    // Clean any lingering overlay state on page load
    document.querySelectorAll('.premium-popup-overlay, .modal-overlay').forEach(el => {
      el.classList.remove('active');
    });

    this.bindEvents();
    this.bindCoverLetterModalEvents();
    this.bindKanbanDragDropEvents();
    this.loadProfileIntoUI();
    this.renderTracker();
    this.updateUploadedCVBanner();
  }

  // =============================================
  //  MAIN EVENT BINDING
  // =============================================
  bindEvents() {
    // Navigation
    document.querySelectorAll('.nav-menu [data-view]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        if (view) this.switchView(view);
      });
    });

    // Delegated click on document for any nav element
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('[data-view]');
      if (navItem && navItem.closest('.nav-menu')) {
        const view = navItem.getAttribute('data-view');
        if (view && view !== this.currentView) {
          e.preventDefault();
          this.switchView(view);
        }
      }
    });

    // Analyzer
    document.getElementById('btn-run-analysis')?.addEventListener('click', () => this.handleAnalysis());
    document.getElementById('btn-fetch-url')?.addEventListener('click', () => this.handleFetchURL());
    document.getElementById('btn-sample-job')?.addEventListener('click', () => this.loadSampleJob());
    document.getElementById('btn-generate-tailored-cv')?.addEventListener('click', () => this.handleGenerateTailoredCV());
    document.getElementById('btn-generate-cover-letter')?.addEventListener('click', () => this.handleGenerateCoverLetter());
    document.getElementById('btn-add-to-tracker')?.addEventListener('click', () => this.handleAddToTracker());
    document.getElementById('btn-regenerate-docs')?.addEventListener('click', () => this.handleRegenerateDocuments());

    // Search
    document.getElementById('btn-trigger-profile-search')?.addEventListener('click', () => this.handleAutomaticProfileJobSearch24h());

    // Profile
    document.getElementById('btn-save-profile')?.addEventListener('click', () => this.handleSaveProfile());
    document.getElementById('btn-add-experience')?.addEventListener('click', () => this.handleAddExperience());
    document.getElementById('btn-add-education')?.addEventListener('click', () => this.handleAddEducation());
    document.getElementById('btn-add-course')?.addEventListener('click', () => this.handleAddCourse());

    // Header
    document.getElementById('btn-quick-cv-preview')?.addEventListener('click', () => this.openCVPreviewModal());
    document.getElementById('btn-export-backup')?.addEventListener('click', () => this.handleBackupExport());
    document.getElementById('btn-clear-analysis-fields')?.addEventListener('click', () => {
      this.showConfirmPopup({
        title: 'Conferma Pulizia Campi',
        message: 'Sei sicuro di voler ripulire tutti i campi della sezione Analisi?',
        icon: '🧹',
        confirmText: 'Sì, Pulisci',
        cancelText: 'Annulla',
        onConfirm: () => this.handleClearAnalysisFields()
      });
    });

    // CV Preview Modal
    document.getElementById('btn-close-modal')?.addEventListener('click', () => this.closeCVPreviewModal());
    document.getElementById('btn-modal-close')?.addEventListener('click', () => this.closeCVPreviewModal());
    document.getElementById('btn-modal-print')?.addEventListener('click', () => window.print());

    // Cover Letter inline
    document.getElementById('btn-copy-cover-letter')?.addEventListener('click', () => {
      const text = document.getElementById('cover-letter-text')?.value;
      if (!text) { this.showToast('Nessun testo da copiare!', 'error', 'Lettera Vuota'); return; }
      navigator.clipboard.writeText(text);
      this.showToast('Lettera copiata negli appunti!', 'success', 'Copiato');
    });

    document.getElementById('btn-preview-cover-letter')?.addEventListener('click', () => this.openCoverLetterModal());

    // Document Viewer
    document.getElementById('btn-view-uploaded-document')?.addEventListener('click', () => this.openUploadedDocumentViewer());
    document.getElementById('btn-change-uploaded-cv')?.addEventListener('click', () => document.getElementById('cv-file-input')?.click());
    document.getElementById('btn-close-doc-viewer')?.addEventListener('click', () => this.closeUploadedDocumentViewer());
    document.getElementById('btn-doc-viewer-close')?.addEventListener('click', () => this.closeUploadedDocumentViewer());

    // CV file input
    document.getElementById('cv-file-input')?.addEventListener('change', (e) => this.handleCVFileUpload(e.target.files?.[0]));

    // Dropzone click → trigger file input
    const dropzone = document.getElementById('cv-dropzone');
    if (dropzone) {
      dropzone.addEventListener('click', () => document.getElementById('cv-file-input')?.click());
      dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-active'); });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-active'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-active');
        const file = e.dataTransfer.files?.[0];
        if (file) this.handleCVFileUpload(file);
      });
    }
  }

  // =============================================
  //  COVER LETTER MODAL
  // =============================================
  bindCoverLetterModalEvents() {
    document.getElementById('btn-close-cover-letter-modal')?.addEventListener('click', () => this.closeCoverLetterModal());
    document.getElementById('btn-cover-letter-modal-close')?.addEventListener('click', () => this.closeCoverLetterModal());
    document.getElementById('btn-cover-letter-modal-print')?.addEventListener('click', () => {
      const editableEl = document.getElementById('cover-letter-editable-area');
      const val = editableEl ? editableEl.value : document.getElementById('cover-letter-text')?.value;
      const profile = StorageManager.getProfile();
      PDFExporter.exportCoverLetterToPDF(val || '', profile.personalInfo.fullName);
    });
    document.getElementById('btn-cover-letter-modal-copy')?.addEventListener('click', () => {
      const editableEl = document.getElementById('cover-letter-editable-area');
      const val = editableEl ? editableEl.value : document.getElementById('cover-letter-text')?.value;
      if (val) {
        navigator.clipboard.writeText(val);
        this.showToast('Lettera copiata!', 'success', 'Copiato');
      }
    });
  }

  openCoverLetterModal() {
    const text = this.currentCoverLetterText || document.getElementById('cover-letter-text')?.value;
    if (!text || !text.trim()) {
      this.showToast('Incolla il testo dell\'annuncio e clicca "✉️ Genera Lettera" per crearla!', 'info', 'Genera Lettera');
      return;
    }
    const body = document.getElementById('modal-cover-letter-body');
    const modal = document.getElementById('modal-cover-letter-preview');
    if (body) {
      body.innerHTML = `
        <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 0.85rem 1.15rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.6rem; font-size: 0.92rem; color: #38BDF8;">
          <span>✏️ <strong>Modalità Modifica Attiva:</strong> Puoi modificare il testo della lettera direttamente qui sotto prima di scaricare il PDF.</span>
        </div>
        <textarea id="cover-letter-editable-area" class="form-textarea" style="min-height: 480px; font-family: 'Inter', sans-serif; font-size: 1.02rem; line-height: 1.75; background: #0F1422; color: #F8FAFC; border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 1.5rem;">${this.escapeHTML(text)}</textarea>
      `;
    }
    if (modal) modal.classList.add('active');
  }

  closeCoverLetterModal() {
    document.getElementById('modal-cover-letter-preview')?.classList.remove('active');
  }

  // =============================================
  //  KANBAN DRAG & DROP (ON COLUMNS, not cards)
  // =============================================
  bindKanbanDragDropEvents() {
    document.querySelectorAll('.kanban-column').forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('drag-over');
      });
      col.addEventListener('dragleave', () => {
        col.classList.remove('drag-over');
      });
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const appId = e.dataTransfer.getData('text/plain') || this.draggedAppId;
        const newStatus = col.getAttribute('data-status');
        if (appId && newStatus) {
          StorageManager.updateApplicationStatus(appId, newStatus);
          this.renderTracker();
          // Visual feedback only - no toast popup
        }
      });
    });
  }

  // =============================================
  //  TRACKER RENDER (cards with working controls)
  // =============================================
  renderTracker() {
    const apps = StorageManager.getApplications();
    const statuses = ['interested', 'applied', 'interview', 'offer'];

    statuses.forEach(status => {
      const container = document.getElementById(`container-${status}`);
      const countBadge = document.getElementById(`count-${status}`);
      const filtered = apps.filter(a => a.status === status);
      if (countBadge) countBadge.innerText = filtered.length;

      if (!container) return;

      if (filtered.length === 0) {
        container.innerHTML = '<div style="font-size: 0.88rem; color: var(--text-muted); text-align: center; padding: 1.5rem 0;">Nessuna candidatura</div>';
        return;
      }

      container.innerHTML = filtered.map(app => `
        <div class="kanban-card" draggable="true" data-app-id="${app.id}">
          <div class="kanban-card-title">${this.escapeHTML(app.jobTitle || 'Posizione')}</div>
          <div class="kanban-card-company">🏢 ${this.escapeHTML(app.company || 'Azienda')}</div>
          <div style="display: flex; gap: 0.4rem; margin-top: 0.25rem; flex-wrap: wrap;">
            <span class="badge badge-cyan">Match: ${app.matchScore || 85}%</span>
            ${app.dateAdded ? `<span class="badge badge-slate">${app.dateAdded}</span>` : ''}
          </div>
          <div class="kanban-card-meta" style="margin-top: 0.5rem;">
            <select class="kanban-move-select" data-app-id="${app.id}">
              <option value="interested" ${app.status === 'interested' ? 'selected' : ''}>⭐ Interessato</option>
              <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>🚀 Inviato</option>
              <option value="interview" ${app.status === 'interview' ? 'selected' : ''}>💬 Colloquio</option>
              <option value="offer" ${app.status === 'offer' ? 'selected' : ''}>🎉 Offerta</option>
            </select>
            <button class="btn btn-ghost btn-sm kanban-delete-btn" data-app-id="${app.id}" style="color: var(--accent-rose); padding: 2px 8px; font-size: 1rem;">🗑️</button>
          </div>
        </div>
      `).join('');
    });

    // Bind card events after render
    this.bindKanbanCardEvents();
  }

  bindKanbanCardEvents() {
    // Drag on cards
    document.querySelectorAll('.kanban-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        this.draggedAppId = card.getAttribute('data-app-id');
        e.dataTransfer.setData('text/plain', this.draggedAppId);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
      });
    });

    // Dropdown status change
    document.querySelectorAll('.kanban-move-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const appId = sel.getAttribute('data-app-id');
        const newStatus = e.target.value;
        if (appId && newStatus) {
          StorageManager.updateApplicationStatus(appId, newStatus);
          this.renderTracker();
          this.showToast('Stato candidatura aggiornato!', 'success', 'Stato Aggiornato');
        }
      });
    });

    // Delete buttons
    document.querySelectorAll('.kanban-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const appId = btn.getAttribute('data-app-id');
        if (!appId) return;
        this.showConfirmPopup({
          title: 'Elimina Candidatura',
          message: 'Sei sicuro di voler eliminare questa candidatura dal tracciamento?',
          icon: '🗑️',
          confirmText: 'Sì, Elimina',
          cancelText: 'Annulla',
          onConfirm: () => {
            StorageManager.deleteApplication(appId);
            this.renderTracker();
            this.showToast('Candidatura eliminata.', 'info', 'Eliminata');
          }
        });
      });
    });
  }

  // =============================================
  //  PROFILE LOAD / SAVE
  // =============================================
  loadProfileIntoUI() {
    const profile = StorageManager.getProfile();
    const info = profile.personalInfo || {};

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    
    // Clean name and location
    let cleanName = (info.fullName || 'Matteo Tamborrino')
      .replace(/[\[\]]/g, '')
      .replace(/TAMBORRINOMATTEO/gi, 'Matteo Tamborrino')
      .replace(/\s+/g, ' ')
      .trim();

    let cleanLoc = (info.location || 'Busto Arsizio (VA)')
      .replace(/[\[\]]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanLoc.includes('Busto Arsizio')) cleanLoc = 'Busto Arsizio (VA)';

    set('prof-fullname', cleanName);
    set('prof-title', info.title || 'Commesso / Addetto Accoglienza & Vendite');
    set('prof-email', info.email);
    set('prof-phone', info.phone);
    set('prof-location', cleanLoc);
    set('prof-linkedin', info.linkedin);
    set('prof-summary', info.summary);

    // Update sidebar badge
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarTitle = document.getElementById('sidebar-user-title');
    const avatarInitials = document.getElementById('user-avatar-initials');

    if (sidebarName) sidebarName.innerText = cleanName;
    if (sidebarTitle) sidebarTitle.innerText = cleanLoc;

    if (avatarInitials) {
      const parts = cleanName.split(' ').filter(Boolean);
      let initials = 'MT';
      if (parts.length >= 2) initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      else if (parts.length === 1 && parts[0].length >= 2) initials = parts[0].substring(0, 2).toUpperCase();
      avatarInitials.innerText = initials;
    }

    // Skills
    const techEl = document.getElementById('prof-tech-skills');
    const softEl = document.getElementById('prof-soft-skills');
    if (techEl) techEl.value = (profile.skills?.technical || []).join(', ');
    if (softEl) softEl.value = (profile.skills?.soft || []).join(', ');

    // Render lists
    this.renderExperienceList(profile.experience || []);
    this.renderEducationList(profile.education || []);
    this.renderCourseList(profile.courses || []);
  }

  renderExperienceList(experiences) {
    const container = document.getElementById('container-profile-experiences');
    if (!container) return;
    if (!experiences.length) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:0.95rem;text-align:center;padding:1rem;">Nessuna esperienza inserita. Clicca "+ Aggiungi Esperienza".</div>';
      return;
    }
    container.innerHTML = experiences.map((exp, idx) => `
      <div class="editable-item profile-timeline-card" data-exp-id="${this.escapeHTML(exp.id || 'exp-'+idx)}" style="background: rgba(15, 20, 34, 0.65); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 1.35rem 1.5rem; margin-bottom: 0.5rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:0.6rem;">
          <span style="font-size:0.85rem;letter-spacing:0.05em;color:#38BDF8;font-weight:700;text-transform:uppercase;">💼 ESPERIENZA ${idx+1}</span>
          <button class="btn btn-ghost btn-sm delete-exp-btn" data-exp-id="${this.escapeHTML(exp.id || 'exp-'+idx)}" style="color:#FB7185;padding:4px 12px;font-size:0.82rem;background:rgba(251,113,133,0.12);border-radius:8px;">🗑️ Rimuovi</button>
        </div>
        <div class="grid-2" style="gap:1rem;">
          <div class="form-group" style="margin:0;">
            <label class="form-label" style="font-size:0.88rem;font-weight:600;color:#94A3B8;">Ruolo / Posizione</label>
            <input class="form-input exp-role" style="font-size:1rem;color:#F8FAFC;background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.1);" value="${this.escapeHTML(exp.role || '')}" placeholder="es. Commesso / Addetto Vendite">
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label" style="font-size:0.88rem;font-weight:600;color:#94A3B8;">Azienda / Datore di Lavoro</label>
            <input class="form-input exp-company" style="font-size:1rem;color:#F8FAFC;background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.1);" value="${this.escapeHTML(exp.company || '')}" placeholder="es. OBI Italia">
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label" style="font-size:0.88rem;font-weight:600;color:#94A3B8;">Data Inizio</label>
            <input class="form-input exp-start" style="font-size:1rem;color:#F8FAFC;background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.1);" value="${this.escapeHTML(exp.startDate || '')}" placeholder="es. 01/2023">
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label" style="font-size:0.88rem;font-weight:600;color:#94A3B8;">Data Fine</label>
            <input class="form-input exp-end" style="font-size:1rem;color:#F8FAFC;background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.1);" value="${this.escapeHTML(exp.endDate || '')}" placeholder="es. In corso / 12/2024">
          </div>
        </div>
        <div class="form-group" style="margin:1rem 0 0;">
          <label class="form-label" style="font-size:0.88rem;font-weight:600;color:#94A3B8;">Mansioni e Responsabilità Dettagliate</label>
          <textarea class="form-textarea exp-bullets" style="min-height:85px;font-size:0.95rem;line-height:1.6;color:#F8FAFC;background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.1);" placeholder="es. Accoglienza clienti; Gestione cassa e POS; Riassortimento scaffali">${this.escapeHTML((exp.bullets||[]).join('\n'))}</textarea>
        </div>
      </div>
    `).join('');

    // Bind delete buttons
    container.querySelectorAll('.delete-exp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-exp-id');
        const profile = StorageManager.getProfile();
        profile.experience = (profile.experience || []).filter(e => e.id !== id);
        StorageManager.saveProfile(profile);
        this.renderExperienceList(profile.experience);
        this.showToast('Esperienza rimossa.', 'info', 'Rimosso');
      });
    });
  }

  renderEducationList(educations) {
    const container = document.getElementById('container-profile-education');
    if (!container) return;
    if (!educations.length) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:0.95rem;text-align:center;padding:1rem;">Nessun titolo inserito. Clicca "+ Aggiungi Istruzione".</div>';
      return;
    }
    container.innerHTML = educations.map((edu, idx) => `
      <div class="editable-item profile-timeline-card" data-edu-id="${this.escapeHTML(edu.id || 'edu-'+idx)}" style="background: rgba(15, 20, 34, 0.65); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 1.35rem 1.5rem; margin-bottom: 0.5rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:0.6rem;">
          <span style="font-size:0.85rem;letter-spacing:0.05em;color:#818CF8;font-weight:700;text-transform:uppercase;">🎓 ISTRUZIONE ${idx+1}</span>
          <button class="btn btn-ghost btn-sm delete-edu-btn" data-edu-id="${this.escapeHTML(edu.id || 'edu-'+idx)}" style="color:#FB7185;padding:4px 12px;font-size:0.82rem;background:rgba(251,113,133,0.12);border-radius:8px;">🗑️ Rimuovi</button>
        </div>
        <div class="grid-2" style="gap:1rem;">
          <div class="form-group" style="margin:0;">
            <label class="form-label" style="font-size:0.88rem;font-weight:600;color:#94A3B8;">Titolo di Studio / Diploma</label>
            <input class="form-input edu-degree" style="font-size:1rem;color:#F8FAFC;background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.1);" value="${this.escapeHTML(edu.degree || '')}" placeholder="es. Diploma di Ragioneria">
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label" style="font-size:0.88rem;font-weight:600;color:#94A3B8;">Istituto / Università</label>
            <input class="form-input edu-institution" style="font-size:1rem;color:#F8FAFC;background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.1);" value="${this.escapeHTML(edu.institution || '')}" placeholder="es. Liceo Scientifico Manzoni">
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label" style="font-size:0.88rem;font-weight:600;color:#94A3B8;">Anno Conseguimento</label>
            <input class="form-input edu-year" style="font-size:1rem;color:#F8FAFC;background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.1);" value="${this.escapeHTML(edu.year || '')}" placeholder="es. 2021">
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.delete-edu-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edu-id');
        const profile = StorageManager.getProfile();
        profile.education = (profile.education || []).filter(e => e.id !== id);
        StorageManager.saveProfile(profile);
        this.renderEducationList(profile.education);
        this.showToast('Istruzione rimossa.', 'info', 'Rimosso');
      });
    });
  }

  renderCourseList(courses) {
    const container = document.getElementById('container-profile-courses');
    if (!container) return;
    if (!courses.length) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:0.95rem;text-align:center;padding:1rem;">Nessun corso inserito. Clicca "+ Aggiungi Corso".</div>';
      return;
    }
    container.innerHTML = courses.map((crs, idx) => `
      <div class="editable-item profile-timeline-card" data-crs-id="${this.escapeHTML(crs.id || 'crs-'+idx)}" style="background: rgba(15, 20, 34, 0.65); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 1.35rem 1.5rem; margin-bottom: 0.5rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:0.6rem;">
          <span style="font-size:0.85rem;letter-spacing:0.05em;color:#34D399;font-weight:700;text-transform:uppercase;">📜 CORSO / CERTIFICAZIONE ${idx+1}</span>
          <button class="btn btn-ghost btn-sm delete-crs-btn" data-crs-id="${this.escapeHTML(crs.id || 'crs-'+idx)}" style="color:#FB7185;padding:4px 12px;font-size:0.82rem;background:rgba(251,113,133,0.12);border-radius:8px;">🗑️ Rimuovi</button>
        </div>
        <div class="grid-2" style="gap:1rem;">
          <div class="form-group" style="margin:0;">
            <label class="form-label" style="font-size:0.88rem;font-weight:600;color:#94A3B8;">Nome Corso / Certificazione</label>
            <input class="form-input crs-name" style="font-size:1rem;color:#F8FAFC;background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.1);" value="${this.escapeHTML(crs.name || '')}" placeholder="es. Corso Sicurezza D.Lgs 81/08">
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label" style="font-size:0.88rem;font-weight:600;color:#94A3B8;">Ente Erogatore</label>
            <input class="form-input crs-issuer" style="font-size:1rem;color:#F8FAFC;background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.1);" value="${this.escapeHTML(crs.issuer || '')}" placeholder="es. Ente Accreditato">
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label" style="font-size:0.88rem;font-weight:600;color:#94A3B8;">Anno</label>
            <input class="form-input crs-year" style="font-size:1rem;color:#F8FAFC;background:rgba(0,0,0,0.3);border-color:rgba(255,255,255,0.1);" value="${this.escapeHTML(crs.year || '')}" placeholder="es. 2023">
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.delete-crs-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-crs-id');
        const profile = StorageManager.getProfile();
        profile.courses = (profile.courses || []).filter(c => c.id !== id);
        StorageManager.saveProfile(profile);
        this.renderCourseList(profile.courses);
        this.showToast('Corso rimosso.', 'info', 'Rimosso');
      });
    });
  }

  handleSaveProfile() {
    const profile = StorageManager.getProfile();

    const get = (id) => document.getElementById(id)?.value?.trim() || '';
    profile.personalInfo = {
      ...profile.personalInfo,
      fullName: get('prof-fullname'),
      title: get('prof-title'),
      email: get('prof-email'),
      phone: get('prof-phone'),
      location: get('prof-location'),
      linkedin: get('prof-linkedin'),
      summary: get('prof-summary')
    };

    const techRaw = get('prof-tech-skills');
    const softRaw = get('prof-soft-skills');
    profile.skills = {
      technical: techRaw ? techRaw.split(',').map(s => s.trim()).filter(Boolean) : profile.skills?.technical || [],
      soft: softRaw ? softRaw.split(',').map(s => s.trim()).filter(Boolean) : profile.skills?.soft || []
    };

    // Collect experiences from inline editable cards
    const expCards = document.querySelectorAll('#container-profile-experiences .editable-item');
    profile.experience = Array.from(expCards).map(card => {
      const bulletsRaw = card.querySelector('.exp-bullets')?.value || '';
      const bullets = bulletsRaw.split(/[;\n]/).map(s => s.trim()).filter(Boolean);
      return {
        id: card.getAttribute('data-exp-id') || 'exp-' + Date.now(),
        role: card.querySelector('.exp-role')?.value?.trim() || '',
        company: card.querySelector('.exp-company')?.value?.trim() || '',
        startDate: card.querySelector('.exp-start')?.value?.trim() || '',
        endDate: card.querySelector('.exp-end')?.value?.trim() || '',
        bullets
      };
    }).filter(e => e.role || e.company);

    // Collect education from inline editable cards
    const eduCards = document.querySelectorAll('#container-profile-education .editable-item');
    profile.education = Array.from(eduCards).map(card => ({
      id: card.getAttribute('data-edu-id') || 'edu-' + Date.now(),
      degree: card.querySelector('.edu-degree')?.value?.trim() || '',
      institution: card.querySelector('.edu-institution')?.value?.trim() || '',
      year: card.querySelector('.edu-year')?.value?.trim() || ''
    })).filter(e => e.degree);

    // Collect courses from inline editable cards
    const crsCards = document.querySelectorAll('#container-profile-courses .editable-item');
    profile.courses = Array.from(crsCards).map(card => ({
      id: card.getAttribute('data-crs-id') || 'crs-' + Date.now(),
      name: card.querySelector('.crs-name')?.value?.trim() || '',
      issuer: card.querySelector('.crs-issuer')?.value?.trim() || '',
      year: card.querySelector('.crs-year')?.value?.trim() || ''
    })).filter(c => c.name);

    StorageManager.saveProfile(profile);

    // Refresh UI to update sidebar initials and clean layout
    this.loadProfileIntoUI();

    this.showToast('Profilo salvato con successo!', 'success', 'Profilo Aggiornato');
  }

  handleAddExperience() {
    const role = prompt('Ruolo / Posizione:');
    if (!role) return;
    const company = prompt('Azienda:') || '';
    const startDate = prompt('Data inizio (es. 01/2022):') || '';
    const endDate = prompt('Data fine (es. 12/2023 o Presente):') || '';
    const bulletsRaw = prompt('Mansioni principali (separate da ; ):') || '';
    const bullets = bulletsRaw.split(';').map(s => s.trim()).filter(Boolean);

    const profile = StorageManager.getProfile();
    profile.experience = profile.experience || [];
    profile.experience.unshift({ id: 'exp-' + Date.now(), role, company, startDate, endDate, bullets });
    StorageManager.saveProfile(profile);
    this.renderExperienceList(profile.experience);
    this.showToast(`Esperienza "${role}" aggiunta!`, 'success', 'Esperienza Aggiunta');
  }

  handleAddEducation() {
    const degree = prompt('Titolo di Studio:');
    if (!degree) return;
    const institution = prompt('Istituto / Università:') || '';
    const year = prompt('Anno di conseguimento:') || '';

    const profile = StorageManager.getProfile();
    profile.education = profile.education || [];
    profile.education.push({ id: 'edu-' + Date.now(), degree, institution, year });
    StorageManager.saveProfile(profile);
    this.renderEducationList(profile.education);
    this.showToast('Titolo di studio aggiunto!', 'success', 'Istruzione Aggiunta');
  }

  handleAddCourse() {
    const name = prompt('Nome del Corso / Certificazione:');
    if (!name) return;
    const issuer = prompt('Ente / Istituto Erogatore:') || '';
    const year = prompt('Anno:') || '';

    const profile = StorageManager.getProfile();
    profile.courses = profile.courses || [];
    profile.courses.push({ id: 'crs-' + Date.now(), name, issuer, year });
    StorageManager.saveProfile(profile);
    this.renderCourseList(profile.courses);
    this.showToast('Corso aggiunto!', 'success', 'Corso Aggiunto');
  }

  // =============================================
  //  VIEWS
  // =============================================
  switchView(viewId) {
    console.log('switchView requested for:', viewId);
    if (!viewId) return;

    this.currentView = viewId;

    // Toggle active state on menu items
    document.querySelectorAll('.nav-menu .nav-item').forEach(item => {
      const isMatch = item.getAttribute('data-view') === viewId;
      if (isMatch) item.classList.add('active');
      else item.classList.remove('active');
    });

    // Toggle display of view panels
    document.querySelectorAll('.view-panel').forEach(panel => {
      if (panel.id === `view-${viewId}`) {
        panel.style.setProperty('display', 'block', 'important');
      } else {
        panel.style.setProperty('display', 'none', 'important');
      }
    });

    const titles = {
      analyzer: '🎯 Analisi Annuncio & CV su Misura',
      search: '🔍 Ricerca Annunci AI (Ultime 24h)',
      profile: '👤 Profilo Base & CV Master',
      tracker: '📋 Tracciamento Candidature (Kanban)'
    };
    const titleElem = document.getElementById('view-title');
    if (titleElem) titleElem.innerText = titles[viewId] || 'Career Advisor AI';

    const isAnalyzer = viewId === 'analyzer';
    const btnClear = document.getElementById('btn-clear-analysis-fields');
    const btnPreview = document.getElementById('btn-quick-cv-preview');
    if (btnClear) btnClear.style.display = isAnalyzer ? 'inline-flex' : 'none';
    if (btnPreview) btnPreview.style.display = isAnalyzer ? 'inline-flex' : 'none';

    window.scrollTo({ top: 0, behavior: 'instant' });

    // Auto-render search links when opening the search tab
    if (viewId === 'search') {
      this.renderSearchLinks();
    }
  }

  // =============================================
  //  AI LOADING OVERLAY
  // =============================================
  showAILoading() {
    document.getElementById('ai-loading-overlay')?.classList.add('active');
    if (this.loadingTimeout) clearTimeout(this.loadingTimeout);
    this.loadingTimeout = setTimeout(() => this.hideAILoading(), 3500);
  }

  hideAILoading() {
    if (this.loadingTimeout) clearTimeout(this.loadingTimeout);
    document.getElementById('ai-loading-overlay')?.classList.remove('active');
  }

  // =============================================
  //  ANALYSIS
  // =============================================
  async handleAnalysis() {
    const jobText = document.getElementById('job-text-input')?.value;
    const profile = StorageManager.getProfile();

    if (!jobText || jobText.trim().length < 15) {
      this.showToast('Inserisci il testo dell\'annuncio prima di analizzare.', 'error', 'Annuncio Mancante');
      return;
    }

    this.showAILoading();

    try {
      const analysis = await AIEngine.analyzeJobOffer(jobText, profile);

      const customTitle = document.getElementById('job-title-input')?.value?.trim();
      const customCompany = document.getElementById('job-company-input')?.value?.trim();
      if (customTitle) analysis.jobTitle = customTitle;
      if (customCompany) analysis.company = customCompany;

      const titleEl = document.getElementById('job-title-input');
      const compEl = document.getElementById('job-company-input');
      if (titleEl) titleEl.value = analysis.jobTitle;
      if (compEl) compEl.value = analysis.company;

      this.currentAnalysis = analysis;
      this.renderAnalysisResult(analysis);
      this.handleGenerateCoverLetter();

      this.showToast(`Analisi completata per "${analysis.company}"! Match: ${analysis.matchPercentage}%`, 'success', 'Analisi Completata');
    } catch (e) {
      if (e.message === 'KEY_MISSING') {
        this.showToast('Chiave API Gemini non configurata in js/api-key.js!', 'error', 'Chiave API Mancante');
      } else {
        this.showToast(e.message, 'error', 'Errore Analisi');
      }
    } finally {
      this.hideAILoading();
    }
  }

  renderAnalysisResult(analysis) {
    const score = analysis.matchPercentage;
    const offset = 283 - (283 * score) / 100;
    const circle = document.getElementById('gauge-circle-progress');
    const scoreText = document.getElementById('gauge-score-value');
    const badge = document.getElementById('match-status-badge');
    if (circle) circle.style.strokeDashoffset = offset;
    if (scoreText) scoreText.innerHTML = `${score}<span>%</span>`;
    document.getElementById('analysis-job-title')?.innerText !== undefined && (document.getElementById('analysis-job-title').innerText = analysis.jobTitle || '');
    document.getElementById('analysis-job-company')?.innerText !== undefined && (document.getElementById('analysis-job-company').innerText = `Azienda: ${analysis.company || ''}`);

    if (badge) {
      if (score >= 80) { badge.className = 'badge badge-emerald'; badge.innerText = 'Eccellente Match'; }
      else if (score >= 60) { badge.className = 'badge badge-cyan'; badge.innerText = 'Buon Match ATS'; }
      else { badge.className = 'badge badge-rose'; badge.innerText = 'Match Medio / Gap Presenti'; }
    }

    const scam = analysis.scamRadar || {};
    const scamBox = document.getElementById('card-scam-radar');
    const scamBadge = document.getElementById('scam-risk-badge');
    if (document.getElementById('scam-warning-text')) document.getElementById('scam-warning-text').innerText = scam.warningMessage || '';
    if (document.getElementById('scam-ai-reasoning')) document.getElementById('scam-ai-reasoning').innerText = scam.aiReasoning || '';

    if (scamBox && scamBadge) {
      if (scam.riskLevel === 'HIGH') {
        scamBox.style.borderLeftColor = 'var(--accent-rose)';
        scamBadge.className = 'badge badge-rose';
        scamBadge.innerText = '⚠️ Rischio Elevato';
      } else {
        scamBox.style.borderLeftColor = 'var(--accent-emerald)';
        scamBadge.className = 'badge badge-emerald';
        scamBadge.innerText = '✓ Rischio Basso';
      }
    }

    const flagsList = document.getElementById('scam-flags-list');
    if (flagsList) {
      if ((scam.redFlagsFound || []).length > 0) {
        flagsList.innerHTML = scam.redFlagsFound.map(f => `<div style="font-size:0.88rem;color:#FB7185;">• <strong>${f.label}</strong></div>`).join('');
      } else {
        flagsList.innerHTML = '<div style="font-size:0.88rem;color:#34D399;">✓ Nessun segnale di scam rilevato.</div>';
      }
    }

    const matchedContainer = document.getElementById('container-matched-skills');
    if (matchedContainer) {
      matchedContainer.innerHTML = (analysis.matchedSkills || []).length > 0
        ? analysis.matchedSkills.map(s => `<span class="cv-skill-tag matched-tag">✓ ${s}</span>`).join('')
        : '<span class="badge badge-slate">Nessuna corrispondenza trovata</span>';
    }

    const missingContainer = document.getElementById('container-missing-skills');
    if (missingContainer) {
      missingContainer.innerHTML = (analysis.missingSkills || []).length > 0
        ? analysis.missingSkills.map(s => `<span class="cv-skill-tag">⚡ ${s}</span>`).join('')
        : '<span class="badge badge-emerald">✓ Nessuna skill critica mancante!</span>';
    }
  }

  handleClearAnalysisFields() {
    ['job-title-input', 'job-company-input', 'job-text-input'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const circle = document.getElementById('gauge-circle-progress');
    const scoreText = document.getElementById('gauge-score-value');
    const badge = document.getElementById('match-status-badge');
    if (circle) circle.style.strokeDashoffset = 283;
    if (scoreText) scoreText.innerHTML = '0<span>%</span>';
    if (badge) { badge.className = 'badge badge-cyan'; badge.innerText = 'Pronto per Analisi'; }
    document.getElementById('analysis-job-title') && (document.getElementById('analysis-job-title').innerText = 'Nessun annuncio inserito');
    document.getElementById('analysis-job-company') && (document.getElementById('analysis-job-company').innerText = 'Incolla il testo dell\'annuncio di lavoro.');
    document.getElementById('container-matched-skills') && (document.getElementById('container-matched-skills').innerHTML = '<span class="badge badge-slate">In attesa di analisi...</span>');
    document.getElementById('container-missing-skills') && (document.getElementById('container-missing-skills').innerHTML = '<span class="badge badge-slate">In attesa di analisi...</span>');
    this.currentAnalysis = null;
    this.showToast('Campi puliti!', 'success', 'Campi Puliti');
  }

  async handleFetchURL() {
    const url = document.getElementById('job-url-input')?.value;
    if (!url?.startsWith('http')) {
      this.showToast('Inserisci un URL valido!', 'error', 'URL Non Valido');
      return;
    }
    this.showToast('Estrazione testo in corso...', 'info', 'Scraping');
    try {
      const text = await AIEngine.extractJobFromURL(url);
      const el = document.getElementById('job-text-input');
      if (el) el.value = text;
      this.showToast('Testo estratto!', 'success', 'Estratto');
      this.handleAnalysis();
    } catch (e) {
      this.showToast(e.message, 'error', 'Estrazione Fallita');
    }
  }

  loadSampleJob() {
    const sampleJob = `Azienda Seleziona Brand Ambassador & Promoter per Stand nei Centri Commerciali e Fiere a Milano.
Non si richiede alcuna esperienza! Inserimento immediato per 5 figure giovanili e dinamiche.
Possibilità di crescita manageriale lampo in soli 6 mesi.
Retribuzione a provvigioni con guadagni illimitati legate al raggiungimento degli obiettivi.
Attività di marketing diretto e fundraising per strada e piazze.`.trim();

    const t = document.getElementById('job-title-input'); if (t) t.value = 'Brand Ambassador / Promoter';
    const c = document.getElementById('job-company-input'); if (c) c.value = 'Direct Marketing Studio';
    const tx = document.getElementById('job-text-input'); if (tx) tx.value = sampleJob;
    this.handleAnalysis();
  }

  // =============================================
  //  GENERATE CV & COVER LETTER
  // =============================================

  /**
   * Validates that position and company are filled.
   * Returns true if valid, shows warning and returns false if not.
   */
  validatePositionAndCompany() {
    const title = document.getElementById('job-title-input')?.value?.trim();
    const company = document.getElementById('job-company-input')?.value?.trim();
    if (!title && !company) {
      this.showToast('Inserisci il nome della posizione e dell\'azienda nei campi appositi prima di generare i documenti.', 'error', 'Dati Mancanti');
      document.getElementById('job-title-input')?.focus();
      return false;
    }
    if (!title) {
      this.showToast('Inserisci il nome della posizione (es. Addetto Vendite, Commesso...) nel campo apposito.', 'error', 'Posizione Mancante');
      document.getElementById('job-title-input')?.focus();
      return false;
    }
    if (!company) {
      this.showToast('Inserisci il nome dell\'azienda nel campo apposito.', 'error', 'Azienda Mancante');
      document.getElementById('job-company-input')?.focus();
      return false;
    }
    return true;
  }

  /** Rigenera CV e Lettera con i valori corretti nei campi */
  handleRegenerateDocuments() {
    const jobText = document.getElementById('job-text-input')?.value;
    if (!jobText || jobText.trim().length < 15) {
      this.showToast('Incolla prima il testo dell\'annuncio.', 'error', 'Annuncio Mancante');
      return;
    }
    if (!this.validatePositionAndCompany()) return;

    const profile = StorageManager.getProfile();
    const uiTitle = document.getElementById('job-title-input').value.trim();
    const uiCompany = document.getElementById('job-company-input').value.trim();

    // Rigenera CV con i dati aggiornati
    const { profile: tailored } = AIEngine.generateTailoredCV(jobText, profile);
    tailored.personalInfo.targetTitle = uiTitle;
    this.tailoredProfile = tailored;

    // Rigenera Lettera con i dati aggiornati
    const letterResult = AIEngine.generateCoverLetter(jobText, profile, uiTitle, uiCompany);
    const textArea = document.getElementById('cover-letter-text');
    if (textArea) textArea.value = letterResult.letterText;

    this.showToast(`CV e lettera rigenerati per "${uiTitle}" presso ${uiCompany}!`, 'success', 'Documenti Aggiornati');

    const card = document.getElementById('card-integrated-cover-letter');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }  // fine handleRegenerateDocuments

  handleGenerateTailoredCV() {
    const jobText = document.getElementById('job-text-input')?.value;
    if (!jobText) { this.showToast('Incolla prima un annuncio!', 'error', 'Annuncio Mancante'); return; }
    if (!this.validatePositionAndCompany()) return;

    const profile = StorageManager.getProfile();
    const { profile: tailored } = AIEngine.generateTailoredCV(jobText, profile);
    const uiTitle = document.getElementById('job-title-input')?.value?.trim();
    if (uiTitle) tailored.personalInfo.targetTitle = uiTitle;

    this.tailoredProfile = tailored;
    this.openCVPreviewModal(tailored);
    this.showToast('CV su misura generato!', 'success', 'CV Generato');
  }


  handleGenerateCoverLetter() {
    const jobText = document.getElementById('job-text-input')?.value || '';
    if (!jobText || jobText.trim().length < 15) {
      this.showToast('Incolla prima il testo dell\'annuncio!', 'error', 'Annuncio Mancante');
      return;
    }
    const profile = StorageManager.getProfile();

    const uiTitle = document.getElementById('job-title-input')?.value?.trim();
    const uiCompany = document.getElementById('job-company-input')?.value?.trim();

    const result = AIEngine.generateCoverLetter(jobText, profile, uiTitle, uiCompany);
    this.currentCoverLetterText = result.letterText;

    this.openCoverLetterModal();
    this.showToast('Lettera di presentazione generata!', 'success', 'Lettera Generata');
  }

  // =============================================
  //  ADD TO TRACKER
  // =============================================
  handleAddToTracker() {
    const jobTitle = document.getElementById('job-title-input')?.value?.trim()
      || this.currentAnalysis?.jobTitle || 'Posizione Lavorativa';
    const company = document.getElementById('job-company-input')?.value?.trim()
      || this.currentAnalysis?.company || 'Azienda';
    const jobText = document.getElementById('job-text-input')?.value || '';

    StorageManager.saveApplication({
      jobTitle,
      company,
      description: jobText,
      matchScore: this.currentAnalysis?.matchPercentage || 85,
      status: 'interested',
      location: 'Busto Arsizio (VA)',
      notes: 'Analizzato con Career Advisor AI'
    });

    this.renderTracker();
    this.switchView('tracker');
    this.showToast(`"${jobTitle}" aggiunta al tracciamento!`, 'success', 'Candidatura Aggiunta');
  }

  // =============================================
  //  SEARCH AI 24H
  // =============================================
  handleAutomaticProfileJobSearch24h() {
    this.renderSearchLinks();
  }

  renderSearchLinks() {
    const container = document.getElementById('container-search-results');
    if (!container) return;

    // 6 real search categories matching candidate's actual experience sectors
    // Each card has 3 real search portal links (Indeed, InfoJobs, LinkedIn) pre-filtered for Busto Arsizio zone
    const categories = [
      {
        icon: '🛒',
        title: 'Addetto Vendite & Commesso/a',
        desc: 'Posizioni in negozi, supermercati, GDO e punti vendita al dettaglio nella zona di Busto Arsizio, Gallarate e Legnano.',
        badges: ['Retail', 'GDO', 'Cassa'],
        portals: [
          { name: 'Indeed', url: 'https://it.indeed.com/offerte-lavoro?q=addetto+vendite+commesso&l=Busto+Arsizio%2C+VA&radius=25', color: '#2164f3' },
          { name: 'InfoJobs', url: 'https://www.infojobs.it/offerte-lavoro/addetto-vendite/en-busto-arsizio_va.xhtml', color: '#ff6600' },
          { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=addetto%20vendite%20commesso&location=Busto%20Arsizio%2C%20Lombardia%2C%20Italia&distance=25', color: '#0a66c2' }
        ]
      },
      {
        icon: '🎬',
        title: 'Accoglienza Cinema & Multiplex',
        desc: 'Addetto alle sale, maschera, accoglienza spettatori e assistenza al bar nei cinema della zona.',
        badges: ['Cinema', 'Multiplex', 'Accoglienza'],
        portals: [
          { name: 'Indeed', url: 'https://it.indeed.com/offerte-lavoro?q=addetto+cinema+multiplex+accoglienza&l=Busto+Arsizio%2C+VA&radius=30', color: '#2164f3' },
          { name: 'InfoJobs', url: 'https://www.infojobs.it/offerte-lavoro/accoglienza/en-busto-arsizio_va.xhtml', color: '#ff6600' },
          { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=addetto%20accoglienza%20cinema&location=Busto%20Arsizio%2C%20Lombardia%2C%20Italia', color: '#0a66c2' }
        ]
      },
      {
        icon: '🍸',
        title: 'Bartender & Barista',
        desc: 'Bar, caffetterie, locali serali e strutture eventi che cercano bartender o barista nella zona di Busto Arsizio e Varese.',
        badges: ['Bar', 'Bartending', 'Ristorazione'],
        portals: [
          { name: 'Indeed', url: 'https://it.indeed.com/offerte-lavoro?q=bartender+barista&l=Busto+Arsizio%2C+VA&radius=25', color: '#2164f3' },
          { name: 'InfoJobs', url: 'https://www.infojobs.it/offerte-lavoro/barista/en-busto-arsizio_va.xhtml', color: '#ff6600' },
          { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=bartender%20barista&location=Busto%20Arsizio%2C%20Lombardia%2C%20Italia', color: '#0a66c2' }
        ]
      },
      {
        icon: '📣',
        title: 'Promoter & Brand Ambassador',
        desc: 'Attività promozionali in stand, gallerie e centri commerciali nella zona di Milano, Varese e Busto Arsizio.',
        badges: ['Promozioni', 'Stand', 'Marketing'],
        portals: [
          { name: 'Indeed', url: 'https://it.indeed.com/offerte-lavoro?q=promoter+brand+ambassador&l=Busto+Arsizio%2C+VA&radius=30', color: '#2164f3' },
          { name: 'InfoJobs', url: 'https://www.infojobs.it/offerte-lavoro/promoter/en-busto-arsizio_va.xhtml', color: '#ff6600' },
          { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=promoter%20brand%20ambassador&location=Busto%20Arsizio%2C%20Lombardia%2C%20Italia', color: '#0a66c2' }
        ]
      },
      {
        icon: '🛎️',
        title: 'Receptionist & Accoglienza',
        desc: 'Reception di hotel, strutture ricettive, uffici e centri servizi nella zona di Busto Arsizio, Gallarate e Malpensa.',
        badges: ['Reception', 'Check-in', 'Accoglienza'],
        portals: [
          { name: 'Indeed', url: 'https://it.indeed.com/offerte-lavoro?q=receptionist+accoglienza&l=Busto+Arsizio%2C+VA&radius=25', color: '#2164f3' },
          { name: 'InfoJobs', url: 'https://www.infojobs.it/offerte-lavoro/receptionist/en-busto-arsizio_va.xhtml', color: '#ff6600' },
          { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=receptionist%20accoglienza&location=Busto%20Arsizio%2C%20Lombardia%2C%20Italia', color: '#0a66c2' }
        ]
      },
      {
        icon: '📦',
        title: 'Magazziniere & Logistica',
        desc: 'Addetti al magazzino, scaffalisti e operatori logistici in punti vendita e centri distribuzione della zona.',
        badges: ['Magazzino', 'Scaffalista', 'Logistica'],
        portals: [
          { name: 'Indeed', url: 'https://it.indeed.com/offerte-lavoro?q=magazziniere+scaffalista&l=Busto+Arsizio%2C+VA&radius=20', color: '#2164f3' },
          { name: 'InfoJobs', url: 'https://www.infojobs.it/offerte-lavoro/magazziniere/en-busto-arsizio_va.xhtml', color: '#ff6600' },
          { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=magazziniere%20scaffalista&location=Busto%20Arsizio%2C%20Lombardia%2C%20Italia', color: '#0a66c2' }
        ]
      },
      {
        icon: '💻',
        title: 'Customer Service & Supporto Remoto',
        desc: 'Posizioni di assistenza clienti via chat, email e telefono in full remote da tutta Italia.',
        badges: ['Remote', 'Customer Care', 'Smart Working'],
        portals: [
          { name: 'Indeed', url: 'https://it.indeed.com/offerte-lavoro?q=customer+service+assistenza+clienti+remote&l=Italia', color: '#2164f3' },
          { name: 'InfoJobs', url: 'https://www.infojobs.it/candidati/offerte-lavoro/all-regioni/telelavoro,en_22.xhtml?keyword=customer+service', color: '#ff6600' },
          { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=customer%20service%20remote&location=Italia&f_WT=2', color: '#0a66c2' }
        ]
      }
    ];

    container.innerHTML = categories.map(cat => `
      <div class="glass-card" style="display:flex;flex-direction:column;justify-content:space-between;gap:1rem;">
        <div>
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.6rem;">
            <span style="font-size:2rem;">${cat.icon}</span>
            <h3 style="font-size:1.05rem;margin:0;">${cat.title}</h3>
          </div>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;margin-bottom:0.65rem;">
            ${cat.badges.map(b => `<span class="badge badge-slate">${b}</span>`).join('')}
          </div>
          <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;margin:0;">${cat.desc}</p>
        </div>
        <div style="border-top:1px solid var(--border-color);padding-top:0.85rem;">
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.05em;">Cerca su portale →</div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            ${cat.portals.map(p => `
              <a href="${p.url}" target="_blank" rel="noopener" class="btn btn-sm" style="flex:1;text-align:center;background:${p.color}22;border:1px solid ${p.color}55;color:${p.color};font-weight:700;font-size:0.82rem;">
                🔗 ${p.name}
              </a>
            `).join('')}
          </div>
        </div>
      </div>
    `).join('');
  }

  loadSearchJobToAnalyzer(title, company, description) {
    this.switchView('analyzer');
    const t = document.getElementById('job-title-input'); if (t) t.value = title;
    const c = document.getElementById('job-company-input'); if (c) c.value = company;
    const tx = document.getElementById('job-text-input'); if (tx) tx.value = description;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.handleAnalysis();
  }

  quickAddSearchToTracker(title, company, score) {
    StorageManager.saveApplication({ jobTitle: title, company, matchScore: score, status: 'interested', location: 'Busto Arsizio (VA)', notes: 'Da Ricerca AI 24h' });
    this.renderTracker();
    this.showToast(`"${title}" salvata nel Kanban!`, 'success', 'Salvata');
  }

  // =============================================
  //  CV PREVIEW MODAL
  // =============================================
  openCVPreviewModal(customProfile = null) {
    const profile = customProfile || StorageManager.getProfile();
    const html = PDFExporter.renderCVHTML(profile);
    const body = document.getElementById('modal-cv-body');
    const modal = document.getElementById('modal-cv-preview');
    if (body) {
      body.innerHTML = `
        <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 0.85rem 1.15rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.6rem; font-size: 0.92rem; color: #38BDF8;">
          <span>✏️ <strong>Modalità Modifica Attiva:</strong> Clicca su qualsiasi testo del CV (ruoli, mansioni, date, bio) per modificarlo direttamente prima di scaricare il PDF!</span>
        </div>
        ${html}
      `;
    }
    if (modal) modal.classList.add('active');
  }

  closeCVPreviewModal() {
    document.getElementById('modal-cv-preview')?.classList.remove('active');
  }

  // =============================================
  //  UPLOADED DOCUMENT VIEWER
  // =============================================
  updateUploadedCVBanner() {
    const banner = document.getElementById('card-uploaded-cv-info');
    const nameElem = document.getElementById('uploaded-cv-filename');
    if (!banner) return;
    banner.style.display = this.uploadedFileName ? 'block' : 'none';
    if (nameElem && this.uploadedFileName) nameElem.innerText = this.uploadedFileName;
  }

  openUploadedDocumentViewer() {
    const container = document.getElementById('modal-doc-viewer-body');
    const modal = document.getElementById('modal-uploaded-cv-viewer');
    if (!container || !modal) return;

    const savedPdfBase64 = localStorage.getItem('ca_uploaded_pdf_base64');
    const pdfUrl = this.uploadedFileUrl || savedPdfBase64;

    if (pdfUrl) {
      container.innerHTML = `<iframe src="${pdfUrl}" style="width:100%;height:100%;min-height:620px;border:none;border-radius:12px;background:#ffffff;"></iframe>`;
    } else {
      // Fallback to Master CV HTML layout preview
      const profile = StorageManager.getProfile();
      const cvHtml = PDFExporter.renderCVHTML(profile);
      container.innerHTML = `<div style="padding:1.5rem;height:100%;overflow-y:auto;background:#ffffff;">${cvHtml}</div>`;
    }
    modal.classList.add('active');
  }

  closeUploadedDocumentViewer() {
    document.getElementById('modal-uploaded-cv-viewer')?.classList.remove('active');
  }

  async handleCVFileUpload(file) {
    if (!file) return;

    this.uploadedFileName = file.name;
    localStorage.setItem('ca_uploaded_filename', file.name);
    this.uploadedFileUrl = URL.createObjectURL(file);
    this.updateUploadedCVBanner();

    // Store PDF in base64 for persistent preview across sessions
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          localStorage.setItem('ca_uploaded_pdf_base64', e.target.result);
        } catch(err) {
          console.warn('PDF size exceeds localStorage quota');
        }
      };
      reader.readAsDataURL(file);
    } catch(err) {
      console.warn('FileReader failed:', err);
    }

    // Update dropzone to show loading
    const dropzone = document.getElementById('cv-dropzone');
    if (dropzone) dropzone.innerHTML = `<span class="upload-icon">⏳</span><div class="upload-title">Estrazione testo in corso...</div>`;

    this.showAILoading();

    try {
      let cvText = '';
      const ext = file.name.split('.').pop().toLowerCase();

      if (ext === 'pdf') {
        // Extract text from PDF using PDF.js
        cvText = await this.extractTextFromPDF(file);
      } else {
        // TXT / DOC: read as plain text
        cvText = await file.text();
      }

      if (!cvText || cvText.trim().length < 30) {
        throw new Error('Impossibile estrarre testo dal file. Prova un formato TXT o copia il testo manualmente.');
      }

      this.uploadedRawText = cvText;
      localStorage.setItem('ca_uploaded_rawtext', cvText.substring(0, 5000));

      // Call Gemini to parse the CV
      this.showToast('Testo estratto! Invio a Gemini AI per l\'analisi del profilo...', 'info', 'Analisi in corso');
      const parsed = await AIEngine.parseCVWithGemini(cvText);

      if (!parsed || !parsed.personalInfo) {
        throw new Error('Gemini non ha restituito dati validi. Riprova o compila manualmente.');
      }

      // Save to localStorage
      StorageManager.saveProfile(parsed);

      // Populate form fields
      this.loadProfileIntoUI();

      // Reset dropzone to success state with debug button
      if (dropzone) dropzone.innerHTML = `
        <span class="upload-icon">✅</span>
        <div class="upload-title">${this.escapeHTML(file.name)} — Profilo Estratto con Successo!</div>
        <div class="upload-desc" style="margin-top:0.5rem;">
          <button id="btn-show-raw-text" class="btn btn-ghost btn-sm" style="font-size:0.8rem;">🔍 Vedi testo estratto dal PDF</button>
          &nbsp;
          <label style="cursor:pointer;" class="btn btn-ghost btn-sm" style="font-size:0.8rem;">
            🔄 Carica altro CV
            <input type="file" id="cv-file-input" accept=".pdf,.doc,.docx,.txt" style="display:none;">
          </label>
        </div>
      `;
      document.getElementById('cv-file-input')?.addEventListener('change', (e) => this.handleCVFileUpload(e.target.files?.[0]));
      document.getElementById('btn-show-raw-text')?.addEventListener('click', () => {
        const container = document.getElementById('modal-doc-viewer-body');
        const modal = document.getElementById('modal-uploaded-cv-viewer');
        if (container) container.innerHTML = `<div style="padding:1.5rem;background:var(--bg-darker);color:var(--text-primary);font-family:monospace;white-space:pre-wrap;overflow-y:auto;height:100%;font-size:0.82rem;line-height:1.6;">${this.escapeHTML(cvText)}</div>`;
        if (modal) modal.classList.add('active');
      });


      this.showToast(`Profilo di "${parsed.personalInfo.fullName}" estratto e caricato con successo!`, 'success', 'Profilo Caricato ✅');

    } catch (err) {
      if (dropzone) dropzone.innerHTML = `
        <span class="upload-icon">📄</span>
        <div class="upload-title">Trascina qui il file del tuo CV o Clicca per Caricare</div>
        <div class="upload-desc">Supporta i formati <strong>PDF, DOC, DOCX, TXT</strong></div>
        <input type="file" id="cv-file-input" accept=".pdf,.doc,.docx,.txt" style="display: none;">
      `;
      document.getElementById('cv-file-input')?.addEventListener('change', (e) => this.handleCVFileUpload(e.target.files?.[0]));
      this.showToast(err.message || 'Errore durante il caricamento del CV.', 'error', 'Errore Caricamento');
    } finally {
      this.hideAILoading();
    }
  }

  /**
   * Extract all text from a PDF file using PDF.js
   */
  async extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const pdf = await window.pdfjsLib.getDocument({ data: typedArray }).promise;
          let fullText = '';

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();

            // --- Position-aware reconstruction for two-column layouts (Europass) ---
            // Each item has transform[4]=X, transform[5]=Y (Y increases upward in PDF)
            const items = content.items.filter(item => item.str && item.str.trim());

            if (items.length === 0) continue;

            // --- Position-aware reconstruction for two-column layouts (Europass) ---
            // 1. Sort strictly by Y coordinate descending (top of page to bottom)
            items.sort((a, b) => b.transform[5] - a.transform[5]);

            // 2. Group items into rows (items within 4 points of Y belong to the same visual line)
            const rows = [];
            let currentRow = [];
            let currentY = null;

            for (const item of items) {
              const y = item.transform[5];
              if (currentY === null || Math.abs(y - currentY) > 4) {
                if (currentRow.length > 0) rows.push(currentRow);
                currentRow = [item];
                currentY = y;
              } else {
                currentRow.push(item);
              }
            }
            if (currentRow.length > 0) rows.push(currentRow);

            // 3. Sort each row left-to-right (X ascending) and build line text
            for (const row of rows) {
              row.sort((a, b) => a.transform[4] - b.transform[4]);
              let line = '';
              let lastXEnd = null;
              for (const item of row) {
                const x = item.transform[4];
                if (lastXEnd !== null && x - lastXEnd > 12) {
                  line += '  ';
                }
                line += item.str;
                lastXEnd = x + (item.width || (item.str.length * 5));
              }
              const trimmed = line.trim();
              if (trimmed) fullText += trimmed + '\n';
            }
            fullText += '\n'; // blank line between pages
          }

          resolve(fullText.trim());
        } catch (err) {
          console.error('PDF extraction error:', err);
          reject(new Error('Errore lettura PDF. Prova a esportarlo come TXT.'));
        }
      };
      reader.onerror = () => reject(new Error('Errore lettura file.'));
      reader.readAsArrayBuffer(file);
    });
  }



  // =============================================
  //  BACKUP
  // =============================================
  handleBackupExport() {
    const blob = new Blob([StorageManager.exportBackup()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Career_Advisor_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    this.showToast('Backup scaricato!', 'success', 'Backup Completato');
  }

  // =============================================
  //  POPUP / TOAST SYSTEM
  // =============================================
  showConfirmPopup({ title, message, icon = '❓', confirmText = 'Conferma', cancelText = 'Annulla', onConfirm }) {
    const overlay = document.getElementById('premium-popup-overlay');
    if (!overlay) return;
    if (this.popupTimeout) clearTimeout(this.popupTimeout);

    const iconEl = document.getElementById('premium-popup-icon');
    const titleEl = document.getElementById('premium-popup-title');
    const msgEl = document.getElementById('premium-popup-message');
    const actionsEl = document.getElementById('premium-popup-actions');

    if (iconEl) iconEl.innerText = icon;
    if (titleEl) titleEl.innerText = title;
    if (msgEl) msgEl.innerText = message;
    if (actionsEl) {
      actionsEl.innerHTML = `
        <button class="btn btn-secondary btn-sm" id="btn-popup-cancel">${this.escapeHTML(cancelText)}</button>
        <button class="btn btn-primary btn-sm" id="btn-popup-confirm">${this.escapeHTML(confirmText)}</button>
      `;
      document.getElementById('btn-popup-cancel')?.addEventListener('click', () => this.closePremiumPopup());
      document.getElementById('btn-popup-confirm')?.addEventListener('click', () => {
        this.closePremiumPopup();
        if (typeof onConfirm === 'function') onConfirm();
      });
    }
    overlay.classList.add('active');
  }

  showToast(message, type = 'info', title = 'Notifica') {
    const overlay = document.getElementById('premium-popup-overlay');
    if (!overlay) return;
    const icons = { success: '✨', error: '⚠️', info: '⚡' };
    const iconEl = document.getElementById('premium-popup-icon');
    const titleEl = document.getElementById('premium-popup-title');
    const msgEl = document.getElementById('premium-popup-message');
    const actionsEl = document.getElementById('premium-popup-actions');
    if (iconEl) iconEl.innerText = icons[type] || '⚡';
    if (titleEl) titleEl.innerText = title;
    if (msgEl) msgEl.innerText = message;
    if (actionsEl) {
      actionsEl.innerHTML = `<button class="btn btn-primary btn-sm" id="btn-close-premium-popup">OK</button>`;
      document.getElementById('btn-close-premium-popup')?.addEventListener('click', () => this.closePremiumPopup());
    }
    overlay.classList.add('active');
    if (this.popupTimeout) clearTimeout(this.popupTimeout);
    this.popupTimeout = setTimeout(() => this.closePremiumPopup(), 3500);
  }

  closePremiumPopup() {
    document.getElementById('premium-popup-overlay')?.classList.remove('active');
  }

  escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
}

// Initialize App immediately if DOM is ready, or on DOMContentLoaded
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
  });
} else {
  window.app = new App();
}
