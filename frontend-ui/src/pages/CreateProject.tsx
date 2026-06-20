import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function CreateProject() {
                         
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [repo, setRepo] = useState("");
  const [type, setType] = useState("type1");

  const [wf, setWF] = useState<any>({});

  // ✅ Dynamic fields based on TYPE
  const handleTypeChange = (t: any) => {

    setType(t);

    if (t === "type1") {
      setWF({
        frontend_build: "",
        frontend_deploy: "",
        backend_build: "",
        backend_deploy: ""
      });
    } else {
      setWF({
        frontend_build_deploy: "",
        backend_build_deploy: ""
      });
    }
  }

  const create = async () => {

    await axios.post("http://localhost:8000/create_project", {
      name,
      repo,
      type,
      workflows: wf
    });

    nav("/projects");
  }

  return (
    <div>

      <h2>Create Project</h2>

      <input placeholder="Project Name" onChange={e => setName(e.target.value)} />
      <input placeholder="Repo (username/repo)" onChange={e => setRepo(e.target.value)} />

      <h4>Select Type</h4>

      <select onChange={(e) => handleTypeChange(e.target.value)}>
        <option value="type1">Type-1</option>
        <option value="type2">Type-2</option>
      </select>

      <h4>Workflow Files</h4>


      {Object.keys(wf).map((k) => (
        <div key={k}>
          {k}:
          <input
            value={wf[k]}
            onChange={(e) =>
              setWF({
                ...wf,
                [k]: e.target.value.trim()
              })
            }
          />
        </div>
      ))}

      <button onClick={create}>Create</button>

    </div>
  );
}