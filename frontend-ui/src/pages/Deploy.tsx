import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";

export default function Deploy() {

  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();

  const [project, setProject] = useState<any>(null);
  const [selectedWF, setSelectedWF] = useState<any>(null);

  useEffect(() => {
    axios.get("http://localhost:8000/projects")
      .then(res => {
        const p = res.data.find((x: any) => x.id == id);
        setProject(p);
      });
  }, []);

  // ✅ keep selected workflow
  useEffect(() => {
    if (!project) return;

    const workflows = JSON.parse(project.workflows || "{}");

    const params = new URLSearchParams(location.search);
    const wfFromURL = params.get("wf");

    const savedWF = localStorage.getItem(`selectedWF-${id}`);

    let finalWF = null;

    // ✅ FIRST LOAD → use URL
    if (wfFromURL && workflows[wfFromURL]) {
      finalWF = wfFromURL;

      // ✅ store it
      localStorage.setItem(`selectedWF-${id}`, wfFromURL);
    }
    // ✅ AFTER REFRESH → use localStorage
    else if (savedWF && workflows[savedWF]) {
      finalWF = savedWF;
    }

    if (finalWF) {
      setSelectedWF({
        ...workflows[finalWF],
        key: finalWF
      });
    }

  }, [project, location.search]);

  if (!project) return <div>Loading...</div>;

  const workflows = JSON.parse(project.workflows || "{}");

  const deploy = async () => {
    const res = await axios.post("http://localhost:8000/deploy", {
      project_id: project.id,
      workflow_key: selectedWF.key
    });

    if (res.data.msg !== "triggered") {
      alert(res.data.msg);
      return;
    }

    alert("Triggered ✅");
  };

  return (
    <div className="h-screen flex bg-[#1e1e1e] text-white">

      {/* ✅ LEFT SIDEBAR */}
      <div className="w-64 bg-[#171717] border-r p-4 flex flex-col">

        {/* LOGO */}
        <div className="text-xl font-bold mb-6">KAI</div>

        {/* NEW DEPLOY */}
        <button
          className="mb-4 border p-2 rounded"
        >
          Projects
        </button>

        {/* SEARCH */}
        <div className="text-sm text-gray-400 mb-4">
          Search Deploys
        </div>

        {/* RECENTS */}
        <div className="text-gray-400 mb-2">Recents History</div>

        <div className="flex-1 overflow-y-auto space-y-2">

        </div>

        {/* USER */}
        <div className="mt-4 text-sm text-gray-400">
          Manikandan
        </div>

      </div>

      {/* ✅ MAIN AREA */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="h-16 border-b flex items-center justify-between px-6">

          {/* ✅ Project Name */}
          <div className="font-bold">
            {project.name}
          </div>

          <div className="flex">
            {selectedWF && (
              <div className="text-center mb-6">
                <button
                  className="bg-gray-700 px-4 py-2 rounded"
                  onClick={() =>
                    nav(`/workflow/${project.id}?tab=${selectedWF.key}`)
                  }
                >
                  ⚙️ Modify Inputs
                </button>
              </div>
            )}

            {/* ✅ YAML SELECT DROPDOWN */}
            <select
              className="bg-gray-800 p-2 rounded"
              value={selectedWF?.key || ""}

              onChange={(e) => {
                const k = e.target.value;

                setSelectedWF({ ...workflows[k], key: k });

                // ✅ save
                localStorage.setItem(`selectedWF-${id}`, k);

                // ✅ REMOVE query param (VERY IMPORTANT)
                nav(`/deploy/${id}`, { replace: true });
              }}

            >
              <option value="">Select Workflow</option>
              {Object.keys(workflows).map((k) => (
                <option key={k} value={k}>
                  {workflows[k].file}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* ✅ CONTENT (ONLY THIS SCROLLS) */}
        <div className="flex-1 overflow-y-auto p-10 flex flex-col items-start">

          {/* ✅ CHAT STYLE TEXT */}
          {selectedWF && (
            <div className="max-w-xl space-y-4">

              <h1 className="text-2xl mt-4">
                Hi, I'm Deployment Assistant 👋
              </h1>

              {selectedWF.fields?.map((f: any, i: number) => {

                const value =
                  project.saved_values
                    ? JSON.parse(project.saved_values)[selectedWF.key]?.[f.key]
                    : "";

                return (
                  <div key={i}>
                    <span className="text-gray-400">{f.key} :</span>{" "}
                    <span>{value || "-"}</span>
                  </div>
                );
              })}

            </div>
          )}

        </div>
        {selectedWF && (
          <div className="fixed bottom-0 left-64 right-0 bg-[#1e1e1e] p-4">

            <div className="max-w-3xl mx-auto flex items-center bg-[#2a2a2a] rounded-full px-4 py-3">

              <input
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="Start deployment command..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") deploy();
                }}
              />

              <button
                className="bg-white text-black px-4 py-2 rounded-full ml-2"
                onClick={deploy}
              >
                →
              </button>

            </div>

          </div>
        )}


      </div>

    </div>
  );
}