import Link from "next/link";
import ThemeChanger from "./DarkSwitch";
import Image from "next/image"
import { Disclosure } from "@headlessui/react";
import jsCookie from "js-cookie";
import { useEffect, useState } from "react";

const Navbar = () => {

  const [loggedOut, setLoggedOut] = useState(true);

  // settign nav to dictionary so redirecting can be looped through
  const nav = {
    "About": 'about',
    "Setup": 'setup',
    "FAQ": 'faq',
    "Release Log": 'releaselog'
  };


  const navigation = [
    "About",
    "Setup",
    "FAQ",
    "Release Log"

    // future work- add new header to all pages with tabs:

    // "Notes",
    // "Communities",
    // "Submissions",
    // "About",
    // "Extension", 
  ];

  useEffect(()=>{
    setLoggedOut(
      jsCookie.get("token") == "" || jsCookie.get("token") == undefined
    );
  },[])

  return (
    <div className="w-full">
      <nav className="container relative flex flex-wrap items-center justify-between p-6 mx-auto lg:justify-between xl:px-0">
        {/* Logo  */}

        <Disclosure>
          {({ open }) => (
            <>
              <div className="flex flex-wrap items-center justify-between w-full lg:w-auto">
                <Link href="/">
                  <span className="flex items-center space-x-2 text-2xl font-medium text-blue-500 dark:text-gray-100">
                    <span>
                      <Image
                        src="/img/logo.svg"
                        alt="CDL"
                        width="40"
                        height="40"
                        className="w-8"
                      />
                    </span>
                    <span>CDL</span>
                  </span>
                </Link>

                <Disclosure.Button
                  aria-label="Toggle Menu"
                  className="px-2 py-1 ml-auto text-gray-500 rounded-md lg:hidden hover:text-blue-500 focus:text-blue-500 focus:bg-indigo-100 focus:outline-none dark:text-gray-300 dark:focus:bg-trueGray-700">
                  <svg
                    className="w-6 h-6 fill-current"

                    viewBox="0 0 24 24">
                    {open && (
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
                      />
                    )}
                    {!open && (
                      <path
                        fillRule="evenodd"
                        d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
                      />
                    )}
                  </svg>
                </Disclosure.Button>

                <Disclosure.Panel className="flex flex-wrap w-full my-5 lg:hidden">
                  <>
                    {Object.entries(nav).map(([key, item]) => (
                      <Link key={key} href={`/${item}`} className="w-full px-4 py-2 -ml-4 text-gray-500 rounded-md dark:text-gray-300 hover:text-blue-500 focus:text-blue-500 focus:bg-indigo-100 dark:focus:bg-gray-800 focus:outline-none">
                        {key}
                      </Link>
                    ))}
                    {!loggedOut ? <Link href="/" className="w-full px-6 py-2 mt-3 text-center text-white bg-blue-500 rounded-md lg:ml-5">
                      Home
                    </Link> : <Link href="/auth" className="w-full px-6 py-2 mt-3 text-center text-white bg-blue-500 rounded-md lg:ml-5">
                      Get Started
                    </Link>}
                  </>
                </Disclosure.Panel>
              </div>
            </>
          )}
        </Disclosure>

        <div className="hidden text-center lg:flex lg:items-center">
          <ul className="items-center justify-end flex-1 pt-6 list-none lg:pt-0 lg:flex">

            {Object.entries(nav).map(([key, item]) => (

              <Link key={key} href={`/${item}`} className="w-full px-4 py-2 text-gray-500 rounded-md dark:text-gray-300 hover:text-blue-500 focus:text-blue-500 focus:bg-indigo-100 dark:focus:bg-gray-800 focus:outline-none ">
                {key}
              </Link>


            ))}
          </ul>
        </div>

        <div className="hidden mr-3 space-x-4 lg:flex nav__item">
        
        {!loggedOut ? <Link href="/" className="w-full px-6 py-2 mt-3 text-center text-white bg-blue-500 rounded-md lg:ml-5">
                      Home
                    </Link> : <Link href="/auth" className="w-full px-6 py-2 mt-3 text-center text-white bg-blue-500 rounded-md lg:ml-5">
                      Get Started
                    </Link>}

          <ThemeChanger />
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
