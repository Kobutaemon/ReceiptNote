import React from "react";
import { NavLink } from "react-router-dom";
import { PanelRight } from "lucide-react";

const NavStyle = ({ isActive }) => {
  return {
    display: "block",
    borderRadius: "15px",
    padding: "0.5rem 1rem",
    transition: "background-color 0.3s", // スムーズな変化
    // アクティブな場合にスタイルを適用
    backgroundColor: isActive ? "#dedede" : "transparent",
  };
};

function Sidebar() {
  return (
    <div className="flex fixed right-10">
      <button className="">
        <PanelRight />
      </button>
      <nav>
        <ul className="flex flex-col gap-4 mt-10 text-lg">
          <li>
            <NavLink to="/dashboard" style={NavStyle}>
              ダッシュボード
            </NavLink>
          </li>
          <li>
            <NavLink to="/bicycle" style={NavStyle}>
              駐輪代
            </NavLink>
          </li>
          <li>
            <NavLink to="/shopping" style={NavStyle}>
              買い物代
            </NavLink>
          </li>
          <li>
            <NavLink to="/something" style={NavStyle}>
              その他
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;
