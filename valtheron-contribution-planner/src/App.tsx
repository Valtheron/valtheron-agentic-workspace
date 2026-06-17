/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  BookOpen, 
  ShieldAlert, 
  CheckSquare, 
  Terminal, 
  Sparkles, 
  ArrowRight, 
  Code, 
  CheckCircle, 
  Layers, 
  Lock, 
  History, 
  Copy, 
  Download, 
  Info, 
  PlusCircle, 
  Loader2, 
  Trash2, 
  Flame, 
  Award,
  RefreshCw,
  Folder,
  FileText,
  ChevronRight,
  Database,
  Edit,
  Eye,
  Maximize2,
  Minimize2,
  RotateCcw
} from 'lucide-react';
import { VALTHERON_INFO, CONTRIBUTION_TOPICS, MESSY_DOCS_STRUCTURE, MessyDocFile } from './data';
import { ContributionTopic, ContributionDraft } from './types';

const TRANSLATIONS = {
  de: {
    appTitle: "Valtheron Beitragsplaner",
    appSubtitle: "Brainstormen, Code prüfen, Dokumentation umstrukturieren und Pull-Requests für das Framework mit 290 spezialisierten Agenten erstellen.",
    tabSandbox: "Aktivitäten-Sandbox",
    tabDocs: "Dokumenten-Manager",
    tabDatabase: "Datenbank & Audit",
    sandboxLabel: "Sandbox",
    docsLabel: "Docs",
    dbLabel: "DB-Audit",
    gitHub: "GitHub",
    
    securityStandards: "AKTIVE KRYPTOGRAFIE- & AUTH-STANDARDS",
    aesTitle: "AES-256-GCM",
    aesDetail: "Militärtaugliche kryptografische Verschlüsselung von Agenten-Anmeldeinformationen, API-Tokens und temporären Speichern.",
    mfaTitle: "Multi-Faktor-Auth",
    mfaDetail: "Erforderliche Sicherheitsebenen für strukturelle Änderungen der Agentenkonfiguration und Betriebsbereitstellungen.",
    auditTitle: "Audit-Trail",
    auditDetail: "WORM-Sicherheits-Logger (Write Once, Read Many) zur Protokollierung aller Handoffs, Modellanweisungen und Token-Overhead.",

    exploreTitle: "Beitragsbereiche erkunden",
    diffText: "Schwierigkeit",
    effortText: "Aufwand",
    selectBtn: "Auswählen",
    all: "Alle (All)",
    docsCat: "Dokumente (Docs)",
    reviewCat: "Codeaudit (Auditor)",
    testsCat: "Testszenarien (Scenarios)",
    onboardingCat: "Onboarding",
    brainstormCat: "Fahrplan (Roadmap)",
    
    customTopicTitle: "Eigenen Beitragsbereich entwerfen",
    customTopicSubtitle: "Definieren Sie eine benutzerdefinierte Aufgabe für die Agenten-Copiloten",
    customLabelTitle: "Titel der Aufgabe",
    customLabelShort: "Kurzbeschreibung",
    customLabelFull: "Ausführlicher Prompt",
    customLabelDifficulty: "Schwierigkeit",
    customLabelEffort: "Voraussichtlicher Aufwand",
    customBtnAdd: "Thema zur Liste hinzufügen",
    
    blueprintsTitle: "Erstellte Beitrags-Blaupausen",
    blueprintDefaultMsg: "Es sind noch keine Entwürfe für dieses Thema vorhanden. Wählen Sie ein Thema links aus und klicken Sie oben auf 'Kompilieren' oder 'Standardisieren', um einen ersten Entwurf zu generieren.",
    compiledAt: "Kompiliert am",
    generatedAt: "Generiert um",
    
    interactiveTitle: "Interaktive Vorschau & Editor",
    editorLeft: "MARKDOWN-EDITOR (LINKS)",
    previewRight: "VORSCHAU GERENDERT (RECHTS)",
    unsavedChanges: "Sie haben ungesicherte Änderungen im Editor.",
    btnSaveDraft: "Entwurf speichern",
    btnSaving: "Wird gespeichert...",
    btnRefine: "Polieren (Refine)",
    optionBoth: "Ton & Prägnanz",
    optionConcise: "Kompakter",
    optionTone: "Professioneller Ton",
    btnRefining: "Wird poliert...",
    
    toastDraftSaved: "Beitrags-Entwurf erfolgreich gesichert!",
    toastSaveError: "Fehler beim Sichern des Entwurfs.",
    toastSelectTopic: "Wählen Sie ein Thema links und klicken Sie auf 'Generieren'.",
    
    docsOrganizerTitle: "Unstrukturierte Projekt-Dokumente",
    docsOrganizerSubtitle: "Scannen und standardisieren Sie unformatierte .txt- oder wilde .json-API-Dateien in das Valtheron-Dokumenten-Format.",
    docOriginalPath: "Originaler Pfad",
    docTargetPath: "Ziel-Pfad",
    docStatus: "Status",
    docStatusMessy: "Unstrukturiert",
    docStatusRestructured: "Standardisiert",
    docJustification: "Reorganisations-Begründung",
    btnStandardize: "Dokument standardisieren",
    btnStandardizing: "Wir analysieren und strukturieren...",
    toastDocStandardized: "Dokument erfolgreich strukturiert & standardisiert!",
    
    dbTitle: "Kryptografischer Ledger-Prüfer",
    dbSubtitle: "Valtheron verfügt über eine WORM-Auditkette (Write-Once-Read-Many), die Betriebsprotokolle mathematisch mithilfe von SHA-256-Hashkoeffizienten verknüpft. Validieren Sie die Kettenblockkoordinaten.",
    dbPassed: "MATHEMATISCHE PRÜFUNG ERFOLGREICH",
    dbFailed: "INTEGRITÄTSVERLETZUNG ENTDECKT",
    dbLogMessage: "Auditverifizierung für die aktive Datenbanksitzung wurde noch nicht durchgeführt.",
    btnAuditLedger: "Sicherheits-Ledger auditieren",
    toastIntegritySuccess: "Ledger weist eine makellose Integrizit auf!",
    toastIntegrityFail: "Sicherheitsverletzung in der Block-Sequenz gefunden!",
    dbBlocksValidated: "Validierte Blöcke",
    dbOverviewTitle: "Kryptografische Transaktionsprotokolle",
    dbOverviewSubtitle: "Direkte Auslesung der verschlüsselten Logs aus der SQLite-Sicherheitsdatenbank (WORM-Protokoll)",
    dbTableAction: "Aktion",
    dbTableDetails: "Ziel / Details",
    dbTableAuthor: "Autor",
    dbTableTimestamp: "Zeitstempel",
    dbTableHash: "Block-Hash SHA-256",
    dbNoLogs: "Keine Log-Einträge vorhanden.",
    btnExportLogs: "Audit-Log exportieren",
    
    btnCopy: "Inhalt kopieren",
    btnDownload: "Downloaden (.md)",
    toastCopied: "In die Zwischenablage kopiert!",
    versionHistoryTitle: "Versionsverlauf des Entwurfs",
    versionLabelCurrent: "Aktualisiert am",
    btnRevert: "Wiederherstellen",
    btnReverted: "Wiederhergestellt",
    noVersionsMsg: "Keine gespeicherten Versionen gefunden",
    toastReverted: "Entwurf erfolgreich auf die ausgewählte Version zurückgesetzt!",
    toastSaveSuccess: "Entwurf erfolgreich mit Versionierung gesichert!",
    btnBatchStandardize: "Ausgewählte standardisieren",
    btnBatchStandardizing: "Stapelverarbeitung läuft...",
    selectAll: "Alle auswählen",
    deselectAll: "Auswahl aufheben",
    selectedCount: "Ausgewählte Dokumente: ",
    toastBatchCompleted: "Stapelverarbeitung abgeschlossen!"
  },
  en: {
    appTitle: "Valtheron Contribution Planner",
    appSubtitle: "Brainstorm, audit code, restructure documentation, and build pull requests for the 290 specialized agent framework.",
    tabSandbox: "Contributions Sandbox",
    tabDocs: "Messy Docs Organizer",
    tabDatabase: "Secure DB & Audit",
    sandboxLabel: "Sandbox",
    docsLabel: "Docs",
    dbLabel: "DB-Audit",
    gitHub: "GitHub",
    
    securityStandards: "ACTIVE CRYPTOGRAPHIC & AUTH STANDARDS",
    aesTitle: "AES-256-GCM",
    aesDetail: "Military-grade cryptographic encryption of agent credentials, API tokens, and temporary memory structures.",
    mfaTitle: "Multi-Factor Auth",
    mfaDetail: "Mandatory security layers gating structural agent configuration edits and operational deploys.",
    auditTitle: "Audit Trailing",
    auditDetail: "WORM (Write Once, Read Many) secure logger tracing all handoffs, model instructions, and token overhead.",

    exploreTitle: "Explore Contribution Directions",
    diffText: "Difficulty",
    effortText: "Effort",
    selectBtn: "Select",
    all: "All",
    docsCat: "📖 Docs",
    reviewCat: "🔍 Auditor",
    testsCat: "🧪 Scenarios",
    onboardingCat: "🚀 Onboarding",
    brainstormCat: "💡 Roadmap",
    
    customTopicTitle: "Design Custom Contribution Topic",
    customTopicSubtitle: "Define a tailored instruction set for the agent copilot to construct",
    customLabelTitle: "Contribution Title",
    customLabelShort: "Short Highlight Description",
    customLabelFull: "Full Prompt Context Instruction Set",
    customLabelDifficulty: "Expertise Difficulty",
    customLabelEffort: "Suggested Timeline",
    customBtnAdd: "Inject Target Area into List",
    
    blueprintsTitle: "Contribution Blueprints Drafted",
    blueprintDefaultMsg: "No drafts exist for this topic yet. Select a topic on the left and click 'Compile Blueprint' or 'Standardize Doc' above.",
    compiledAt: "Compiled at",
    generatedAt: "Generated at",
    
    interactiveTitle: "Interactive Preview & Editor",
    editorLeft: "RAW MARKDOWN EDITOR (LEFT PANE)",
    previewRight: "LIVE RENDERED PREVIEW (RIGHT PANE)",
    unsavedChanges: "You have unsaved edits inside your interactive workspace draft.",
    btnSaveDraft: "Save Draft",
    btnSaving: "Saving...",
    btnRefine: "Refine",
    optionBoth: "Tone & Concise",
    optionConcise: "More Concise",
    optionTone: "Professional Tone",
    btnRefining: "Refining...",
    
    toastDraftSaved: "Contribution draft successfully secured and updated!",
    toastSaveError: "Failed to secure draft updates.",
    toastSelectTopic: "Please select a target topic on the left and click compile above.",
    
    docsOrganizerTitle: "Unstructured Project Documents",
    docsOrganizerSubtitle: "Scan and standardize messy flat .txt configuration guidelines or loose JSON API blueprints into clean Valtheron schemas.",
    docOriginalPath: "Original Path",
    docTargetPath: "Target Path",
    docStatus: "Status",
    docStatusMessy: "Unstructured",
    docStatusRestructured: "Standardized",
    docJustification: "Reorganization Justification",
    btnStandardize: "Standardize & Structure",
    btnStandardizing: "Analyzing guidelines schema...",
    toastDocStandardized: "Unstructured document successfully aligned and drafted!",
    
    dbTitle: "Cryptographic Ledger Auditor",
    dbSubtitle: "Valtheron embeds a Write-Once-Read-Many (WORM) audit chain linking operation logs mathematically using SHA-256 hash coefficients. Verify chain block coordinates.",
    dbPassed: "PASSED MATHEMATICAL PROOF",
    dbFailed: "LEDGER BREACH DETECTED",
    dbLogMessage: "Audit verification has not been performed on the active database session.",
    btnAuditLedger: "Auditate Ledger Cryptography",
    toastIntegritySuccess: "Ledger holding perfect physical cryptographic integrity coefficient!",
    toastIntegrityFail: "WARNING: Integrity breach found in block sequence!",
    dbBlocksValidated: "Blocks validated",
    dbOverviewTitle: "Cryptographic Safe Logs & WORM Ledger",
    dbOverviewSubtitle: "Continuous server ledger logs direct-fetched from SQLite secure backend database streams",
    dbTableAction: "Action Code",
    dbTableDetails: "Target Path / Context",
    dbTableAuthor: "Operator",
    dbTableTimestamp: "Chained Timestamp",
    dbTableHash: "Cryptographic Header Block Hash",
    dbNoLogs: "No audit records registered.",
    btnExportLogs: "Export Ledger Blueprint",
    
    btnCopy: "Copy Clipboard",
    btnDownload: "Download (.md)",
    toastCopied: "Copied to clipboard!",
    versionHistoryTitle: "Draft Version History",
    versionLabelCurrent: "Updated at",
    btnRevert: "Revert",
    btnReverted: "Reverted",
    noVersionsMsg: "No saved versions found",
    toastReverted: "Draft successfully reverted to selected version!",
    toastSaveSuccess: "Draft saved with version history!",
    btnBatchStandardize: "Standardize Selected",
    btnBatchStandardizing: "Batch restructuring...",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    selectedCount: "items selected: ",
    toastBatchCompleted: "Batch restructuring completed!"
  },
  fr: {
    appTitle: "Planificateur de Contributions",
    appSubtitle: "Examinez le code, restructurez la documentation et créez des requêtes de pull request.",
    tabSandbox: "Espace Sandbox",
    tabDocs: "Organisateur Docs",
    tabDatabase: "Audit de BD",
    sandboxLabel: "Sandbox",
    docsLabel: "Docs",
    dbLabel: "Audit",
    gitHub: "GitHub",
    
    securityStandards: "NORMES INTERNES ET SÉCURITÉ",
    aesTitle: "AES-256-GCM",
    aesDetail: "Chiffrement militaire des secrets d'agents, de tokens de connexion API et d'autres clés.",
    mfaTitle: "Contrôles MFA",
    mfaDetail: "Étapes critiques de validation obligatoire pour l'exécution d'un changement matériel ou déploiement.",
    auditTitle: "Registre d'Audit",
    auditDetail: "Logger immuable (WORM) enregistrant les transactions, demandes modèles et jetons dépensés.",

    exploreTitle: "Explorer les contributions de travail",
    diffText: "Difficulté",
    effortText: "Effort",
    selectBtn: "Sélectionner",
    all: "Tout",
    docsCat: "📖 Documents",
    reviewCat: "🔍 Auditeur",
    testsCat: "🧪 Scénarios",
    onboardingCat: "🚀 Intégration",
    brainstormCat: "💡 Roadmap",
    
    customTopicTitle: "Créer un sujet sur mesure",
    customTopicSubtitle: "Configurez une tâche et transmettez-la aux agents de génération",
    customLabelTitle: "Titre du sujet",
    customLabelShort: "Résumé rapide",
    customLabelFull: "Consigne d'invite détaillée",
    customLabelDifficulty: "Difficulté globale",
    customLabelEffort: "Durée estimée",
    customBtnAdd: "Ajouter la tâche à la liste",
    
    blueprintsTitle: "Modèles générés disponibles",
    blueprintDefaultMsg: "Aucun brouillon disponible pour l'instant. Choisissez un sujet sur la gauche ou un fichier, puis lancez la compilation.",
    compiledAt: "Compilé le",
    generatedAt: "Généré à",
    
    interactiveTitle: "Espace Éditeur et Visualisation",
    editorLeft: "ÉDITEUR MARKDOWN (GAUCHE)",
    previewRight: "RENDU VISUEL (DROITE)",
    unsavedChanges: "Certains changements ne sont pas enregistrés.",
    btnSaveDraft: "Sauvegarder",
    btnSaving: "Enregistrement...",
    btnRefine: "Affiner",
    optionBoth: "Ton & Concision",
    optionConcise: "Plus Concis",
    optionTone: "Ton Professionnel",
    btnRefining: "Affinage...",
    
    toastDraftSaved: "Brouillon enregistré avec succès !",
    toastSaveError: "Impossible de modifier ou sauvegarder le document.",
    toastSelectTopic: "Sélectionnez une thématique.",
    
    docsOrganizerTitle: "Réorganisation des fichiers désordonnés",
    docsOrganizerSubtitle: "Passez au crible et intégrez les configurations .txt ou déclarations JSON en markdown standardisé.",
    docOriginalPath: "Fichier source",
    docTargetPath: "Fichier cible",
    docStatus: "Statut",
    docStatusMessy: "Désordonné",
    docStatusRestructured: "Répandu",
    docJustification: "Justification du tri",
    btnStandardize: "Lancer la restructuration",
    btnStandardizing: "Analyse en cours...",
    toastDocStandardized: "Document structuré en modèle optimal !",
    
    dbTitle: "Auditeur de Registre Interne SHA",
    dbSubtitle: "Système de chaînage sécurisé (WORM) validant la conformité des instructions via des sommes SHA-256.",
    dbPassed: "VALIDATION MATHÉMATIQUE APPROUVÉE",
    dbFailed: "ANOMALIE DE SÉCURITÉ DÉTECTÉE",
    dbLogMessage: "L'analyse complète du registre n'a pas encore été déclenchée pour cette session.",
    btnAuditLedger: "Auditer la sécurité physique",
    toastIntegritySuccess: "Le registre ne présente aucune déviation cryptographique !",
    toastIntegrityFail: "Erreur critique : La structure de blocks présente un défaut !",
    dbBlocksValidated: "Blocs scannés",
    dbOverviewTitle: "Journal de Transactions Crypté",
    dbOverviewSubtitle: "Historique flux direct de la base de données sécurisée locale",
    dbTableAction: "Code d'Action",
    dbTableDetails: "Chemin cible / Métadonnées",
    dbTableAuthor: "Auteur",
    dbTableTimestamp: "Horodatage",
    dbTableHash: "Bloc Hash SHA-256",
    dbNoLogs: "Aucune transaction pour l'instant.",
    btnExportLogs: "Exporter les Journaux",
    
    btnCopy: "Copier",
    btnDownload: "Télécharger (.md)",
    toastCopied: "Copié dans le presse-papiers !",
    versionHistoryTitle: "Historique des Versions du Brouillon",
    versionLabelCurrent: "Mis à jour le",
    btnRevert: "Restaurer",
    btnReverted: "Restauré",
    noVersionsMsg: "Aucune version enregistrée trouvée",
    toastReverted: "Brouillon restauré avec succès !",
    toastSaveSuccess: "Brouillon enregistré avec historique des versions !",
    btnBatchStandardize: "Standardiser la sélection",
    btnBatchStandardizing: "Traitement par lot...",
    selectAll: "Tout sélectionner",
    deselectAll: "Tout désélectionner",
    selectedCount: "éléments sélectionnés: ",
    toastBatchCompleted: "Traitement par lot terminé avec succès !"
  },
  pl: {
    appTitle: "Planista Zaangażowania Valtheron",
    appSubtitle: "Projektuj, kontroluj kody, restrukturyzuj dokumentację i wspieraj zadania dla systemu 290 agentów.",
    tabSandbox: "Piaskownica Operacyjna",
    tabDocs: "Zarządca Dokumentów",
    tabDatabase: "Baza Danych i Rejestr",
    sandboxLabel: "Piaskownica",
    docsLabel: "Menedżer Docs",
    dbLabel: "BD i Rejestr",
    gitHub: "GitHub",
    
    securityStandards: "AKTYWNE KONTROLE KRYPTOGRAFICZNE",
    aesTitle: "AES-256-GCM",
    aesDetail: "Zabezpieczenie szyfrem wojskowym danych uwierzytelniających, tokenów i rejestrów transientowych.",
    mfaTitle: "Uwierzytelnianie MFA",
    mfaDetail: "Kluczowa warstwa weryfikacyjna pozwalająca na wdrożenia i modyfikacje konfiguracji.",
    auditTitle: "Immutowalny Rejestr WORM",
    auditDetail: "Bezpieczny logger chroniący dane operacyjne przed modyfikacją za pomocą podpisów.",

    exploreTitle: "Kierunki aktywności projektowych",
    diffText: "Trudność",
    effortText: "Wysiłek",
    selectBtn: "Wybierz",
    all: "Wszystko",
    docsCat: "📖 Dokumentacja",
    reviewCat: "🔍 Audyt",
    testsCat: "🧪 Scenariusze",
    onboardingCat: "🚀 Onboarding",
    brainstormCat: "💡 Roadmap",
    
    customTopicTitle: "Zdefiniuj własny obszar",
    customTopicSubtitle: "Sformułuj instrukcję i przekaż ją bezpośrednio agentom koordynującym",
    customLabelTitle: "Tytuł zadania",
    customLabelShort: "Krótka notka",
    customLabelFull: "Główny prompt operacji",
    customLabelDifficulty: "Poziom",
    customLabelEffort: "Estymacja czasowa",
    customBtnAdd: "Dodaj zadanie do wykazu",
    
    blueprintsTitle: "Dostępne szkice dokumentów",
    blueprintDefaultMsg: "Brak szkiców. Wybierz jeden z tematów z menu bocznego i kliknij generowanie, aby rozpocząć pracę.",
    compiledAt: "Skompilowano",
    generatedAt: "Wygenerowano",
    
    interactiveTitle: "Obszar pracy interaktywnej",
    editorLeft: "EDYTOR MARKDOWN",
    previewRight: "PODGLĄD WIZUALNY",
    unsavedChanges: "Niektóre modyfikacje nie zostały jeszcze zapisane.",
    btnSaveDraft: "Zapisz zmiany",
    btnSaving: "Zapisywanie...",
    btnRefine: "Ulepsz",
    optionBoth: "Ton i Zwięzłość",
    optionConcise: "Zwięzły",
    optionTone: "Ton Profesjonalny",
    btnRefining: "Przetwarzanie...",
    
    toastDraftSaved: "Szkic został pomyślnie zapisany w bazie !",
    toastSaveError: "Problem z zapisaniem szkicu.",
    toastSelectTopic: "Wybierz temat po lewej.",
    
    docsOrganizerTitle: "Uporządkowanie Rozproszonej Dokumentacji",
    docsOrganizerSubtitle: "Analizuj rozproszone notatki .txt lub API JSON i przekształcaj je w ustandaryzowany markdown.",
    docOriginalPath: "Plik oryginalny",
    docTargetPath: "Ścieżka zapisu",
    docStatus: "Status",
    docStatusMessy: "Chropowaty",
    docStatusRestructured: "Zunifikowany",
    docJustification: "Uzasadnienie translacji",
    btnStandardize: "Przekształć dokument",
    btnStandardizing: "Analizowanie zawartości...",
    toastDocStandardized: "Plik ustrukturyzowany do systemu Valtheron !",
    
    dbTitle: "Audytor łańcucha kryptograficznego",
    dbSubtitle: "Narzędzie matematycznej weryfikacji powiązań bloków logów transakcyjnych SHA-256.",
    dbPassed: "PROCES MATEMATYCZNY ZAAKCEPTOWANY",
    dbFailed: "NARUSZENIE INTEGRALNOŚCI STRUKTURY",
    dbLogMessage: "Nie uruchomiono weryfikacji bloków w bieżącej sesji.",
    btnAuditLedger: "Uruchom audyt kryptograficzny",
    toastIntegritySuccess: "Łańcuch bloków zachowuje całkowitą integralność spójności!",
    toastIntegrityFail: "Wykryto niezgodność sum kontrolnych w łańcuchu !",
    dbBlocksValidated: "Bloki zwalidowane",
    dbOverviewTitle: "Transakcyjny Rejestr Aktywności WORM",
    dbOverviewSubtitle: "Operacje logowane w bazie danych pobierane w czasie rzeczywistym",
    dbTableAction: "Kod Operacji",
    dbTableDetails: "Powiązanie / Szczegóły",
    dbTableAuthor: "Operator",
    dbTableTimestamp: "Czas rejestracji",
    dbTableHash: "Szyfr Bloku SHA-256",
    dbNoLogs: "Brak zalogowanych operacji.",
    btnExportLogs: "Eksportuj audyt",
    
    btnCopy: "Kopiuj",
    btnDownload: "Pobierz (.md)",
    toastCopied: "Skopiowano do schowka !",
    versionHistoryTitle: "Klasyfikacja i Historia Wersji Szkicu",
    versionLabelCurrent: "Zaktualizowano o",
    btnRevert: "Przywróć",
    btnReverted: "Przywrócono",
    noVersionsMsg: "Nie znaleziono zapisanych wersji",
    toastReverted: "Szkic został przywrócony do wybranej wersji!",
    toastSaveSuccess: "Zapisano szkic wraz z historią wersji!",
    btnBatchStandardize: "Ujednolic zaznaczone",
    btnBatchStandardizing: "Przetwarzanie wsadowe...",
    selectAll: "Zaznacz wszystkie",
    deselectAll: "Odznacz wszystkie",
    selectedCount: "Zaznaczono elementów: ",
    toastBatchCompleted: "Przetwarzanie wsadowe zakończone pomyślnie!"
  }
};

