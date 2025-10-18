import React, { useState } from 'react';

interface ApiKeyModalProps {
  onSave: (apiKey: string) => void;
  initialError?: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, initialError }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState(initialError || '');

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('الرجاء إدخال مفتاح API.');
      return;
    }
    onSave(apiKey);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 max-w-md w-full flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold text-cyan-400">مطلوب مفتاح Gemini API</h2>
        <p className="text-gray-400 text-center">
          لاستخدام هذه الخدمة، تحتاج إلى مفتاح Google AI Gemini API الخاص بك.
        </p>
        <p className="text-gray-400 text-center text-sm">
          يمكنك الحصول على مفتاح مجاني من <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Google AI Studio</a>.
        </p>

        <input
          type="password"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            if (error) setError('');
          }}
          placeholder="أدخل مفتاح API هنا"
          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300"
        >
          حفظ والمتابعة
        </button>
      </div>
    </div>
  );
};

export default ApiKeyModal;
