import AppLayout from "../components/AppLayout";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function ProjectHome(){

  const { id } = useParams();
  const nav = useNavigate();

  const [project,setProject]=useState<any>(null);

  useEffect(()=>{
    axios.get("http://localhost:8000/projects")
      .then(res=>{
        const p = res.data.find((x:any)=> x.id == id);
        setProject(p);
      });
  },[]);

  if(!project) return null;

  return (
<>
      <button
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => nav("/projects")}>
        ⬅ Back to Projects
      </button>

      <h2 className="text-xl font-bold mb-3">
        {project.name}
      </h2>

      <div className="bg-white p-4 rounded shadow">
        <p><strong>Repo:</strong> {project.repo}</p>
        <p><strong>Type:</strong> {project.type}</p>
      </div>
</>
  );
}