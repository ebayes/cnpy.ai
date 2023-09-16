import React, { useState, useEffect } from "react";
import { MultiSelect, Text, Group } from '@mantine/core';
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
    "Wild dog",
    "Black bear",
    "Red Panda",
    "Buffalo",
    "Wild pig",
    "Marten",
    "Goat",
    "Deer",
    "Person",
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
    <>
    
    <Group position="apart" mt="md" mb="xs" className="flex items-start">
            <Text fz="sm" fw={500}>
              Classes:
            </Text>
    <div className='w-72'>
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
    </div>
    </Group>
    <div className='pt-3 flex justify-between items-start'>
    <Text fz="sm" fw={500}>Description:</Text>
    <div className='w-72'>
      <Text fz="sm" ta="right" variant="light">
        Model used is OpenAI&apos;s <a
          href="https://openai.com/research/clip"
          target="_blank"
          className="hover:text-blue-500 underline"
        >
          CLIP
        </a>. Type in your own classes to customize the model. Note: may not work well on blanks.
      </Text>
    </div>
  </div>
  </>
  );
};

export default InputFieldsComponent;
