import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function CreateProject() {

  const nav = useNavigate();

  const [name, setName] = useState("");
  const [repo, setRepo] = useState("");

  const [wf, setWF] = useState<any>({});



  

  // ✅ OPEN CONFIG (IMPORTANT FIX 🔥)
const fetchWorkflows = async () => {
  if (!repo) {
    alert("Enter repo first");
    return;
  }

  const res = await axios.get("http://localhost:8000/workflows", {
    params: { repo }
  });

  setWF(res.data);
};

const create = async () => {

  if (!name || !repo) {
    alert("Enter name and repo");
    return;
  }

  if (Object.keys(wf).length === 0) {
    alert("Load workflows first");
    return;
  }

  await axios.post("http://localhost:8000/create_project", {
    name,
    repo,
    workflows: wf
  });

  alert("Created ✅");
  nav("/projects");
};

  return (
    <div className="p-6">

      <h2 className="text-xl font-bold mb-4">Create Project</h2>

      {/* BASIC */}
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Project Name"
        value={name}
        onChange={(e)=>setName(e.target.value)}
      />

      
<input
  className="border p-2 mb-4 w-full"
  placeholder="Repo"
  value={repo}
  onChange={(e) => setRepo(e.target.value)}
/>

<button
  className="bg-blue-600 text-white px-3 py-2 mb-4"
  onClick={fetchWorkflows}
>
  Load Workflows
</button>
  
{Object.keys(wf).map((k) => (
  <div key={k} className="border p-3 mb-3">

    <div className="font-bold">
      {wf[k].file}
    </div>

    <div className="text-sm text-gray-500">
      {wf[k].fields.length} inputs loaded
    </div>

  </div>
))}

<button
  className="bg-black text-white px-4 py-2 mt-4"
  onClick={create}
>
  Create Project
</button>

    </div>
    
  );
}