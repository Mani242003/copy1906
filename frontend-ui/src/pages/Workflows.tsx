import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Workflows() {

  const { id } = useParams();
  const location = useLocation();
  const nav = useNavigate();

  const [wf, setWF] = useState<any>({});
  const [project, setProject] = useState<any>(null);

  const [savedValues, setSavedValues] = useState<any>({});
  const [editField, setEditField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");

  // ✅ LOAD PROJECT
  useEffect(() => {
    axios.get("http://localhost:8000/projects")
      .then(res => {
        const p = res.data.find((x: any) => x.id == id);

        setProject(p);

        const workflowsData =
          typeof p.workflows === "string"
            ? JSON.parse(p.workflows)
            : p.workflows || {};

        const savedData =
          typeof p.saved_values === "string"
            ? JSON.parse(p.saved_values)
            : p.saved_values || {};

        setWF(workflowsData);
        setSavedValues(savedData);

        const keys = Object.keys(workflowsData);
        if (keys.length > 0) setActiveTab(keys[0]);
      });
  }, []);

useEffect(() => {

  // ✅ do nothing if workflows not loaded yet
  if (Object.keys(wf).length === 0) return;

  const params = new URLSearchParams(location.search);
  const tab = params.get("tab");

  if (tab && wf[tab]) {
    setActiveTab(tab);   // ✅ correct tab
  } else {
    const first = Object.keys(wf)[0];
    if (first) setActiveTab(first);  // ✅ fallback
  }

}, [location.search, wf]);

  if (!project) return <div>Loading...</div>;

  const workflow = wf[activeTab];

  return (
    <div className="min-h-screen bg-white text-black p-6">

      {/* ✅ BREADCRUMB */}
      <div className="mb-6 text-sm">
        <span className="cursor-pointer" onClick={() => nav("/projects")}>
          Projects
        </span>
        {" > "}
        <span
          className="cursor-pointer"
          onClick={() => nav(`/deploy/${id}`)}
        >
          Deploy
        </span>
        {" > "}
        <span>Workflow</span>
      </div>

      <h2 className="text-2xl font-bold mb-6">
        Modify Inputs - {project.name}
      </h2>

      {/* ✅ TABS */}
      <div className="flex gap-2 mb-6 border-b pb-2 flex-wrap">
        {Object.keys(wf).map((k) => (
          <button
            key={k}
            onClick={() => setActiveTab(k)}
            className={`px-4 py-2 border ${
              activeTab === k
                ? "bg-black text-white"
                : "bg-white"
            }`}
          >
            {wf[k]?.file}
          </button>
        ))}
      </div>

      {/* ✅ FIELDS */}
      {workflow && workflow.fields?.map((f: any, i: number) => {

        const fieldKey = f.key;
        const fieldId = `${activeTab}-${fieldKey}`;
        const isEdit = editField === fieldId;
        const value = savedValues[activeTab]?.[fieldKey] || "";

        return (
          <div key={i} className="mb-5">

            <div className="text-sm mb-1">{fieldKey}</div>

            <div className="flex gap-2">

              {f.type === "text" && (
                <input
                  className="border p-2 w-[300px]"
                  value={value}
                  disabled={!isEdit}
                  onChange={(e) => {
                    setSavedValues({
                      ...savedValues,
                      [activeTab]: {
                        ...(savedValues[activeTab] || {}),
                        [fieldKey]: e.target.value
                      }
                    });
                  }}
                />
              )}

              {f.type === "select" && (
                <select
                  className="border p-2 w-[300px]"
                  value={value}
                  disabled={!isEdit}
                  onChange={(e) => {
                    setSavedValues({
                      ...savedValues,
                      [activeTab]: {
                        ...(savedValues[activeTab] || {}),
                        [fieldKey]: e.target.value
                      }
                    });
                  }}
                >
                  <option value="">Select</option>
                  {f.options?.map((o: any, j: number) => (
                    <option key={j} value={o}>{o}</option>
                  ))}
                </select>
              )}

              <button
                onClick={() =>
                  setEditField(isEdit ? null : fieldId)
                }
              >
                ✏️
              </button>

            </div>

          </div>
        );
      })}

      {/* ✅ SAVE */}
      <button
        className="bg-black text-white px-5 py-2 mt-4"
        onClick={async () => {

          await axios.put(`http://localhost:8000/project/${id}`, {
            name: project.name,
            repo: project.repo,
            workflows: wf,
            saved_values: savedValues
          });

          alert("Saved ✅");

          // ✅ Go back to deploy
          nav(`/deploy/${id}?wf=${activeTab}`);
        }}
      >
        Save Inputs
      </button>

    </div>
  );
}