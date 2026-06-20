import AppLayout from "../components/AppLayout";
import Breadcrumbs from "../components/Breadcrumbs";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Workflows(){

  const {id} = useParams();

  const [wf,setWF]=useState<any>({});
  const [project,setProject]=useState<any>(null);
  const [edit,setEdit]=useState(false);

  useEffect(()=>{
    axios.get("http://localhost:8000/projects")
      .then(res=>{
        const p = res.data.find((x:any)=> x.id == id);
        setProject(p);
        setWF(JSON.parse(p.workflows || "{}"));
      });
  },[]);

  if(!project) return null;

  return (
    <AppLayout workflows={wf}>

      <Breadcrumbs />

      <h2 className="text-xl font-bold mb-3">
        Workflows - {project.name}
      </h2>

      <button
        className="mb-3 bg-blue-600 text-white px-3 py-1 rounded"
        onClick={()=>setEdit(!edit)}>
        {edit ? "Disable Edit" : "Enable Edit"}
      </button>

      {Object.keys(wf).map(k => (
        <div key={k} className="bg-white p-4 rounded mb-3 shadow">
          <label className="block text-sm font-semibold">{k}</label>

          <input
            className="border p-2 mt-2 w-[350px]"
            value={wf[k]}
            disabled={!edit}
            onChange={(e)=>
              setWF({...wf, [k]: e.target.value})
            }
          />
        </div>
      ))}

    </AppLayout>
  );
}