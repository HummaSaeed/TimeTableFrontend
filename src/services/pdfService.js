// Real PDF generation using jsPDF and autoTable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const dayOrder = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

const sortSlots = (a, b) => {
  const da = dayOrder[a.day] || 999;
  const db = dayOrder[b.day] || 999;
  if (da !== db) return da - db;
  const pa = Number(a.period_number || 0);
  const pb = Number(b.period_number || 0);
  return pa - pb;
};

const saveToBlob = (doc) => {
  return doc.output('blob');
};

const addFooter = (doc) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `Generated: ${new Date().toLocaleString()} • Page ${i}/${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }
};

export const pdfService = {
  // Generate PDF for a specific class timetable
  generateClassTimetablePDF: async (classData, timetableSlots, schoolProfile = null) => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });

      // Header
      doc.setFontSize(16);
      doc.text(`${classData?.class_name || 'Class'}${classData?.section ? '-' + classData.section : ''} Timetable`, 40, 40);
      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.text(`Room: ${classData?.room_number || '-'}`, 40, 60);
      doc.text(`Strength: ${classData?.total_strength || '-'}`, 200, 60);

      const slots = Array.isArray(timetableSlots) ? timetableSlots : [];
      const uniqueDays = Array.from(new Set(slots.map(s => s.day))).sort((a, b) => (dayOrder[a] || 999) - (dayOrder[b] || 999));
      const days = uniqueDays.length ? uniqueDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

      // Use school profile total periods if available, otherwise calculate from slots
      const totalPeriods = schoolProfile?.total_periods_per_day || Math.max(8, ...slots.map(s => Number(s.period_number) || 0));
      const periodNumbers = Array.from({ length: totalPeriods }, (_, i) => i + 1);

      const head = [['Day', ...periodNumbers.map(p => `Period ${p}`)]];
      const body = days.map(d => {
        const row = [d];
        periodNumbers.forEach(p => {
          const slot = slots.find(s => s.day === d && Number(s.period_number) === p);
          row.push(slot ? `${slot.subject_name || ''}${slot.teacher_name ? `\n(${slot.teacher_name})` : ''}` : '-');
        });
        return row;
      });

      autoTable(doc, {
        startY: 85,
        head,
        body,
        styles: { fontSize: 10, cellPadding: 6, lineColor: [200, 200, 200], lineWidth: 0.5 },
        headStyles: { fillColor: [33, 37, 41], textColor: 255 },
        theme: 'grid',
      });

      addFooter(doc);
      const blob = saveToBlob(doc);

      return {
        success: true,
        filename: `${(classData?.class_name || 'Class').replace(/\s+/g, '_')}${classData?.section ? '_' + classData.section : ''}_Timetable.pdf`,
        data: blob
      };
    } catch (error) {
      console.error('Error generating class timetable PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  },

  // Generate PDF for a specific teacher timetable
  generateTeacherTimetablePDF: async (teacherData, timetableSlots, schoolProfile = null) => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });

      doc.setFontSize(16);
      doc.text(`${teacherData?.name || 'Teacher'} Timetable`, 40, 40);
      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.text(`Email: ${teacherData?.email || '-'}`, 40, 60);
      doc.text(`Subject: ${teacherData?.subject_specialist || '-'}`, 260, 60);

      const slots = Array.isArray(timetableSlots) ? timetableSlots : [];
      const uniqueDays = Array.from(new Set(slots.map(s => s.day))).sort((a, b) => (dayOrder[a] || 999) - (dayOrder[b] || 999));
      const days = uniqueDays.length ? uniqueDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

      // Use school profile total periods if available, otherwise calculate from slots
      const totalPeriods = schoolProfile?.total_periods_per_day || Math.max(8, ...slots.map(s => Number(s.period_number) || 0));
      const periodNumbers = Array.from({ length: totalPeriods }, (_, i) => i + 1);

      const head = [['Day', ...periodNumbers.map(p => `Period ${p}`)]];
      const body = days.map(d => {
        const row = [d];
        periodNumbers.forEach(p => {
          const slot = slots.find(s => s.day === d && Number(s.period_number) === p);
          row.push(slot ? `${slot.class_name ? `${slot.class_name}${slot.class_section ? '-' + slot.class_section : ''}` : ''}${slot.subject_name ? `\n${slot.subject_name}` : ''}` : '-');
        });
        return row;
      });

      autoTable(doc, {
        startY: 85,
        head,
        body,
        styles: { fontSize: 10, cellPadding: 6, lineColor: [200, 200, 200], lineWidth: 0.5 },
        headStyles: { fillColor: [33, 37, 41], textColor: 255 },
        theme: 'grid',
      });

      addFooter(doc);
      const blob = saveToBlob(doc);

      return {
        success: true,
        filename: `${(teacherData?.name || 'Teacher').replace(/\s+/g, '_')}_Timetable.pdf`,
        data: blob
      };
    } catch (error) {
      console.error('Error generating teacher timetable PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  },

  // Generate consolidated class timetable grid (all classes on 1-2 pages)
  generateConsolidatedClassesPDF: async (classes, timetableSlots, schoolProfile = null) => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });

      doc.setFontSize(18);
      doc.text('Complete School Timetable - All Classes', 40, 40);
      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);

      const totalPeriods = schoolProfile?.total_periods_per_day || 8;
      const periodNumbers = Array.from({ length: totalPeriods }, (_, i) => i + 1);

      // Build table data
      const head = [['Class', ...periodNumbers.map(p => `P${p}`)]];
      const body = (classes || []).map(cls => {
        const row = [`${cls.class_name}-${cls.section}`];
        periodNumbers.forEach(periodNum => {
          const slot = (timetableSlots || []).find(
            s => s.class_name === cls.class_name &&
              s.class_section === cls.section &&
              s.period_number === periodNum
          );
          row.push(slot ? `${slot.subject_name || ''}\\n${slot.teacher_name || ''}` : '-');
        });
        return row;
      });

      autoTable(doc, {
        startY: 85,
        head,
        body,
        styles: {
          fontSize: 8,
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
          halign: 'center',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [26, 110, 72],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [248, 249, 250] }
        },
        theme: 'grid',
      });

      addFooter(doc);
      const blob = saveToBlob(doc);

      return {
        success: true,
        filename: `School_Timetable_All_Classes_${new Date().toISOString().split('T')[0]}.pdf`,
        data: blob
      };
    } catch (error) {
      console.error('Error generating consolidated classes PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  },

  // Generate consolidated teacher timetable grid (all teachers on 1-2 pages)
  generateConsolidatedTeachersPDF: async (teachers, timetableSlots, schoolProfile = null) => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });

      doc.setFontSize(18);
      doc.text('Complete School Timetable - All Teachers', 40, 40);
      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);

      const totalPeriods = schoolProfile?.total_periods_per_day || 8;
      const periodNumbers = Array.from({ length: totalPeriods }, (_, i) => i + 1);

      // Build table data
      const head = [['Teacher', ...periodNumbers.map(p => `P${p}`)]];
      const body = (teachers || []).map(teacher => {
        const row = [teacher.name];
        periodNumbers.forEach(periodNum => {
          const slot = (timetableSlots || []).find(
            s => s.teacher_name === teacher.name && s.period_number === periodNum
          );
          row.push(slot ? `${slot.class_name}-${slot.class_section}\\n${slot.subject_name || ''}` : '-');
        });
        return row;
      });

      autoTable(doc, {
        startY: 85,
        head,
        body,
        styles: {
          fontSize: 8,
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
          halign: 'center',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [26, 110, 72],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [248, 249, 250] }
        },
        theme: 'grid',
      });

      addFooter(doc);
      const blob = saveToBlob(doc);

      return {
        success: true,
        filename: `School_Timetable_All_Teachers_${new Date().toISOString().split('T')[0]}.pdf`,
        data: blob
      };
    } catch (error) {
      console.error('Error generating consolidated teachers PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  },

  // Generate comprehensive PDF with all timetables
  generateAllTimetablesPDF: async (classes, teachers, timetableSlots, schoolProfile = null) => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });

      doc.setFontSize(18);
      doc.text('Complete School Timetable', 40, 40);
      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);

      // Summary page
      const totalClasses = (classes || []).length;
      const totalTeachers = (teachers || []).length;
      const totalSlots = (timetableSlots || []).length;
      autoTable(doc, {
        startY: 90,
        head: [['Metric', 'Value']],
        body: [
          ['Total Classes', String(totalClasses)],
          ['Total Teachers', String(totalTeachers)],
          ['Total Slots', String(totalSlots)]
        ],
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [33, 37, 41] }
      });

      // Class pages (grid)
      (classes || []).forEach((cls, idx) => {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(20);
        doc.text(`${cls.class_name || 'Class'}${cls.section ? '-' + cls.section : ''} Timetable`, 40, 40);

        const slots = (timetableSlots || []).filter(s => s.class_name === cls.class_name && s.class_section === cls.section);
        const uniqueDays = Array.from(new Set(slots.map(s => s.day))).sort((a, b) => (dayOrder[a] || 999) - (dayOrder[b] || 999));
        const days = uniqueDays.length ? uniqueDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        // Use school profile total periods if available
        const totalPeriods = schoolProfile?.total_periods_per_day || Math.max(8, ...slots.map(s => Number(s.period_number) || 0));
        const periodNumbers = Array.from({ length: totalPeriods }, (_, i) => i + 1);

        const head = [['Day', ...periodNumbers.map(p => `Period ${p}`)]];
        const body = days.map(d => {
          const row = [d];
          periodNumbers.forEach(p => {
            const slot = slots.find(s => s.day === d && Number(s.period_number) === p);
            row.push(slot ? `${slot.subject_name || ''}${slot.teacher_name ? `\n(${slot.teacher_name})` : ''}` : '-');
          });
          return row;
        });

        autoTable(doc, {
          startY: 70,
          head,
          body,
          styles: { fontSize: 10, cellPadding: 6, lineColor: [200, 200, 200], lineWidth: 0.5 },
          headStyles: { fillColor: [33, 37, 41], textColor: 255 },
          theme: 'grid',
        });
      });

      // Teacher pages (grid)
      (teachers || []).forEach((t) => {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(20);
        doc.text(`${t.name || 'Teacher'} Timetable`, 40, 40);

        const slots = (timetableSlots || []).filter(s => s.teacher_name === t.name);
        const uniqueDays = Array.from(new Set(slots.map(s => s.day))).sort((a, b) => (dayOrder[a] || 999) - (dayOrder[b] || 999));
        const days = uniqueDays.length ? uniqueDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        // Use school profile total periods if available
        const totalPeriods = schoolProfile?.total_periods_per_day || Math.max(8, ...slots.map(s => Number(s.period_number) || 0));
        const periodNumbers = Array.from({ length: totalPeriods }, (_, i) => i + 1);

        const head = [['Day', ...periodNumbers.map(p => `Period ${p}`)]];
        const body = days.map(d => {
          const row = [d];
          periodNumbers.forEach(p => {
            const slot = slots.find(s => s.day === d && Number(s.period_number) === p);
            row.push(slot ? `${slot.class_name ? `${slot.class_name}${slot.class_section ? '-' + slot.class_section : ''}` : ''}${slot.subject_name ? `\n${slot.subject_name}` : ''}` : '-');
          });
          return row;
        });

        autoTable(doc, {
          startY: 70,
          head,
          body,
          styles: { fontSize: 10, cellPadding: 6, lineColor: [200, 200, 200], lineWidth: 0.5 },
          headStyles: { fillColor: [33, 37, 41], textColor: 255 },
          theme: 'grid',
        });
      });

      addFooter(doc);
      const blob = saveToBlob(doc);

      return {
        success: true,
        filename: `Complete_School_Timetable_${new Date().toISOString().split('T')[0]}.pdf`,
        data: blob
      };
    } catch (error) {
      console.error('Error generating comprehensive PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  },

  // Download a PDF blob
  downloadPDF: (pdfBlob, filename) => {
    try {
      const blob = pdfBlob instanceof Blob ? pdfBlob : new Blob([pdfBlob], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true, message: 'PDF downloaded successfully' };
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw new Error('Failed to download PDF');
    }
  },

  // Print timetable (simple)
  printTimetable: (timetableData) => {
    try {
      console.log('Printing timetable:', timetableData);

      // In a real implementation, this would:
      // 1. Create a print-friendly version of the timetable
      // 2. Open print dialog
      // 3. Handle print formatting

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>${timetableData.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .timetable { width: 100%; border-collapse: collapse; }
              .timetable th, .timetable td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              .timetable th { background-color: #f5f5f5; }
              .slot { background-color: #e8f5e8; padding: 4px; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${timetableData.title}</h1>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
            <div class="timetable-content">
              <!-- Timetable content would be rendered here -->
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();

      return { success: true, message: 'Print dialog opened' };
    } catch (error) {
      console.error('Error printing timetable:', error);
      throw new Error('Failed to print timetable');
    }
  },

  // Generate Substitution Grid PDF
  generateSubstitutionGridPDF: async (gridData, periods, date, dayName, statistics) => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });

      // Header
      doc.setFontSize(20);
      doc.setTextColor(220, 53, 69); // Red color
      doc.text('Substitution Grid', 40, 35);

      // Date and day info
      doc.setFontSize(12);
      doc.setTextColor(80);
      doc.text(`Date: ${new Date(date).toLocaleDateString()} (${dayName})`, 40, 55);
      doc.text(`Total Absent Teachers: ${gridData.length}`, 40, 70);

      // Statistics
      if (statistics) {
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Total Periods: ${statistics.total_periods_to_substitute} | `, 40, 85);
        doc.setTextColor(40, 167, 69); // Green
        doc.text(`Covered: ${statistics.substituted_periods}`, 180, 85);
        doc.setTextColor(220, 53, 69); // Red
        doc.text(` | Pending: ${statistics.unsubstituted_periods}`, 260, 85);
      }

      // Prepare table data
      const headers = ['Teacher (Absent)', ...periods.map(p => `P${p}`)];
      const tableData = [];

      gridData.forEach(row => {
        const rowData = [row.teacher_name + (row.reason ? `\n(${row.reason})` : '')];

        periods.forEach(period => {
          const periodData = row.periods[period];

          if (periodData && periodData.has_class) {
            const cellLines = [
              `📚 ${periodData.class_name}`,
              `📖 ${periodData.subject_name}`
            ];

            if (periodData.room_number) {
              cellLines.push(`🚪 ${periodData.room_number}`);
            }

            if (periodData.period_start_time && periodData.period_end_time) {
              cellLines.push(`⏰ ${periodData.period_start_time}-${periodData.period_end_time}`);
            }

            if (periodData.substitute_teacher) {
              cellLines.push(`→ ${periodData.substitute_teacher}`);
            } else {
              cellLines.push('⚠️ NO SUBSTITUTE');
            }

            rowData.push(cellLines.join('\n'));
          } else {
            rowData.push('Free');
          }
        });

        tableData.push(rowData);
      });

      // Generate table
      autoTable(doc, {
        startY: 100,
        head: [headers],
        body: tableData,
        styles: {
          fontSize: 8,
          cellPadding: 5,
          overflow: 'linebreak',
          cellWidth: 'wrap',
          valign: 'top'
        },
        headStyles: {
          fillColor: [220, 53, 69],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: {
            cellWidth: 100,
            fontStyle: 'bold',
            fillColor: [245, 245, 245]
          }
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        didParseCell: function (data) {
          // Highlight cells with no substitute
          if (data.cell.text && data.cell.text.length > 0) {
            const cellText = data.cell.text.join(' ');
            if (cellText.includes('NO SUBSTITUTE')) {
              data.cell.styles.fillColor = [255, 230, 230];
              data.cell.styles.textColor = [220, 53, 69];
            } else if (cellText.includes('→') && data.column.index > 0) {
              // Has substitute - light green background
              data.cell.styles.fillColor = [230, 255, 230];
            } else if (cellText === 'Free') {
              data.cell.styles.fillColor = [240, 240, 240];
              data.cell.styles.textColor = [150, 150, 150];
              data.cell.styles.fontStyle = 'italic';
              data.cell.styles.halign = 'center';
            }
          }
        }
      });

      // Add legend at the bottom
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Legend:', 40, finalY);

      // Green box
      doc.setFillColor(230, 255, 230);
      doc.rect(90, finalY - 8, 15, 10, 'F');
      doc.text('Covered', 110, finalY);

      // Red box
      doc.setFillColor(255, 230, 230);
      doc.rect(165, finalY - 8, 15, 10, 'F');
      doc.text('No Substitute', 185, finalY);

      // Gray box
      doc.setFillColor(240, 240, 240);
      doc.rect(265, finalY - 8, 15, 10, 'F');
      doc.text('Free Period', 285, finalY);

      // Add footer
      addFooter(doc);

      const blob = saveToBlob(doc);

      return {
        success: true,
        filename: `Substitution_Grid_${date}.pdf`,
        data: blob
      };
    } catch (error) {
      console.error('Error generating substitution grid PDF:', error);
      throw new Error('Failed to generate substitution grid PDF');
    }
  }
};

// Helper function to format timetable data for PDF
export const formatTimetableForPDF = (slots, type = 'class') => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'
  ];

  const formattedData = {
    days: days,
    timeSlots: timeSlots,
    slots: slots,
    type: type
  };

  return formattedData;
};

// Helper function to create timetable grid for PDF
export const createTimetableGrid = (slots, days, timeSlots) => {
  const grid = [];

  timeSlots.forEach(timeSlot => {
    const [startTime] = timeSlot.split('-');
    const row = {
      time: timeSlot,
      slots: {}
    };

    days.forEach(day => {
      const slot = slots.find(s =>
        s.day === day && s.start_time === startTime
      );
      row.slots[day] = slot || null;
    });

    grid.push(row);
  });

  return grid;
};

export default pdfService; 