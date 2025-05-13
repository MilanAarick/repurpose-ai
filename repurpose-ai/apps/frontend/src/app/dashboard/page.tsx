"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabaseClient';
import { useSupabaseAuth } from '../../components/SupabaseAuthProvider';

export default function Dashboard() {
  const { user, loading: loadingUser } = useSupabaseAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProject, setNewProject] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loadingUser && !user) {
      router.replace('/');
    }
  }, [loadingUser, user, router]);

  const fetchProjects = async () => {
    setLoading(true);
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    fetch('http://localhost:3001/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch projects');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!user) return;
    fetchProjects();
    // eslint-disable-next-line
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.trim()) return;
    setCreating(true);
    setError(null);
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch('http://localhost:3001/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: newProject })
    });
    if (!res.ok) {
      setError('Failed to create project');
    } else {
      setNewProject('');
      fetchProjects();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    setError(null);
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(`http://localhost:3001/api/projects/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      setError('Failed to delete project');
    } else {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  if (loadingUser) return <div className="card">Loading...</div>;
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto mt-12 flex flex-col gap-10">
      <div className="card text-center mb-8 shadow-xl border border-gray-100">
        <h1 className="text-4xl font-extrabold mb-2 text-primary">Your Dashboard</h1>
        <div className="mb-2 text-lg font-medium text-gray-700">Welcome, <span className="font-semibold">{user?.user_metadata?.full_name || user?.email}</span> 👋</div>
        <div className="text-gray-500 mb-2">{user?.email}</div>
      </div>
      <div className="card shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-primary">Your Projects</h2>
        <form onSubmit={handleCreate} className="flex gap-2 mb-8">
          <input
            type="text"
            value={newProject}
            onChange={e => setNewProject(e.target.value)}
            placeholder="New project name"
            disabled={creating}
            className="flex-1"
          />
          <button type="submit" disabled={creating || !newProject.trim()}>
            {creating ? 'Creating...' : 'Add Project'}
          </button>
        </form>
        {loading && <div>Loading projects...</div>}
        {error && <div className="text-danger mb-4 text-base font-semibold">{error}</div>}
        {!loading && !error && (
          <ul className="flex flex-col gap-3">
            {projects.length === 0 && <li className="text-gray-400 text-center">No projects found.</li>}
            {projects.map((project: any) => (
              <li key={project.id} className="flex items-center justify-between gap-4 bg-white border border-gray-200 shadow-sm">
                <span className="font-medium text-lg text-gray-800">{project.name || project.id}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    className="bg-primary text-white px-4 py-2 rounded-lg"
                  >
                    Assets
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="bg-white text-[#ef4444] border border-[#ef4444] hover:bg-[#ef4444] hover:text-white transition px-4 py-2 font-semibold rounded-lg"
                    style={{ boxShadow: 'none' }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 