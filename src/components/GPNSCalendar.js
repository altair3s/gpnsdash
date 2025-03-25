import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const GPNSCalendar = () => {
  const [templates, setTemplates] = useState({
    Est: [],
    Ouest: []
  });
  const [currentTemplate, setCurrentTemplate] = useState('Est');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [taskColorMap, setTaskColorMap] = useState({});
  
  // Générer une carte de couleurs pour chaque type de tâche
  const generateTaskColorMap = (templateData) => {
    const colorMap = {};
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-red-100 text-red-800 border-red-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-cyan-100 text-cyan-800 border-cyan-200'
    ];
    
    let colorIndex = 0;
    
    // Pour chaque template, parcourir les tâches et leur attribuer une couleur
    Object.values(templateData).forEach(template => {
      if (template.length > 1) {
        // Parcourir toutes les lignes sauf l'en-tête
        for (let i = 1; i < template.length; i++) {
          const row = template[i];
          if (!row) continue;
          
          // Parcourir les jours de la semaine (colonnes 1 à 5)
          for (let j = 1; j <= 5; j++) {
            const task = row[j];
            if (task && !colorMap[task]) {
              colorMap[task] = colors[colorIndex % colors.length];
              colorIndex++;
            }
          }
        }
      }
    });
    
    setTaskColorMap(colorMap);
  };
  
  // Obtenir le nombre de jours dans le mois
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Obtenir le premier jour du mois (0 = Dimanche, 1 = Lundi, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Obtenir le numéro de la semaine dans l'année
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };
  
  // Calculer la position dans le cycle de 6 semaines
  const getCyclePosition = (date) => {
    // Définir une date de référence où le cycle commence par semaine paire 1
    // Je choisis le 03/03/2025 comme référence (selon votre test)
    const referenceDate = new Date(2025, 2, 3); // 03/03/2025
    
    // Calculer le nombre de semaines entre la date de référence et la date donnée
    const weekDiff = Math.floor((date - referenceDate) / (7 * 24 * 60 * 60 * 1000));
    
    // Obtenir la position dans le cycle (0-5)
    return ((weekDiff % 6) + 6) % 6; // +6 et %6 pour gérer les nombres négatifs
  };
  
  // Générer le calendrier
  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(year, month);
    let firstDay = getFirstDayOfMonth(year, month);
    
    // Ajuster firstDay: 0=Dimanche devient 1=Lundi (position 0 dans notre grille)
    // 1=Lundi devient position 0, 2=Mardi devient position 1, etc.
    firstDay = firstDay === 0 ? 6 : firstDay - 1; // 0->6, 1->0, 2->1, etc.
    
    const days = [];
    const weeks = [];
    
    // Ajouter des cellules vides pour les jours avant le 1er du mois
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Ajouter les jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    // Créer les semaines (par tranches de 7 jours)
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    // Si la dernière semaine n'est pas complète, ajouter des valeurs nulles
    const lastWeek = weeks[weeks.length - 1];
    if (lastWeek.length < 7) {
      for (let i = lastWeek.length; i < 7; i++) {
        lastWeek.push(null);
      }
    }
    
    return weeks;
  };
  
  // Obtenir la tâche pour un jour spécifique
  const getTaskForDay = (day) => {
    if (!day || !templates[currentTemplate] || templates[currentTemplate].length < 2) return null;
    
    // Déterminer le jour de la semaine (0 = Dimanche, 1 = Lundi, etc.)
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    
    // Ignorer les weekends (0 = dimanche, 6 = samedi)
    if (dayOfWeek === 0 || dayOfWeek === 6) return null;
    
    // Convertir dayOfWeek (0-6) en index dans notre tableau (0-4 pour Lun-Ven)
    // Lundi (1) devient index 0, Vendredi (5) devient index 4
    const dayIndex = dayOfWeek;
    
    // Déterminer la semaine du mois (1, 2, 3, 4, 5)
    const weekOfMonth = Math.ceil(day / 7);
    
    // Trouver la ligne de template appropriée
    let templateRow = null;
    
    // Pour Ouest: cycle fixe de 6 semaines dans un ordre précis
    if (currentTemplate === 'Est') {
      // Pour Est: utiliser la semaine du mois (avec cycle si nécessaire)
      const templateIndex = ((weekOfMonth - 1) % (templates[currentTemplate].length - 1)) + 1;
      templateRow = templates[currentTemplate][templateIndex];
    } else {
      // Pour Ouest: cycle fixe de 6 semaines dans l'ordre spécifique
      // 1. Semaine paire 1, 2. Semaine impaire 1, 3. Semaine paire 2, 
      // 4. Semaine impaire 2, 5. Semaine paire 3, 6. Semaine impaire 3
      
      // Calculer la position dans le cycle de 6 semaines (0-5)
      const cyclePosition = getCyclePosition(date);
      
      // Déterminer le modèle de semaine en fonction de la position dans le cycle
      const weekModels = [
        "Semaine paire 1", 
        "Semaine impaire 1", 
        "Semaine paire 2", 
        "Semaine impaire 2", 
        "Semaine paire 3", 
        "Semaine impaire 3"
      ];
      
      const weekPattern = weekModels[cyclePosition];
      
      // Chercher le modèle dans les données du template
      for (let i = 1; i < templates[currentTemplate].length; i++) {
        const row = templates[currentTemplate][i];
        if (row && row[0] && row[0].toString() === weekPattern) {
          templateRow = row;
          break;
        }
      }
      
      // Si non trouvé (pour éviter les erreurs), utiliser le premier modèle
      if (!templateRow && templates[currentTemplate].length > 1) {
        templateRow = templates[currentTemplate][1];
      }
    }
    
    if (!templateRow) return null;

    // Obtenir la tâche correspondante
    const task = templateRow[dayIndex];
    if (!task) return null;
    
    return {
      name: task,
      weekType: templateRow[0],
      color: taskColorMap[task] || 'bg-gray-100 text-gray-800 border-gray-200'
    };
  };
  
  // Obtenir le nom du mois
  const getMonthName = () => {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return monthNames[month];
  };
  
  // Navigation entre les mois
  const prevMonth = () => {
    setMonth(month === 0 ? 11 : month - 1);
    if (month === 0) setYear(year - 1);
  };
  
  const nextMonth = () => {
    setMonth(month === 11 ? 0 : month + 1);
    if (month === 11) setYear(year + 1);
  };
  
  // Générer des couleurs pastels pour l'en-tête de jour
  const getHeaderColor = (day) => {
    if (!day) return '';
    const colors = [
      'bg-blue-50 hover:bg-blue-100',
      'bg-purple-50 hover:bg-purple-100',
      'bg-green-50 hover:bg-green-100',
      'bg-yellow-50 hover:bg-yellow-100',
      'bg-pink-50 hover:bg-pink-100'
    ];
    return colors[day % 5];
  };
  
  useEffect(() => {
    // Charger les données depuis le fichier Excel lors du montage
    const loadTemplateData = async () => {
      try {
        // Dans un environnement réel, vous devriez adapter ceci pour charger
        // depuis votre source de données
        const response = await fetch('/data/PROGRAMME_GPNS.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        
        const workbook = XLSX.read(data, {
          cellStyles: true,
          cellFormulas: true,
          cellDates: true,
          cellNF: true,
          sheetStubs: true
        });
        
        const templateData = {};
        
        // Traiter chaque feuille
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Nettoyer les données
          const cleanedData = jsonData.filter(row => 
            row.some(cell => cell !== null && cell !== '')
          );
          
          templateData[sheetName] = cleanedData;
        });
        
        setTemplates(templateData);
        generateTaskColorMap(templateData);
      } catch (error) {
        console.error("Erreur lors du chargement du template:", error);
        
        // Utiliser des données par défaut basées sur votre fichier Excel
        const defaultData = {
          Est: [
            [null, "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"],
            ["Semaine 1", "TDS3", "TDS3", "S3N", "TBF", "TBF"],
            ["Semaine 2", "T2F", "T2F", "T2F", "TBM", "TBM"],
            ["Semaine 3", "QSE", "TCN", "PARACHUTE", "TME", "TME"],
            ["Semaine 4", "TBS4", "TBS4", "T2G", "ZONES FUMEURS EST", "RETRAIT ENCOMBRANTS"]
          ],
          Ouest: [
            [null, "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"],
            ["Semaine paire 1", "TERMINAL1", "TERMINAL1", "TERMINAL 3", "T2AC", "T2BD"],
            ["Semaine impaire 1", "NIV -4 TME", "NIV -4 TME", "LIAISON TME-T2F", "CATHEDRALE", "CATHEDRALE"],
            ["Semaine paire 2", "TERMINAL1", "TERMINAL1", "TERMINAL 3", "T2AC", "T2BD"],
            ["Semaine impaire 2", "NIV -2TBS4", "NIV -2TBS4", "LIAISON TDS3-TME", "NIV -2 TDS3", "NIV -2 TDS3"],
            ["Semaine paire 3", "TERMINAL1", "TERMINAL1", "TERMINAL 3", "T2AC", "T2BD"],
            ["Semaine impaire 3", "LIAISON TME / ARRIVÉES E", "LIAISON QSE-TBM", "LIAISON QSE - STOCKEUR", "SATELLITE T1", "RETRAIT ENCOMBRANTS ET ZONES FUMEURS OUEST"]
          ]
        };
        
        setTemplates(defaultData);
        generateTaskColorMap(defaultData);
      }
    };
    
    loadTemplateData();
  }, []);
  
  const calendar = generateCalendar();
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  
  return (
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold">{getMonthName()} {year}</h2>
          <select 
            value={currentTemplate}
            onChange={(e) => setCurrentTemplate(e.target.value)}
            className="border rounded p-1"
          >
            {Object.keys(templates).map(template => (
              <option key={template} value={template}>{template}</option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            ◀
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            ▶
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-5">
        {/* En-tête du calendrier - Jours de semaine (Lun-Ven seulement) */}
        {dayNames.slice(0, 5).map((day, index) => (
          <div key={index} className="p-2 text-center bg-gray-100 font-medium">
            {day}
          </div>
        ))}
        
        {/* Corps du calendrier - affichage des jours de semaine (Lun-Ven) uniquement */}
        {calendar.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {week.slice(0, 5).map((day, dayIndex) => {
              const task = getTaskForDay(day);
              
              return (
                <div 
                  key={dayIndex} 
                  className={`border min-h-28 relative ${getHeaderColor(day)}`}
                >
                  {day !== null && (
                    <>
                      <div className="text-gray-500 font-medium p-1 text-right">{day}</div>
                      {task && (
                        <div className={`m-1 p-2 rounded border ${task.color} text-sm shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer`}>
                          <div className="font-bold">{task.name}</div>
                          <div className="text-xs mt-1">{task.weekType}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default GPNSCalendar;