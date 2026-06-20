import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function Deploy(){

  const { id } = useParams();   // ✅ GET PROJECT ID

  const [project,setProject]=useState<any>(null);

  const [form,setForm]=useState<any>({
    component:"frontend",
    action:"build"
  });

  useEffect(()=>{
    axios.get("http://localhost:8000/projects")
      .then(res=>{
        const p = res.data.find((x:any)=> x.id == id);
        setProject(p);   // ✅ FIXED
      });
  },[]);

  if(!project) return null;

  const trigger = async ()=>{

    await axios.post("http://localhost:8000/deploy",{
      project_id:project.id,
      form_data:form
    });

    alert("Triggered");
  }

  return (
    <div>

      <h2>Deploy - {project.name}</h2>

      <select onChange={(e)=>setForm({...form,component:e.target.value})}>
        <option>frontend</option>
        <option>backend</option>
      </select>

      {/* ✅ TYPE BASED */}
      {project.type==="type1" && (
        <>
          <select onChange={(e)=>setForm({...form, action:e.target.value.trim()})}>
            <option value="build">Build</option>
            <option value="deploy">Deploy</option>
            <option value="build_deploy">Build + Deploy</option>
          </select>
        </>
      )}

      {project.type==="type2" && (
        <>
          <h4>Only Build + Deploy Available ✅</h4>
        </>
      )}

      <input placeholder="Release No"
        onChange={(e)=>setForm({...form,relno:e.target.value})}/>

      <select onChange={(e)=>setForm({...form,environment:e.target.value})}>
        <option>sit1</option>
        <option>uat1</option>
      </select>

      <button onClick={trigger}>Trigger</button>

    </div>
  );
}
