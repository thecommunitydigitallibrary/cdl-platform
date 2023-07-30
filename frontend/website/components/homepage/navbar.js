
import Link from "next/link";
import ThemeChanger from "./DarkSwitch";
import Image from "next/image";
import jsCookie from "js-cookie";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [loggedOut, setLoggedOut] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const nav = {
    "About": 'about',
    "Setup": 'setup',
    "FAQ": 'faq',
    "Release Log": 'releaselog'
  };

  useEffect(() => {
    setLoggedOut(jsCookie.get("token") === "" || jsCookie.get("token") === undefined);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div  style={{ position: 'sticky', top: '0', right: '0', zIndex: '50' }} className="w-full">
      <nav className="container relative flex flex-wrap items-center justify-between bg-white p-6 mx-auto lg:justify-between xl:px-0">
        {/* Logo */}
        <div className="flex items-center space-x-2 text-2xl font-medium text-blue-500 dark:text-gray-100">
          <Link href="/">
            <a>
              <Image
                src="/img/logo.svg"
                alt="CDL"
                width="40"
                height="40"
                className="w-8"
              />
            </a>
          </Link>
          <span>CDL</span>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          aria-label="Toggle Menu"
          className="px-2 py-1 ml-auto text-gray-500 rounded-md lg:hidden hover:text-blue-500 focus:text-blue-500 focus:bg-indigo-100 focus:outline-none no-underline dark:text-gray-300 dark:focus:bg-trueGray-700"
          onClick={toggleMobileMenu}
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
              />
            )}
          </svg>
        </button>

        {/* Mobile Menu */}
        <div className={`lg:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}>
          {Object.entries(nav).map(([key, item]) => (
            <Link key={key} href={`/${item}`}>
              <a className="block px-4 py-2 -ml-4 text-gray-500 rounded-md dark:text-gray-300 hover:text-blue-500 focus:text-blue-500 focus:bg-indigo-100 dark:focus:bg-gray-800 focus:outline-none no-underline">
                {key}
              </a>
            </Link>
          ))}
          {!loggedOut ? (
            <Link href="/">
              <a className="block w-full px-6 py-2 mt-3 text-center text-white bg-blue-500 rounded-md lg:ml-5">
                Home
              </a>
            </Link>
          ) : (
            <Link href="/auth">
              <a className="block w-full px-6 py-2 mt-3 text-center text-white bg-blue-500 rounded-md lg:ml-5">
                Get Started
              </a>
            </Link>
          )}
        </div>

        {/* Desktop Menu */}
        <div className="hidden text-center lg:flex lg:items-center">
          <ul className="items-center justify-end flex-1 pt-6 list-none lg:pt-0 lg:flex">
            {Object.entries(nav).map(([key, item]) => (
              <li key={key}>
                <Link href={`/${item}`}>
                  <a className="block px-4 py-2 text-gray-500 rounded-md dark:text-gray-300 hover:text-blue-500 focus:text-blue-500 focus:bg-indigo-100 dark:focus:bg-gray-800 focus:outline-none no-underline">
                    {key}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden mr-3 space-x-4 lg:flex nav__item">
          {!loggedOut ? (
            <a href="/" className="w-full px-6 py-2 mt-3 text-center text-white bg-blue-500 rounded-md lg:ml-5 no-underline">
              Home
            </a>
          ) : (
            <a href="/auth" className="w-full px-6 py-2 mt-3 text-center text-white bg-blue-500 rounded-md lg:ml-5 no-underline">
              Get Started
            </a>
          )}
          <ThemeChanger />
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
