import { useState, useEffect } from "react";
import {
  getMemories, updateMemory, deleteMemory,
  getEntities, updateEntity, deleteEntity,
  getRelationships, updateRelationship, deleteRelationship,
  getActions, updateAction, deleteAction
} from "../api/knowledge";

type Tab = "Memories" | "Entities" | "Relationships" | "Actions";

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState<Tab>("Memories");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const getLocalDatetimeString = (isoString: string | null | undefined) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getIsoFromLocalDatetime = (localString: string) => {
    if (!localString) return null;
    const d = new Date(localString);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "Memories") setData(await getMemories());
      if (activeTab === "Entities") setData(await getEntities());
      if (activeTab === "Relationships") setData(await getRelationships());
      if (activeTab === "Actions") setData(await getActions());
    } catch {
      console.error("Failed to fetch data");
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      if (activeTab === "Memories") await deleteMemory(id);
      if (activeTab === "Entities") await deleteEntity(id);
      if (activeTab === "Relationships") await deleteRelationship(id);
      if (activeTab === "Actions") await deleteAction(id);
      fetchData();
    } catch {
      alert("Failed to delete.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      if (activeTab === "Memories") {
        await updateMemory(editingItem.id, {
          category: editingItem.category,
          content: editingItem.content,
          metadata: typeof editingItem.metadata === 'string' ? JSON.parse(editingItem.metadata || '{}') : editingItem.metadata,
        });
      } else if (activeTab === "Entities") {
        await updateEntity(editingItem.id, {
          type: editingItem.type,
          name: editingItem.name,
          metadata: typeof editingItem.metadata === 'string' ? JSON.parse(editingItem.metadata || '{}') : editingItem.metadata,
        });
      } else if (activeTab === "Relationships") {
        await updateRelationship(editingItem.id, {
          relationship: editingItem.relationship,
          metadata: typeof editingItem.metadata === 'string' ? JSON.parse(editingItem.metadata || '{}') : editingItem.metadata,
        });
      } else if (activeTab === "Actions") {
        await updateAction(editingItem.id, {
          type: editingItem.type,
          title: editingItem.title,
          status: editingItem.status,
          scheduledFor: editingItem.scheduledFor || null,
          recurrence: editingItem.recurrence || null,
          payload: typeof editingItem.payload === 'string' ? JSON.parse(editingItem.payload || '{}') : editingItem.payload,
        });
      }
      setEditingItem(null);
      fetchData();
    } catch {
      alert("Failed to save updates.");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Knowledge Base</h1>
        <p className="text-slate-500 font-medium">Manage memories, entities, relationships, and actions.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar border-b border-slate-200">
        {(["Memories", "Entities", "Relationships", "Actions"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-bold rounded-t-xl transition-colors ${
              activeTab === tab
                ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-bold">Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col">
              <div className="flex-1">
                {activeTab === "Memories" && (
                  <>
                    <div className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">{item.category}</div>
                    <div className="font-medium text-slate-800 text-sm">{item.content}</div>
                  </>
                )}
                {activeTab === "Entities" && (
                  <>
                    <div className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">{item.type}</div>
                    <div className="font-bold text-slate-900 text-lg">{item.name}</div>
                  </>
                )}
                {activeTab === "Relationships" && (
                  <>
                    <div className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">Relationship</div>
                    <div className="font-medium text-slate-800 text-sm">{item.relationship}</div>
                  </>
                )}
                {activeTab === "Actions" && (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">{item.type}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : item.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm mb-1">{item.title}</div>
                    {item.scheduledFor && <div className="text-xs text-slate-500">Scheduled: {new Date(item.scheduledFor).toLocaleString()}</div>}
                  </>
                )}
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setEditingItem({ ...item, metadata: JSON.stringify(item.metadata, null, 2), payload: JSON.stringify(item.payload, null, 2) })}
                  className="flex-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {data.length === 0 && <div className="col-span-full text-center py-12 text-slate-500">No data found.</div>}
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-4">Edit {activeTab.slice(0, -1)}</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              {activeTab === "Memories" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:outline-emerald-500" value={editingItem.category || ""} onChange={e => setEditingItem({...editingItem, category: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Content</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:outline-emerald-500 min-h-[100px]" value={editingItem.content || ""} onChange={e => setEditingItem({...editingItem, content: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Metadata (JSON)</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-mono text-xs focus:outline-emerald-500 min-h-[100px]" value={editingItem.metadata || ""} onChange={e => setEditingItem({...editingItem, metadata: e.target.value})} />
                  </div>
                </>
              )}

              {activeTab === "Entities" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:outline-emerald-500" value={editingItem.type || ""} onChange={e => setEditingItem({...editingItem, type: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:outline-emerald-500" value={editingItem.name || ""} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Metadata (JSON)</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-mono text-xs focus:outline-emerald-500 min-h-[100px]" value={editingItem.metadata || ""} onChange={e => setEditingItem({...editingItem, metadata: e.target.value})} />
                  </div>
                </>
              )}

              {activeTab === "Relationships" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Relationship</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:outline-emerald-500" value={editingItem.relationship || ""} onChange={e => setEditingItem({...editingItem, relationship: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Metadata (JSON)</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-mono text-xs focus:outline-emerald-500 min-h-[100px]" value={editingItem.metadata || ""} onChange={e => setEditingItem({...editingItem, metadata: e.target.value})} />
                  </div>
                </>
              )}

              {activeTab === "Actions" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:outline-emerald-500" value={editingItem.type || ""} onChange={e => setEditingItem({...editingItem, type: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:outline-emerald-500" value={editingItem.title || ""} onChange={e => setEditingItem({...editingItem, title: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:outline-emerald-500" value={editingItem.status || ""} onChange={e => setEditingItem({...editingItem, status: e.target.value})}>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Scheduled For (Local Time)</label>
                    <input 
                      type="datetime-local" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:outline-emerald-500" 
                      value={getLocalDatetimeString(editingItem.scheduledFor)} 
                      onChange={e => setEditingItem({...editingItem, scheduledFor: getIsoFromLocalDatetime(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Recurrence Rule</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium focus:outline-emerald-500" value={editingItem.recurrence || ""} onChange={e => setEditingItem({...editingItem, recurrence: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Payload (JSON)</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-mono text-xs focus:outline-emerald-500 min-h-[100px]" value={editingItem.payload || ""} onChange={e => setEditingItem({...editingItem, payload: e.target.value})} />
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditingItem(null)} className="flex-1 py-3 px-4 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 px-4 font-bold text-white bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
