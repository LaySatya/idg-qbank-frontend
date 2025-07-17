import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function EditCompletePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const questionId = params.get('questionid');

  useEffect(() => {
    toast.success('Edit completed!');
    setTimeout(() => {
      navigate(`/preview/${questionId}`);
    }, 2000);
  }, [questionId]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Saved successfully</h2>
      <p>Redirecting...</p>
    </div>
  );
}
