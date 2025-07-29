class InfoApp {
  constructor() {
    this.userData = null;
    this.currentModule = null;
    this.currentLesson = null;
    this.currentQuiz = null;
    this.currentQuestionIndex = 0;
    this.quizAnswers = [];
    this.content = [];

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(() => this.init(), 100));
    } else {
      setTimeout(() => this.init(), 100);
    }
  }

  badges = [
    { id: "first-steps", name: "Premiers pas", description: "Complétez votre première leçon", icon: "🎯", condition: "lessonCompleted", value: 1 },
    { id: "quiz-master", name: "Maître des quiz", description: "Réussissez 3 quiz", icon: "🧠", condition: "quizPassed", value: 3 },
    { id: "bureautique-expert", name: "Expert Bureautique", description: "Terminez tous les cours de bureautique", icon: "📊", condition: "moduleCompleted", value: "bureautique" },
    { id: "programmer", name: "Programmeur", description: "Terminez tous les cours de programmation", icon: "💻", condition: "moduleCompleted", value: "programmation" },
    { id: "cybersecurity-expert", name: "Expert Cybersécurité", description: "Terminez tous les cours de cybersécurité", icon: "🔒", condition: "moduleCompleted", value: "cybersecurite" },
    { id: "dedicated-learner", name: "Apprenant assidu", description: "Obtenez 100 XP", icon: "⭐", condition: "xpReached", value: 100 },
    { id: "knowledge-seeker", name: "Chercheur de savoir", description: "Complétez 10 leçons", icon: "📚", condition: "lessonCompleted", value: 10 }
  ];

  levels = [
    { level: 1, name: "Débutant", xpRequired: 0, color: "#94a3b8" },
    { level: 2, name: "Novice", xpRequired: 50, color: "#60a5fa" },
    { level: 3, name: "Apprenti", xpRequired: 120, color: "#34d399" },
    { level: 4, name: "Compétent", xpRequired: 220, color: "#fbbf24" },
    { level: 5, name: "Expérimenté", xpRequired: 350, color: "#f97316" },
    { level: 6, name: "Expert", xpRequired: 500, color: "#ef4444" },
    { level: 7, name: "Maître", xpRequired: 700, color: "#8b5cf6" }
  ];

  async init() {
    console.log('Initialisation de l\'application...');
    await this.loadContent();
    await this.loadUserData();
    this.checkFirstLaunch();
    this.setupEventListeners();
    this.applyTheme();
    console.log('Application initialisée');
  }

  async loadContent() {
    try {
      if (window.electronAPI) {
        this.content = await window.electronAPI.getContent();
        if (this.content.length === 0) {
          const initialContent = [
            {
              module_id: "bureautique",
              lesson_id: "word-basics",
              title: "Initiation à Word",
              description: "Apprenez les bases de Microsoft Word pour créer des documents professionnels",
              video_path: "https://CHAHBG.github.io/infoapp-assets/videos/word-basics.mp4",
              pdf_path: "https://CHAHBG.github.io/infoapp-assets/pdf/word-debutant.pdf",
              has_quiz: true,
              xp: 10,
              quiz_data: JSON.stringify({
                title: "Quiz Word - Les bases",
                questions: [
                  { question: "Quel raccourci clavier permet de sauvegarder un document Word ?", options: ["Ctrl+S", "Ctrl+A", "Ctrl+Z", "Ctrl+C"], correct: 0 },
                  { question: "Comment appelle-t-on la barre qui contient les menus Fichier, Édition, etc. ?", options: ["Barre d'état", "Barre de menu", "Barre d'outils", "Barre de titre"], correct: 1 },
                  { question: "Quelle fonctionnalité permet de corriger automatiquement les fautes de frappe ?", options: ["Correction automatique", "Vérification orthographique", "Grammaire", "Révision"], correct: 0 }
                ]
              })
            },
            {
              module_id: "bureautique",
              lesson_id: "excel-basics",
              title: "Initiation à Excel",
              description: "Découvrez les fonctionnalités essentielles d'Excel pour gérer vos données",
              video_path: "https://CHAHBG.github.io/infoapp-assets/videos/excel-basics.mp4",
              pdf_path: "https://CHAHBG.github.io/infoapp-assets/pdf/excel-debutant.pdf",
              has_quiz: true,
              xp: 10,
              quiz_data: JSON.stringify({
                title: "Quiz Excel - Les bases",
                questions: [
                  { question: "Comment appelle-t-on l'intersection d'une ligne et d'une colonne ?", options: ["Case", "Cellule", "Zone", "Champ"], correct: 1 },
                  { question: "Quel symbole utilise-t-on pour commencer une formule dans Excel ?", options: ["@", "#", "=", "&"], correct: 2 },
                  { question: "Quelle fonction permet de calculer la somme d'une plage de cellules ?", options: ["TOTAL()", "SOMME()", "CALCUL()", "ADDITION()"], correct: 1 }
                ]
              })
            },
            {
              module_id: "bureautique",
              lesson_id: "powerpoint-basics",
              title: "Initiation à PowerPoint",
              description: "Créez des présentations impactantes avec PowerPoint",
              video_path: "https://CHAHBG.github.io/infoapp-assets/videos/powerpoint-basics.mp4",
              has_quiz: false,
              xp: 10
            },
            {
              module_id: "informatique",
              lesson_id: "computer-basics",
              title: "Les bases de l'ordinateur",
              description: "Comprenez le fonctionnement d'un ordinateur et ses composants",
              video_path: "https://CHAHBG.github.io/infoapp-assets/videos/computer-basics.mp4",
              has_quiz: true,
              xp: 10,
              quiz_data: JSON.stringify({
                title: "Quiz Informatique - Les bases",
                questions: [
                  { question: "Que signifie l'acronyme CPU ?", options: ["Computer Processing Unit", "Central Processing Unit", "Core Processing Unit", "Central Program Unit"], correct: 1 },
                  { question: "Combien d'octets contient un kilooctet (Ko) ?", options: ["100", "1000", "1024", "1048"], correct: 2 },
                  { question: "Quel composant stocke temporairement les données en cours d'utilisation ?", options: ["Disque dur", "RAM", "Processeur", "Carte graphique"], correct: 1 }
                ]
              })
            },
            {
              module_id: "informatique",
              lesson_id: "internet-basics",
              title: "Naviguer sur Internet",
              description: "Apprenez à utiliser Internet en toute sécurité",
              video_path: "https://CHAHBG.github.io/infoapp-assets/videos/internet-basics.mp4",
              has_quiz: true,
              xp: 10,
              quiz_data: JSON.stringify({
                title: "Quiz Internet - Navigation",
                questions: [
                  { question: "Que signifie l'acronyme URL ?", options: ["Universal Resource Locator", "Uniform Resource Locator", "Universal Reference Link", "Uniform Reference Locator"], correct: 1 },
                  { question: "Quel protocole sécurisé est utilisé pour les sites web sécurisés ?", options: ["HTTP", "HTTPS", "FTP", "SMTP"], correct: 1 }
                ]
              })
            },
            {
              module_id: "programmation",
              lesson_id: "python-basics",
              title: "Python pour débutants",
              description: "Découvrez les bases de la programmation avec Python",
              video_path: "https://CHAHBG.github.io/infoapp-assets/videos/python-basics.mp4",
              pdf_path: "https://CHAHBG.github.io/infoapp-assets/pdf/python-debuter.pdf",
              has_quiz: true,
              xp: 15,
              quiz_data: JSON.stringify({
                title: "Quiz Python - Les bases",
                questions: [
                  { question: "Comment affiche-t-on du texte en Python ?", options: ["echo()", "display()", "print()", "show()"], correct: 2 },
                  { question: "Quel symbole utilise-t-on pour les commentaires en Python ?", options: ["//", "/*", "#", "--"], correct: 2 },
                  { question: "Comment déclare-t-on une variable en Python ?", options: ["var nom = 'valeur'", "nom = 'valeur'", "declare nom = 'valeur'", "string nom = 'valeur'"], correct: 1 }
                ]
              })
            },
            {
              module_id: "programmation",
              lesson_id: "scratch-basics",
              title: "Programmation avec Scratch",
              description: "Apprenez la logique de programmation avec Scratch",
              video_path: "https://CHAHBG.github.io/infoapp-assets/videos/scratch-basics.mp4",
              pdf_path: "https://CHAHBG.github.io/infoapp-assets/pdf/scratch-premiers-pas.pdf",
              has_quiz: true,
              xp: 10,
              quiz_data: JSON.stringify({
                title: "Quiz Scratch - Programmation visuelle",
                questions: [
                  { question: "Scratch est un langage de programmation :", options: ["Textuel", "Visuel", "Audio", "Numérique"], correct: 1 },
                  { question: "Comment appelle-t-on les éléments que l'on assemble dans Scratch ?", options: ["Codes", "Blocs", "Pièces", "Modules"], correct: 1 }
                ]
              })
            },
            {
              module_id: "cybersecurite",
              lesson_id: "cybersecurity-basics",
              title: "Les bases de la cybersécurité",
              description: "Apprenez à protéger vos données et naviguer en sécurité",
              video_path: "https://CHAHBG.github.io/infoapp-assets/videos/cybersecurity-basics.mp4",
              pdf_path: "https://CHAHBG.github.io/infoapp-assets/pdf/cybersecurity-debutant.pdf",
              has_quiz: true,
              xp: 15,
              quiz_data: JSON.stringify({
                title: "Quiz Cybersécurité - Les bases",
                questions: [
                  { question: "Quel est le meilleur type de mot de passe ?", options: ["123456", "monnom", "Az3#9kL", "password"], correct: 2 },
                  { question: "Qu’est-ce qu’un logiciel malveillant ?", options: ["Un logiciel de bureautique", "Un virus informatique", "Un navigateur web", "Un éditeur de texte"], correct: 1 }
                ]
              })
            }
          ];

          const insertStmt = window.electronAPI.db.prepare(
            'INSERT INTO content (module_id, lesson_id, title, description, video_path, pdf_path, has_quiz, xp, quiz_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          );

          initialContent.forEach(item => {
            insertStmt.run(
              item.module_id,
              item.lesson_id,
              item.title,
              item.description,
              item.video_path,
              item.pdf_path,
              item.has_quiz ? 1 : 0,
              item.xp,
              item.quiz_data
            );
          });

          this.content = await window.electronAPI.getContent();
        }
        console.log('Contenu chargé:', this.content);

        const resourcesStmt = window.electronAPI.db.prepare(
          'INSERT INTO resources (lesson_id, type, path, title, description) VALUES (?, ?, ?, ?, ?)'
        );
        const resources = [
          {
            lesson_id: "cybersecurity-basics",
            type: "link",
            path: "https://openclassrooms.com/fr/courses/1526901-la-cybersecurite-pour-tous",
            title: "Cours OpenClassrooms",
            description: "Cours gratuit sur la cybersécurité pour débutants"
          },
          {
            lesson_id: "python-basics",
            type: "link",
            path: "https://www.python.org/about/gettingstarted/",
            title: "Guide Python Officiel",
            description: "Ressources officielles pour apprendre Python"
          }
        ];

        resources.forEach(r => {
          try {
            resourcesStmt.run(r.lesson_id, r.type, r.path, r.title, r.description);
          } catch (error) {
            console.error('Erreur lors de l\'insertion des ressources:', error);
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du contenu:', error);
    }
  }

  async loadUserData() {
    try {
      if (window.electronAPI) {
        const userData = await window.electronAPI.getUser();
        if (userData) {
          this.userData = {
            ...userData,
            completedLessons: (await window.electronAPI.getUserProgress(userData.id)).filter(p => p.completed).map(p => p.lesson_id),
            quizResults: [],
            badges: (await window.electronAPI.getUserBadges(userData.id)).map(b => b.badge_id),
            settings: { theme: 'auto' }
          };
          console.log('Données utilisateur chargées:', this.userData);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      this.userData = null;
    }
  }

  async saveUserData() {
    try {
      if (window.electronAPI && this.userData) {
        await window.electronAPI.updateUserXP(this.userData.id, this.userData.xp);
        for (const lessonId of this.userData.completedLessons) {
          await window.electronAPI.updateUserProgress({
            user_id: this.userData.id,
            module_id: this.content.find(c => c.lesson_id === lessonId)?.module_id,
            lesson_id: lessonId,
            progress: 100,
            completed: true,
            time_spent: 0
          });
        }
        for (const badgeId of this.userData.badges) {
          await window.electronAPI.awardBadge({ user_id: this.userData.id, badge_id: badgeId });
        }
        console.log('Données utilisateur sauvegardées');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }

  checkFirstLaunch() {
    console.log('Vérification du premier lancement...');
    if (!this.userData) {
      console.log('Premier lancement détecté');
      document.getElementById('setup-screen')?.classList.remove('hidden');
      document.getElementById('main-app')?.classList.add('hidden');
    } else {
      console.log('Utilisateur existant détecté');
      document.getElementById('setup-screen')?.classList.add('hidden');
      document.getElementById('main-app')?.classList.remove('hidden');
      this.initMainApp();
    }
  }

  setupEventListeners() {
    console.log('Configuration des event listeners...');
    const setupForm = document.getElementById('setup-form');
    if (setupForm) {
      setupForm.addEventListener('submit', (e) => this.handleSetup(e));
    }

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => this.handleNavigation(e));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') this.handleNavigation(e);
      });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') this.closeModal(e.target.closest('.modal'));
      });
    });

    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => this.changeTheme(e.target.value));
    }

    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    const resetBtn = document.getElementById('resetProgressBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetProgress());
    }

    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    if (changeAvatarBtn) {
      changeAvatarBtn.addEventListener('click', () => this.openAvatarModal());
    }

    const saveAvatarBtn = document.getElementById('saveAvatarBtn');
    if (saveAvatarBtn) {
      saveAvatarBtn.addEventListener('click', () => this.saveAvatar());
    }

    const markCompleteBtn = document.getElementById('markCompleteBtn');
    if (markCompleteBtn) {
      markCompleteBtn.addEventListener('click', () => this.markLessonComplete());
    }

    const downloadPdfBtn = document.getElementById('pdfLink');
    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener('click', () => this.downloadPdf());
    }

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) this.closeModal(e.target);
      if (e.target.closest('.setup-form .avatar-option') || e.target.closest('#avatarModal .avatar-option')) {
        const options = e.target.closest('.setup-form') ? '.setup-form .avatar-option' : '#avatarModal .avatar-option';
        document.querySelectorAll(options).forEach(opt => opt.classList.remove('selected'));
        e.target.closest('.avatar-option').classList.add('selected');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal:not(.hidden)');
        if (openModal) this.closeModal(openModal);
      }
    });
  }

  async handleSetup(e) {
    e.preventDefault();
    console.log('=== Début du traitement de la configuration ===');
    
    const nameInput = document.getElementById('user-name');
    const name = nameInput?.value.trim();
    const selectedAvatar = document.querySelector('.setup-form .avatar-option.selected');
    
    if (!name) {
      alert('Veuillez entrer votre prénom');
      nameInput?.focus();
      return;
    }
    
    if (!selectedAvatar) {
      alert('Veuillez choisir un avatar');
      return;
    }

    if (window.electronAPI) {
      const userId = await window.electronAPI.createUser({
        name,
        avatar: selectedAvatar.dataset.avatar
      });
      this.userData = {
        id: userId,
        name,
        avatar: selectedAvatar.dataset.avatar,
        xp: 0,
        level: 1,
        completedLessons: [],
        quizResults: [],
        badges: [],
        settings: { theme: 'auto' },
        createdAt: new Date().toISOString()
      };
    }

    await this.saveUserData();
    
    document.getElementById('setup-screen')?.classList.add('hidden');
    document.getElementById('main-app')?.classList.remove('hidden');
    this.initMainApp();
    
    console.log('=== Configuration terminée avec succès ===');
  }

  initMainApp() {
    console.log('Initialisation de l\'application principale...');
    setTimeout(() => {
      this.updateUserDisplay();
      this.renderModules();
      this.updateDashboard();
      this.updateProfile();
      this.updateLevelDisplay();
      this.renderLevelsTimeline();
      this.showSection('dashboard');
      console.log('Application principale initialisée');
    }, 100);
  }

  updateUserDisplay() {
    const avatarEmojis = {
      etudiant: '👨‍🎓',
      developpeur: '👨‍💻',
      professeur: '👨‍🏫'
    };

    const avatar = avatarEmojis[this.userData.avatar] || '👨‍🎓';
    const currentLevel = this.getCurrentLevel();

    const userAvatar = document.getElementById('userAvatar');
    const userNameDisplay = document.getElementById('userName-display');
    const userLevel = document.getElementById('userLevel');

    if (userAvatar) userAvatar.textContent = avatar;
    if (userNameDisplay) userNameDisplay.textContent = this.userData.name;
    if (userLevel) userLevel.textContent = `Niveau ${currentLevel.level}`;
  }

  getCurrentLevel() {
    let currentLevel = this.levels[0];
    for (let level of this.levels) {
      if (this.userData.xp >= level.xpRequired) {
        currentLevel = level;
      } else {
        break;
      }
    }
    return currentLevel;
  }

  getNextLevel() {
    const currentLevel = this.getCurrentLevel();
    const nextLevelIndex = this.levels.findIndex(l => l.level === currentLevel.level) + 1;
    return nextLevelIndex < this.levels.length ? this.levels[nextLevelIndex] : null;
  }

  handleNavigation(e) {
    e.preventDefault();
    const section = e.currentTarget.dataset.section;
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    this.showSection(section);
  }

  showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) targetSection.classList.add('active');
    
    if (sectionName === 'modules') this.renderModules();
    else if (sectionName === 'dashboard') this.updateDashboard();
    else if (sectionName === 'profile') this.updateProfile();
    else if (sectionName === 'level') this.updateLevelDisplay();
  }

  renderModules() {
    const container = document.getElementById('modulesGrid');
    if (!container) return;
    
    container.innerHTML = '';

    const modules = [...new Set(this.content.map(c => c.module_id))].map(moduleId => ({
      id: moduleId,
      name: moduleId.charAt(0).toUpperCase() + moduleId.slice(1),
      icon: {
        bureautique: '📊',
        informatique: '💻',
        programmation: '👨‍💻',
        cybersecurite: '🔒'
      }[moduleId] || '📚',
      color: {
        bureautique: 'var(--color-bg-1)',
        informatique: 'var(--color-bg-2)',
        programmation: 'var(--color-bg-3)',
        cybersecurite: 'var(--color-bg-5)'
      }[moduleId] || 'var(--color-bg-1)'
    }));

    modules.forEach(module => {
      const moduleLessons = this.content.filter(c => c.module_id === module.id);
      const completedLessons = moduleLessons.filter(l => this.userData.completedLessons.includes(l.lesson_id)).length;
      
      const moduleCard = document.createElement('div');
      moduleCard.className = 'module-card';
      moduleCard.setAttribute('role', 'article');
      moduleCard.innerHTML = `
        <div class="module-header">
          <div class="module-icon" style="background: ${module.color}">
            ${module.icon}
          </div>
          <div>
            <h3 class="module-title">${module.name}</h3>
            <p style="margin: 0; color: var(--color-text-secondary); font-size: var(--font-size-sm);">
              ${completedLessons}/${moduleLessons.length} leçons terminées
            </p>
          </div>
        </div>
        <div class="lessons-list">
          ${moduleLessons.map(lesson => {
            const isCompleted = this.userData.completedLessons.includes(lesson.lesson_id);
            const hasQuizPassed = lesson.has_quiz && this.userData.quizResults.some(r => r.lessonId === lesson.lesson_id && r.passed);
            
            return `
              <div class="lesson-item">
                <div class="lesson-info">
                  <h4>${lesson.title}</h4>
                  <p class="lesson-status">
                    ${isCompleted ? '✅ Terminé' : '⏳ Non commencé'}
                    ${lesson.has_quiz && hasQuizPassed ? ' • Quiz réussi' : ''}
                  </p>
                </div>
                <div class="lesson-actions">
                  <button class="btn btn--sm btn--primary" onclick="app.openLesson('${lesson.lesson_id}')" aria-label="${isCompleted ? 'Revoir' : 'Regarder'} la leçon ${lesson.title}">
                    ${isCompleted ? 'Revoir' : 'Regarder'}
                  </button>
                  ${lesson.has_quiz ? `
                    <button class="btn btn--sm btn--secondary" onclick="app.openQuiz('${lesson.lesson_id}')" aria-label="Lancer le quiz pour ${lesson.title}">
                      Quiz
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      container.appendChild(moduleCard);
    });
  }

  openLesson(lessonId) {
    const lesson = this.content.find(c => c.lesson_id === lessonId);
    if (!lesson) return;

    this.currentLesson = lesson;
    
    const videoTitle = document.getElementById('videoTitle');
    if (videoTitle) videoTitle.textContent = lesson.title;
    
    const video = document.getElementById('lessonVideo');
    if (video && lesson.video_path) {
      video.src = window.electronAPI.getAssetPath(lesson.video_path);
    }
    
    const pdfBtn = document.getElementById('pdfLink');
    if (pdfBtn) {
      if (lesson.pdf_path) {
        pdfBtn.href = window.electronAPI.getAssetPath(lesson.pdf_path);
        pdfBtn.style.display = 'inline-flex';
      } else {
        pdfBtn.style.display = 'none';
      }
    }

    const completeBtn = document.getElementById('markCompleteBtn');
    if (completeBtn) {
      const isCompleted = this.userData.completedLessons.includes(lessonId);
      completeBtn.textContent = isCompleted ? 'Déjà terminé' : 'Marquer comme terminé';
      completeBtn.disabled = isCompleted;
    }

    this.openModal(document.getElementById('videoModal'));
  }

  async markLessonComplete() {
    if (!this.currentLesson) return;
    
    if (!this.userData.completedLessons.includes(this.currentLesson.lesson_id)) {
      this.userData.completedLessons.push(this.currentLesson.lesson_id);
      await window.electronAPI.updateUserProgress({
        user_id: this.userData.id,
        module_id: this.currentLesson.module_id,
        lesson_id: this.currentLesson.lesson_id,
        progress: 100,
        completed: true,
        time_spent: 0
      });
      await this.addXP(this.currentLesson.xp || 10);
      await this.checkBadges();
      await this.saveUserData();
      
      const completeBtn = document.getElementById('markCompleteBtn');
      if (completeBtn) {
        completeBtn.textContent = 'Déjà terminé';
        completeBtn.disabled = true;
      }
      
      this.showNotification(`Félicitations ! Vous avez gagné ${this.currentLesson.xp || 10} XP !`, 'success');
      
      this.renderModules();
      this.updateDashboard();
    }
  }

  downloadPdf() {
    if (this.currentLesson && this.currentLesson.pdf_path) {
      const link = document.createElement('a');
      link.href = window.electronAPI.getAssetPath(this.currentLesson.pdf_path);
      link.download = this.currentLesson.pdf_path.split('/').pop();
      link.click();
      this.showNotification('PDF téléchargé avec succès !', 'success');
    }
  }

  openQuiz(lessonId) {
    const lesson = this.content.find(c => c.lesson_id === lessonId);
    if (!lesson || !lesson.has_quiz) {
      this.showNotification('Quiz non disponible pour cette leçon', 'info');
      return;
    }

    this.currentQuiz = JSON.parse(lesson.quiz_data);
    this.currentQuestionIndex = 0;
    this.quizAnswers = [];
    
    const quizTitle = document.getElementById('quizTitle');
    if (quizTitle) quizTitle.textContent = this.currentQuiz.title;
    
    this.renderQuizQuestion();
    this.openModal(document.getElementById('quizModal'));
  }

  renderQuizQuestion() {
    if (!this.currentQuiz) return;

    const question = this.currentQuiz.questions[this.currentQuestionIndex];
    const isLastQuestion = this.currentQuestionIndex === this.currentQuiz.questions.length - 1;

    const quizContent = document.getElementById('quizContent');
    if (!quizContent) return;

    quizContent.innerHTML = `
      <div class="quiz-question">
        <h4>Question ${this.currentQuestionIndex + 1}/${this.currentQuiz.questions.length}</h4>
        <p>${question.question}</p>
        <div class="quiz-options">
          ${question.options.map((option, index) => `
            <div class="quiz-option" data-index="${index}" role="button" tabindex="0" aria-label="Option ${option}">
              ${option}
            </div>
          `).join('')}
        </div>
      </div>
      <div class="quiz-actions">
        <button class="btn btn--primary" id="nextQuestionBtn" disabled aria-label="${isLastQuestion ? 'Terminer le quiz' : 'Question suivante'}">
          ${isLastQuestion ? 'Terminer le quiz' : 'Question suivante'}
        </button>
      </div>
    `;

    document.querySelectorAll('.quiz-option').forEach(option => {
      option.addEventListener('click', (e) => this.selectQuizOption(e));
      option.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') this.selectQuizOption(e);
      });
    });

    const nextBtn = document.getElementById('nextQuestionBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (isLastQuestion) this.finishQuiz();
        else this.nextQuestion();
      });
    }
  }

  selectQuizOption(e) {
    document.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
    e.target.classList.add('selected');
    
    const selectedIndex = parseInt(e.target.dataset.index);
    this.quizAnswers[this.currentQuestionIndex] = selectedIndex;
    
    const nextBtn = document.getElementById('nextQuestionBtn');
    if (nextBtn) nextBtn.disabled = false;
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    this.renderQuizQuestion();
  }

  async finishQuiz() {
    const correctAnswers = this.currentQuiz.questions.reduce((count, question, index) => {
      return count + (this.quizAnswers[index] === question.correct ? 1 : 0);
    }, 0);

    const totalQuestions = this.currentQuiz.questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = percentage >= 70;

    const lessonId = this.content.find(c => c.quiz_data === JSON.stringify(this.currentQuiz))?.lesson_id;
    
    if (window.electronAPI) {
      await window.electronAPI.saveQuizResult({
        user_id: this.userData.id,
        lesson_id: lessonId,
        score: percentage,
        total_questions: totalQuestions,
        attempt_number: this.userData.quizResults.filter(r => r.lessonId === lessonId).length + 1
      });
    }

    const result = {
      lessonId,
      score: percentage,
      passed,
      date: new Date().toISOString()
    };

    const existingResultIndex = this.userData.quizResults.findIndex(r => r.lessonId === lessonId);
    if (existingResultIndex >= 0) {
      this.userData.quizResults[existingResultIndex] = result;
    } else {
      this.userData.quizResults.push(result);
    }

    if (passed) {
      await this.addXP(20);
    }

    await this.checkBadges();
    await this.saveUserData();

    const quizContent = document.getElementById('quizContent');
    if (quizContent) {
      quizContent.innerHTML = `
        <div class="quiz-result">
          <div class="quiz-score ${passed ? 'passed' : 'failed'}">
            ${percentage}%
          </div>
          <h4>${passed ? 'Quiz réussi !' : 'Quiz échoué'}</h4>
          <p>Vous avez obtenu ${correctAnswers}/${totalQuestions} bonnes réponses.</p>
          ${passed ? `<p>Vous avez gagné 20 XP !</p>` : `<p>Il faut au moins 70% pour réussir. Recommencez !</p>`}
          <button class="btn btn--primary" onclick="app.closeModal(document.getElementById('quizModal'))" aria-label="Fermer le quiz">
            Fermer
          </button>
        </div>
      `;
    }
  }

  async addXP(amount) {
    const oldLevel = this.getCurrentLevel();
    this.userData.xp += amount;
    if (window.electronAPI) {
      await window.electronAPI.updateUserXP(this.userData.id, amount);
    }
    const newLevel = this.getCurrentLevel();
    
    if (newLevel.level > oldLevel.level) {
      this.showNotification(`Félicitations ! Vous avez atteint le niveau ${newLevel.level} : ${newLevel.name} !`, 'success');
    }
    
    this.updateUserDisplay();
    this.updateDashboard();
    this.updateLevelDisplay();
  }

  async checkBadges() {
    for (const badge of this.badges) {
      if (this.userData.badges.includes(badge.id)) continue;

      let earned = false;

      switch (badge.condition) {
        case 'lessonCompleted':
          earned = this.userData.completedLessons.length >= badge.value;
          break;
        case 'quizPassed':
          earned = this.userData.quizResults.filter(r => r.passed).length >= badge.value;
          break;
        case 'moduleCompleted':
          const moduleLessons = this.content.filter(c => c.module_id === badge.value);
          earned = moduleLessons.every(lesson => this.userData.completedLessons.includes(lesson.lesson_id));
          break;
        case 'xpReached':
          earned = this.userData.xp >= badge.value;
          break;
      }

      if (earned) {
        this.userData.badges.push(badge.id);
        if (window.electronAPI) {
          await window.electronAPI.awardBadge({ user_id: this.userData.id, badge_id: badge.id });
        }
        this.showNotification(`Badge obtenu : ${badge.name} ${badge.icon}`, 'success');
      }
    }
  }

  updateDashboard() {
    if (!this.userData) return;

    const totalLessons = this.content.length;
    const completedLessons = this.userData.completedLessons.length;
    const globalProgress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    const globalProgressEl = document.getElementById('globalProgress');
    if (globalProgressEl) globalProgressEl.textContent = `${globalProgress}%`;
    
    const progressCircle = document.querySelector('.progress-circle');
    if (progressCircle) {
      progressCircle.style.background = `conic-gradient(var(--color-primary) ${globalProgress * 3.6}deg, var(--color-secondary) 0deg)`;
    }

    const currentLevel = this.getCurrentLevel();
    const nextLevel = this.getNextLevel();
    const xpInCurrentLevel = this.userData.xp - currentLevel.xpRequired;
    const xpForNextLevel = nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 100;
    const xpProgress = Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100);
    
    const xpDisplay = document.getElementById('xpDisplay');
    if (xpDisplay) xpDisplay.textContent = `${this.userData.xp} XP`;
    
    const xpFill = document.getElementById('xpFill');
    if (xpFill) xpFill.style.width = `${xpProgress}%`;

    const recentBadgesContainer = document.getElementById('recentBadges');
    if (recentBadgesContainer) {
      if (this.userData.badges.length > 0) {
        recentBadgesContainer.innerHTML = this.userData.badges.slice(-3).map(badgeId => {
          const badge = this.badges.find(b => b.id === badgeId);
          return `<div class="badge-item">${badge.icon} ${badge.name}</div>`;
        }).join('');
      } else {
        recentBadgesContainer.innerHTML = '<p class="no-badges">Aucun badge obtenu</p>';
      }
    }

    const completedLessonsEl = document.getElementById('completedLessons');
    if (completedLessonsEl) completedLessonsEl.textContent = completedLessons;

    const completedQuizzesEl = document.getElementById('completedQuizzes');
    if (completedQuizzesEl) {
      completedQuizzesEl.textContent = this.userData.quizResults.filter(r => r.passed).length;
    }

    const totalBadgesEl = document.getElementById('totalBadges');
    if (totalBadgesEl) totalBadgesEl.textContent = this.userData.badges.length;
  }

  updateProfile() {
    const avatarEmojis = {
      etudiant: '👨‍🎓',
      developpeur: '👨‍💻',
      professeur: '👨‍🏫'
    };

    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileLevel = document.getElementById('profileLevel');
    const allBadges = document.getElementById('allBadges');

    if (profileAvatar) profileAvatar.textContent = avatarEmojis[this.userData.avatar] || '👨‍🎓';
    if (profileName) profileName.textContent = this.userData.name;
    if (profileLevel) profileLevel.textContent = `Niveau ${this.getCurrentLevel().level} • ${this.userData.xp} XP`;

    if (allBadges) {
      if (this.userData.badges.length > 0) {
        allBadges.innerHTML = this.userData.badges.map(badgeId => {
          const badge = this.badges.find(b => b.id === badgeId);
          return `
            <div class="badge-item">
              <span class="badge-icon">${badge.icon}</span>
              <div>
                <h4>${badge.name}</h4>
                <p>${badge.description}</p>
              </div>
            </div>
          `;
        }).join('');
      } else {
        allBadges.innerHTML = '<p class="no-badges">Aucun badge obtenu pour le moment</p>';
      }
    }
  }

  updateLevelDisplay() {
    const currentLevel = this.getCurrentLevel();
    const nextLevel = this.getNextLevel();

    const currentLevelNumber = document.getElementById('currentLevelNumber');
    const currentLevelName = document.getElementById('currentLevelName');
    const levelProgress = document.getElementById('levelProgress');
    const levelFill = document.getElementById('levelFill');

    if (currentLevelNumber) currentLevelNumber.textContent = currentLevel.level;
    if (currentLevelName) currentLevelName.textContent = currentLevel.name;

    if (nextLevel) {
      const xpIn