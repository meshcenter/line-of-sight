import React, { useState, useEffect } from "react";
import Autocomplete from "react-autocomplete";

export default function AddressInput(props) {
  const { defaultAddress = "", onSelect } = props;
  const [value, setValue] = useState(defaultAddress);
  const [suggestions, setSuggestions] = useState({});

  useEffect(() => {
    async function fetchSuggestions() {
      if (!value) return;
      const URL = `https://geosearch.planninglabs.nyc/v2/autocomplete?text=${value}`;
      const res = await fetch(URL);
      const json = await res.json();
      const { features } = json;
      setSuggestions(suggestions => ({
        ...suggestions,
        [value]: features.slice(0, 5)
      }));
    }
    fetchSuggestions();
  }, [value]);

  let input;

  return (
    <Autocomplete
      ref={element => {
        input = element;
      }}
      value={value}
      items={suggestions[value] || []}
      getItemValue={item => {
        const { name, borough, locality, postalcode } = item.properties;
        return `${titleCase(name)}, ${borough}, ${locality} ${postalcode}`;
      }}
      inputProps={{ placeholder: "Search for an address..." }}
      wrapperStyle={{ width: "100%" }}
      renderInput={props => {
        return (
          <input
            id="address"
            className="w-100 mw6 pa2 border-box ba b--moon-gray br2 shadow"
            style={{
              boxShadow: "#ccc 0px 1px 0px 0px"
            }}
            autoComplete="nope"
            spellCheck="false"
            {...props}
          />
        );
      }}
      renderItem={(item, isHighlighted) => {
        const { name, borough, locality, postalcode } = item.properties;
        const address1 = titleCase(name);
        const address2 = `${borough}, ${locality} ${postalcode}`;
        return (
          <div
            key={item.properties.id}
            className="pa3 bb b--light-gray pointer bg-white"
            style={{ backgroundColor: isHighlighted ? "#f5f5f5" : "#fff" }}
          >
            <span>{address1} </span>
            <span className="gray">{address2}</span>
          </div>
        );
      }}
      menuStyle={{
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.1)",
        background: "rgba(255, 255, 255, 0.9)",
        position: "absolute",
        zIndex: 9,
        overflow: "auto",
        maxHeight: "50%", // TODO: don't cheat, let it flow to the bottom
        borderRadius: "0.5rem",
        maxWidth: "calc(100vw - 32px)",
        marginRight: "1rem"
      }}
      onChange={event => setValue(event.target.value)}
      onSelect={(value, item) => {
        setValue(value);
        onSelect({
          address: value,
          bin: item.properties.addendum.pad_bin,
          lat: item.geometry.coordinates[1],
          lng: item.geometry.coordinates[0]
        });
        input.blur();
      }}
    />
  );
}

function titleCase(text) {
  return text
    .toLowerCase()
    .split(" ")
    .map(s => s.charAt(0).toUpperCase() + s.substring(1))
    .join(" ");
}
