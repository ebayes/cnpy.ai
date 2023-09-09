import React, { useState, useEffect } from "react";
import { MultiSelect, ActionIcon, TextInput } from '@mantine/core';
import { IconPlus, IconX } from "@tabler/icons-react";

interface InputFieldsComponentProps {
  onInputChange: (inputs: string[]) => void;
  busy: boolean;
  modelLoaded: boolean;
}

const InputFieldsComponent: React.FC<InputFieldsComponentProps> = ({
  onInputChange,
  busy,
  modelLoaded
}) => {
  const defaultValues = [
    "Tiger",
    "Leopard",
    "Fox",
    "Black bear",
    "Red Panda",
    "Buffalo",
    "Wild pig",
    "Marten",
    "Goat",
    "Deer",
    "Man",
  ];

  const [inputs, setInputs] = useState<string[]>(defaultValues);
  const [data, setData] = useState<string[]>(defaultValues);

  const addInputField = (value: string) => {
    setData((prevData) => [...prevData, value]);
    onInputChange(data);
  };

  const handleInputChange = (values: string[]) => {
    setInputs(values);
    onInputChange(values);
  };

  useEffect(() => {
    onInputChange(inputs);
  }, [inputs, onInputChange]); // Added `onInputChange` as a dependency

  return (
    <MultiSelect
      pb="sm"
      data={data}
      value={inputs}
      placeholder="Add classes"
      searchable
      creatable
      clearable
      disabled={busy}
      onChange={handleInputChange}
      getCreateLabel={(query) => `+ Create ${query}`}
      onCreate={(query) => {
        addInputField(query);
        return query;
      }}
    />
  );
};

export default InputFieldsComponent;
