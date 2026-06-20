import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setProjects } from "../store/store";

export default function Projects(){

  const [data,setData] = useState([]);
  const nav = useNavigate();
  const dispatch = useDispatch();

  useEffect(()=>{
    axios.get("http://localhost:8000/projects")
      .then(res => {
        setData(res.data);
        dispatch(setProjects(res.data));
      });
  },[]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Projects</h2>

      <button className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
        onClick={()=>nav("/create")}>
        Create
      </button>

      <div className="grid grid-cols-3 gap-4">
        {data.map((p:any)=>(
          <div key={p.id}
            className="bg-white p-4 rounded shadow cursor-pointer"
            onClick={()=>nav(`/project/${p.id}`)}>

            <h3 className="font-bold">{p.name}</h3>
            <p>{p.repo}</p>
            <span className="text-sm text-gray-500">{p.type}</span>

          </div>
        ))}
      </div>
    </div>
  );
}