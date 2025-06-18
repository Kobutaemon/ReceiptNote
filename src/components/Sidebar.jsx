import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { PanelRight, X } from "lucide-react";

const NavStyle = ({ isActive }) => {
  return {
    display: "block",
    borderRadius: "5px",
    padding: "0.5rem 1rem",
    transition: "background-color 0.3s", // スムーズな変化
    backgroundColor: isActive ? "#dedede" : "transparent",
  };
};

function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <div
      className={`flex gap-4 fixed right-0 transition-all duration-300 z-10 ${
        isMenuOpen ? "translate-x-0" : "translate-x-[75%]"
      }`}
    >
      <button
        className="w-10 h-10 flex items-center justify-center cursor-pointer bg-[#60BDA7] rounded mt-5 transition-colors duration-200"
        onClick={menuClick}
        aria-label="メニューを開閉する"
      >
        {isMenuOpen ? (
          <X size={20} style={{ color: "white" }} />
        ) : (
          <PanelRight size={20} style={{ color: "white" }} />
        )}
      </button>
      <nav
        className="bg-gray-100 h-screen pt-10 px-5 transition-transform duration-300 ease-in-out border-l border-black"
        style={{
          boxShadow: isMenuOpen ? "0px 0px 15px -5px #777777" : "none",
        }}
        // isMenuOpenがfalseの時にメニューがフォーカスされないようにするなら下のコメントアウトを解除
        // style={{ visibility: isMenuOpen ? "visible" : "hidden" }}
      >
        <ul className="flex flex-col gap-4 text-lg select-none">
          <li>
            <NavLink to="/" style={NavStyle} onClick={handleNavClick}>
              ダッシュボード
            </NavLink>
          </li>
          <li>
            <NavLink to="/bicycle" style={NavStyle} onClick={handleNavClick}>
              駐輪代
            </NavLink>
          </li>
          <li>
            <NavLink to="/shopping" style={NavStyle} onClick={handleNavClick}>
              買い物代
            </NavLink>
          </li>
          <li>
            <NavLink to="/something" style={NavStyle} onClick={handleNavClick}>
              その他
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;
