import React from 'react';

export const generatePDFReport = async (projectData, canvasRef) => {
  try {
    console.log('PDF Report generation requested for:', projectData.projectName);
    
    // For now, use the electron main process to handle PDF generation
    if (window.electronAPI && window.electronAPI.exportReport) {
      const result = await window.electronAPI.exportReport(projectData);
      if (result.success) {
        return { 
          success: true, 
          fileName: 'Report exported successfully',
          message: 'Report has been saved to your chosen location.'
        };
      } else {
        return { 
          success: false, 
          error: result.error || 'Failed to export report'
        };
      }
    } else {
      return { 
        success: false, 
        error: 'Export functionality not available'
      };
    }
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred'
    };
  }
};

export const generateCSVReport = (projectData) => {
  try {
    console.log('CSV Report generation requested for:', projectData.projectName);
    
    // Generate CSV data
    const csvData = [];
    
    // Header
    csvData.push(['Element Type', 'Width (inches)', 'Height (inches)', 'Area (sq in)', 'Material', 'Level']);
    
    // Data rows
    projectData.elements.forEach(element => {
      const widthInches = Math.round((element.width || 0) / 20); // Convert pixels to inches
      const heightInches = Math.round((element.height || 0) / 20);
      const area = widthInches * heightInches;
      const levelName = projectData.levels.find(l => l.id === element.levelId)?.name || 'Unknown';
      
      csvData.push([
        element.type || 'Unknown',
        widthInches,
        heightInches,
        area,
        element.material || 'Unknown',
        levelName
      ]);
    });
    
    // Convert to CSV string
    const csvString = csvData.map(row => row.join(',')).join('\n');
    
    // Create and download blob
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectData.projectName.replace(/\s+/g, '_')}_report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { 
      success: true, 
      fileName: link.download,
      message: 'CSV report downloaded successfully'
    };
    
  } catch (error) {
    console.error('Error generating CSV report:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred'
    };
  }
};
