import Button from "@mui/material/Button";
import React from "react";
import { useRouter, Link } from "next/router";
var baseurl = "http://localhost:3000/";
function NavButton(props) {
  const router = useRouter();
  const handleClick = (e) => {
    e.preventDefault();
    router.push(baseurl + props.path);
  };
  return (
    <div>
      <Button variant={props.variant} onClick={handleClick} style={props.style}>
        {props.children}
      </Button>
    </div>
  );
}

export default NavButton;
