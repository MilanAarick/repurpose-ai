"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../utils/supabaseClient";
import { uploadToSupabase } from "../../../../utils/uploadToSupabase";

export default function ProjectAssets() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [assets, setAssets] = useState<any[]>([]);
  const [newAsset, setNewAsset] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);
  const [mediaAssetId, setMediaAssetId] = useState<string>("");
  const [mediaJobId, setMediaJobId] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaJobStatus, setMediaJobStatus] = useState<string | null>(null);
  const [mediaOutputUrl, setMediaOutputUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'reel' | 'audiogram'>('reel');

  async function getSupabaseToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  async function fetchAssets() {
    setLoading(true);
    setError(null);
    const token = await getSupabaseToken();
    const res = await fetch(`http://localhost:3001/api/projects/${projectId}/assets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setError("Failed to fetch assets");
      setLoading(false);
      return;
    }
    setAssets(await res.json());
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newAsset.trim() || !file) return;
    setLoading(true);
    setError(null);
    try {
      // Get userId from Supabase session
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error("User not authenticated");
      // Upload file to Supabase Storage
      const fileUrl = await uploadToSupabase(file, userId, projectId as string);
      // Save asset metadata to backend
      const token = await getSupabaseToken();
      const res = await fetch(`http://localhost:3001/api/projects/${projectId}/assets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newAsset,
          type: file.type,
          status: "ready",
          file_url: fileUrl,
        }),
      });
      if (!res.ok) throw new Error("Failed to create asset");
      setNewAsset("");
      setFile(null);
      fetchAssets();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setLoading(true);
    setError(null);
    const token = await getSupabaseToken();
    const res = await fetch(`http://localhost:3001/api/assets/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setError("Failed to delete asset");
    } else {
      setAssets(assets.filter((a) => a.id !== id));
    }
    setLoading(false);
  }

  async function handleSummarize(asset: any) {
    setSummarizingId(asset.id);
    setSummarizeError(null);
    try {
      const res = await fetch("http://localhost:3001/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: asset.id, transcript: asset.transcript }),
      });
      if (!res.ok) throw new Error("Failed to summarize");
      await fetchAssets();
    } catch (err: any) {
      setSummarizeError(err.message || "Error summarizing");
    } finally {
      setSummarizingId(null);
    }
  }

  async function handleGenerateMedia(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaAssetId.trim()) return;
    setMediaError(null);
    setMediaJobId(null);
    setMediaJobStatus(null);
    setMediaOutputUrl(null);
    try {
      const token = await getSupabaseToken();
      const endpoint = mediaType === 'reel'
        ? 'http://localhost:3001/api/media/generate-reel'
        : 'http://localhost:3001/api/media/generate-audiogram';
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assetId: mediaAssetId, startTime: 0, endTime: 30, style: "default" }),
      });
      if (!res.ok) throw new Error(`Failed to trigger ${mediaType} generation`);
      const { jobId } = await res.json();
      setMediaJobId(jobId);
      // Poll job status
      pollJobStatus(jobId, token);
    } catch (err: any) {
      setMediaError(err.message || `Error generating ${mediaType}`);
    }
  }

  // Poll job status until complete/error
  async function pollJobStatus(jobId: string, token: string) {
    setMediaJobStatus('processing');
    let attempts = 0;
    const poll = async () => {
      const res = await fetch(`http://localhost:3001/api/media/job/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setMediaJobStatus('error');
        setMediaError('Failed to fetch job status');
        return;
      }
      const job = await res.json();
      if (job.status === 'complete') {
        setMediaJobStatus('complete');
        setMediaOutputUrl(job.output_url);
      } else if (job.status === 'error') {
        setMediaJobStatus('error');
        setMediaError(job.error || 'Job failed');
      } else if (attempts < 15) {
        attempts++;
        setTimeout(poll, 1500);
      } else {
        setMediaJobStatus('timeout');
        setMediaError('Job timed out');
      }
    };
    poll();
  }

  useEffect(() => {
    fetchAssets();
    // eslint-disable-next-line
  }, [projectId]);

  return (
    <div className="max-w-2xl mx-auto mt-12 flex flex-col gap-10">
      <div className="card text-center mb-8 shadow-xl border border-gray-100">
        <h1 className="text-3xl font-extrabold mb-2 text-primary">Assets for Project {projectId}</h1>
      </div>
      <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-2 mb-8">
        <input
          type="text"
          value={newAsset}
          onChange={e => setNewAsset(e.target.value)}
          placeholder="New asset name"
          disabled={loading}
          className="flex-1"
        />
        <input
          type="file"
          onChange={e => setFile(e.target.files?.[0] || null)}
          disabled={loading}
          className="flex-1"
        />
        <button type="submit" disabled={loading || !newAsset.trim() || !file}>
          {loading ? "Uploading..." : "Add Asset"}
        </button>
      </form>
      {loading && <div>Loading assets...</div>}
      {error && <div className="text-danger mb-4 text-base font-semibold">{error}</div>}
      <ul className="flex flex-col gap-3">
        {assets.length === 0 && <li className="text-gray-400 text-center">No assets found.</li>}
        {assets.map((asset) => (
          <li key={asset.id} className="flex flex-col gap-2 bg-white border border-gray-200 shadow-sm p-4 mb-2">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium text-lg text-gray-800">{asset.name || asset.id}</span>
              <a href={asset.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline mr-2">View</a>
              <button
                onClick={() => handleDelete(asset.id)}
                className="bg-white text-[#ef4444] border border-[#ef4444] hover:bg-[#ef4444] hover:text-white transition px-4 py-2 font-semibold rounded-lg"
                style={{ boxShadow: 'none' }}
              >
                Delete
              </button>
            </div>
            {asset.transcript && (
              <div className="mt-2">
                <strong>Transcript:</strong>
                <pre className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">{asset.transcript}</pre>
              </div>
            )}
            {asset.transcript && (
              asset.summary ? (
                <div className="mt-2">
                  <strong>Summary:</strong>
                  <pre className="bg-gray-100 p-2 rounded text-sm whitespace-pre-wrap">{asset.summary}</pre>
                </div>
              ) : (
                <button
                  onClick={() => handleSummarize(asset)}
                  disabled={!!summarizingId}
                  className="mt-2 bg-primary text-white px-4 py-2 rounded-lg"
                >
                  {summarizingId === asset.id ? 'Summarizing...' : 'Summarize'}
                </button>
              )
            )}
          </li>
        ))}
      </ul>
      {summarizeError && <div className="text-danger mb-4 text-base font-semibold">{summarizeError}</div>}
      {/* Media Asset Generation UI (Reel or Audiogram) */}
      <div className="mt-8 p-4 bg-white border border-gray-200 shadow-sm rounded-lg">
        <h2 className="text-xl font-bold mb-2">Generate Media Asset</h2>
        <form onSubmit={handleGenerateMedia} className="flex flex-col md:flex-row gap-2 mb-2">
          <select
            value={mediaAssetId}
            onChange={e => setMediaAssetId(e.target.value)}
            className="flex-1"
          >
            <option value="">Select Asset</option>
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>{asset.name || asset.id}</option>
            ))}
          </select>
          <select
            value={mediaType}
            onChange={e => setMediaType(e.target.value as 'reel' | 'audiogram')}
            className="flex-1"
          >
            <option value="reel">Video Reel</option>
            <option value="audiogram">Audiogram</option>
          </select>
          <button type="submit" disabled={!mediaAssetId.trim()}>Generate</button>
        </form>
        {mediaJobId && (
          <div>
            <p>Job ID: {mediaJobId}</p>
            {mediaJobStatus === 'processing' && <p>Processing...</p>}
            {mediaJobStatus === 'complete' && mediaOutputUrl && (
              <div className="mt-2">
                {mediaType === 'reel' ? (
                  <video src={mediaOutputUrl} controls className="w-full max-w-md" />
                ) : (
                  <video src={mediaOutputUrl} controls className="w-full max-w-md" />
                )}
                <div className="flex gap-2 mt-2">
                  <a href={mediaOutputUrl} download className="bg-primary text-white px-4 py-2 rounded-lg">Download</a>
                  <button onClick={() => navigator.clipboard.writeText(mediaOutputUrl)} className="bg-gray-200 px-4 py-2 rounded-lg">Copy Link</button>
                </div>
              </div>
            )}
            {mediaJobStatus === 'error' && <p className="text-danger">{mediaError}</p>}
            {mediaJobStatus === 'timeout' && <p className="text-danger">Job timed out</p>}
          </div>
        )}
        {mediaError && !mediaJobId && <p className="text-danger">{mediaError}</p>}
      </div>
    </div>
  );
} 