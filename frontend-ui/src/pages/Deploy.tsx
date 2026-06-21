import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom"
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
  useEffect(() => {
  if (!project) return;

  const params = new URLSearchParams(location.search);
  const wfFromURL = params.get("wf");

  if (wfFromURL) {
    const workflows = JSON.parse(project.workflows || "{}");

    if (workflows[wfFromURL]) {
      setSelectedWF({
        ...workflows[wfFromURL],
        key: wfFromURL
      });
    }
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
    <div className="min-h-screen bg-black text-white p-10">

      {/* ✅ BREADCRUMB */}
      <div className="mb-6 text-sm">
        <span className="cursor-pointer" onClick={() => nav("/projects")}>
          Projects
        </span>
        {" > "}
        <span>{project.name}</span>
      </div>

      <h1 className="text-3xl mb-6">Deploy 🚀</h1>

      {/* ✅ WORKFLOW SELECT */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {Object.keys(workflows).map((k) => (
          <button
            key={k}
            className={`px-4 py-2 ${
              selectedWF?.key === k
                ? "bg-white text-black"
                : "bg-gray-700"
            }`}
            onClick={() =>
              setSelectedWF({ ...workflows[k], key: k })
            }
          >
            {workflows[k].file}
          </button>
        ))}
      </div>

      {/* ✅ MODIFY INPUT */}
      {selectedWF && (
        <button
          className="bg-white text-black px-4 py-2 mb-6"
          onClick={() =>
            nav(`/workflow/${project.id}?tab=${selectedWF.key}`)
          }
        >
          ⚙️ Modify Inputs
        </button>
      )}

      {/* ✅ DEPLOY */}
      {selectedWF && (
        <button
          className="bg-white text-black px-6 py-3 text-xl"
          onClick={deploy}
        >
          →
        </button>
      )}

    </div>
  );
}