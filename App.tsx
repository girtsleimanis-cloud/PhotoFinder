
import React, { useState, useEffect } from 'react';
import { LibraryItem, AppView, SearchResult } from './types';
import { performVisualSearch } from './services/geminiService';
import Camera from './components/Camera';
import { CameraIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon, BookOpenIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LIBRARY);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  
  // Form State
  const [newItem, setNewItem] = useState({ name: '', code: '', image: '' });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('image_library');
    if (saved) {
      try {
        setLibrary(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load library", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('image_library', JSON.stringify(library));
  }, [library]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.image || !newItem.name || !newItem.code) {
      alert("Lūdzu, aizpildiet visus laukus un pievienojiet attēlu.");
      return;
    }

    const item: LibraryItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name,
      collectionCode: newItem.code,
      imageData: newItem.image,
      createdAt: Date.now()
    };

    setLibrary([item, ...library]);
    setNewItem({ name: '', code: '', image: '' });
    setView(AppView.LIBRARY);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteItem = (id: string) => {
    if (confirm("Vai tiešām vēlaties dzēst šo ierakstu?")) {
      setLibrary(library.filter(item => item.id !== id));
    }
  };

  const onCaptureForSearch = async (base64: string) => {
    setView(AppView.LIBRARY);
    setIsSearching(true);
    setSearchResult(null);

    try {
      const result = await performVisualSearch(base64, library);
      setSearchResult(result);
    } catch (error) {
      console.error(error);
      alert("Meklēšana neizdevās.");
    } finally {
      setIsSearching(false);
    }
  };

  const foundItem = searchResult?.matchFound 
    ? library.find(i => i.id === searchResult.itemId) 
    : null;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
            <ArchiveBoxIcon className="w-6 h-6" />
            Attēlu Krājums
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setView(AppView.ADD_ITEM)}
              className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Search Progress/Result Overlay */}
        {(isSearching || searchResult) && (
          <div className="mb-6 bg-white rounded-2xl p-6 shadow-sm border border-indigo-100 animate-in fade-in duration-300">
            {isSearching ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-600 font-medium">Analizē attēlu un meklē krājumā...</p>
              </div>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setSearchResult(null)}
                  className="absolute -top-2 -right-2 text-slate-400 hover:text-slate-600"
                >
                  &times;
                </button>
                <h2 className="text-lg font-semibold mb-3">Meklēšanas rezultāts</h2>
                {searchResult?.matchFound && foundItem ? (
                  <div className="flex flex-col sm:flex-row gap-4 items-center bg-green-50 p-4 rounded-xl border border-green-100">
                    <img src={foundItem.imageData} alt={foundItem.name} className="w-24 h-24 object-cover rounded-lg shadow-sm" />
                    <div>
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Atrasts atbilstums</p>
                      <h3 className="text-xl font-bold text-slate-900">{foundItem.name}</h3>
                      <p className="text-slate-600">Krājuma kods: <span className="font-mono font-bold">{foundItem.collectionCode}</span></p>
                      {searchResult.reason && <p className="text-sm text-slate-500 mt-2 italic">{searchResult.reason}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
                    <p className="text-orange-800 font-medium">Atbilstība netika atrasta.</p>
                    <p className="text-orange-600 text-sm">{searchResult?.reason || "Mēģiniet nofotografēt skaidrāk."}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add Item View */}
        {view === AppView.ADD_ITEM && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold mb-6">Pievienot jaunu attēlu</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative min-h-[200px]">
                {newItem.image ? (
                  <img src={newItem.image} className="max-h-60 object-contain rounded-lg" alt="Preview" />
                ) : (
                  <div className="text-center">
                    <BookOpenIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">Klikšķiniet, lai augšupielādētu attēlu</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nosaukums</label>
                <input 
                  type="text" 
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Piem., Senā vāze"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Krājuma kods</label>
                <input 
                  type="text" 
                  value={newItem.code}
                  onChange={e => setNewItem({ ...newItem, code: e.target.value })}
                  placeholder="Piem., MN-2024-001"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Saglabāt bibliotēkā
                </button>
                <button 
                  type="button"
                  onClick={() => setView(AppView.LIBRARY)}
                  className="px-6 py-3 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
                >
                  Atcelt
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Library Grid View */}
        {view === AppView.LIBRARY && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Krājuma Bibliotēka</h2>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                {library.length} vienības
              </span>
            </div>

            {library.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <BookOpenIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">Bibliotēka vēl ir tukša.</p>
                <button 
                  onClick={() => setView(AppView.ADD_ITEM)}
                  className="mt-4 text-indigo-600 font-bold hover:underline"
                >
                  Pievienot pirmo attēlu
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {library.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="h-48 relative overflow-hidden">
                      <img src={item.imageData} alt={item.name} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => deleteItem(item.id)}
                        className="absolute top-2 right-2 p-2 bg-white/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 truncate">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          {item.collectionCode}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Navigation Tab Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-around items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setView(AppView.LIBRARY)}
          className={`flex flex-col items-center gap-1 ${view === AppView.LIBRARY ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <BookOpenIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Bibliotēka</span>
        </button>

        <button 
          onClick={() => setView(AppView.CAMERA)}
          className="relative -top-10 w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white active:scale-95 transition-transform"
        >
          <CameraIcon className="w-8 h-8" />
        </button>

        <button 
          onClick={() => setView(AppView.ADD_ITEM)}
          className={`flex flex-col items-center gap-1 ${view === AppView.ADD_ITEM ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <PlusIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Pievienot</span>
        </button>
      </nav>

      {/* Full Screen Camera for Search */}
      {view === AppView.CAMERA && (
        <Camera 
          onCapture={onCaptureForSearch}
          onCancel={() => setView(AppView.LIBRARY)}
        />
      )}
    </div>
  );
};

export default App;
