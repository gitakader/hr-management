"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";

interface FolderItem {
  id: number;
  name: string;
  applicationId: number | null;
  parentId: number | null;
  isFile: boolean;
  filepath: string;
  mimetype: string;
  createdAt: string;
}

export default function FileManagementPage() {
  const { token } = useAuth();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [folderStack, setFolderStack] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FolderItem | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const loadFolders = async (parentId: number | null = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (parentId !== null) params.set("parentId", String(parentId));
      const res = await fetch(`/api/folders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) setFolders(d.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (token) loadFolders(null);
  }, [token]);

  const openFolder = (folder: FolderItem) => {
    if (folder.isFile) {
      setPreviewFile(folder);
      setZoom(100);
      setRotation(0);
    } else {
      setFolderStack([...folderStack, folder]);
      setCurrentFolder(folder);
      loadFolders(folder.id);
    }
  };

  const goBack = () => {
    const stack = [...folderStack];
    stack.pop();
    const prev = stack.length > 0 ? stack[stack.length - 1] : null;
    setFolderStack(stack);
    setCurrentFolder(prev);
    loadFolders(prev?.id || null);
    setPreviewFile(null);
  };

  const isImage = (mime: string) => mime?.startsWith("image/");
  const isPDF = (mime: string) => mime === "application/pdf";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">File Management</h1>

      <div className="flex gap-6">
        {/* Folder Tree & File List */}
        <div className="w-1/2">
          <div className="card">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              <button onClick={goBack} disabled={folderStack.length === 0} className="text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline">
                ← Back
              </button>
              <span className="text-gray-400">/</span>
              <button onClick={() => { setFolderStack([]); setCurrentFolder(null); loadFolders(null); setPreviewFile(null); }}
                className="text-blue-600 hover:underline">
                Root
              </button>
              {folderStack.map((f, i) => (
                <span key={f.id} className="flex items-center gap-1">
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600 dark:text-gray-400">{f.name}</span>
                </span>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div></div>
            ) : (
              <div className="space-y-1">
                {folders.map(item => (
                  <div
                    key={item.id}
                    onClick={() => openFolder(item)}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                  >
                    <span className="text-lg">{item.isFile ? "📄" : "📁"}</span>
                    <span className="text-sm text-gray-900 dark:text-white">{item.name}</span>
                    {item.isFile && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {item.mimetype?.split("/")[1]?.toUpperCase() || "FILE"}
                      </span>
                    )}
                  </div>
                ))}
                {folders.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No files or folders</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-1/2">
          <div className="card">
            {previewFile ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{previewFile.name}</h3>
                  <div className="flex items-center gap-2">
                    {isImage(previewFile.mimetype) && (
                      <>
                        <button onClick={() => setZoom(Math.min(zoom + 25, 300))} className="btn-secondary text-xs px-2 py-1">🔍+</button>
                        <button onClick={() => setZoom(Math.max(zoom - 25, 25))} className="btn-secondary text-xs px-2 py-1">🔍-</button>
                        <button onClick={() => setRotation((rotation + 90) % 360)} className="btn-secondary text-xs px-2 py-1">🔄</button>
                        <button onClick={() => { setZoom(100); setRotation(0); }} className="btn-secondary text-xs px-2 py-1">Fit</button>
                      </>
                    )}
                    <button
                      onClick={() => window.open(previewFile.filepath, "_blank")}
                      className="btn-secondary text-xs px-2 py-1"
                    >
                      🖨️ Print
                    </button>
                  </div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto max-h-[70vh] flex items-center justify-center"
                  style={{ minHeight: "400px" }}>
                  {isImage(previewFile.mimetype) ? (
                    <img
                      src={previewFile.filepath}
                      alt={previewFile.name}
                      style={{
                        transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
                        maxWidth: "100%",
                        transition: "all 0.3s ease",
                      }}
                    />
                  ) : isPDF(previewFile.mimetype) ? (
                    <iframe
                      src={previewFile.filepath}
                      className="w-full h-[70vh] rounded-lg"
                      title={previewFile.name}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-4xl mb-2">📄</p>
                      <p>Preview not available for this file type</p>
                      <a href={previewFile.filepath} target="_blank" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                        Download {previewFile.name}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-5xl mb-4">📂</p>
                <p>Select a file to preview</p>
                <p className="text-sm mt-1">Click on any file in the left panel</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
