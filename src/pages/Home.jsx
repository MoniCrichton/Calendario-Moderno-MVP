import React from "react";
import Calendario from "./Calendario";

export default function Home({ nivel }) {
  return (
    <div className="p-4">
      <Calendario nivel={nivel} />
    </div>
  );
}
