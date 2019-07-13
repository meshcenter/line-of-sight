import React, { useState, useEffect } from "react";
import Autocomplete from "react-autocomplete";

export default function AddressInput(props) {
  const { address, onChange, onSelect } = props;
  const [suggestions, setSuggestions] = useState({});

  useEffect(() => {
    async function fetchSuggestions() {
      if (!address) return;
      const URL = `https://geosearch.planninglabs.nyc/v1/autocomplete?text=${address}`;
      const res = await fetch(URL);
      const json = await res.json();
      const { features } = json;
      setSuggestions(suggestions => ({
        ...suggestions,
        [address]: features.slice(0, 5)
      }));
    }
    fetchSuggestions();
  }, [address]);

  let input;

  return (
    <div>
      <label className="db mb2 fw5" htmlFor="address">
        Building address
      </label>
      <Autocomplete
        ref={element => {
          input = element;
        }}
        value={address}
        items={suggestions[address] || []}
        getItemValue={item => {
          const { name, borough, locality, postalcode } = item.properties;
          return `${titleCase(name)}, ${borough}, ${locality} ${postalcode}`;
        }}
        wrapperStyle={{ width: "100%" }}
        menuStyle={{
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.1)",
          background: "rgba(255, 255, 255, 0.9)",
          position: "absolute",
          zIndex: 9,
          overflow: "auto",
          maxHeight: "50%", // TODO: don't cheat, let it flow to the bottom
          borderRadius: "0.5rem",
          maxWidth: "calc(100vw - 32px)"
        }}
        renderInput={props => {
          return (
            <input
              id="address"
              className="usa-input w-100 pa2 border-box ba b--gray"
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
        onChange={(event, value) => onChange(value)}
        onSelect={(value, item) => {
          onSelect({
            address: value,
            bin: item.properties.pad_bin
          });
          input.blur();
        }}
      />
    </div>
  );
}

function titleCase(text) {
  return text
    .toLowerCase()
    .split(" ")
    .map(s => s.charAt(0).toUpperCase() + s.substring(1))
    .join(" ");
}
