import React, { useState, useEffect } from 'react';
import { testApiConfiguration } from '../services/geminiService';
import { X, Key, Save, ExternalLink, LogOut, MessageCircle, User, Settings2, Smartphone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onUserUpdate }) => {
  const [user, setUser] = useState<{ name: string, avatar?: string } | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiType, setApiType] = useState('gemini');
  const [baseUrl, setBaseUrl] = useState('');
  const [modelName, setModelName] = useState('');

  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTestStatus(null);
      setTestMessage('');
      const storedUser = localStorage.getItem('user_info');
      // ... (rest of useEffect)
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setApiKey(localStorage.getItem('gemini_api_key') || '');
      setApiType(localStorage.getItem('api_provider') || 'gemini');
      setBaseUrl(localStorage.getItem('openai_base_url') || '');
      setModelName(localStorage.getItem('openai_model_name') || '');
    }
  }, [isOpen]);

  // ... (handleLogin, handleLogout)

  const handleLogin = () => {
    // Mock WeChat Login
    const mockUser = {
      name: 'WeChat User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
    };
    localStorage.setItem('user_info', JSON.stringify(mockUser));
    setUser(mockUser);
    onUserUpdate();
  };

  const handleLogout = () => {
    localStorage.removeItem('user_info');
    setUser(null);
    onUserUpdate();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);
    setTestMessage('');

    try {
      await testApiConfiguration(apiType, apiKey, baseUrl, modelName);
      setTestStatus('success');
      setTestMessage('Connection successful!');
    } catch (e: any) {
      setTestStatus('error');
      setTestMessage(e.message || 'Connection failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    // ... (existing save logic)
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }

    localStorage.setItem('api_provider', apiType);

    if (apiType === 'openai') {
      localStorage.setItem('openai_base_url', baseUrl.trim());
      localStorage.setItem('openai_model_name', modelName.trim());
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800">My Settings</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Account Section - unchanged */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Account</h3>
            {user ? (
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
                {/* ... user details */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white p-1 border border-gray-200 shadow-sm overflow-hidden">
                    <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full bg-gray-100" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> WeChat Linked
                    </p>
                  </div>
                </div>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Log out">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="w-full py-3 bg-[#07C160] hover:bg-[#06ad56] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                Login with WeChat
              </button>
            )}
          </div>

          {/* API Settings Section */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Model Configuration</h3>

            <div className="space-y-4">
              {/* Provider Select - unchanged */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Provider</label>
                <div className="relative">
                  <Settings2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={apiType}
                    onChange={(e) => setApiType(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm bg-white appearance-none"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI (Compatible)</option>
                    <option value="anthropic" disabled>Anthropic Claude (Coming Soon)</option>
                  </select>
                </div>
              </div>

              {/* API Key Input - unchanged */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {apiType === 'gemini' ? 'Gemini API Key' : 'API Key'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={apiType === 'gemini' ? "Enter Gemini API Key" : "sk-..."}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {apiType === 'openai' && (
                <>
                  {/* Base URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="https://api.openai.com/v1"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Default: https://api.openai.com/v1 (For DeepSeek: https://api.deepseek.com)</p>
                  </div>

                  {/* Model Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        placeholder="gpt-3.5-turbo"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">e.g., deepseek-chat, gpt-4, etc.</p>
                  </div>
                </>
              )}
            </div>

            {/* Connection Test Status */}
            {testStatus && (
              <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${testStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                {testStatus === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span className="flex-1">{testMessage}</span>
              </div>
            )}

            {apiType === 'gemini' && (
              <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
                <ExternalLink className="w-3 h-3 mt-0.5 shrink-0" />
                <span>
                  Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between gap-2">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !apiKey}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${isTesting || !apiKey
              ? 'text-gray-400 bg-gray-100'
              : 'text-primary bg-primary/10 hover:bg-primary/20'
              }`}
          >
            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
            Test Connection
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};