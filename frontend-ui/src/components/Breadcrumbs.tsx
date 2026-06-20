import { Link, useLocation } from "react-router-dom";

export default function Breadcrumbs() {
  const location = useLocation();
  const paths = location.pathname.split("/").filter(Boolean);

  return (
    <div className="mb-4 text-sm">
      {paths.map((p, i) => {
        const path = "/" + paths.slice(0, i + 1).join("/");
        return (
          <span key={i}>
            <Link className="text-blue-600" to={path}>{p}</Link> /
          </span>
        );
      })}
    </div>
  );
}