export default function App() {
  const [lang, setLang] = useState<'de' | 'en' | 'fr' | 'pl'>('de');

  const t = (key: keyof typeof TRANSLATIONS['en']): string => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || String(key);
  };

  const [activeViewTab, setActiveViewTab] = useState<'sandbox' | 'docs_organizer' | 'database'>('sandbox');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [topics, setTopics] = useState<ContributionTopic[]>(CONTRIBUTION_TOPICS);
  const [selectedTopic, setSelectedTopic] = useState<ContributionTopic>(CONTRIBUTION_TOPICS[0]);
  const [selectedMessyDoc, setSelectedMessyDoc] = useState<MessyDocFile>(MESSY_DOCS_STRUCTURE[1]); // Default to v1_setup_instruction.txt
  const [batchSelectedPaths, setBatchSelectedPaths] = useState<string[]>([]);
  const [batchProgress, setBatchProgress] = useState<{
    total: number;
    current: number;
    activeFile?: string;
    isBatching: boolean;
  }>({ total: 0, current: 0, isBatching: false });
  
  const [drafts, setDrafts] = useState<ContributionDraft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<string>('');
  const [activeDraftId, setActiveDraftId] = useState<string>('');
  const [saveLabelText, setSaveLabelText] = useState<string>('');
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isRefiningDraft, setIsRefiningDraft] = useState<boolean>(false);
  const [refineOption, setRefineOption] = useState<'concise' | 'tone' | 'both'>('both');
  const [unsavedChanges, setUnsavedChanges] = useState<{ [id: string]: boolean }>({});
  const [isWidescreenSandbox, setIsWidescreenSandbox] = useState<boolean>(false);
  const [isWidescreenDocs, setIsWidescreenDocs] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Diagnostic Log Ledger & Sim queue
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [integrityResult, setIntegrityResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Custom Topic Form Input States
  const [newTopicTitle, setNewTopicTitle] = useState<string>('');
  const [newTopicCategory, setNewTopicCategory] = useState<'docs' | 'review' | 'tests' | 'onboarding' | 'brainstorm'>('docs');
  const [newTopicShort, setNewTopicShort] = useState<string>('');
  const [newTopicFull, setNewTopicFull] = useState<string>('');
  const [newTopicDifficulty, setNewTopicDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [newTopicEffort, setNewTopicEffort] = useState<string>('2 hours');

  // Custom Input Forms for tab 1 (Curated Topics)
  const [customCode, setCustomCode] = useState<string>(`// Paste your React/Express contribution code here for full review!
import express from 'express';
const router = express.Router();

router.post('/api/v1/agent/config', (req, res) => {
  const { agentId, secretToken } = req.body;
  
  // Is this secure under SQLite concurrency & AES constraints?
  db.run("UPDATE agents SET secret = '" + secretToken + "' WHERE id = " + agentId);
  
  res.json({ status: "success" });
});`);
  const [customContext, setCustomContext] = useState<'security' | 'sqlite' | 'express' | 'general'>('security');
  
  const [docsFormat, setDocsFormat] = useState<'readme' | 'tutorial' | 'api-ref' | 'flowchart'>('tutorial');
  const [docsScope, setDocsScope] = useState<string>('Deep dive into Express 5.1 middleware and authentication handoffs.');
  
  const [testComponent, setTestComponent] = useState<string>('Orchestrator Handoff Service');
  const [testAgent, setTestAgent] = useState<string>('TranslatorAgent & SummarizerAgent');
  const [testComplexity, setTestComplexity] = useState<'simple' | 'complex'>('complex');
  
  const [roadmapFeature, setRoadmapFeature] = useState<'postgresql' | 'kubernetes' | 'sso-oidc' | 'scaling'>('postgresql');
  const [roadmapDetails, setRoadmapDetails] = useState<string>('Design database schema, connection pooling configs under heavy load state handles.');

  // Load backend data on boot with live periodic updates
  useEffect(() => {
    fetchDrafts();
    fetchTopics();
    fetchAuditLogs();

    // Setup active background monitoring of logs
    const interval = setInterval(() => {
      fetchAuditLogs();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // When custom topics are seeded, synchronize selection gracefully
  useEffect(() => {
    if (topics.length > 0 && !topics.find(t => t.id === selectedTopic?.id)) {
      setSelectedTopic(topics[0]);
    }
  }, [topics]);

  // Fetch API handlers
  const fetchDrafts = async () => {
    try {
      const res = await fetch('/api/drafts');
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
      }
    } catch (err) {
      console.warn("Could not load drafts from database:", err);
    }
  };

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/topics');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setTopics(data);
        }
      }
    } catch (err) {
      console.warn("Could not load topics from database:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.warn("Could not load audit trailing database logs:", err);
    }
  };

  // Show auto-expiring toast
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Copy text helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied content to clipboard successfully!", "success");
  };

  // Download draft as markdown file
  const downloadAsMarkdown = (draft: ContributionDraft) => {
    const element = document.createElement("a");
    const file = new Blob([draft.responseMarkdown], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `valtheron_contribution_${draft.topicId}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast(`Downloaded "${draft.title}" file successfully!`, "success");
  };

  // Handle local typing updates in split-pane markdown editor
  const handleEditDraftText = (text: string) => {
    setCurrentDraft(text);
    if (activeDraftId) {
      // Mark as unsaved
      setUnsavedChanges(prev => ({ ...prev, [activeDraftId]: true }));
      // Keep in-memory drafts updated so downloading or switching has latest changes immediately
      setDrafts(prev => prev.map(d => d.id === activeDraftId ? { ...d, responseMarkdown: text } : d));
    }
  };

  // Securely save raw markdown changes to backend database
  const handleSaveActiveDraftText = async () => {
    if (!activeDraftId) return;
    setIsSavingDraft(true);
    try {
      const res = await fetch(`/api/drafts/${activeDraftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          responseMarkdown: currentDraft,
          label: saveLabelText.trim() || 'User Save'
        })
      });
      if (res.ok) {
        setUnsavedChanges(prev => ({ ...prev, [activeDraftId]: false }));
        setSaveLabelText('');
        showToast(t('toastSaveSuccess'), "success");
        await fetchDrafts();
        fetchAuditLogs(); // Refresh ledger logs to show rewrite audit trail!
      } else {
        throw new Error("Unable to save draft update, server error.");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to commit changes.", "error");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Revert active draft to a previously saved version
  const handleRevertDraft = async (versionId: string) => {
    if (!activeDraftId) return;
    setIsSavingDraft(true);
    try {
      const res = await fetch(`/api/drafts/${activeDraftId}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentDraft(data.draft.responseMarkdown);
        setUnsavedChanges(prev => ({ ...prev, [activeDraftId]: false }));
        showToast(t('toastReverted'), "success");
        await fetchDrafts();
        fetchAuditLogs();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to revert to chosen version.");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Error reverting draft.", "error");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Securely request AI refinement focused on conciseness or tone
  const handleRefineDraft = async () => {
    if (!currentDraft) {
      showToast("No active draft text present to refine.", "error");
      return;
    }
    setIsRefiningDraft(true);
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: activeDraftId,
          text: currentDraft,
          option: refineOption
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentDraft(data.refinedText);
        if (activeDraftId) {
          setUnsavedChanges(prev => ({ ...prev, [activeDraftId]: false }));
        }
        await fetchDrafts();
        showToast(
          data.isMocked 
            ? "Simulated model refinement compiled successfully (Offline mode)."
            : "AI Model processed and polished your document blueprint successfully!", 
          "success"
        );
        fetchAuditLogs();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Refinement processing failed.");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Refinement failed.", "error");
    } finally {
      setIsRefiningDraft(false);
    }
  };

  // Trigger server AI generation for Curated Topics (Tab 1)
  const handleGenerate = async (topic: ContributionTopic) => {
    setIsLoading(true);
    let payload: any = {};

    if (topic.category === 'docs') {
      payload = { format: docsFormat, scope: docsScope };
    } else if (topic.category === 'review') {
      payload = { code: customCode, context: customContext };
    } else if (topic.category === 'tests') {
      payload = { component: testComponent, agentType: testAgent, complexity: testComplexity };
    } else if (topic.category === 'brainstorm') {
      payload = { feature: roadmapFeature, details: roadmapDetails };
    } else {
      payload = { details: "Standard developer onboarding workflow setup checklist" };
    }

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: topic.category,
          title: topic.title,
          payload
        })
      });

      if (!response.ok) {
        throw new Error("Internal server was unable to complete the request.");
      }

      const data = await response.json();
      
      const serverDraft: ContributionDraft = {
        id: data.id,
        topicId: data.topicId,
        title: data.title,
        category: data.category,
        promptNotes: data.promptNotes,
        responseMarkdown: data.responseMarkdown,
        createdAt: data.createdAt
      };

      setDrafts(prev => [serverDraft, ...prev]);
      setCurrentDraft(serverDraft.responseMarkdown);
      setActiveDraftId(serverDraft.id);

      showToast(
        data.isMocked 
          ? "Generated outline (Fallback mode). Syncing SQLite database log trail..." 
          : "Successfully crafted tailored open-source contribution draft!",
        data.isMocked ? "info" : "success"
      );

      fetchAuditLogs(); // Refresh logs to display transaction block immediately!
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed generating the suggestion, please retry.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Target refactor action (Tab 2) for a disorganized file
  const handleRefactorMessyFile = async (doc: MessyDocFile) => {
    setIsLoading(true);
    const proposedTitle = `Refactor of ${doc.originalPath} to standard modular location ${doc.targetPath}`;
    
    const payload = {
      format: doc.type === 'json' ? 'api-ref' : doc.type === 'yaml' ? 'flowchart' : 'tutorial',
      scope: `Refactoring the file describing: "${doc.description}". 
      Original Path: ${doc.originalPath} 
      Optimized destination path: ${doc.targetPath}
      Justification for movement: ${doc.reorganizationJustification}
      Ensure the produced file matches high code quality checklist standards, clean type safety, and Express 5.1/React 19 conventions.`
    };

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'docs',
          title: proposedTitle,
          payload
        })
      });

      if (!response.ok) {
        throw new Error("Internal server was unable to process the refactoring draft.");
      }

      const data = await response.json();

      const serverDraft: ContributionDraft = {
        id: data.id,
        topicId: data.topicId,
        title: data.title,
        category: data.category,
        promptNotes: data.promptNotes,
        responseMarkdown: data.responseMarkdown,
        createdAt: data.createdAt
      };

      setDrafts(prev => [serverDraft, ...prev]);
      setCurrentDraft(serverDraft.responseMarkdown);
      setActiveDraftId(serverDraft.id);

      showToast(`Formulated clean restructured markdown for ${doc.originalPath.split('/').pop()}`, "success");
      fetchAuditLogs();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed generating restructuring draft.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a global restructuring pull request script
  const handleGenerateGlobalRestructurePR = async () => {
    setIsLoading(true);
    const title = "Complete Documentation Directory Structure Refactor & Modernization Plan";
    const payload = {
      feature: 'scaling',
      details: `We want to clean up our disorganized /docs folder tree. Create a cohesive, scannable PR draft listing:
      1. A Shell command script utilizing 'mkdir -p' and 'git mv' commands to move all the following disorganized files:
         - docs/v1_setup_instruction.txt -> docs/guides/getting-started.md
         - docs/security_brief.pdf -> docs/architecture/security-model.md
         - docs/agent-architecture-overview.md -> docs/architecture/agent-orchestrator.md
         - docs/routes_v5_full_api.json -> docs/api/express-endpoints.md
         - docs/draft_onboarding_list.md -> docs/onboarding/contributor-blueprint.md
         - docs/kubernetes_draft.yaml -> docs/deployment/kubernetes-helm.md
         - docs/roadmap_discussion_v2.txt -> docs/roadmap/v2-database-scaling.md
      2. The design strategy behind this hierarchy
      3. A Checklist of files converted from txt/json/yaml into rich Markdown standards.`
    };

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'brainstorm',
          title: title,
          payload
        })
      });

      if (!response.ok) {
        throw new Error("Unable to create global restructuring plan.");
      }

      const data = await response.json();

      const serverDraft: ContributionDraft = {
        id: data.id,
        topicId: data.topicId,
        title: data.title,
        category: data.category,
        promptNotes: data.promptNotes,
        responseMarkdown: data.responseMarkdown,
        createdAt: data.createdAt
      };

      setDrafts(prev => [serverDraft, ...prev]);
      setCurrentDraft(serverDraft.responseMarkdown);
      setActiveDraftId(serverDraft.id);

      showToast("Formulated Directory Restructuring script and PR roadmap!", "success");
      fetchAuditLogs();
    } catch (error: any) {
      console.error(error);
      showToast("Failed to compile global PR draft.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Permanently delete a draft from server SQL/file database log
  const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/drafts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDrafts(prev => prev.filter(d => d.id !== id));
        showToast("Draft securely purged from database storage.", "success");
        if (activeDraftId === id) {
          setActiveDraftId('');
          setCurrentDraft('');
        }
        fetchAuditLogs();
      } else {
        showToast("Server was unable to delete selected draft block.", "error");
      }
    } catch (err) {
      showToast("Failed to connect to delete endpoint.", "error");
    }
  };

  // Submit standard parameters to create custom database contribution topic
  const handleCreateCustomTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle || !newTopicShort || !newTopicFull) {
      showToast("Please fully define custom topic parameters.", "error");
      return;
    }

    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newTopicCategory,
          title: newTopicTitle,
          shortDesc: newTopicShort,
          fullDesc: newTopicFull,
          difficulty: newTopicDifficulty,
          suggestedEffort: newTopicEffort
        })
      });

      if (res.ok) {
        const topicData = await res.json();
        setTopics(prev => [...prev, topicData]);
        setSelectedTopic(topicData);
        showToast(`Custom topic "${newTopicTitle}" successfully saved to server!`, "success");
        
        // Reset topic creation form values
        setNewTopicTitle('');
        setNewTopicShort('');
        setNewTopicFull('');
        
        fetchAuditLogs();
      } else {
        showToast("Error creating custom topic.", "error");
      }
    } catch (err) {
      showToast("Connection failed to database API.", "error");
    }
  };

  // Verify full ledger chained sequence
  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/audit-logs/verify', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIntegrityResult(data);
        if (data.isValid) {
          showToast("Ledger holding perfect physical cryptographic integrity coefficient!", "success");
        } else {
          showToast("WARNING: Integrity breach found in block sequence!", "error");
        }
        fetchAuditLogs();
      }
    } catch (err) {
      showToast("Cryptographic verifier middleware is currently offline.", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredTopics = selectedCategory === 'all' 
    ? topics 
    : topics.filter(t => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#070b13] font-sans text-gray-200 selection:bg-cyan-500 selection:text-black">
      {/* Dynamic Header */}
      <header className="border-b border-gray-800/80 bg-[#0b0f19]/95 sticky top-0 z-50 backdrop-blur" id="header_container">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
              <GitPullRequest className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-white tracking-wide">
                  {t('appTitle')}
                </h1>
                <span className="text-[10px] bg-cyan-950/60 border border-cyan-800 text-cyan-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                  Companion v1.1
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('appSubtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Language Selector Controls */}
            <div className="flex bg-gray-950 border border-gray-800 rounded-lg p-0.5 text-[10px] font-mono text-gray-400 gap-0.5" id="language_switcher">
              <button 
                onClick={() => setLang('de')} 
                className={`px-1.5 py-1 rounded-md transition duration-150 shrink-0 ${lang === 'de' ? 'bg-cyan-500 text-black font-semibold' : 'hover:text-white'}`}
                title="Deutsch"
              >
                🇩🇪 DE
              </button>
              <button 
                onClick={() => setLang('en')} 
                className={`px-1.5 py-1 rounded-md transition duration-150 shrink-0 ${lang === 'en' ? 'bg-cyan-500 text-black font-semibold' : 'hover:text-white'}`}
                title="English"
              >
                🇬🇧 EN
              </button>
              <button 
                onClick={() => setLang('fr')} 
                className={`px-1.5 py-1 rounded-md transition duration-150 shrink-0 ${lang === 'fr' ? 'bg-cyan-500 text-black font-semibold' : 'hover:text-white'}`}
                title="Français"
              >
                🇫🇷 FR
              </button>
              <button 
                onClick={() => setLang('pl')} 
                className={`px-1.5 py-1 rounded-md transition duration-150 shrink-0 ${lang === 'pl' ? 'bg-cyan-500 text-black font-semibold' : 'hover:text-white'}`}
                title="Polski"
              >
                🇵🇱 PL
              </button>
            </div>

            <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-0.5 sm:p-1 text-[11px] sm:text-xs overflow-x-auto no-scrollbar max-w-full gap-0.5" id="header_view_tabs">
              <button 
                onClick={() => setActiveViewTab('sandbox')}
                className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-medium transition duration-150 flex items-center gap-1 sm:gap-1.5 shrink-0 ${activeViewTab === 'sandbox' ? 'bg-cyan-500 text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
              >
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>
                  <span className="hidden sm:inline">{t('tabSandbox')}</span>
                  <span className="sm:hidden inline">{t('sandboxLabel')}</span>
                </span>
              </button>
              <button 
                onClick={() => setActiveViewTab('docs_organizer')}
                className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-medium transition duration-150 flex items-center gap-1 sm:gap-1.5 shrink-0 ${activeViewTab === 'docs_organizer' ? 'bg-cyan-500 text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
              >
                <Folder className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>
                  <span className="hidden sm:inline">{t('tabDocs')}</span>
                  <span className="sm:hidden inline">{t('docsLabel')}</span>
                </span>
              </button>
              <button 
                onClick={() => setActiveViewTab('database')}
                className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-medium transition duration-150 flex items-center gap-1 sm:gap-1.5 shrink-0 ${activeViewTab === 'database' ? 'bg-cyan-500 text-black font-semibold' : 'text-gray-400 hover:text-white'}`}
              >
                <Database className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>
                  <span className="hidden sm:inline">{t('tabDatabase')}</span>
                  <span className="sm:hidden inline">{t('dbLabel')}</span>
                </span>
              </button>
            </div>

            <a 
              href={VALTHERON_INFO.githubUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/85 hover:bg-gray-700/80 border border-gray-700 text-xs font-medium rounded-lg text-white transition duration-150 shadow"
            >
              <Terminal className="w-3 h-3 text-gray-400" />
              <span>{t('gitHub')}</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in" id="primary_main_section">
        {/* Banner with contextual briefing */}
        <section className="mb-8 bg-gradient-to-r from-gray-900 via-[#0a101d] to-gray-900 border border-gray-850 rounded-2xl p-6 relative overflow-hidden" id="workspace_banner">
          <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-b from-cyan-500/5 to-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 bg-cyan-950/50 border border-cyan-800/30 px-2.5 py-1 rounded-full mb-3 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" /> High-Consequences Agentic Orchestration
              </span>
              <h2 className="text-2xl font-bold font-display text-white mb-2">
                Analyze, Standardize & Restructure
              </h2>
              <p className="text-gray-300 text-xs leading-relaxed mb-4">
                {VALTHERON_INFO.overview} Because the repository includes a comprehensive <strong>Valtheron Handbuch v2.pdf</strong> alongside miscellaneous disorganized notes, contributors need quick mechanisms to restructure files, audit standard Express routers, and produce flawless markdown.
              </p>
              
              <div className="flex flex-wrap gap-2">
                {VALTHERON_INFO.stack.map((tech) => (
                  <div key={tech.name} className="bg-gray-850/60 border border-gray-800 p-2 py-1.5 rounded-lg flex flex-col">
                    <span className="text-xs font-semibold text-white font-mono">{tech.name}</span>
                    <span className="text-[10px] text-gray-400 line-clamp-1">{tech.role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 h-full">
              <div className="bg-gray-950/60 border border-gray-850 p-4 rounded-xl flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center justify-between">
                    <span>{t('securityStandards')}</span>
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  </h3>
                  <div className="space-y-2.5">
                    {VALTHERON_INFO.security.map((sec) => {
                      const isAes = sec.feature.includes("AES");
                      const isMfa = sec.feature.includes("Multi-Factor") || sec.feature.includes("MFA") || sec.feature.includes("Auth");
                      const title = isAes ? t('aesTitle') : (isMfa ? t('mfaTitle') : t('auditTitle'));
                      const detail = isAes ? t('aesDetail') : (isMfa ? t('mfaDetail') : t('auditDetail'));
                      return (
                        <div key={sec.feature} className="text-xs">
                          <span className="font-semibold text-white block font-mono text-[11px]">{title}</span>
                          <span className="text-gray-400 block mt-0.5 leading-relaxed text-[11px]">{detail}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Tab 1 View: The Original Sandbox Area */}
        {activeViewTab === 'sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="sandbox_grid_container">
            
            {/* LEFT PANEL: Curated Topics & Sandbox Customizers (7 Cols) */}
            <div className={`lg:col-span-7 space-y-6 ${isWidescreenSandbox ? 'hidden' : ''}`}>
              
              {/* Filter Section */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-850 pb-4">
                <h3 className="text-gray-150 font-bold font-display text-base flex items-center gap-2">
                  <span>{t('exploreTitle')}</span>
                </h3>
                
                <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-0.5 text-xs text-gray-400 overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setSelectedCategory('all')} 
                    className={`px-2.5 py-1 rounded-md font-medium transition duration-150 shrink-0 ${selectedCategory === 'all' ? 'bg-cyan-500 text-black font-semibold' : 'hover:text-white'}`}
                  >
                    {t('all')}
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('docs')} 
                    className={`px-2.5 py-1 rounded-md font-medium transition duration-150 shrink-0 ${selectedCategory === 'docs' ? 'bg-cyan-500 text-black font-semibold' : 'hover:text-white'}`}
                  >
                    {t('docsCat')}
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('review')} 
                    className={`px-2.5 py-1 rounded-md font-medium transition duration-150 shrink-0 ${selectedCategory === 'review' ? 'bg-cyan-500 text-black font-semibold' : 'hover:text-white'}`}
                  >
                    {t('reviewCat')}
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('tests')} 
                    className={`px-2.5 py-1 rounded-md font-medium transition duration-150 shrink-0 ${selectedCategory === 'tests' ? 'bg-cyan-500 text-black font-semibold' : 'hover:text-white'}`}
                  >
                    {t('testsCat')}
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('onboarding')} 
                    className={`px-2.5 py-1 rounded-md font-medium transition duration-150 shrink-0 ${selectedCategory === 'onboarding' ? 'bg-cyan-500 text-black font-semibold' : 'hover:text-white'}`}
                  >
                    {t('onboardingCat')}
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('brainstorm')} 
                    className={`px-2.5 py-1 rounded-md font-medium transition duration-150 shrink-0 ${selectedCategory === 'brainstorm' ? 'bg-cyan-500 text-black font-semibold' : 'hover:text-white'}`}
                  >
                    {t('brainstormCat')}
                  </button>
                </div>
              </div>

              {/* List of selectables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="scollable_topic_grid">
                {filteredTopics.map((topic) => {
                  const isSelected = selectedTopic.id === topic.id;
                  let catBadge = "bg-gray-800 text-gray-300";
                  if (topic.category === 'docs') catBadge = "bg-emerald-950/40 text-emerald-400 border border-emerald-800/20";
                  if (topic.category === 'review') catBadge = "bg-rose-950/40 text-rose-400 border border-rose-800/20";
                  if (topic.category === 'tests') catBadge = "bg-sky-950/40 text-sky-400 border border-sky-800/20";
                  if (topic.category === 'onboarding') catBadge = "bg-purple-950/40 text-purple-400 border border-purple-800/20";
                  if (topic.category === 'brainstorm') catBadge = "bg-amber-950/40 text-amber-400 border border-amber-800/20";

                  let difficultyBadge = "text-emerald-400";
                  if (topic.difficulty === 'Intermediate') difficultyBadge = "text-amber-400";
                  if (topic.difficulty === 'Advanced') difficultyBadge = "text-rose-400 font-bold";

                  return (
                    <div 
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic)}
                      className={`cursor-pointer transition-all duration-200 border text-left p-4 rounded-xl flex flex-col justify-between ${
                        isSelected 
                          ? 'border-cyan-400 bg-cyan-950/10 shadow-lg shadow-cyan-950/20' 
                          : 'border-gray-800 bg-[#0b0f19]/40 hover:bg-[#0e1423]/60 hover:border-gray-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold font-mono tracking-wider ${catBadge}`}>
                            {topic.category === 'docs' && '📖 Documentation'}
                            {topic.category === 'review' && '🔍 Security Audit'}
                            {topic.category === 'tests' && '🧪 Robust Test Cases'}
                            {topic.category === 'onboarding' && '🚀 Onboarding'}
                            {topic.category === 'brainstorm' && '💡 Architecture'}
                          </span>
                          
                          <div className="flex gap-1.5 items-center">
                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                            <span className={`${difficultyBadge} text-[10px] font-mono uppercase bg-gray-900 border border-gray-800 px-1 py-0.5 rounded`}>
                              {topic.difficulty}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-white font-semibold font-display text-xs tracking-wide line-clamp-1 mb-1.5">
                          {topic.title}
                        </h4>
                        <p className="text-gray-400 text-[11px] leading-relaxed line-clamp-2">
                          {topic.shortDesc}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-gray-850 flex justify-between items-center text-[10px] text-gray-550 font-mono">
                        <span>Effort: <strong className="text-gray-300">{topic.suggestedEffort}</strong></span>
                        <span className="flex items-center gap-1 text-cyan-400">
                          Select <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Topic Context Details & Customizer Area */}
              <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-5" id="topic_customizer_container">
                <div className="flex justify-between items-baseline gap-4 mb-2.5">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-semibold">
                    Configure Draft Rules & Scopes
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    ID: {selectedTopic.id}
                  </span>
                </div>
                
                <h3 className="text-md font-bold text-white font-display flex items-center gap-2 mb-1.5">
                  <span>{selectedTopic.title}</span>
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  {selectedTopic.fullDesc}
                </p>

                {/* Dynamic Inputs depending on category of selected topic */}
                <div className="bg-gray-950/65 border border-gray-900 rounded-xl p-4 mb-5" id="dynamic_topic_inputs">
                  
                  {selectedTopic.category === 'docs' && (
                    <div className="space-y-4">
                      <h5 className="text-xs font-mono font-bold text-cyan-300 border-b border-gray-900 pb-2">
                        Documentation Formatting Tweaks
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                            <span>Documentation Formatting Style</span>
                            <span className="group relative inline-block cursor-help select-none">
                              <Info className="w-3.5 h-3.5 text-cyan-400 hover:text-cyan-300 inline-block align-middle" />
                              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-950 border border-cyan-500/30 rounded-lg shadow-xl text-[10px] text-gray-200 font-sans normal-case tracking-normal z-50 leading-relaxed font-normal text-left">
                                <strong className="text-cyan-400 block mb-0.5">Format Guidance</strong>
                                Determines the layout and style: "Tutorial Setup" generates step-by-step setup guides, while "Strict API Reference" generates contract definitions.
                                <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-950"></span>
                              </span>
                            </span>
                          </label>
                          <select 
                            value={docsFormat} 
                            onChange={(e) => setDocsFormat(e.target.value as any)}
                            className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg text-xs p-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                          >
                            <option value="tutorial">Step-by-Step Tutorial & Setup Code</option>
                            <option value="api-ref">Strict API Reference & Endpoint contracts</option>
                            <option value="readme">Compact README.md Outlines</option>
                            <option value="flowchart">Interactive Text Flowchart Diagram</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                            <span>Specific Tech Exclusions or Focus</span>
                            <span className="group relative inline-block cursor-help select-none">
                              <Info className="w-3.5 h-3.5 text-cyan-400 hover:text-cyan-300 inline-block align-middle" />
                              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-950 border border-cyan-500/30 rounded-lg shadow-xl text-[10px] text-gray-200 font-sans normal-case tracking-normal z-50 leading-relaxed font-normal text-left">
                                <strong className="text-cyan-400 block mb-0.5">Scope Guidance</strong>
                                Highlights or bypasses specific items. Specifying "AES-256-GCM" or "Express" instructs the agent to zoom into these security aspects.
                                <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-950"></span>
                              </span>
                            </span>
                          </label>
                          <input 
                            type="text" 
                            value={docsScope} 
                            onChange={(e) => setDocsScope(e.target.value)}
                            placeholder="e.g. Focus on Express route decorators or AES decryption handlers."
                            className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg text-xs p-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTopic.category === 'review' && (
                    <div className="space-y-4">
                      <h5 className="text-xs font-mono font-bold text-cyan-300 border-b border-gray-900 pb-2">
                        Developer Code Auditor Customizer
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label className="block text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                            <span>Audit Core Context</span>
                            <span className="group relative inline-block cursor-help select-none">
                              <Info className="w-3.5 h-3.5 text-cyan-400 hover:text-cyan-300 inline-block align-middle" />
                              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-950 border border-cyan-500/30 rounded-lg shadow-xl text-[10px] text-gray-200 font-sans normal-case tracking-normal z-50 leading-relaxed font-normal text-left">
                                <strong className="text-cyan-400 block mb-0.5">Audit Context Guidance</strong>
                                Guides target identification. Choose "AES-256-GCM" for encryption layers, or "SQLite concurrency" to inspect thread lock delays and ACID rules.
                                <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-950"></span>
                              </span>
                            </span>
                          </label>
                          <select
                            value={customContext}
                            onChange={(e) => setCustomContext(e.target.value as any)}
                            className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg text-xs p-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                          >
                            <option value="security">AES-256-GCM / Token exposures</option>
                            <option value="sqlite">SQLite concurrency pools & locking</option>
                            <option value="express">Express 5.1 request validators</option>
                            <option value="general">Clarity, clean interfaces & ESM</option>
                          </select>
                          <div className="mt-3 p-2 bg-rose-950/20 text-[10px] text-rose-400 border border-rose-900/30 rounded leading-relaxed">
                            Flags memory lock patterns, transaction boundaries, and unauthenticated routes.
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-medium text-gray-400 mb-1 flex justify-between items-center">
                            <span className="flex items-center gap-1">
                              <span>Input Proposed Contribution Code Block</span>
                              <span className="group relative inline-block cursor-help select-none">
                                <Info className="w-3.5 h-3.5 text-cyan-400 hover:text-cyan-300 inline-block align-middle" />
                                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-950 border border-cyan-500/30 rounded-lg shadow-xl text-[10px] text-gray-200 font-sans normal-case tracking-normal z-50 leading-relaxed font-normal text-left">
                                  <strong className="text-cyan-400 block mb-0.5">Code Block Guidance</strong>
                                  Provide the raw TypeScript or JavaScript code containing endpoints or database connections to analyze using the sandbox auditor logic.
                                  <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-950"></span>
                                </span>
                              </span>
                            </span>
                            <span className="text-[10px] text-cyan-500">TypeScript Code</span>
                          </label>
                          <textarea
                            rows={6}
                            value={customCode}
                            onChange={(e) => setCustomCode(e.target.value)}
                            className="w-full bg-gray-900/90 border border-gray-850 font-mono text-[11px] rounded-lg p-2 text-gray-300 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTopic.category === 'tests' && (
                    <div className="space-y-4">
                      <h5 className="text-xs font-mono font-bold text-cyan-300 border-b border-gray-900 pb-2">
                        Vitest Target Configuration Values
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                            <span>Target Core Subsystem</span>
                            <span className="group relative inline-block cursor-help select-none">
                              <Info className="w-3.5 h-3.5 text-cyan-400 hover:text-cyan-300 inline-block align-middle" />
                              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-950 border border-cyan-500/30 rounded-lg shadow-xl text-[10px] text-gray-200 font-sans normal-case tracking-normal z-50 leading-relaxed font-normal text-left">
                                <strong className="text-cyan-400 block mb-0.5">Target Guidance</strong>
                                Specifies which internal module requires test automation. Common subsystems include "cryptographic-ledger", "db-transaction-pool", or "express-ingress".
                                <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-950"></span>
                              </span>
                            </span>
                          </label>
                          <input
                            type="text"
                            value={testComponent}
                            onChange={(e) => setTestComponent(e.target.value)}
                            className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg text-xs p-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                            <span>Tested Agent Typology</span>
                            <span className="group relative inline-block cursor-help select-none">
                              <Info className="w-3.5 h-3.5 text-cyan-400 hover:text-cyan-300 inline-block align-middle" />
                              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-950 border border-cyan-500/30 rounded-lg shadow-xl text-[10px] text-gray-200 font-sans normal-case tracking-normal z-50 leading-relaxed font-normal text-left">
                                <strong className="text-cyan-400 block mb-0.5">Typology Guidance</strong>
                                Defines which agent class executes the operation. Example classes include "AuditTrailValidator", "DocSynthesisAgent", or "TaskScheduler".
                                <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-950"></span>
                              </span>
                            </span>
                          </label>
                          <input
                            type="text"
                            value={testAgent}
                            onChange={(e) => setTestAgent(e.target.value)}
                            className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg text-xs p-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                            <span>Integration Test Path</span>
                            <span className="group relative inline-block cursor-help select-none">
                              <Info className="w-3.5 h-3.5 text-cyan-400 hover:text-cyan-300 inline-block align-middle" />
                              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-950 border border-cyan-500/30 rounded-lg shadow-xl text-[10px] text-gray-200 font-sans normal-case tracking-normal z-50 leading-relaxed font-normal text-left">
                                <strong className="text-cyan-400 block mb-0.5">Complexity Guidance</strong>
                                Configures the harness type. Choose "Failure paths" to verify database lock behaviors and race condition resolution during block commits.
                                <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-950"></span>
                              </span>
                            </span>
                          </label>
                          <select
                            value={testComplexity}
                            onChange={(e) => setTestComplexity(e.target.value as any)}
                            className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg text-xs p-2 focus:outline-none"
                          >
                            <option value="complex">Failure paths (lock delay, decrypt leaks)</option>
                            <option value="simple">Standard Unit Verification cases</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTopic.category === 'brainstorm' && (
                    <div className="space-y-4">
                      <h5 className="text-xs font-mono font-bold text-cyan-300 border-b border-gray-900 pb-2">
                        Enterprise Roadmap Architectural Goals
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                            <span>Target Roadmap Feature</span>
                            <span className="group relative inline-block cursor-help select-none">
                              <Info className="w-3.5 h-3.5 text-cyan-400 hover:text-cyan-300 inline-block align-middle" />
                              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-950 border border-cyan-500/30 rounded-lg shadow-xl text-[10px] text-gray-200 font-sans normal-case tracking-normal z-50 leading-relaxed font-normal text-left">
                                <strong className="text-cyan-400 block mb-0.5">Feature Guidance</strong>
                                Proposes future architectural additions. Choose "PostgreSQL" to map database migration patterns or "SSO-OIDC" for security upgrades.
                                <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-950"></span>
                              </span>
                            </span>
                          </label>
                          <select
                            value={roadmapFeature}
                            onChange={(e) => setRoadmapFeature(e.target.value as any)}
                            className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg text-xs p-2 focus:outline-none"
                          >
                            <option value="postgresql">PostgreSQL driver abstraction layer</option>
                            <option value="kubernetes">Kubernetes safe namespace limits</option>
                            <option value="sso-oidc">Enterprise Single Sign-On authenticators</option>
                            <option value="scaling">290+ concurrent multi-model pools</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                            <span>Blueprint Directives & Technical Requirements</span>
                            <span className="group relative inline-block cursor-help select-none">
                              <Info className="w-3.5 h-3.5 text-cyan-400 hover:text-cyan-300 inline-block align-middle" />
                              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-60 p-2.5 bg-slate-950 border border-cyan-500/30 rounded-lg shadow-xl text-[10px] text-gray-200 font-sans normal-case tracking-normal z-50 leading-relaxed font-normal text-left">
                                <strong className="text-cyan-400 block mb-0.5">Directives Guidance</strong>
                                Key structural constraints or details. Example: "Implement connection pooling, keeping query latencies strictly under 10ms with logging".
                                <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-950"></span>
                              </span>
                            </span>
                          </label>
                          <input
                            type="text"
                            value={roadmapDetails}
                            onChange={(e) => setRoadmapDetails(e.target.value)}
                            className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg text-xs p-2 text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTopic.category === 'onboarding' && (
                    <div className="p-1 text-xs text-gray-400 leading-relaxed">
                      Onboarding and CLI setups use the standardized Express CLI bootstrap directives. Generates fully ready onboarding command schedules to onboard other developers.
                    </div>
                  )}

                </div>

                {/* Submit Action Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleGenerate(selectedTopic)}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-550 to-indigo-500 hover:from-cyan-455 hover:to-indigo-400 text-[#070b13] font-bold text-xs uppercase tracking-widest rounded-lg transition-all shadow flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#070b13]" />
                        <span>Generating Draft...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#070b13]" />
                        <span>Formulate Contribution Blueprint</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>

            {/* RIGHT PANEL: Draft Workspace, Saved Outlines, Preview & Code blocks (5 Cols) */}
            <div className={`space-y-6 ${isWidescreenSandbox ? 'lg:col-span-12' : 'lg:col-span-5'}`}>
              
              {/* Outline History */}
              <div className="bg-[#0b0f19]/90 border border-gray-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display mb-3 flex items-center justify-between border-b border-gray-850 pb-2">
                  <span>Contribution Blueprints Drafted</span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded font-mono">
                    {drafts.length}
                  </span>
                </h3>

                {drafts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-500">
                    <BookOpen className="w-7 h-7 mx-auto text-gray-700 mb-2" />
                    <p>No active contribution blueprints formulated yet.</p>
                    <p className="mt-1 text-[10px] text-gray-600">Select a topic and click compile above.</p>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto no-scrollbar space-y-2 pr-1" id="drafts_history_scroller">
                    {drafts.map((dr) => {
                      const isActive = activeDraftId === dr.id;
                      return (
                        <div
                          key={dr.id}
                          id={`sandbox_draft_historical_${dr.id}`}
                          onClick={() => {
                            setCurrentDraft(dr.responseMarkdown);
                            setActiveDraftId(dr.id);
                          }}
                          className={`text-left p-2.5 rounded-lg border text-xs transition duration-150 cursor-pointer flex justify-between items-center ${
                            isActive 
                              ? 'bg-cyan-950/20 border-cyan-500/50 text-white shadow-md shadow-cyan-950/20' 
                              : 'bg-gray-900/60 border-gray-850 text-gray-300 hover:bg-[#0e1423]'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <span className="font-semibold block font-display truncate text-xs">{dr.title}</span>
                            <span className="text-[9px] text-gray-550 block font-mono truncate">
                              Category: {dr.category.toUpperCase()} • Generated at {dr.createdAt}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); downloadAsMarkdown(dr); }}
                              className="p-1 hover:bg-gray-800 rounded text-cyan-400"
                              title="Download Markdown"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteDraft(dr.id, e)}
                              className="p-1 hover:bg-rose-950/50 rounded text-rose-500"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Version History Card */}
              {activeDraftId && drafts.find(d => d.id === activeDraftId) && (
                <div className="bg-[#0b0f19]/90 border border-gray-800 rounded-xl p-4 animate-fadeIn" id="sandbox_draft_version_history_card">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display mb-2 flex items-center gap-2 border-b border-gray-850 pb-2">
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('versionHistoryTitle')}</span>
                  </h3>
                  
                  <div className="text-[10px] text-gray-400 mb-3 block font-mono bg-cyan-950/10 border border-cyan-900/20 px-2 py-1 rounded">
                    Active: <span className="text-cyan-400 font-semibold">{drafts.find(d => d.id === activeDraftId)?.title}</span>
                  </div>

                  {(() => {
                    const activeDr = drafts.find(d => d.id === activeDraftId);
                    const versionsList = [...(activeDr?.versions || [])].reverse(); // newest first
                    
                    if (versionsList.length === 0) {
                      return (
                        <div className="py-4 text-center text-[10px] text-gray-500 italic">
                          {t('noVersionsMsg')}
                        </div>
                      );
                    }

                    return (
                      <div className="max-h-56 overflow-y-auto no-scrollbar space-y-3.5 pl-1 relative border-l border-gray-800/85 ml-2 py-1" id="sandbox_version_timeline">
                        {versionsList.map((ver) => {
                          const isActive = currentDraft === ver.responseMarkdown;
                          return (
                            <div key={ver.id} className="relative pl-5 group" id={`sandbox_ver_node_${ver.id}`}>
                              {/* Connector dot */}
                              <div className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full border border-2 transition duration-200 ${
                                isActive 
                                  ? 'bg-cyan-500 border-cyan-400 shadow-sm shadow-cyan-400/50' 
                                  : 'bg-gray-950 border-gray-700 group-hover:border-gray-500'
                              }`} />
                              
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-[10px] font-semibold font-mono ${isActive ? 'text-cyan-400' : 'text-gray-300'}`}>
                                    {ver.label}
                                  </span>
                                  {isActive && (
                                    <span className="text-[7px] uppercase tracking-wider bg-cyan-950 text-cyan-400 font-bold px-1 rounded border border-cyan-800/30">
                                      Active
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-[9px] text-gray-400 flex items-center justify-between">
                                  <span>
                                    {new Date(ver.timestamp).toLocaleDateString()} {new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                  
                                  {!isActive && (
                                    <button
                                      onClick={() => handleRevertDraft(ver.id)}
                                      className="text-[8px] px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 hover:bg-cyan-950 hover:text-cyan-400 hover:border-cyan-800 text-gray-400 transition duration-150 flex items-center gap-1 cursor-pointer"
                                      title="Revert draft to this saved layout"
                                    >
                                      <RotateCcw className="w-2 h-2" />
                                      <span>{t('btnRevert')}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Live Document Workspace */}
              <div className="bg-[#0b0f19] border border-gray-800 rounded-xl overflow-hidden flex flex-col justify-between" id="markdown_output_workspace">
                <div className="px-4 py-3 bg-gray-950/80 border-b border-gray-855 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display">
                      Interactive Preview & Editor
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Refine Blueprint Control */}
                    {currentDraft && (
                      <div className="flex items-center bg-gray-900 border border-gray-800 rounded px-2 py-0.5 gap-1.5" id="sandbox_refine_widget">
                        <select
                          value={refineOption}
                          id="sandbox_refine_select"
                          onChange={(e: any) => setRefineOption(e.target.value)}
                          className="bg-transparent text-cyan-400 text-[10px] font-mono border-0 focus:outline-none focus:ring-0 cursor-pointer pr-1"
                        >
                          <option value="both" className="bg-[#0b0f19] text-gray-300">Tone & Concise</option>
                          <option value="concise" className="bg-[#0b0f19] text-gray-300">More Concise</option>
                          <option value="tone" className="bg-[#0b0f19] text-gray-300">Professional Tone</option>
                        </select>
                        <button
                          onClick={handleRefineDraft}
                          disabled={isRefiningDraft}
                          id="sandbox_refine_btn"
                          className="text-[10px] text-gray-300 hover:text-white font-bold bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded transition flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                        >
                          {isRefiningDraft ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin text-cyan-400" />
                          ) : (
                            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                          )}
                          <span>Refine</span>
                        </button>
                      </div>
                    )}

                     {/* Change Log message input */}
                    {activeDraftId && unsavedChanges[activeDraftId] && (
                      <input 
                        type="text"
                        placeholder="Version note (e.g. Fixed typos)"
                        value={saveLabelText}
                        onChange={(e) => setSaveLabelText(e.target.value)}
                        className="bg-gray-950 border border-gray-800 text-[10px] text-gray-300 px-2 py-1 rounded max-w-[125px] focus:outline-none focus:border-yellow-500 placeholder-gray-650"
                        title="Enter a note summarizing your changes before saving"
                      />
                    )}

                    {/* Save changes button */}
                    {activeDraftId && (
                      <button
                        onClick={handleSaveActiveDraftText}
                        disabled={isSavingDraft || !unsavedChanges[activeDraftId]}
                        className={`text-[10px] px-2.5 py-1 rounded transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                          unsavedChanges[activeDraftId]
                            ? 'bg-yellow-500 hover:bg-yellow-400 font-bold text-black border border-yellow-600 animate-pulse'
                            : 'bg-gray-900 border border-gray-800 text-gray-500'
                        }`}
                      >
                        {isSavingDraft ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        <span>{unsavedChanges[activeDraftId] ? 'Save Blueprint' : 'Saved'}</span>
                      </button>
                    )}

                    {/* Widescreen Toggle */}
                    <button
                      onClick={() => setIsWidescreenSandbox(!isWidescreenSandbox)}
                      className="text-[10px] text-gray-400 bg-gray-900 border border-gray-800 px-2 py-1 rounded hover:text-white flex items-center gap-1"
                      title={isWidescreenSandbox ? "Exit Widescreen Mode" : "Expand Split-pane Workspace"}
                    >
                      {isWidescreenSandbox ? (
                        <>
                          <Minimize2 className="w-3 h-3 text-cyan-400" />
                          <span>Standard View</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3 h-3 text-cyan-400" />
                          <span>Widescreen Focus</span>
                        </>
                      )}
                    </button>

                    {currentDraft && (
                      <button
                        onClick={() => copyToClipboard(currentDraft)}
                        className="text-[10px] text-gray-400 bg-gray-900 border border-gray-800 px-2 py-1 rounded hover:text-white flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy Raw
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800 bg-gray-950/10 min-h-[500px]" id="sandbox_split_pane">
                  {/* Left Column: Raw Markdown Editor */}
                  <div className="flex flex-col h-[500px] bg-[#070a12]/60 relative">
                    <div className="px-3 py-1.5 bg-gray-950/50 border-b border-gray-900 flex justify-between items-center text-[9px] text-gray-400 select-none font-mono">
                      <span className="uppercase tracking-wider flex items-center gap-1.5">
                        <Edit className="w-3 h-3 text-cyan-400" /> Raw Markdown Editor (Left Pane)
                      </span>
                      {activeDraftId && unsavedChanges[activeDraftId] ? (
                        <span className="text-yellow-500 font-bold flex items-center gap-1">
                          ● Uncommitted Shifts
                        </span>
                      ) : activeDraftId ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          ✓ Sync Complete
                        </span>
                      ) : null}
                    </div>
                    {currentDraft ? (
                      <textarea
                        value={currentDraft}
                        onChange={(e) => handleEditDraftText(e.target.value)}
                        className="w-full h-full flex-grow p-4 bg-transparent text-xs text-cyan-300 font-mono focus:outline-none resize-none leading-relaxed overflow-y-auto"
                        placeholder="Edit raw markdown guidelines here..."
                        style={{ height: 'calc(100% - 25px)' }}
                      />
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center text-[11px] text-gray-500 italic font-mono space-y-1">
                        <p>No editor draft active.</p>
                        <p className="text-[9px] text-gray-600 not-italic">Formulate or select any contribution blueprint to begin editing.</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Live Rendered Output */}
                  <div className="flex flex-col h-[500px] bg-gray-950/20 relative">
                    <div className="px-3 py-1.5 bg-gray-950/50 border-b border-gray-900 text-[9px] text-gray-400 select-none font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3 h-3 text-cyan-400" /> Live Rendered Preview (Right Pane)
                    </div>
                    
                    <div className="flex-grow p-4 overflow-y-auto text-xs text-gray-300 leading-relaxed font-sans scroll-smooth" id="draft_rendered_output" style={{ height: 'calc(100% - 25px)' }}>
                      {currentDraft ? (
                        <div className="space-y-4">
                          {currentDraft.split('\n').map((line, idx) => {
                            if (line.startsWith('### ')) {
                              return <h3 key={idx} className="text-sm font-bold font-display text-white border-b border-gray-900 pb-1 mt-3">{line.replace('### ', '')}</h3>;
                            }
                            if (line.startsWith('#### ')) {
                              return <h4 key={idx} className="text-xs font-semibold font-display text-cyan-400 mt-2">{line.replace('#### ', '')}</h4>;
                            }
                            if (line.startsWith('**') && line.endsWith('**')) {
                              return <strong key={idx} className="text-white block mt-1.5">{line.replace(/\*\*/g, '')}</strong>;
                            }
                            if (line.startsWith('* ') || line.startsWith('- ')) {
                              return <div key={idx} className="pl-3 py-0.5 flex items-start gap-1.5 text-gray-300">
                                <span className="text-cyan-500">•</span>
                                <span>{line.substring(2)}</span>
                              </div>;
                            }
                            if (line.startsWith('```')) {
                              if (line === '```' || line.includes('```typescript') || line.includes('```sql') || line.includes('```bash')) {
                                return null;
                              }
                            }
                            const belongsToCode = currentDraft.split('\n').slice(0, idx).filter(l => l.startsWith('```')).length % 2 !== 0;

                            if (belongsToCode) {
                              return (
                                <div key={idx} className="bg-gray-950 font-mono text-[10.5px] px-3 py-0.5 border-l-2 border-indigo-500 text-cyan-300 overflow-x-auto whitespace-pre">
                                  {line}
                                </div>
                              );
                            }

                            return <p key={idx} className="mt-1 leading-relaxed text-gray-300">{line}</p>;
                          })}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-12">
                          <Sparkles className="w-10 h-10 text-gray-800 mb-3 animate-pulse" />
                          <h4 className="text-white font-medium mb-1">Interactive Contribution Sandbox</h4>
                          <p className="max-w-xs text-[11px] text-gray-400">Select a curated contribution scenario or configure custom requirements, then click "Formulate Contribution Blueprint".</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {currentDraft && (
                  <div className="p-3 bg-gray-950 border-t border-gray-850 flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">
                      Standardized to <strong>React 19 / Express 5.1</strong> code rules.
                    </span>
                    <button
                      onClick={() => {
                        const activeDraftItem = drafts.find(d => d.id === activeDraftId);
                        if (activeDraftItem) {
                          downloadAsMarkdown(activeDraftItem);
                        } else {
                          const element = document.createElement("a");
                          const file = new Blob([currentDraft], {type: 'text/markdown'});
                          element.href = URL.createObjectURL(file);
                          element.download = "valtheron_contribution_plan.md";
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 font-bold text-black rounded transition tracking-wide flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Export .md List
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* Dynamic Tab 2 View: The Messy Docs Organizer Tool */}
        {activeViewTab === 'docs_organizer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="docs_organizer_grid_container">
            
            {/* LEFT PANEL: Restructuring Directory Tree and File Selection */}
            <div className={`lg:col-span-7 space-y-6 ${isWidescreenDocs ? 'hidden' : ''}`}>
              
              <div className="bg-[#0b0f19] border border-gray-800 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-850 pb-4 mb-4">
                  <div>
                    <h3 className="text-md font-bold text-white font-display flex items-center gap-2">
                      <Folder className="w-5 h-5 text-cyan-400" />
                      <span>Reorganize Disorganized /docs Directory</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Valtheron's documentation has miscellaneous unorganized logs and drafts. Restructure them into a clear modular pattern.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleGenerateGlobalRestructurePR}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black font-semibold text-xs rounded-lg transition duration-150 flex items-center justify-center gap-1.5 shadow disabled:opacity-50 cursor-pointer shrink-0"
                    title="Creates a full PR writeup with terminal mv commands"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <GitPullRequest className="w-3.5 h-3.5" />
                    )}
                    <span>Generate Global Movement PR</span>
                  </button>
                </div>

                {/* The before/after tree preview map */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Before messy layout */}
                  <div className="bg-gray-950/70 border border-rose-950/40 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="text-xs font-bold text-rose-400 uppercase font-mono tracking-wider">Disorganized Layout (Current)</span>
                    </div>
                    <div className="font-mono text-[11px] text-gray-400 space-y-1.5 leading-relaxed bg-black/30 p-2.5 rounded border border-gray-900">
                      <div className="text-gray-300">📂 docs/</div>
                      <div className="pl-4">├── 📂 guides/</div>
                      <div className="pl-8 text-cyan-400">├── Valtheron_Handbuch_v2.pdf</div>
                      <div className="pl-4 text-rose-400">├── v1_setup_instruction.txt</div>
                      <div className="pl-4 text-rose-400">├── security_brief.pdf</div>
                      <div className="pl-4 text-rose-400">├── agent-architecture-overview.md</div>
                      <div className="pl-4 text-rose-400">├── routes_v5_full_api.json</div>
                      <div className="pl-4 text-rose-400">├── draft_onboarding_list.md</div>
                      <div className="pl-4 text-rose-400">├── kubernetes_draft.yaml</div>
                      <div className="pl-4 text-rose-400">└── roadmap_discussion_v2.txt</div>
                    </div>
                  </div>

                  {/* After neat layout */}
                  <div className="bg-gray-950/70 border border-emerald-950/40 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-xs font-bold text-emerald-400 uppercase font-mono tracking-wider">Proposed Architecture (Aligned)</span>
                    </div>
                    <div className="font-mono text-[11px] text-gray-400 space-y-1.5 leading-relaxed bg-black/30 p-2.5 rounded border border-gray-900">
                      <div className="text-gray-300">📂 docs/</div>
                      <div className="pl-4 text-emerald-400">├── 📂 guides/</div>
                      <div className="pl-8 text-gray-400">│   ├── Valtheron_Handbuch_v2.pdf</div>
                      <div className="pl-8 text-emerald-400">│   └── getting-started.md</div>
                      <div className="pl-4 text-emerald-400">├── 📂 architecture/</div>
                      <div className="pl-8 text-emerald-400">│   ├── security-model.md</div>
                      <div className="pl-8 text-emerald-400">│   └── agent-orchestrator.md</div>
                      <div className="pl-4 text-emerald-400">├── 📂 api/</div>
                      <div className="pl-8 text-emerald-400">│   └── express-endpoints.md</div>
                      <div className="pl-4 text-emerald-400">├── 📂 onboarding/</div>
                      <div className="pl-8 text-emerald-400">│   └── contributor-blueprint.md</div>
                      <div className="pl-4 text-emerald-400">├── 📂 deployment/</div>
                      <div className="pl-8 text-emerald-400">│   └── kubernetes-helm.md</div>
                      <div className="pl-4 text-emerald-400">└── 📂 roadmap/</div>
                      <div className="pl-8 text-emerald-400 font-bold">    └── v2-database-scaling.md</div>
                    </div>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mb-3 block">
                  Select Disorganized File to Convert and Align:
                </h4>

                {/* File selectors list details */}
                <div className="space-y-3">
                  {MESSY_DOCS_STRUCTURE.map((doc) => {
                    const isSelected = selectedMessyDoc.originalPath === doc.originalPath;
                    let fileBadge = "bg-rose-950/20 text-rose-400 border border-rose-900/40";
                    if (doc.status === 'restructured') fileBadge = "bg-cyan-950/20 text-cyan-400 border border-cyan-900/40";

                    return (
                      <div
                        key={doc.originalPath}
                        onClick={() => setSelectedMessyDoc(doc)}
                        className={`cursor-pointer text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col md:flex-row justify-between md:items-center gap-3 ${
                          isSelected 
                            ? 'bg-cyan-950/10 border-cyan-400 shadow-md' 
                            : 'bg-gray-900/40 border-gray-850 hover:bg-gray-900/70 hover:border-gray-800'
                        }`}
                      >
                        <div className="flex gap-3 items-start min-w-0">
                          <div className="mt-1 p-2 bg-gray-950 border border-gray-800 rounded-lg shrink-0">
                            <FileText className="w-4 h-4 text-gray-400" />
                          </div>
                          
                          <div className="min-w-0 space-y-1">
                            <span className="text-[10px] font-mono uppercase bg-gray-950 px-1.5 py-0.5 rounded text-gray-500 mr-2">
                              {doc.type.toUpperCase()}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase font-semibold text-center tracking-wider inline-block mb-1.5 md:mb-0">
                              Current: <span className="text-rose-400 underline">{doc.originalPath}</span>
                            </span>
                            <h4 className="text-white font-medium text-xs tracking-wide">
                              Proposed: <strong className="text-emerald-400">{doc.targetPath}</strong>
                            </h4>
                            <p className="text-gray-400 text-[11px] leading-relaxed line-clamp-2 mt-1">
                              {doc.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3 border-t md:border-t-0 border-gray-850 pt-2.5 md:pt-0">
                          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${fileBadge}`}>
                            {doc.status === 'messy' ? 'Needs Markdown Restructure' : 'Reference Core PDF'}
                          </span>
                          <span className="text-cyan-400 text-xs font-semibold flex items-center gap-0.5">
                            Details <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selection context detail expander */}
              <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-baseline border-b border-gray-850 pb-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                    Standardization Workflow Card
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Refactor Target: {selectedMessyDoc.originalPath.split('/').pop()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <h4 className="text-[11px] text-gray-400 font-bold uppercase mb-1">
                      Original Disorganized Draft
                    </h4>
                    <p className="p-3 bg-gray-950/70 border border-gray-900 rounded-lg text-gray-400 leading-relaxed min-h-[4.5rem]">
                      {selectedMessyDoc.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[11px] text-gray-400 font-bold uppercase mb-1">
                      Reorganization Justification
                    </h4>
                    <p className="p-3 bg-gray-950/70 border border-gray-900 rounded-lg text-gray-300 leading-relaxed min-h-[4.5rem]">
                      {selectedMessyDoc.reorganizationJustification}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-850">
                  <span className="text-[10px] text-gray-400">
                    Targets React 19 visual patterns, Express 5.1 type routes, and secure SQL procedures.
                  </span>
                  
                  <button
                    onClick={() => handleRefactorMessyFile(selectedMessyDoc)}
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs uppercase tracking-widest rounded-lg transition duration-150 flex items-center gap-1.5 shadow disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Standardize Documentation File</span>
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT PANEL: Live Draft Output and Export Options */}
            <div className={`space-y-6 ${isWidescreenDocs ? 'lg:col-span-12' : 'lg:col-span-5'}`}>
              
              {/* Drafts checklist list */}
              <div className="bg-[#0b0f19] border border-gray-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display mb-3 flex items-center justify-between border-b border-gray-850 pb-2">
                  <span>Formatted Documentation Files</span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded font-mono">
                    {drafts.filter(d => d.category === 'docs').length}
                  </span>
                </h3>

                {drafts.filter(d => d.category === 'docs').length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-500">
                    <BookOpen className="w-7 h-7 mx-auto text-gray-750 mb-2" />
                    <p>No aligned markdown outlines prepared.</p>
                    <p className="mt-1 text-[10px] text-gray-600">Select a target file on the left, then click Standardize.</p>
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto no-scrollbar space-y-2 pr-1" id="sandbox_docs_draft_scroller">
                    {drafts.filter(d => d.category === 'docs').map((dr) => {
                      const isActive = activeDraftId === dr.id;
                      return (
                        <div
                          key={dr.id}
                          id={`organizer_draft_historical_${dr.id}`}
                          onClick={() => {
                            setCurrentDraft(dr.responseMarkdown);
                            setActiveDraftId(dr.id);
                          }}
                          className={`text-left p-2.5 rounded-lg border text-xs transition duration-150 cursor-pointer flex justify-between items-center ${
                            isActive 
                              ? 'bg-cyan-950/20 border-cyan-500/50 text-white shadow-md shadow-cyan-950/20' 
                              : 'bg-gray-900/60 border-gray-850 text-gray-300 hover:bg-[#0e1423]'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <span className="font-semibold block font-display truncate text-xs">{dr.title}</span>
                            <span className="text-[9px] text-gray-550 block font-mono truncate">{dr.promptNotes}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); downloadAsMarkdown(dr); }}
                              className="p-1 hover:bg-gray-800 rounded text-cyan-400"
                              title="Download Markdown"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteDraft(dr.id, e)}
                              className="p-1 hover:bg-rose-950/50 rounded text-rose-500"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Version History Card for Docs Organizer */}
              {activeDraftId && drafts.find(d => d.id === activeDraftId) && (
                <div className="bg-[#0b0f19]/90 border border-gray-800 rounded-xl p-4 animate-fadeIn" id="docs_draft_version_history_card">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display mb-2 flex items-center gap-2 border-b border-gray-855 pb-2">
                    <History className="w-3.5 h-3.5 text-[#10b981]" />
                    <span>{t('versionHistoryTitle')}</span>
                  </h3>
                  
                  <div className="text-[10px] text-gray-400 mb-3 block font-mono bg-emerald-950/10 border border-emerald-900/20 px-2 py-1 rounded">
                    Active: <span className="text-emerald-400 font-semibold">{drafts.find(d => d.id === activeDraftId)?.title}</span>
                  </div>

                  {(() => {
                    const activeDr = drafts.find(d => d.id === activeDraftId);
                    const versionsList = [...(activeDr?.versions || [])].reverse(); // newest first
                    
                    if (versionsList.length === 0) {
                      return (
                        <div className="py-4 text-center text-[10px] text-gray-500 italic">
                          {t('noVersionsMsg')}
                        </div>
                      );
                    }

                    return (
                      <div className="max-h-48 overflow-y-auto no-scrollbar space-y-3 pl-1 relative border-l border-gray-800/80 ml-2 py-0.5" id="docs_version_timeline">
                        {versionsList.map((ver) => {
                          const isActive = currentDraft === ver.responseMarkdown;
                          return (
                            <div key={ver.id} className="relative pl-5 group" id={`docs_ver_node_${ver.id}`}>
                              {/* Connector dot */}
                              <div className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full border border-2 transition duration-200 ${
                                isActive 
                                  ? 'bg-[#10b981] border-emerald-400 shadow-sm shadow-[#10b981]/50' 
                                  : 'bg-gray-950 border-gray-700 group-hover:border-gray-500'
                              }`} />
                              
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-[10px] font-semibold font-mono ${isActive ? 'text-emerald-400' : 'text-gray-350'}`}>
                                    {ver.label}
                                  </span>
                                  {isActive && (
                                    <span className="text-[7px] uppercase tracking-wider bg-emerald-950 text-[#10b981] font-bold px-1 rounded border border-emerald-800/30">
                                      Active
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-[9px] text-gray-400 flex items-center justify-between">
                                  <span>
                                    {new Date(ver.timestamp).toLocaleDateString()} {new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                  
                                  {!isActive && (
                                    <button
                                      onClick={() => handleRevertDraft(ver.id)}
                                      className="text-[8px] px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 hover:bg-emerald-950 hover:text-[#10b981] hover:border-emerald-800 text-gray-400 transition duration-150 flex items-center gap-1 cursor-pointer"
                                      title="Revert draft to this saved layout"
                                    >
                                      <RotateCcw className="w-2 h-2" />
                                      <span>{t('btnRevert')}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Interactive document renderer */}
              <div className="bg-[#0b0f19] border border-gray-800 rounded-xl overflow-hidden flex flex-col justify-between" id="markdown_output_workspace_tab2">
                <div className="px-4 py-3 bg-gray-950/80 border-b border-gray-855 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest font-display">
                      Pristine Documentation Editor & Preview
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Refine Blueprint Control */}
                    {currentDraft && (
                      <div className="flex items-center bg-gray-900 border border-gray-800 rounded px-2 py-0.5 gap-1.5" id="organizer_refine_widget">
                        <select
                          value={refineOption}
                          id="organizer_refine_select"
                          onChange={(e: any) => setRefineOption(e.target.value)}
                          className="bg-transparent text-cyan-400 text-[10px] font-mono border-0 focus:outline-none focus:ring-0 cursor-pointer pr-1"
                        >
                          <option value="both" className="bg-[#0b0f19] text-gray-300">Tone & Concise</option>
                          <option value="concise" className="bg-[#0b0f19] text-gray-300">More Concise</option>
                          <option value="tone" className="bg-[#0b0f19] text-gray-300">Professional Tone</option>
                        </select>
                        <button
                          onClick={handleRefineDraft}
                          disabled={isRefiningDraft}
                          id="organizer_refine_btn"
                          className="text-[10px] text-gray-300 hover:text-white font-bold bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded transition flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                        >
                          {isRefiningDraft ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin text-cyan-400" />
                          ) : (
                            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                          )}
                          <span>Refine</span>
                        </button>
                      </div>
                    )}

                    {/* Change Log message input */}
                    {activeDraftId && unsavedChanges[activeDraftId] && (
                      <input 
                        type="text"
                        placeholder="Version note (e.g. Cleansed specs)"
                        value={saveLabelText}
                        onChange={(e) => setSaveLabelText(e.target.value)}
                        className="bg-gray-950 border border-gray-800 text-[10px] text-gray-300 px-2 py-1 rounded max-w-[125px] focus:outline-none focus:border-emerald-500 placeholder-gray-650"
                        title="Enter a note summarizing your changes before saving"
                      />
                    )}

                    {/* Save changes button */}
                    {activeDraftId && (
                      <button
                        onClick={handleSaveActiveDraftText}
                        disabled={isSavingDraft || !unsavedChanges[activeDraftId]}
                        className={`text-[10px] px-2.5 py-1 rounded transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                          unsavedChanges[activeDraftId]
                            ? 'bg-[#10b981] hover:bg-[#059669] font-bold text-black border border-emerald-600 animate-pulse'
                            : 'bg-gray-900 border border-gray-800 text-gray-400'
                        }`}
                      >
                        {isSavingDraft ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        <span>{unsavedChanges[activeDraftId] ? 'Save Aligned Blueprint' : 'Saved'}</span>
                      </button>
                    )}

                    {/* Widescreen Toggle */}
                    <button
                      onClick={() => setIsWidescreenDocs(!isWidescreenDocs)}
                      className="text-[10px] text-gray-400 bg-gray-900 border border-gray-800 px-2 py-1 rounded hover:text-white flex items-center gap-1"
                      title={isWidescreenDocs ? "Exit Widescreen Mode" : "Expand Split-pane Workspace"}
                    >
                      {isWidescreenDocs ? (
                        <>
                          <Minimize2 className="w-3 h-3 text-cyan-400" />
                          <span>Standard View</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3 h-3 text-cyan-400" />
                          <span>Widescreen Focus</span>
                        </>
                      )}
                    </button>

                    {currentDraft && (
                      <button
                        onClick={() => copyToClipboard(currentDraft)}
                        className="text-[10px] text-gray-400 bg-gray-900 border border-gray-800 px-2 py-1 rounded hover:text-white flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy Raw
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800 bg-gray-950/10 min-h-[500px]" id="organizer_split_pane">
                  {/* Left Column: Raw Markdown Editor */}
                  <div className="flex flex-col h-[500px] bg-[#070a12]/60 relative">
                    <div className="px-3 py-1.5 bg-gray-950/50 border-b border-gray-900 flex justify-between items-center text-[9px] text-gray-400 select-none font-mono">
                      <span className="uppercase tracking-wider flex items-center gap-1.5">
                        <Edit className="w-3 h-3 text-cyan-400" /> Raw Markdown Editor (Left Pane)
                      </span>
                      {activeDraftId && unsavedChanges[activeDraftId] ? (
                        <span className="text-yellow-500 font-bold flex items-center gap-1">
                          ● Uncommitted Shifts
                        </span>
                      ) : activeDraftId ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          ✓ Sync Complete
                        </span>
                      ) : null}
                    </div>
                    {currentDraft ? (
                      <textarea
                        value={currentDraft}
                        onChange={(e) => handleEditDraftText(e.target.value)}
                        className="w-full h-full flex-grow p-4 bg-transparent text-xs text-emerald-300 font-mono focus:outline-none resize-none leading-relaxed overflow-y-auto"
                        placeholder="Edit raw markdown file layout here..."
                        style={{ height: 'calc(100% - 25px)' }}
                      />
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center text-[11px] text-gray-500 italic font-mono space-y-1">
                        <p>No document draft active.</p>
                        <p className="text-[9px] text-gray-600 not-italic">Select any unstructured doc item on the left and click standardise.</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Live Rendered Output */}
                  <div className="flex flex-col h-[500px] bg-gray-950/20 relative">
                    <div className="px-3 py-1.5 bg-gray-950/50 border-b border-gray-900 text-[9px] text-gray-400 select-none font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3 h-3 text-cyan-400" /> Live Rendered Preview (Right Pane)
                    </div>
                    
                    <div className="flex-grow p-4 overflow-y-auto text-xs text-gray-300 leading-relaxed font-sans scroll-smooth" id="draft_rendered_output_tab2" style={{ height: 'calc(100% - 25px)' }}>
                      {currentDraft ? (
                        <div className="space-y-4">
                          {currentDraft.split('\n').map((line, idx) => {
                            if (line.startsWith('### ')) {
                              return <h3 key={idx} className="text-sm font-bold font-display text-white border-b border-gray-900 pb-1 mt-3">{line.replace('### ', '')}</h3>;
                            }
                            if (line.startsWith('#### ')) {
                              return <h4 key={idx} className="text-xs font-semibold font-display text-cyan-400 mt-2">{line.replace('#### ', '')}</h4>;
                            }
                            if (line.startsWith('**') && line.endsWith('**')) {
                              return <strong key={idx} className="text-white block mt-1.5">{line.replace(/\*\*/g, '')}</strong>;
                            }
                            if (line.startsWith('* ') || line.startsWith('- ')) {
                              return <div key={idx} className="pl-3 py-0.5 flex items-start gap-1.5 text-gray-300">
                                <span className="text-emerald-500">•</span>
                                <span>{line.substring(2)}</span>
                              </div>;
                            }
                            if (line.startsWith('```')) {
                              if (line === '```' || line.includes('```typescript') || line.includes('```sql') || line.includes('```bash')) {
                                return null;
                              }
                            }
                            const belongsToCode = currentDraft.split('\n').slice(0, idx).filter(l => l.startsWith('```')).length % 2 !== 0;

                            if (belongsToCode) {
                              return (
                                <div key={idx} className="bg-gray-950 font-mono text-[10.5px] px-3 py-0.5 border-l-2 border-emerald-500 text-emerald-300 overflow-x-auto whitespace-pre">
                                  {line}
                                </div>
                              );
                            }

                            return <p key={idx} className="mt-1 leading-relaxed text-gray-300">{line}</p>;
                          })}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-12">
                          <Sparkles className="w-10 h-10 text-gray-800 mb-3 animate-pulse" />
                          <h4 className="text-white font-medium mb-1">Standardized Workspace</h4>
                          <p className="max-w-xs text-[11px] text-gray-400">Select any unstructured doc item on the left and click standardise to render its ready-to-commit markdown guideline model.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {currentDraft && (
                  <div className="p-3 bg-gray-950 border-t border-gray-855 flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">
                      Export is stored as a ready-to-write markdown file (.md).
                    </span>
                    <button
                      onClick={() => {
                        const activeDraftItem = drafts.find(d => d.id === activeDraftId);
                        if (activeDraftItem) {
                          downloadAsMarkdown(activeDraftItem);
                        } else {
                          const element = document.createElement("a");
                          const file = new Blob([currentDraft], {type: 'text/markdown'});
                          element.href = URL.createObjectURL(file);
                          element.download = "refactored_documentation_blueprint.md";
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 font-bold text-black rounded transition tracking-wide flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Aligned File
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* Dynamic Tab 3 View: Secure Server-Side Database & WORM Audit Trail */}
        {activeViewTab === 'database' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="database_grid_container">
            
            {/* LEFT COLUMN: Controls & System Integrity Auditor */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Integrity Verifier Engine Card */}
              <div className="bg-[#0b0f19] border border-gray-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-850 pb-3">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-md font-bold text-white font-display">Cryptographic Ledger Auditor</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Valtheron embeds a Write-Once-Read-Many (WORM) audit chain linking operation logs mathematically using SHA-256 hash coefficients. Verify chain block coordinates.
                </p>

                {integrityResult ? (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
                    integrityResult.isValid 
                      ? 'bg-[#06201b]/65 border-emerald-500/30' 
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${integrityResult.isValid ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      <strong className={integrityResult.isValid ? 'text-emerald-400' : 'text-rose-400'}>
                        {integrityResult.isValid ? 'PASSED MATHEMATICAL PROOF' : 'LEDGER BREACH DETECTED'}
                      </strong>
                    </div>
                    <p className="text-gray-300">{integrityResult.message}</p>
                    <p className="text-[10px] text-gray-400">
                      Blocks validated: <strong>{integrityResult.logsAudited}</strong> | Verification hash logged securely.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-950 rounded-xl border border-gray-900 text-[11px] text-gray-400 text-center">
                    Audit verification has not been performed on the active database session.
                  </div>
                )}

                <button
                  onClick={handleVerifyIntegrity}
                  disabled={isVerifying}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider rounded-lg transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <History className="w-4 h-4 text-black" />
                  )}
                  <span>{t('btnAuditLedger')}</span>
                </button>
              </div>

              {/* Custom Topic Form DBMS Seed */}
              <form onSubmit={handleCreateCustomTopic} className="bg-[#0b0f19] border border-gray-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-850 pb-3">
                  <PlusCircle className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-md font-bold text-white font-display">{t('customTopicTitle')}</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {t('customTopicSubtitle')}
                </p>

                <div className="space-y-3 text-xs col-span-1">
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold uppercase tracking-wider text-[10px]">{t('customLabelTitle')}</label>
                    <input 
                      type="text" 
                      value={newTopicTitle}
                      onChange={e => setNewTopicTitle(e.target.value)}
                      placeholder="e.g. Design TOTP Securitisation Hook"
                      className="w-full bg-gray-950 border border-[#1b2230] px-3 py-2 rounded text-white focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-400 mb-1 font-semibold uppercase tracking-wider text-[10px]">Category</label>
                      <select 
                        value={newTopicCategory}
                        onChange={e => setNewTopicCategory(e.target.value as any)}
                        className="w-full bg-gray-950 border border-[#1b2230] px-2 py-2 rounded text-white focus:outline-none focus:border-cyan-500 text-xs"
                      >
                        <option value="docs">{t('docsCat')}</option>
                        <option value="review">{t('reviewCat')}</option>
                        <option value="tests">{t('testsCat')}</option>
                        <option value="onboarding">{t('onboardingCat')}</option>
                        <option value="brainstorm">{t('brainstormCat')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1 font-semibold uppercase tracking-wider text-[10px]">{t('diffText')}</label>
                      <select 
                        value={newTopicDifficulty}
                        onChange={e => setNewTopicDifficulty(e.target.value as any)}
                        className="w-full bg-gray-950 border border-[#1b2230] px-2 py-2 rounded text-white focus:outline-none focus:border-cyan-500 text-xs"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold uppercase tracking-wider text-[10px]">{t('customLabelShort')}</label>
                    <input 
                      type="text" 
                      value={newTopicShort}
                      onChange={e => setNewTopicShort(e.target.value)}
                      placeholder="e.g. Audit cryptographic key rotation thresholds."
                      className="w-full bg-gray-950 border border-gray-150 px-3 py-2 rounded text-white focus:outline-none focus:border-cyan-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold uppercase tracking-wider text-[10px]">{t('customLabelFull')}</label>
                    <textarea 
                      value={newTopicFull}
                      onChange={e => setNewTopicFull(e.target.value)}
                      rows={3}
                      placeholder="e.g. Define explicit rotation thresholds..."
                      className="w-full bg-gray-950 border border-gray-150 px-3 py-2 rounded text-white focus:outline-none focus:border-cyan-500 text-xs font-sans leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold uppercase tracking-wider text-[10px]">{t('customLabelEffort')}</label>
                    <input 
                      type="text" 
                      value={newTopicEffort}
                      onChange={e => setNewTopicEffort(e.target.value)}
                      placeholder="e.g. 4-6 hours"
                      className="w-full bg-gray-950 border border-gray-150 px-3 py-2 rounded text-white focus:outline-none focus:border-cyan-500 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <PlusCircle className="w-4 h-4 text-white" />
                  <span>{t('customBtnAdd')}</span>
                </button>
              </form>

            </div>

            {/* RIGHT COLUMN: Cryptographic SECURE WORM Audit Ledger, and Active Workers */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* LEDGER DISPLAY TABLE */}
              <div className="bg-[#0b0f19] border border-gray-800 rounded-2xl p-5">
                <div className="flex justify-between items-center border-b border-gray-850 pb-3.5 mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="text-md font-bold text-white font-display">Cryptographic Audit Ledger</h3>
                      <p className="text-xs text-gray-400">Total chained blocks in permanent database storage: {auditLogs.length}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={fetchAuditLogs}
                    className="p-1 px-2.5 border border-gray-800 rounded text-xs text-cyan-400 bg-gray-950 hover:bg-gray-900 transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 animate-spin duration-1000" />
                    <span>Refresh Ledger</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-900 bg-gray-950/20 max-h-96">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#060a11] text-[10px] text-gray-400 uppercase tracking-wider select-none font-mono font-bold border-b border-gray-900">
                      <tr>
                        <th className="py-2.5 px-4">Block Node</th>
                        <th className="py-2.5 px-4">Timestamp</th>
                        <th className="py-2.5 px-4 font-semibold text-cyan-400">Action Type</th>
                        <th className="py-2.5 px-4 max-w-[200px]">Operation Details</th>
                        <th className="py-2.5 px-4 text-right font-mono">Node Signature</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900 scrollbar-thin">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500 font-mono text-[10.5px]">
                            No ledger coordinates detected. Checking database connection...
                          </td>
                        </tr>
                      ) : (
                        auditLogs.slice().reverse().map((log: any) => (
                          <tr key={log.id} className="hover:bg-slate-900/30 transition-all font-mono text-[10.5px]">
                            <td className="py-2.5 px-4 text-gray-450 font-sans font-medium text-[10px]">{log.id.split('_')[0] === 'log' ? log.id.slice(4, 12) : log.id.slice(0, 12)}</td>
                            <td className="py-2.5 px-4 text-gray-500 font-sans text-[10px]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                            <td className="py-2.5 px-4">
                              <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                                log.action === 'GENESIS_BLOCK' ? 'bg-[#0f1c30] text-cyan-400 font-semibold' :
                                log.action === 'TOPIC_CREATE' ? 'bg-[#153a47] text-cyan-300 font-semibold' :
                                log.action === 'DRAFT_CREATE' ? 'bg-[#173e21] text-emerald-400 font-semibold' :
                                log.action === 'DRAFT_DELETE' ? 'bg-[#40121a] text-rose-450 font-semibold' :
                                log.action === 'INTEGRITY_VERIFY' ? 'bg-[#3b2a0c] text-amber-400 font-semibold' :
                                'bg-[#1e293b] text-gray-400'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-gray-300 font-sans max-w-[200px] truncate" title={log.details}>
                              {log.details}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="text-[10px] text-indigo-400/90 font-mono tracking-tighter" title={`Prev Hash: ${log.prevHash}\nFull Hash: ${log.hash}`}>
                                {log.hash.substring(0, 14)}...
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Floating Auto Toast notifications */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-slate-900 border border-cyan-800 text-white rounded-lg p-4 shadow-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            <div className="text-xs">
              <p className="font-medium">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-[#060a12] mt-16 py-8" id="system_footer">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            Valtheron Contribution Planner Companion. Standard template configured using Node/Express proxy, compiled via Vite and powered securely with server-side AI endpoints.
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            Build strictly complies with structural workspace instructions. No tech-larping logs or telemetry values are present.
          </p>
        </div>
      </footer>
    </div>
  );
}
