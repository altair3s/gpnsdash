import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import MarketingCalendar from './components/MarketingCalendar';
import GPNSCalendar from '../components/GPNSCalendar';


// Composant pour afficher des notifications
const Notification = ({ message, type = 'info', onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-red-100' : 'bg-blue-100';
  const textColor = type === 'success' ? 'text-green-800' : type === 'error' ? 'text-red-800' : 'text-blue-800';
  const borderColor = type === 'success' ? 'border-green-400' : type === 'error' ? 'border-red-400' : 'border-blue-400';
  
  return (
    <div className={`${bgColor} ${textColor} ${borderColor} border-l-4 p-4 mb-4 rounded shadow-md`}>
      <div className="flex justify-between items-center">
        <p>{message}</p>
        <button onClick={onClose} className={`${textColor} hover:${textColor} font-bold`}>×</button>
      </div>
    </div>
  );
};

// Configuration de la date
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR');
};

// Composant principal de l'application
export default function PlanningApp() {
  // États pour les données
  const [templates, setTemplates] = useState({ Est: [], Ouest: [] });
  const [currentTemplate, setCurrentTemplate] = useState('Est');
  const [generatedPlanning, setGeneratedPlanning] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 30)));
  const [view, setView] = useState('calendar'); // 'calendar', 'list', 'edit'
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [subTasks, setSubTasks] = useState({});
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Effet pour charger le fichier Excel par défaut au démarrage
  useEffect(() => {
    const loadDefaultTemplate = async () => {
      try {
        setLoading(true);
        // Pour un environnement de développement, utilisez fetch au lieu de window.fs.readFile
        const response = await fetch('/data/PROGRAMME_GPNS.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        handleFileImport(arrayBuffer);
      } catch (error) {
        console.error("Erreur lors du chargement du fichier par défaut:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDefaultTemplate();
  }, []);

  // Fonction pour gérer l'import de fichier Excel
  const handleFileImport = (fileBuffer) => {
    try {
      const workbook = XLSX.read(fileBuffer, {
        cellStyles: true,
        cellFormulas: true,
        cellDates: true,
        cellNF: true,
        sheetStubs: true
      });

      const newTemplates = {};

      // Traiter chaque feuille du fichier
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
        
        // Supprimer les lignes vides et extraire les données pertinentes
        const cleanedData = jsonData.filter(row => 
          row.some(cell => cell !== null)
        ).slice(0, 5);
        
        newTemplates[sheetName] = cleanedData;
      });

      setTemplates(newTemplates);
      generatePlanning(newTemplates, startDate, endDate, currentTemplate);
      setNotification({
        message: 'Fichier importé avec succès!',
        type: 'success'
      });
    } catch (error) {
      console.error("Erreur lors de l'analyse du fichier:", error);
      setNotification({
        message: "Erreur lors de l'importation du fichier.",
        type: 'error'
      });
    }
  };

  // Fonction pour gérer l'importation de fichier via input
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      handleFileImport(data);
    };
    reader.readAsArrayBuffer(file);
  };

  // Fonction pour générer le planning en fonction des dates
  const generatePlanning = (templatesData, start, end, templateName) => {
    const templateData = templatesData[templateName] || [];
    if (templateData.length === 0) return;

    const daysOfWeek = templateData[0].slice(1).filter(day => day !== null);
    const weeks = templateData.slice(1).filter(row => row[0] !== null);
    
    // Créer un tableau pour stocker toutes les tâches générées
    const tasks = [];
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      // Ignorer les weekends (0 = dimanche, 6 = samedi)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
        continue;
      }

      // Déterminer quelle semaine du template utiliser
      const weekIndex = Math.floor((getWeekNumber(currentDate) - getWeekNumber(start)) % weeks.length);
      const weekType = weeks[weekIndex < 0 ? 0 : weekIndex][0];
      
      // Trouver l'index du jour de la semaine (1 = lundi, 5 = vendredi)
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      if (dayIndex >= 0 && dayIndex < 5) {
        const taskName = weeks[weekIndex < 0 ? 0 : weekIndex][dayIndex + 1];
        
        if (taskName) {
          tasks.push({
            id: `${currentDate.toISOString()}-${taskName}`,
            name: taskName,
            date: new Date(currentDate),
            weekType,
            dayOfWeek: daysOfWeek[dayIndex]
          });
        }
      }
      
      // Avancer au jour suivant
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }
    
    setGeneratedPlanning(tasks);
  };

  // Fonction utilitaire pour obtenir le numéro de la semaine
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Fonction pour exporter en Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(generatedPlanning.map(task => ({
      Date: task.date.toLocaleDateString(),
      Jour: task.dayOfWeek,
      'Type de Semaine': task.weekType,
      Tâche: task.name,
      'Sous-tâches': subTasks[task.id] ? subTasks[task.id].join(', ') : ''
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Planning');
    
    XLSX.writeFile(workbook, `Planning_${currentTemplate}_${startDate.toLocaleDateString()}_${endDate.toLocaleDateString()}.xlsx`);
    
    setNotification({
      message: 'Planning exporté en Excel avec succès!',
      type: 'success'
    });
  };

  // Fonction pour exporter en format texte (au lieu de PDF)
  const exportToPDF = () => {
    // Comme jsPDF n'est pas disponible, nous allons proposer une méthode alternative
    // pour exporter les données dans un format qui pourrait être copié-collé dans un document
    
    // Créer une chaîne de caractères formatée avec le contenu
    let content = `Planning ${currentTemplate} - Du ${formatDate(startDate)} au ${formatDate(endDate)}\n\n`;
    content += "Date\tJour\tType de Semaine\tTâche\tSous-tâches\n";
    
    generatedPlanning.forEach(task => {
      content += `${formatDate(task.date)}\t${task.dayOfWeek}\t${task.weekType}\t${task.name}\t${
        subTasks[task.id] ? subTasks[task.id].join(', ') : ''
      }\n`;
    });
    
    // Créer un élément blob pour le téléchargement
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement et le déclencher
    const a = document.createElement('a');
    a.href = url;
    a.download = `Planning_${currentTemplate}_${formatDate(startDate)}_${formatDate(endDate)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setNotification({
      message: 'Planning exporté en format texte avec succès!',
      type: 'success'
    });
  };

  // Fonction pour ajouter une sous-tâche
  const addSubTask = (taskId, subTask) => {
    setSubTasks(prev => {
      const existing = prev[taskId] || [];
      return {
        ...prev,
        [taskId]: [...existing, subTask]
      };
    });
  };

  // Fonction pour supprimer une sous-tâche
  const removeSubTask = (taskId, index) => {
    setSubTasks(prev => {
      const existing = [...(prev[taskId] || [])];
      existing.splice(index, 1);
      return {
        ...prev,
        [taskId]: existing
      };
    });
  };

  // Fonction pour mettre à jour les dates et régénérer le planning
  const updateDateRange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    generatePlanning(templates, start, end, currentTemplate);
  };

  // Gestionnaire de changement de template
  const handleTemplateChange = (templateName) => {
    setCurrentTemplate(templateName);
    generatePlanning(templates, startDate, endDate, templateName);
  };

  // Gestionnaire de clic sur une tâche
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  // Mise à jour de la fonction existante
const renderMainContent = () => {
  switch (view) {
    case 'calendar':
      return <GPNSCalendar 
        templates={templates}
        currentTemplate={currentTemplate} 
        handleTemplateChange={handleTemplateChange}
      />;
    case 'list':
      return <ListView />;
    case 'edit':
      return <TemplateEditView />;
    default:
      return <GPNSCalendar 
        templates={templates}
        currentTemplate={currentTemplate}
        handleTemplateChange={handleTemplateChange}
      />;
  }
};

  // Préparer l'objet pour la date
  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Composant pour le modal d'édition de tâche
  const TaskModal = () => {
    const [taskName, setTaskName] = useState(selectedTask?.name || '');
    const [newSubTask, setNewSubTask] = useState('');
    
    if (!selectedTask) return null;
    
    const handleSave = () => {
      // Mettre à jour le nom de la tâche dans le planning généré
      const updatedPlanning = generatedPlanning.map(task => 
        task.id === selectedTask.id ? { ...task, name: taskName } : task
      );
      setGeneratedPlanning(updatedPlanning);
      setShowTaskModal(false);
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">Modifier la tâche</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Date</label>
            <div className="py-2 px-3 bg-gray-100 rounded">
              {selectedTask.date.toLocaleDateString()} ({selectedTask.dayOfWeek})
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nom de la tâche</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Sous-tâches</label>
            <div className="flex mb-2">
              <input
                type="text"
                value={newSubTask}
                onChange={(e) => setNewSubTask(e.target.value)}
                placeholder="Ajouter une sous-tâche"
                className="flex-1 border border-gray-300 rounded-l p-2"
              />
              <button
                onClick={() => {
                  if (newSubTask.trim()) {
                    addSubTask(selectedTask.id, newSubTask.trim());
                    setNewSubTask('');
                  }
                }}
                className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
            
            <ul className="border border-gray-200 rounded divide-y">
              {(subTasks[selectedTask.id] || []).map((subTask, index) => (
                <li key={index} className="flex justify-between items-center p-2">
                  <span>{subTask}</span>
                  <button 
                    onClick={() => removeSubTask(selectedTask.id, index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </li>
              ))}
              {!(subTasks[selectedTask.id]?.length) && (
                <li className="p-2 text-gray-500 italic">Aucune sous-tâche</li>
              )}
            </ul>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowTaskModal(false)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Composant pour la vue calendrier
  const CalendarView = () => {
    // Regrouper les tâches par date
    const tasksByDate = {};
    generatedPlanning.forEach(task => {
      const dateStr = task.date.toISOString().split('T')[0];
      if (!tasksByDate[dateStr]) {
        tasksByDate[dateStr] = [];
      }
      tasksByDate[dateStr].push(task);
    });
    
    // Générer toutes les dates dans la plage
    const dateRange = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Créer un tableau des semaines
    const weeks = [];
    let week = [];
    
    // Commencer par le jour de la semaine de la première date
    const firstDay = new Date(startDate);
    const firstDayOfWeek = firstDay.getDay();
    
    // Ajouter des jours vides au début pour aligner correctement
    for (let i = 1; i < firstDayOfWeek; i++) {
      week.push(null);
    }
    
    // Ajouter toutes les dates
    dateRange.forEach(date => {
      const dayOfWeek = date.getDay();
      
      // Ignorer les weekend si nécessaire
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Si c'est le dernier jour de la semaine, commencer une nouvelle semaine
        if (dayOfWeek === 6) {
          weeks.push(week);
          week = [];
        }
        return;
      }
      
      week.push(date);
      
      // Si c'est le dernier jour de la semaine, commencer une nouvelle semaine
      if (dayOfWeek === 5) {
        weeks.push(week);
        week = [];
      }
    });
    
    // Ajouter la dernière semaine si elle n'est pas vide
    if (week.length > 0) {
      weeks.push(week);
    }
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-500 text-white">
              <th className="py-3 px-4 text-left">Lundi</th>
              <th className="py-3 px-4 text-left">Mardi</th>
              <th className="py-3 px-4 text-left">Mercredi</th>
              <th className="py-3 px-4 text-left">Jeudi</th>
              <th className="py-3 px-4 text-left">Vendredi</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, weekIndex) => (
              <tr key={weekIndex} className="border-b border-gray-200">
                {week.map((date, dayIndex) => {
                  if (date === null) {
                    return <td key={`empty-${dayIndex}`} className="p-2 border border-gray-100"></td>;
                  }
                  
                  const dateStr = date.toISOString().split('T')[0];
                  const tasks = tasksByDate[dateStr] || [];
                  
                  return (
                    <td key={dateStr} className="p-2 border border-gray-100 align-top h-32">
                      <div className="font-bold text-sm text-gray-600 mb-1">
                        {date.getDate()}/{date.getMonth() + 1}
                      </div>
                      {tasks.map(task => (
                        <div 
                          key={task.id}
                          className="mb-1 p-2 bg-blue-100 rounded cursor-pointer hover:bg-blue-200 text-sm"
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className="font-medium">{task.name}</div>
                          {subTasks[task.id] && subTasks[task.id].length > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              {subTasks[task.id].length} sous-tâche(s)
                            </div>
                          )}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Composant pour la vue liste
  const ListView = () => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-500 text-white">
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Jour</th>
              <th className="py-3 px-4 text-left">Type de semaine</th>
              <th className="py-3 px-4 text-left">Tâche</th>
              <th className="py-3 px-4 text-left">Sous-tâches</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {generatedPlanning.map(task => (
              <tr key={task.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">{task.date.toLocaleDateString()}</td>
                <td className="py-3 px-4">{task.dayOfWeek}</td>
                <td className="py-3 px-4">{task.weekType}</td>
                <td className="py-3 px-4">{task.name}</td>
                <td className="py-3 px-4">
                  {subTasks[task.id] && subTasks[task.id].length > 0 ? (
                    <ul className="list-disc list-inside">
                      {subTasks[task.id].map((subTask, index) => (
                        <li key={index} className="text-sm">{subTask}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 italic">Aucune</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleTaskClick(task)}
                    className="p-1 text-blue-500 hover:text-blue-700"
                    title="Modifier"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {generatedPlanning.length === 0 && (
              <tr>
                <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                  Aucune tâche à afficher. Veuillez sélectionner une période et un template.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Composant pour la vue d'édition du template
  const TemplateEditView = () => {
    // État local pour l'édition du template
    const [editableTemplate, setEditableTemplate] = useState(
      JSON.parse(JSON.stringify(templates[currentTemplate] || []))
    );
    
    // Fonction pour mettre à jour une cellule du template
    const updateCell = (rowIndex, colIndex, value) => {
      const newTemplate = [...editableTemplate];
      if (!newTemplate[rowIndex]) {
        newTemplate[rowIndex] = [];
      }
      newTemplate[rowIndex][colIndex] = value;
      setEditableTemplate(newTemplate);
    };
    
    // Fonction pour sauvegarder les modifications du template
    const saveTemplate = () => {
      const newTemplates = {...templates};
      newTemplates[currentTemplate] = editableTemplate;
      setTemplates(newTemplates);
      generatePlanning(newTemplates, startDate, endDate, currentTemplate);
      setView('calendar');
    };
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Édition du template: {currentTemplate}</h3>
          <p className="text-sm text-gray-600">Modifiez les tâches du template et cliquez sur Enregistrer pour appliquer les changements.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="py-2 px-3 text-left">Semaine</th>
                <th className="py-2 px-3 text-left">Lundi</th>
                <th className="py-2 px-3 text-left">Mardi</th>
                <th className="py-2 px-3 text-left">Mercredi</th>
                <th className="py-2 px-3 text-left">Jeudi</th>
                <th className="py-2 px-3 text-left">Vendredi</th>
              </tr>
            </thead>
            <tbody>
              {editableTemplate.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-200">
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="py-2 px-3 border border-gray-100">
                      <input
                        type="text"
                        value={cell || ''}
                        onChange={(e) => updateCell(rowIndex + 1, colIndex, e.target.value)}
                        className="w-full border border-gray-300 rounded p-1"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setView('calendar')}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            onClick={saveTemplate}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Enregistrer
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* En-tête */}
      <header className="bg-white shadow-md rounded-lg p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-800 mb-4 md:mb-0">
            Application de Planning GPNS
          </h1>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-2 rounded flex items-center ${
                view === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Calendrier
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 rounded flex items-center ${
                view === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              Liste
            </button>
            <button
              onClick={() => setView('edit')}
              className={`px-3 py-2 rounded flex items-center ${
                view === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Éditer
            </button>
          </div>
        </div>
      </header>
      
      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* Panneau de contrôle */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input
              type="date"
              value={formatDateForInput(startDate)}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                updateDateRange(newDate, endDate);
              }}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
            <input
              type="date"
              value={formatDateForInput(endDate)}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                updateDateRange(startDate, newDate);
              }}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <select
              value={currentTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              {Object.keys(templates).map(template => (
                <option key={template} value={template}>
                  {template}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col justify-end">
            <div className="flex space-x-2">
              <label htmlFor="file-upload" className="cursor-pointer bg-gray-200 hover:bg-gray-300 rounded p-2 flex items-center justify-center flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Importer
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              
              <div className="relative">
                <button
                  onClick={() => document.getElementById('export-dropdown').classList.toggle('hidden')}
                  className="bg-gray-200 hover:bg-gray-300 rounded p-2 flex items-center justify-center flex-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Exporter
                </button>
                
                <div id="export-dropdown" className="hidden absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10">
                  <button
                    onClick={exportToExcel}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-md"
                  >
                    Excel (.xlsx)
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-md"
                  >
                    Texte (.txt)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      {loading ? (
        <div className="bg-white shadow-md rounded-lg p-8 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Chargement en cours...</p>
          </div>
        </div>
      ) : (
        renderMainContent()
      )}
      
      {/* Modal d'édition de tâche */}
      {showTaskModal && <TaskModal />}
    </div>
  );
}