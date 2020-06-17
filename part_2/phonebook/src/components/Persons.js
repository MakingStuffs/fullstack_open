import React from "react";
import Button from "./Button";

const Persons = ({ persons, filter, clickHandler }) => (
    <ul>
      {persons
        .filter((person) =>
          person.name.toLowerCase().includes(filter.toLowerCase())
        )
        .map((filteredPerson) => (
          <li key={filteredPerson.name}>
            {filteredPerson.name} - {filteredPerson.number}
            <Button
              onClick={() => clickHandler(filteredPerson.id)}
              type="submit"
              text="Delete"
            />
          </li>
        ))}
    </ul>
  );

export default Persons;
