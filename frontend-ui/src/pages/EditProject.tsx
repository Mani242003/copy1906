import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

export default function EditProject() {

  const { id } = useParams();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [repo, setRepo] = useState("");
  const [wf, setWF] = useState<any>({});

  // ✅ LOAD PROJECT
  useEffect(() => {
    axios.get("http://localhost:8000/projects")
      .then(res => {
        const p = res.data.find((x: any) => x.id == id);

        if (!p) return;

        setName(p.name);
        setRepo(p.repo);

        const workflowsData =
          typeof p.workflows === "string"
            ? JSON.parse(p.workflows)
            : p.workflows || {};

        setWF(workflowsData);
      });
  }, []);

  // ✅ 🔥 NEW: RELOAD WORKFLOWS FROM GITHUB
  const reloadWorkflows = async () => {

    if (!repo) {
      alert("Enter repo first");
      return;
    }

    try {
      const res = await axios.get("http://localhost:8000/workflows", {
        params: { repo }
      });

      setWF(res.data);

      alert("✅ Workflows updated from GitHub");
    } catch (err) {
      alert("❌ Failed to load workflows");
    }
  };

  // ✅ UPDATE PROJECT
  const update = async () => {

    if (!name || !repo) {
      alert("Enter name and repo");
      return;
    }

    await axios.put(`http://localhost:8000/project/${id}`, {
      name,
      repo,
      workflows: wf
    });

    alert("✅ Project Updated");
    nav("/projects");
  };

  return (
    <div className="p-6">

      <h2 className="text-xl font-bold mb-4">Edit Project</h2>

      {/* ✅ PROJECT NAME */}
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {/* ✅ REPO */}
      <input
        className="border p-2 mb-4 w-full"
        placeholder="Repo (username/repo)"
        value={repo}
        onChange={(e) => setRepo(e.target.value)}
      />

      {/* ✅ RELOAD BUTTON */}
      <button
        className="bg-blue-600 text-white px-4 py-2 mb-4"
        onClick={reloadWorkflows}
      >
        🔄 Reload Workflows from GitHub
      </button>

      {/* ✅ WORKFLOWS */}
      <h3 className="font-bold mb-2">Workflows</h3>

      {Object.keys(wf).length === 0 && (
        <div className="text-gray-500">No workflows found</div>
      )}

      {Object.keys(wf).map((k) => (
        <div key={k} className="border p-3 mb-3 rounded">

          <div className="font-semibold">
            {wf[k]?.file}
          </div>

          <div className="text-sm text-gray-500">
            {wf[k]?.fields?.length || 0} inputs loaded
          </div>

        </div>
      ))}

      {/* ✅ UPDATE BUTTON */}
      <button
        className="bg-black text-white px-4 py-2 mt-4"
        onClick={update}
      >
        Update Project
      </button>

    </div>
  );
}