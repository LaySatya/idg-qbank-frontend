import React, { useEffect, useState } from 'react';

const TOKEN = import.meta.env.VITE_MOODLE_TOKEN;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TokenFormatTester = ({ drag }) => {
  const [workingUrl, setWorkingUrl] = useState(null);
  const [status, setStatus] = useState('testing');

  const testUrl = `${drag.fileurl.replace('/pluginfile.php', '/webservice/pluginfile.php')}?token=${TOKEN}`;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setStatus('success');
      setWorkingUrl(testUrl);
    };
    img.onerror = () => {
      setStatus('error');
    };
    img.src = testUrl;
  }, [testUrl]);

  const boxStyle = {
    border: status === 'success' ? '2px solid #28a745' : '2px dashed #dc3545',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: status === 'success' ? '#f0fff4' : '#fff5f5',
    textAlign: 'center'
  };

  return (
    <div style={boxStyle}>
      <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>{drag.filename}</div>
      {status === 'success' ? (
        <img
          src={workingUrl}
          alt={drag.filename}
          style={{
            maxWidth: '100%',
            maxHeight: '80px',
            marginBottom: '5px',
            borderRadius: '4px'
          }}
        />
      ) : (
        <div style={{ height: '80px', lineHeight: '80px', color: '#dc3545' }}>
          {status === 'testing' ? '⏳ Testing...' : ' Failed'}
        </div>
      )}
      {status === 'success' && (
        <details>
          <summary>Working URL</summary>
          <div style={{ wordWrap: 'break-word', fontSize: '10px', marginTop: '4px' }}>
            {workingUrl}
          </div>
        </details>
      )}
    </div>
  );
};

export const QuestionRenderer = ({ previewData }) => {
  if (!previewData || !previewData.drags || previewData.drags.length === 0) {
    return <p>No drag images available</p>;
  }

  return (
    <div>
      <h3>Image Token Test</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px'
        }}
      >
        {previewData.drags.map((drag, idx) => (
          <TokenFormatTester key={idx} drag={drag} />
        ))}
      </div>
    </div>
  );
};
