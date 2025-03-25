import React, { useState } from 'react';

const MarketingCalendar = () => {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Marketing tasks data
  const marketingTasks = {
    // Format: 'YYYY-MM-DD': { platform: 'Instagram', type: 'Behind the scenes', color: 'bg-indigo-100 text-indigo-800' }
    '2025-04-02': { platform: 'Instagram', type: 'Behind the scenes', details: 'Image + Caption', color: 'bg-indigo-100 text-indigo-800', icon: '📷' },
    '2025-04-03': { platform: 'YouTube', type: 'Product Tutorial', details: 'Video', color: 'bg-green-100 text-green-800', icon: '▶️' },
    '2025-04-05': { platform: 'Blog', type: '10 Tips for Productivity', details: '', color: 'bg-blue-100 text-blue-800', icon: '📝' },
    '2025-04-11': { platform: 'LinkedIn', type: 'Product Announcement', details: '', color: 'bg-yellow-100 text-yellow-800', icon: '💼' },
    '2025-04-12': { platform: 'Newsletter', type: 'Monthly Recap', details: 'Email Digest', color: 'bg-red-100 text-red-800', icon: '📨' },
    '2025-04-17': { platform: 'Instagram', type: 'Behind the scenes', details: 'Image + Caption', color: 'bg-indigo-100 text-indigo-800', icon: '📷' },
  };
  
  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Generate calendar days
  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(year, month);
    let firstDay = getFirstDayOfMonth(year, month);
    // Adjust for Monday as first day (0 becomes 6, 1 becomes 0, etc.)
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const days = [];
    const weeks = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    // Create weeks
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    // If the last week is not complete, add null values
    const lastWeek = weeks[weeks.length - 1];
    if (lastWeek.length < 7) {
      for (let i = lastWeek.length; i < 7; i++) {
        lastWeek.push(null);
      }
    }
    
    return weeks;
  };
  
  // Format date as YYYY-MM-DD
  const formatDate = (day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };
  
  // Get task for a specific day
  const getTaskForDay = (day) => {
    if (!day) return null;
    const dateStr = formatDate(day);
    return marketingTasks[dateStr];
  };
  
  // Get month name
  const getMonthName = () => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[month];
  };
  
  // Handle month navigation
  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };
  
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };
  
  const calendar = generateCalendar();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <h2 className="text-xl font-bold">{getMonthName()} {year}</h2>
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
        {/* Calendar header - Weekdays (Mon-Fri only) */}
        {dayNames.slice(0, 5).map((day, index) => (
          <div key={index} className="p-2 text-center bg-gray-100 font-medium">
            {day}
          </div>
        ))}
        
        {/* Calendar body - only showing weekdays (Mon-Fri) */}
        {calendar.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {week.slice(0, 5).map((day, dayIndex) => (
              <div 
                key={dayIndex} 
                className="border min-h-32 p-2 relative"
              >
                {day !== null && (
                  <>
                    <div className="text-gray-500 font-medium mb-1">{day}</div>
                    {getTaskForDay(day) && (
                      <div className={`p-2 rounded ${getTaskForDay(day).color} text-sm mb-1`}>
                        <div className="flex items-center">
                          <span className="mr-1">{getTaskForDay(day).icon}</span>
                          <strong>{getTaskForDay(day).platform}</strong>
                        </div>
                        <div>{getTaskForDay(day).type}</div>
                        {getTaskForDay(day).details && (
                          <div className="text-xs">{getTaskForDay(day).details}</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default MarketingCalendar;