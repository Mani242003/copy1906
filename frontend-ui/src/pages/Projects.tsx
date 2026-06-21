import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setProjects } from "../store/store";

export default function Projects() {
  const [data, setData] = useState<any[]>([]);
  const nav = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    axios.get("http://localhost:8000/projects")
      .then(res => {
        setData(res.data);
        dispatch(setProjects(res.data));
      });
  }, []);

  return (
   
 <div className="bg-gray-100 min-h-screen">

    {/* ✅ Fixed Header */}
    <div className="fixed top-0 left-0 right-0 bg-[#af0b1c] text-white h-14 flex items-center px-6 shadow z-50">
      <h1 className="text-lg font-semibold">Projects</h1>
    </div>

    {/* ✅ Content (push down to avoid overlap) */}
    <div className="pt-16 px-6 mb-6 mt-6">



      <div className="grid grid-cols-5 gap-6">

        {/* ✅ Create New Project Card */}
        <div 
          onClick={() => nav("/create")}
          className="bg-blue-700 text-white rounded-xl flex flex-col items-center justify-center h-48 cursor-pointer shadow hover:scale-105 transition"
        >
          <div className="text-4xl bg-white text-blue-700 w-12 h-12 flex items-center justify-center rounded-full mb-3">
            +
          </div>
          <p className="font-medium">New Project</p>
        </div>

        {/* ✅ Project Cards */}
        {data.map((p: any) => (
          <div
            key={p.id}
            onClick={() => nav(`/deploy/${p.id}`)}
            className="bg-white rounded-xl shadow cursor-pointer hover:shadow-lg transition overflow-hidden"
          >

            {/* Thumbnail area */}
            <div className="h-28 bg-gray-200">
              {/* Optional image */}
              {/* <img src={p.image} className="w-full h-full object-cover" /> */}
            </div>

            {/* Content */}
            <div className="p-3">

              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{p.name}</h3>
                <span className="cursor-pointer">⋯</span>
              </div>

              <p className="text-sm text-gray-500">{p.repo}</p>

              <p className="text-xs text-gray-400 mt-1">
                {p.type}
              </p>

              {/* Buttons */}
              <div className="flex gap-2 mt-3">

                <button
                  className="bg-red-500 text-white px-2 py-1 text-sm rounded"
                  onClick={(e) => {
                    e.stopPropagation();

                    axios.delete(`http://localhost:8000/project/${p.id}`)
                      .then(() => {
                        setData(data.filter((x: any) => x.id !== p.id));
                      });
                  }}
                >
                  Delete
                </button>

                <button
                  className="bg-yellow-500 text-white px-2 py-1 text-sm rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    nav(`/edit/${p.id}`);
                  }}
                >
                  Edit
                </button>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}