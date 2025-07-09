// ============================================================================
// PreviewOptions.jsx - Preview and Display Options Component
// ============================================================================
import React from 'react';
import { toast } from 'react-hot-toast';

export const PreviewOptions = ({
  previewSettings,
  setPreviewSettings,
  showPreviewOptions,
  setShowPreviewOptions,
  showDisplayOptions,
  setShowDisplayOptions,
  defaultMark
}) => {
  return (
    <>
      {/* Preview Options */}
      <div style={{ marginTop: '20px' }}>
        <div style={{
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          backgroundColor: 'white'
        }}>
          <button
            onClick={() => setShowPreviewOptions(!showPreviewOptions)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 15px',
              backgroundColor: '#f8f9fa',
              border: 'none',
              borderBottom: showPreviewOptions ? '1px solid #dee2e6' : 'none',
              borderRadius: showPreviewOptions ? '4px 4px 0 0' : '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{showPreviewOptions ? '▼' : '▶'}</span>
             Preview options
          </button>
          
          {showPreviewOptions && (
            <div style={{ padding: '15px' }}>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '15px' }}>
                These settings are for testing the question. The options you select only affect the preview.
              </div>
              
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Question version
                </label>
                <select 
                  value={previewSettings.questionVersion}
                  onChange={(e) => setPreviewSettings({...previewSettings, questionVersion: e.target.value})}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minWidth: '200px'
                  }}
                >
                  <option value="latest">Always latest</option>
                  <option value="version1">Version 1</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  How questions behave
                  <span style={{ marginLeft: '5px', color: '#17a2b8', cursor: 'help' }}>ⓘ</span>
                </label>
                <select 
                  value={previewSettings.behavior}
                  onChange={(e) => setPreviewSettings({...previewSettings, behavior: e.target.value})}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minWidth: '200px'
                  }}
                >
                  <option value="deferred">Deferred feedback</option>
                  <option value="immediate">Immediate feedback</option>
                  <option value="interactive">Interactive with multiple tries</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Marked out of
                </label>
                <input
                  type="number"
                  value={previewSettings.markedOutOf}
                  onChange={(e) => setPreviewSettings({...previewSettings, markedOutOf: e.target.value})}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    width: '80px'
                  }}
                />
              </div>

              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  toast.success(' Preview options updated!');
                }}
              >
                Save preview options and start again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Display Options */}
      <div style={{ marginTop: '20px' }}>
        <div style={{
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          backgroundColor: 'white'
        }}>
          <button
            onClick={() => setShowDisplayOptions(!showDisplayOptions)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 15px',
              backgroundColor: '#f8f9fa',
              border: 'none',
              borderBottom: showDisplayOptions ? '1px solid #dee2e6' : 'none',
              borderRadius: showDisplayOptions ? '4px 4px 0 0' : '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{showDisplayOptions ? '▼' : '▶'}</span>
             Display options
          </button>
          
          {showDisplayOptions && (
            <div style={{ padding: '15px' }}>
              {[
                { label: 'Whether correct', value: previewSettings.showCorrect, key: 'showCorrect' },
                { label: 'Marks', value: previewSettings.marks, key: 'marks' },
                { label: 'Specific feedback', value: previewSettings.specificFeedback, key: 'specificFeedback' },
                { label: 'General feedback', value: previewSettings.generalFeedback, key: 'generalFeedback' },
                { label: 'Right answer', value: previewSettings.rightAnswer, key: 'rightAnswer' },
                { label: 'Response history', value: previewSettings.responseHistory, key: 'responseHistory' }
              ].map((option, index) => (
                <div key={index} className="form-group" style={{ 
                  marginBottom: '15px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between' 
                }}>
                  <label style={{ fontWeight: '500', minWidth: '120px' }}>
                    {option.label}
                  </label>
                  <select 
                    value={option.value}
                    onChange={(e) => setPreviewSettings({...previewSettings, [option.key]: e.target.value})}
                    style={{
                      padding: '6px 8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      minWidth: '150px'
                    }}
                  >
                    <option value="shown">Shown</option>
                    <option value="not_shown">Not shown</option>
                    {option.key === 'marks' && <option value="show_mark_and_max">Show mark and max</option>}
                  </select>
                </div>
              ))}

              <div className="form-group" style={{ 
                marginBottom: '15px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <label style={{ fontWeight: '500', minWidth: '120px' }}>
                  Decimal places in grades
                </label>
                <input
                  type="number"
                  value={previewSettings.decimalPlaces}
                  onChange={(e) => setPreviewSettings({...previewSettings, decimalPlaces: e.target.value})}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    width: '80px'
                  }}
                />
              </div>

              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  toast.success(' Display options updated!');
                }}
              >
                Update display options
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};