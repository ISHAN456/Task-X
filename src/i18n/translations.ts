import { LanguageCode } from '../types/taskx';

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  hi: 'हिन्दी',
  ja: '日本語',
};

type TranslationKeys = {
  today: string;
  upcoming: string;
  calendar: string;
  folders: string;
  profile: string;
  settings: string;
  addTask: string;
  quickPlaceholder: string;
  smartParse: string;
  optimizeDay: string;
  allTasks: string;
  completed: string;
  highPriority: string;
  recurring: string;
  dailyStreak: string;
  level: string;
  badges: string;
  noTasksTitle: string;
  noTasksDesc: string;
  save: string;
  cancel: string;
};

const DICTIONARY: Record<LanguageCode, TranslationKeys> = {
  en: {
    today: 'Today',
    upcoming: 'Upcoming',
    calendar: 'Calendar',
    folders: 'Folders & Tags',
    profile: 'Profile',
    settings: 'Settings',
    addTask: 'New Task',
    quickPlaceholder: 'Add a task or reminder (e.g. Daily standup at 09:00)...',
    smartParse: 'AI Parse',
    optimizeDay: 'Optimize Day',
    allTasks: 'All',
    completed: 'Completed',
    highPriority: 'High Priority',
    recurring: 'Recurring',
    dailyStreak: 'Day Streak',
    level: 'Level',
    badges: 'Badges',
    noTasksTitle: 'Clear slate',
    noTasksDesc: 'No tasks match this view. Tap + to add a task or recurring daily reminder.',
    save: 'Save',
    cancel: 'Cancel',
  },
  es: {
    today: 'Hoy',
    upcoming: 'Próximas',
    calendar: 'Calendario',
    folders: 'Carpetas',
    profile: 'Perfil',
    settings: 'Ajustes',
    addTask: 'Nueva tarea',
    quickPlaceholder: 'Añade una tarea o recordatorio diario...',
    smartParse: 'IA Analizar',
    optimizeDay: 'Optimizar día',
    allTasks: 'Todas',
    completed: 'Completadas',
    highPriority: 'Prioridad alta',
    recurring: 'Recurrente',
    dailyStreak: 'Racha diaria',
    level: 'Nivel',
    badges: 'Insignias',
    noTasksTitle: 'Todo despejado',
    noTasksDesc: 'No hay tareas en esta vista. Pulsa + para añadir una nueva.',
    save: 'Guardar',
    cancel: 'Cancelar',
  },
  fr: {
    today: 'Aujourd’hui',
    upcoming: 'À venir',
    calendar: 'Calendrier',
    folders: 'Dossiers',
    profile: 'Profil',
    settings: 'Paramètres',
    addTask: 'Nouvelle tâche',
    quickPlaceholder: 'Ajouter une tâche ou un rappel quotidien...',
    smartParse: 'IA Analyser',
    optimizeDay: 'Optimiser',
    allTasks: 'Toutes',
    completed: 'Terminées',
    highPriority: 'Haute priorité',
    recurring: 'Récurrent',
    dailyStreak: 'Série',
    level: 'Niveau',
    badges: 'Badges',
    noTasksTitle: 'Liste vide',
    noTasksDesc: 'Aucune tâche ici. Appuyez sur + pour en créer une.',
    save: 'Enregistrer',
    cancel: 'Annuler',
  },
  de: {
    today: 'Heute',
    upcoming: 'Demnächst',
    calendar: 'Kalender',
    folders: 'Ordner',
    profile: 'Profil',
    settings: 'Einstellungen',
    addTask: 'Neue Aufgabe',
    quickPlaceholder: 'Aufgabe oder tägliche Erinnerung hinzufügen...',
    smartParse: 'KI-Analyse',
    optimizeDay: 'Tag optimieren',
    allTasks: 'Alle',
    completed: 'Erledigt',
    highPriority: 'Hohe Priorität',
    recurring: 'Wiederkehrend',
    dailyStreak: 'Serie',
    level: 'Stufe',
    badges: 'Abzeichen',
    noTasksTitle: 'Alles erledigt',
    noTasksDesc: 'Keine Aufgaben in dieser Ansicht. Tippe + zum Hinzufügen.',
    save: 'Speichern',
    cancel: 'Abbrechen',
  },
  hi: {
    today: 'आज',
    upcoming: 'आगामी',
    calendar: 'कैलेंडर',
    folders: 'फ़ोल्डर और टैग',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    addTask: 'नया कार्य',
    quickPlaceholder: 'दैनिक कार्य या रिमाइंडर जोड़ें...',
    smartParse: 'AI पार्स',
    optimizeDay: 'दिन व्यवस्थित करें',
    allTasks: 'सभी',
    completed: 'पूर्ण',
    highPriority: 'उच्च प्राथमिकता',
    recurring: 'दैनिक',
    dailyStreak: 'लगातार दिन',
    level: 'स्तर',
    badges: 'बैज',
    noTasksTitle: 'कोई कार्य शेष नहीं',
    noTasksDesc: 'इस दृश्य में कोई कार्य नहीं है। नया जोड़ने के लिए + दबाएं।',
    save: 'सहेजें',
    cancel: 'रद्द करें',
  },
  ja: {
    today: '今日',
    upcoming: '予定',
    calendar: 'カレンダー',
    folders: 'フォルダ',
    profile: 'プロフィール',
    settings: '設定',
    addTask: '新規タスク',
    quickPlaceholder: 'タスクや毎日のリマインダーを追加...',
    smartParse: 'AI解析',
    optimizeDay: '最適化',
    allTasks: 'すべて',
    completed: '完了',
    highPriority: '高優先度',
    recurring: '繰り返し',
    dailyStreak: '連続日数',
    level: 'レベル',
    badges: 'バッジ',
    noTasksTitle: 'タスクはありません',
    noTasksDesc: 'この表示にタスクはありません。+ から追加できます。',
    save: '保存',
    cancel: 'キャンセル',
  },
};

export function useT(lang: LanguageCode): TranslationKeys {
  return DICTIONARY[lang] || DICTIONARY.en;
}
