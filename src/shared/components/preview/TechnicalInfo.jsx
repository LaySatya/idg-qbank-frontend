// ============================================================================
// TechnicalInfo.jsx - Technical Information Component
// ============================================================================
import React from 'react';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const TechnicalInfo = ({
  technicalInfo,
  showTechnicalInfo,
  setShowTechnicalInfo,
  previewData,
  error
}) => {
  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  };

  // Handle XML download
  const handleXMLDownload = async (e) => {
    e.preventDefault();
    try {
      console.log(' Downloading question XML...');
      
      const response = await fetch(`${API_BASE_URL}/questions/export?questionid=${previewData.id}&format=xml`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const xmlContent = await response.text();
        const blob = new Blob([xmlContent], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `question_${previewData.id}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(' XML file downloaded successfully!');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error(' Download failed:', err);
      toast.error(' Download failed: ' + err.message);
    }
  };

  return (
    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={() => setShowTechnicalInfo(!showTechnicalInfo)}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            textDecoration: 'none',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
           Technical information {showTechnicalInfo ? '▼' : '▶'}
        </button>
      </div>
      
      {showTechnicalInfo && technicalInfo && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ color: '#17a2b8', marginRight: '5px' }}>ⓘ</span>
            <strong>Behaviour being used:</strong> {technicalInfo.behaviour}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Minimum fraction:</strong> {technicalInfo.minimumFraction}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Maximum fraction:</strong> {technicalInfo.maximumFraction}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Question variant:</strong> {technicalInfo.questionVariant}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Question summary:</strong> {technicalInfo.questionSummary}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Right answer summary:</strong> {technicalInfo.rightAnswerSummary}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Response summary:</strong> {technicalInfo.responseSummary || 'No response yet'}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Question state:</strong> {technicalInfo.questionState}
          </div>
          {technicalInfo.penalty > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Penalty:</strong> {(technicalInfo.penalty * 100).toFixed(1)}%
            </div>
          )}
          <div style={{ marginBottom: '8px' }}>
            <strong>API Status:</strong> <span style={{ color: error ? '#dc3545' : '#28a745' }}>
              {error ? ' API Error (using fallback)' : ' Connected'}
            </span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Endpoint:</strong> 
            <code style={{ 
              backgroundColor: '#e9ecef', 
              padding: '2px 4px', 
              borderRadius: '3px',
              fontSize: '12px',
              marginLeft: '5px'
            }}>
              {API_BASE_URL}/questions/preview?questionid={previewData?.id}
            </code>
          </div>
          
          {/* API Response Debug Info */}
          {previewData?.originalApiData && (
            <div style={{ marginTop: '15px' }}>
              <details style={{ 
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                padding: '10px'
              }}>
                <summary style={{ 
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#856404',
                  fontSize: '13px'
                }}>
                   API Response Debug Info
                </summary>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '12px', marginBottom: '5px' }}>
                    <strong>Question Type:</strong> {previewData.originalApiData.qtype}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '5px' }}>
                    <strong>Answers Count:</strong> {previewData.originalApiData.answers?.length || 0}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '5px' }}>
                    <strong>Match Subquestions:</strong> {previewData.originalApiData.match_subquestions?.length || 0}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '5px' }}>
                    <strong>Drags:</strong> {previewData.originalApiData.drags?.length || 0}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '5px' }}>
                    <strong>Drops:</strong> {previewData.originalApiData.drops?.length || 0}
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    <strong>Context ID:</strong> {previewData.contextId}
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ fontSize: '16px', margin: '0 0 10px 0', fontWeight: '600' }}>
           Question custom fields
        </h4>
      </div>
      
      <div>
        <a 
          href="#" 
          style={{ 
            color: '#007bff', 
            textDecoration: 'none', 
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          onClick={handleXMLDownload}
        >
           Download this question in Moodle XML format
        </a>
      </div>
    </div>
  );
};