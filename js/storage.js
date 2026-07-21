/* ==========================================
   CAREER ADVISOR AI - LOCAL STORAGE MANAGER
   ========================================== */

const STORAGE_KEYS = {
  PROFILE: 'career_advisor_profile_v1',
  APPLICATIONS: 'career_advisor_applications_v1',
  SAVED_JOBS: 'career_advisor_jobs_v1'
};

// Matteo's REAL profile as the default (used when no profile has been saved yet)
const DEFAULT_PROFILE = {
  personalInfo: {
    fullName: 'Matteo Tamborrino',
    title: 'Commesso / Addetto Accoglienza & Vendite',
    email: 'matteo.tamborrino.99@gmail.com',
    phone: '3465258533',
    location: 'Via Canova 24, Busto Arsizio (VA)',
    linkedin: '',
    summary: 'Sono un professionista con esperienza in vendita, accoglienza clienti e gestione del punto vendita, residente a Busto Arsizio (VA). Ho maturato competenze solide nella gestione della cassa, nel riassortimento del magazzino, nell\'assistenza all\'acquisto e nell\'accoglienza della clientela grazie a sette esperienze lavorative in settori differenti. Mi distinguo per affidabilità, spirito di squadra e forte orientamento al cliente.'
  },
  skills: {
    technical: ['Vendita & Commerciale', 'Accoglienza Clienti', 'Gestione Cassa', 'Gestione Magazzino', 'Assistenza Clienti', 'Bartending', 'Attività Promozionale'],
    soft: ['Problem Solving', 'Teamwork', 'Comunicazione', 'Organizzazione', 'Flessibilità', 'Affidabilità']
  },
  experience: [],
  education: [
    {
      id: 'edu-1',
      degree: 'Diploma di Scuola Secondaria Superiore',
      institution: 'Istituto di Istruzione Superiore',
      year: '2021'
    }
  ],
  courses: [
    {
      id: 'crs-1',
      name: 'Corso di Formazione Sicurezza sul Lavoro (D.Lgs 81/08)',
      issuer: 'Ente di Formazione Accreditato',
      year: '2023'
    }
  ],
  languages: [
    { language: 'Italiano', level: 'Madrelingua' },
    { language: 'Inglese', level: 'Livello B1 (Intermedio)' }
  ]
};

const EMPTY_APPLICATIONS = [];

export const StorageManager = {
  getProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        // If the stored profile has an empty fullName, it's the old blank template — re-seed
        if (!parsed.personalInfo?.fullName) {
          return DEFAULT_PROFILE;
        }
        return parsed;
      }
      return DEFAULT_PROFILE;
    } catch (e) {
      console.error('Errore lettura profilo:', e);
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profileData) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profileData));
      return true;
    } catch (e) {
      console.error('Errore salvataggio profilo:', e);
      return false;
    }
  },

  getApplications() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      return data ? JSON.parse(data) : EMPTY_APPLICATIONS;
    } catch (e) {
      console.error('Errore lettura candidature:', e);
      return EMPTY_APPLICATIONS;
    }
  },

  saveApplication(app) {
    const apps = this.getApplications();
    const existingIndex = apps.findIndex(a => a.id === app.id);
    
    if (existingIndex >= 0) {
      apps[existingIndex] = { ...apps[existingIndex], ...app };
    } else {
      apps.unshift({
        id: 'app-' + Date.now(),
        dateAdded: new Date().toISOString().split('T')[0],
        status: app.status || 'interested',
        ...app
      });
    }
    
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    return apps;
  },

  updateApplicationStatus(id, newStatus) {
    const apps = this.getApplications();
    const app = apps.find(a => a.id === id);
    if (app) {
      app.status = newStatus;
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    }
    return apps;
  },

  deleteApplication(id) {
    const apps = this.getApplications().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    return apps;
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
    localStorage.removeItem(STORAGE_KEYS.SAVED_JOBS);
  },

  exportBackup() {
    const backup = {
      profile: this.getProfile(),
      applications: this.getApplications(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.saveProfile(data.profile);
      if (data.applications) localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(data.applications));
      return true;
    } catch (e) {
      console.error('Errore importazione:', e);
      return false;
    }
  }
};
